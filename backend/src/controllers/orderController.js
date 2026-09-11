const { prisma } = require('../config/db');

/**
 * Order Controller
 * Enforces Rule 5, 6, 7, 8, 23 & 25:
 * - Strictly requires authentication.
 * - All pricing, discounts, and inventory checks are verified server-side.
 * - Multi-table operations execute within an atomic Prisma transaction.
 */

/**
 * Generates a clean, unique human-readable order number (e.g. ORG-260910-4821)
 */
function generateOrderNumber() {
  const datePart = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  const randomPart = Math.floor(1000 + Math.random() * 9000);
  return `ORG-${datePart}-${randomPart}`;
}

/**
 * POST /api/orders
 * Places an order from the user's active cart.
 * Strictly gated by authenticate middleware.
 */
async function createOrder(req, res, next) {
  try {
    const userId = req.user.id;
    const { shippingAddress, couponCode, notes, paymentMethod } = req.body;
    const resolvedMethod = paymentMethod === 'STRIPE' ? 'STRIPE' : 'COD';

    // Validate shipping address input (Rule 8)
    if (
      !shippingAddress ||
      !shippingAddress.recipientName ||
      !shippingAddress.phone ||
      !shippingAddress.street ||
      !shippingAddress.city
    ) {
      return res.status(400).json({
        success: false,
        message: 'Recipient name, phone, street address, and city are required for delivery.',
      });
    }

    // Execute atomic transaction for order placement, stock deduction, and payment record (Rule 5)
    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch user's cart with items and live product records
      const cart = await tx.cart.findUnique({
        where: { userId },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      if (!cart || cart.items.length === 0) {
        throw new Error('Your cart is empty. Please add products before checking out.');
      }

      // 2. Validate product availability and recompute line item pricing (Rule 25)
      let subtotal = 0;
      const orderItemsData = [];

      for (const item of cart.items) {
        const product = item.product;

        if (!product.isActive) {
          throw new Error(`"${product.name}" is no longer available.`);
        }

        if (product.stock < item.quantity) {
          throw new Error(
            `Insufficient stock for "${product.name}". Only ${product.stock} units available.`
          );
        }

        const basePrice = Number(product.price);
        const salePrice = product.salePrice !== null ? Number(product.salePrice) : null;
        const unitPrice = salePrice !== null ? salePrice : basePrice;
        const lineTotal = Math.round(unitPrice * item.quantity * 100) / 100;

        subtotal += lineTotal;

        orderItemsData.push({
          productId: product.id,
          productName: product.name,
          quantity: item.quantity,
          unitPrice: unitPrice,
          totalPrice: lineTotal,
        });
      }

      subtotal = Math.round(subtotal * 100) / 100;

      // 3. Server-side coupon verification & discount math (Rule 6)
      let discountAmount = 0;
      let couponId = null;

      if (couponCode && typeof couponCode === 'string' && couponCode.trim()) {
        const trimmedCode = couponCode.trim().toUpperCase();
        const coupon = await tx.coupon.findUnique({
          where: { code: trimmedCode },
        });

        if (coupon && coupon.isActive) {
          const now = new Date();
          const isValidWindow = now >= new Date(coupon.startsAt) && now <= new Date(coupon.expiresAt);
          const hasRemainingUsage = !coupon.usageLimit || coupon.timesUsed < coupon.usageLimit;
          const meetsMinOrder = subtotal >= Number(coupon.minOrderAmount);

          if (isValidWindow && hasRemainingUsage && meetsMinOrder) {
            // Check per-user limit: 1 redemption per customer (Item 12)
            const userUsedCount = await tx.order.count({
              where: {
                userId,
                couponId: coupon.id,
                status: { not: 'CANCELLED' },
              },
            });

            if (userUsedCount >= 1) {
              throw new Error(`You have already redeemed coupon "${coupon.code}". Limited to 1 use per customer.`);
            }

            // Atomic conditional update on timesUsed to prevent race conditions (Item 12)
            const updatedCoupon = await tx.coupon.updateMany({
              where: {
                id: coupon.id,
                isActive: true,
                OR: [
                  { usageLimit: null },
                  { timesUsed: { lt: coupon.usageLimit } },
                ],
              },
              data: { timesUsed: { increment: 1 } },
            });

            if (updatedCoupon.count === 0) {
              throw new Error(`The coupon "${coupon.code}" has reached its maximum usage limit.`);
            }

            couponId = coupon.id;
            const discountVal = Number(coupon.discountValue);

            if (coupon.discountType === 'PERCENTAGE') {
              let calculated = (subtotal * discountVal) / 100;
              if (coupon.maxDiscountAmount) {
                const maxDisc = Number(coupon.maxDiscountAmount);
                if (calculated > maxDisc) calculated = maxDisc;
              }
              discountAmount = calculated;
            } else if (coupon.discountType === 'FIXED') {
              discountAmount = Math.min(subtotal, discountVal);
            }

            discountAmount = Math.round(discountAmount * 100) / 100;
          }
        }
      }

      // 4. Shipping calculation: Free shipping for orders >= ₨ 1,000, otherwise standard ₨ 150
      const shippingFee = subtotal >= 1000 ? 0 : 150;
      const totalAmount = Math.round(Math.max(0, subtotal - discountAmount + shippingFee) * 100) / 100;

      // 5. Find matching existing delivery Address or create a new one (prevents duplicate addresses)
      const cleanRecipient = shippingAddress.recipientName.trim();
      const cleanPhone = shippingAddress.phone.trim();
      const cleanStreet = shippingAddress.street.trim();
      const cleanCity = shippingAddress.city.trim();
      const cleanPostal = shippingAddress.postalCode ? shippingAddress.postalCode.trim() : '00000';
      const cleanCountry = shippingAddress.country ? shippingAddress.country.trim() : 'Pakistan';
      const cleanState = shippingAddress.state ? shippingAddress.state.trim() : null;

      let address = await tx.address.findFirst({
        where: {
          userId,
          recipientName: { equals: cleanRecipient, mode: 'insensitive' },
          street: { equals: cleanStreet, mode: 'insensitive' },
          city: { equals: cleanCity, mode: 'insensitive' },
        },
      });

      if (!address) {
        const addressCount = await tx.address.count({ where: { userId } });
        address = await tx.address.create({
          data: {
            userId,
            recipientName: cleanRecipient,
            phone: cleanPhone,
            street: cleanStreet,
            city: cleanCity,
            state: cleanState,
            postalCode: cleanPostal,
            country: cleanCountry,
            isDefault: addressCount === 0,
          },
        });
      }

      // 6. Generate orderNumber and create Order record
      let orderNumber = generateOrderNumber();
      // Ensure uniqueness
      const existing = await tx.order.findUnique({ where: { orderNumber } });
      if (existing) {
        orderNumber = `${orderNumber}-${Math.floor(10 + Math.random() * 90)}`;
      }

      const order = await tx.order.create({
        data: {
          orderNumber,
          userId,
          addressId: address.id,
          subtotal,
          discountAmount,
          shippingFee,
          totalAmount,
          couponId,
          status: 'PENDING',
          paymentMethod: resolvedMethod,
          paymentStatus: 'PENDING',
          notes: notes ? notes.trim() : null,
          items: {
            create: orderItemsData,
          },
          payment: {
            create: {
              amount: totalAmount,
              method: resolvedMethod,
              status: 'PENDING',
            },
          },
        },
        include: {
          items: true,
          payment: true,
          address: true,
          coupon: {
            select: { code: true, discountType: true, discountValue: true },
          },
        },
      });

      // 7. Atomic decrement product inventory (Item 11: prevents negative stock under concurrent checkouts)
      for (const item of cart.items) {
        const updateResult = await tx.product.updateMany({
          where: {
            id: item.productId,
            isActive: true,
            stock: { gte: item.quantity },
          },
          data: {
            stock: { decrement: item.quantity },
          },
        });

        if (updateResult.count === 0) {
          throw new Error(
            `Insufficient stock for "${item.product.name}". The item sold out while processing your checkout.`
          );
        }
      }

      // 8. Empty the user's cart
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      return order;
    });

    return res.status(201).json({
      success: true,
      message: 'Order placed successfully!',
      order: {
        id: result.id,
        orderNumber: result.orderNumber,
        status: result.status,
        subtotal: Number(result.subtotal),
        discountAmount: Number(result.discountAmount),
        shippingFee: Number(result.shippingFee),
        totalAmount: Number(result.totalAmount),
        paymentMethod: result.paymentMethod,
        paymentStatus: result.paymentStatus,
        createdAt: result.createdAt,
        items: result.items.map((i) => ({
          id: i.id,
          productId: i.productId,
          productName: i.productName,
          quantity: i.quantity,
          unitPrice: Number(i.unitPrice),
          totalPrice: Number(i.totalPrice),
        })),
        address: result.address,
        coupon: result.coupon,
      },
    });
  } catch (error) {
    // If error was thrown inside transaction (e.g. stock or empty cart), return 400
    if (
      error.message &&
      (error.message.includes('stock') ||
        error.message.includes('cart') ||
        error.message.includes('available'))
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
}

/**
 * GET /api/orders/my-orders
 * Retrieves all orders for the authenticated user (Rule 3: Lean select).
 */
async function getMyOrders(req, res, next) {
  try {
    const userId = req.user.id;

    const orders = await prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            product: {
              select: {
                slug: true,
                images: { where: { isPrimary: true }, select: { url: true }, take: 1 },
              },
            },
          },
        },
        address: true,
        coupon: {
          select: { code: true, discountType: true, discountValue: true },
        },
      },
    });

    const formatted = orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      status: o.status,
      subtotal: Number(o.subtotal),
      discountAmount: Number(o.discountAmount),
      shippingFee: Number(o.shippingFee),
      totalAmount: Number(o.totalAmount),
      paymentMethod: o.paymentMethod,
      paymentStatus: o.paymentStatus,
      createdAt: o.createdAt,
      totalItems: o.items.reduce((sum, item) => sum + item.quantity, 0),
      items: o.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        slug: item.product?.slug || null,
        image: item.product?.images[0]?.url || null,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice),
      })),
      address: o.address,
      coupon: o.coupon,
    }));

    return res.status(200).json({
      success: true,
      orders: formatted,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/orders/:identifier (id or orderNumber)
 * Retrieves single order details if caller is owner or admin.
 */
async function getOrderById(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'ADMIN';

    // Allow lookup by UUID id or orderNumber
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    const order = await prisma.order.findFirst({
      where: isUuid ? { id } : { orderNumber: id },
      include: {
        items: {
          include: {
            product: {
              select: {
                slug: true,
                images: { where: { isPrimary: true }, select: { url: true }, take: 1 },
              },
            },
          },
        },
        address: true,
        payment: true,
        coupon: {
          select: { code: true, discountType: true, discountValue: true },
        },
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.',
      });
    }

    // Role/Ownership verification (Rule 7 & 23)
    if (order.userId !== userId && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to view this order.',
      });
    }

    return res.status(200).json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        subtotal: Number(order.subtotal),
        discountAmount: Number(order.discountAmount),
        shippingFee: Number(order.shippingFee),
        totalAmount: Number(order.totalAmount),
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        notes: order.notes,
        createdAt: order.createdAt,
        items: order.items.map((item) => ({
          id: item.id,
          productId: item.productId,
          productName: item.productName,
          slug: item.product?.slug || null,
          image: item.product?.images[0]?.url || null,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
          totalPrice: Number(item.totalPrice),
        })),
        address: order.address,
        payment: order.payment,
        coupon: order.coupon,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/orders/admin/all (Admin only)
 * Fetches all orders with pagination, status filter, and keyword search
 */
async function getAllOrders(req, res, next) {
  try {
    const { status, search, page = 1, limit = 15 } = req.query;

    const take = parseInt(limit, 10) || 15;
    const skip = (parseInt(page, 10) - 1) * take;

    const where = {};

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { orderNumber: { contains: q, mode: 'insensitive' } },
        { user: { name: { contains: q, mode: 'insensitive' } } },
        { user: { email: { contains: q, mode: 'insensitive' } } },
        { address: { recipientName: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true, phone: true } },
          address: true,
          payment: true,
          items: {
            select: {
              id: true,
              productName: true,
              quantity: true,
              unitPrice: true,
              totalPrice: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.order.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      orders: orders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        subtotal: Number(o.subtotal),
        discountAmount: Number(o.discountAmount),
        shippingFee: Number(o.shippingFee),
        totalAmount: Number(o.totalAmount),
        paymentMethod: o.paymentMethod,
        paymentStatus: o.paymentStatus,
        notes: o.notes,
        createdAt: o.createdAt,
        updatedAt: o.updatedAt,
        customer: o.user,
        address: o.address,
        payment: o.payment,
        itemsCount: o.items.reduce((sum, item) => sum + item.quantity, 0),
        items: o.items.map((i) => ({
          id: i.id,
          productName: i.productName,
          quantity: i.quantity,
          unitPrice: Number(i.unitPrice),
          totalPrice: Number(i.totalPrice),
        })),
      })),
      pagination: {
        page: parseInt(page, 10),
        limit: take,
        total,
        totalPages: Math.ceil(total / take),
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/orders/admin/export (Admin only)
 * Fetches all orders matching status/search for sheet export and packing slips (no pagination limit).
 */
async function exportOrdersForAdmin(req, res, next) {
  try {
    const { status, search } = req.query;
    const where = {};

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { orderNumber: { contains: q, mode: 'insensitive' } },
        { user: { name: { contains: q, mode: 'insensitive' } } },
        { user: { email: { contains: q, mode: 'insensitive' } } },
        { address: { recipientName: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        address: true,
        payment: true,
        items: {
          select: {
            id: true,
            productName: true,
            quantity: true,
            unitPrice: true,
            totalPrice: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders: orders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        subtotal: Number(o.subtotal),
        discountAmount: Number(o.discountAmount),
        shippingFee: Number(o.shippingFee),
        totalAmount: Number(o.totalAmount),
        paymentMethod: o.paymentMethod,
        paymentStatus: o.paymentStatus,
        notes: o.notes,
        createdAt: o.createdAt,
        customer: o.user,
        address: o.address,
        payment: o.payment,
        itemsCount: o.items.reduce((sum, item) => sum + item.quantity, 0),
        items: o.items.map((i) => ({
          id: i.id,
          productName: i.productName,
          quantity: i.quantity,
          unitPrice: Number(i.unitPrice),
          totalPrice: Number(i.totalPrice),
        })),
      })),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/orders/admin/:id/status (Admin only)
 * Updates order status with inventory replenishment on cancellation
 */
async function updateOrderStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid order status. Allowed values: ${validStatuses.join(', ')}`,
      });
    }

    const existing = await prisma.order.findUnique({
      where: { id },
      include: { items: true, payment: true },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    if (existing.status === 'CANCELLED') {
      return res.status(400).json({
        success: false,
        message: 'Cancelled orders cannot be modified.',
      });
    }

    if (existing.status === 'DELIVERED' && status !== 'DELIVERED') {
      return res.status(400).json({
        success: false,
        message: 'Completed and delivered orders cannot have their status reversed.',
      });
    }

    // Execute status update with transaction if cancellation restores stock (Rule 5)
    const updatedOrder = await prisma.$transaction(async (tx) => {
      // If order is cancelled, return items back to product inventory
      if (status === 'CANCELLED') {
        for (const item of existing.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }

        if (existing.payment) {
          await tx.payment.update({
            where: { id: existing.payment.id },
            data: { status: 'FAILED' },
          });
        }
      }

      // If order marked DELIVERED and was COD PENDING, mark payment as PAID
      if (status === 'DELIVERED' && existing.paymentMethod === 'COD' && existing.paymentStatus === 'PENDING') {
        if (existing.payment) {
          await tx.payment.update({
            where: { id: existing.payment.id },
            data: { status: 'PAID' },
          });
        }
      }

      return tx.order.update({
        where: { id },
        data: {
          status,
          ...(status === 'DELIVERED' && existing.paymentMethod === 'COD'
            ? { paymentStatus: 'PAID' }
            : {}),
          ...(status === 'CANCELLED'
            ? { paymentStatus: 'FAILED' }
            : {}),
        },
        include: {
          user: { select: { id: true, name: true, email: true } },
          items: true,
          payment: true,
          address: true,
        },
      });
    });

    return res.status(200).json({
      success: true,
      message: `Order #${updatedOrder.orderNumber} status updated to ${updatedOrder.status}.`,
      order: updatedOrder,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/orders/:id/confirm-delivery
 * Customer confirms they received their parcel, or Admin confirms delivery.
 * In a Prisma transaction:
 * - Updates status to DELIVERED
 * - If paymentMethod === 'COD', marks payment as PAID on both Order and Payment
 */
async function confirmDelivery(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const existing = await prisma.order.findUnique({
      where: { id },
      include: { items: true, payment: true },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    // Security (Item 13): Only Store Admin or logistics personnel can mark orders DELIVERED.
    // Customers cannot self-confirm delivery to convert unpaid COD into PAID.
    if (userRole !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Only store administrators or delivery staff can confirm order delivery.',
      });
    }

    if (existing.status === 'DELIVERED') {
      return res.status(200).json({
        success: true,
        message: 'Order delivery has already been confirmed.',
        order: existing,
      });
    }

    if (existing.status === 'CANCELLED') {
      return res.status(400).json({
        success: false,
        message: 'Cancelled orders cannot be marked as delivered.',
      });
    }

    const updated = await prisma.$transaction(async (tx) => {
      // If COD and payment was PENDING, mark payment as PAID
      if (existing.paymentMethod === 'COD' && existing.paymentStatus === 'PENDING') {
        if (existing.payment) {
          await tx.payment.update({
            where: { id: existing.payment.id },
            data: { status: 'PAID' },
          });
        }
      }

      return tx.order.update({
        where: { id },
        data: {
          status: 'DELIVERED',
          ...(existing.paymentMethod === 'COD' && existing.paymentStatus === 'PENDING'
            ? { paymentStatus: 'PAID' }
            : {}),
        },
        include: {
          user: { select: { id: true, name: true, email: true } },
          items: true,
          payment: true,
          address: true,
        },
      });
    });

    return res.status(200).json({
      success: true,
      message: 'Delivery confirmed! Thank you for shopping with Organic Store.',
      order: updated,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/orders/:id/cancel
 * Customer cancels their own order (strictly PENDING and UNPAID), or Admin cancels.
 * In a Prisma transaction:
 * - Restores inventory stock for all products
 * - Marks status CANCELLED and paymentStatus FAILED
 */
async function cancelOrder(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const existing = await prisma.order.findUnique({
      where: { id },
      include: { items: true, payment: true },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    // Only owner of the order or Admin can cancel
    if (existing.userId !== userId && userRole !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to cancel this order.',
      });
    }

    if (existing.status === 'CANCELLED') {
      return res.status(400).json({
        success: false,
        message: 'Order is already cancelled.',
      });
    }

    if (existing.status === 'DELIVERED') {
      return res.status(400).json({
        success: false,
        message: 'Delivered orders cannot be cancelled.',
      });
    }

    // Security (Item 13): Customer can only cancel PENDING UNPAID orders.
    // Confirmed or paid orders require administrator review and refund processing.
    if (userRole !== 'ADMIN') {
      if (existing.status !== 'PENDING') {
        return res.status(400).json({
          success: false,
          message: 'Orders that have already been confirmed or entered fulfillment cannot be cancelled directly. Please contact customer support.',
        });
      }
      if (existing.paymentStatus === 'PAID') {
        return res.status(400).json({
          success: false,
          message: 'Paid orders cannot be automatically cancelled. Please contact support to process a formal cancellation and refund.',
        });
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      // 1. Restore product inventory stock
      for (const item of existing.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }

      // 2. Mark payment failed/cancelled
      if (existing.payment) {
        await tx.payment.update({
          where: { id: existing.payment.id },
          data: { status: 'FAILED' },
        });
      }

      // 3. Update order
      return tx.order.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          paymentStatus: 'FAILED',
        },
        include: {
          user: { select: { id: true, name: true, email: true } },
          items: true,
          payment: true,
          address: true,
        },
      });
    });

    return res.status(200).json({
      success: true,
      message: 'Your order has been cancelled successfully.',
      order: updated,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  exportOrdersForAdmin,
  updateOrderStatus,
  confirmDelivery,
  cancelOrder,
};
