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
    const { shippingAddress, couponCode, notes } = req.body;

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

            // Increment coupon usage
            await tx.coupon.update({
              where: { id: coupon.id },
              data: { timesUsed: { increment: 1 } },
            });
          }
        }
      }

      // 4. Shipping calculation: Free shipping for orders >= ₨ 1,000, otherwise standard ₨ 150
      const shippingFee = subtotal >= 1000 ? 0 : 150;
      const totalAmount = Math.round(Math.max(0, subtotal - discountAmount + shippingFee) * 100) / 100;

      // 5. Create delivery Address record for this order
      const address = await tx.address.create({
        data: {
          userId,
          recipientName: shippingAddress.recipientName.trim(),
          phone: shippingAddress.phone.trim(),
          street: shippingAddress.street.trim(),
          city: shippingAddress.city.trim(),
          state: shippingAddress.state ? shippingAddress.state.trim() : null,
          postalCode: shippingAddress.postalCode ? shippingAddress.postalCode.trim() : '00000',
          country: shippingAddress.country ? shippingAddress.country.trim() : 'Pakistan',
        },
      });

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
          paymentMethod: 'COD',
          paymentStatus: 'PENDING',
          notes: notes ? notes.trim() : null,
          items: {
            create: orderItemsData,
          },
          payment: {
            create: {
              amount: totalAmount,
              method: 'COD',
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

      // 7. Decrement product inventory (Rule 5)
      for (const item of cart.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: { decrement: item.quantity },
          },
        });
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

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
};
