const Stripe = require('stripe');
const { prisma } = require('../config/db');

// Dynamic Stripe instance helper to always capture active environment credentials
function getStripeInstance() {
  const stripeSecretKey = (process.env.STRIPE_SECRET_KEY || '').trim();
  return stripeSecretKey ? new Stripe(stripeSecretKey) : null;
}

/**
 * GET /api/payments/config
 * Public / Authenticated: Returns Stripe publishable key to frontend
 */
async function getStripeConfig(req, res) {
  return res.status(200).json({
    success: true,
    publishableKey: (process.env.STRIPE_PUBLISHABLE_KEY || '').trim(),
  });
}

/**
 * POST /api/payments/create-checkout-session
 * Authenticated: Creates a Stripe Checkout Session for a pending order
 */
async function createCheckoutSession(req, res, next) {
  try {
    const userId = req.user.id;
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required to initiate Stripe checkout.',
      });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        user: { select: { id: true, email: true, name: true } },
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.',
      });
    }

    if (order.userId !== userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to pay for this order.',
      });
    }

    if (order.paymentStatus === 'PAID') {
      return res.status(400).json({
        success: false,
        message: 'This order has already been paid.',
      });
    }

    if (order.status === 'CANCELLED') {
      return res.status(400).json({
        success: false,
        message: 'Cannot pay for a cancelled order.',
      });
    }

    const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/+$/, '');

    // Construct line items for Stripe
    let lineItems = [];
    if (Number(order.discountAmount || order.discount || 0) > 0) {
      // With coupon discount, present line item matching exact final totalAmount
      lineItems = [
        {
          price_data: {
            currency: 'pkr',
            product_data: {
              name: `Organic Store Order #${order.orderNumber}`,
              description: order.items.map((i) => `${i.productName} (x${i.quantity})`).join(', '),
            },
            unit_amount: Math.max(100, Math.round(Number(order.totalAmount) * 100)),
          },
          quantity: 1,
        },
      ];
    } else {
      lineItems = order.items.map((item) => ({
        price_data: {
          currency: 'pkr',
          product_data: {
            name: item.productName,
          },
          unit_amount: Math.round(Number(item.unitPrice) * 100),
        },
        quantity: item.quantity,
      }));

      // Add shipping fee if applicable
      if (Number(order.shippingFee) > 0) {
        lineItems.push({
          price_data: {
            currency: 'pkr',
            product_data: {
              name: 'Standard Delivery Shipping',
            },
            unit_amount: Math.round(Number(order.shippingFee) * 100),
          },
          quantity: 1,
        });
      }
    }

    const stripe = getStripeInstance();
    if (!stripe) {
      return res.status(500).json({
        success: false,
        message: 'Stripe payment gateway is not configured. Please check STRIPE_SECRET_KEY.',
      });
    }

    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        customer_email: order.user?.email || req.user.email,
        client_reference_id: order.id,
        line_items: lineItems,
        metadata: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          userId: req.user.id,
        },
        success_url: `${frontendUrl}/order-success/${order.orderNumber}?session_id={CHECKOUT_SESSION_ID}&order_id=${order.id}`,
        cancel_url: `${frontendUrl}/checkout?cancelled=true&order_id=${order.id}`,
      });

      if (order.payment) {
        await prisma.payment.update({
          where: { id: order.payment.id },
          data: { transactionId: session.id },
        });
      }

      return res.status(200).json({
        success: true,
        sessionId: session.id,
        url: session.url,
      });
    } catch (stripeError) {
      console.error('Stripe checkout error:', stripeError.message);
      return res.status(400).json({
        success: false,
        message: `Stripe error: ${stripeError.message}`,
      });
    }
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/payments/verify-checkout-session
 * Authenticated: Verifies payment status and commits database updates within a Prisma $transaction
 */
async function verifyCheckoutSession(req, res, next) {
  try {
    const userId = req.user.id;
    const { sessionId, orderId } = req.body;

    if (!sessionId && !orderId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID or Order ID is required for verification.',
      });
    }

    // Find order
    const order = await prisma.order.findFirst({
      where: orderId ? { id: orderId } : { payment: { transactionId: sessionId } },
      include: { payment: true, user: true, items: true },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found for payment verification.',
      });
    }

    // Only owner or admin
    if (order.userId !== userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to verify this payment.',
      });
    }

    // If already marked as paid
    if (order.paymentStatus === 'PAID') {
      return res.status(200).json({
        success: true,
        alreadyPaid: true,
        message: 'Order payment is already verified and completed.',
        order,
      });
    }

    let isPaymentValid = false;
    let transactionReference = sessionId;

    const stripe = getStripeInstance();
    if (stripe && sessionId) {
      try {
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        const isMatchingOrder =
          session.client_reference_id === order.id ||
          session.metadata?.orderId === order.id ||
          (order.payment && order.payment.transactionId === session.id);

        if (session.payment_status === 'paid' && isMatchingOrder) {
          isPaymentValid = true;
          transactionReference = session.payment_intent || session.id;
        }
      } catch (err) {
        console.error('Error verifying Stripe session:', err.message);
      }
    }

    if (!isPaymentValid) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed: Payment not confirmed by Stripe or does not match order.',
      });
    }

    // Execute atomic PostgreSQL transaction (Rule 5)
    const updatedOrder = await prisma.$transaction(async (tx) => {
      // 1. Update Payment record
      if (order.payment) {
        await tx.payment.update({
          where: { id: order.payment.id },
          data: {
            status: 'PAID',
            transactionId: transactionReference,
          },
        });
      }

      // 2. Update Order status
      const ord = await tx.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'PAID',
          status: order.status === 'PENDING' ? 'CONFIRMED' : order.status,
        },
        include: {
          items: true,
          payment: true,
          address: true,
        },
      });

      // 3. Decrement inventory stock on verified successful payment confirmation
      for (const item of (order.items || [])) {
        if (item.productId) {
          const res = await tx.product.updateMany({
            where: {
              id: item.productId,
              stock: { gte: item.quantity },
            },
            data: {
              stock: { decrement: item.quantity },
            },
          });
          if (res.count === 0) {
            throw new Error(`Insufficient stock for product ID "${item.productId}" during payment settlement.`);
          }
        }
      }

      // 4. Clear user cart if any active cart exists
      const targetUserId = order.userId || userId;
      if (targetUserId) {
        const userCart = await tx.cart.findUnique({ where: { userId: targetUserId } });
        if (userCart) {
          await tx.cartItem.deleteMany({ where: { cartId: userCart.id } });
        }
      }

      return ord;
    });

    const serializedOrder = {
      ...updatedOrder,
      subtotal: Number(updatedOrder.subtotal),
      discountAmount: Number(updatedOrder.discountAmount),
      shippingFee: Number(updatedOrder.shippingFee),
      totalAmount: Number(updatedOrder.totalAmount),
      items: updatedOrder.items.map((item) => ({
        ...item,
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice),
      })),
    };

    return res.status(200).json({
      success: true,
      message: 'Payment verified and order confirmed!',
      order: serializedOrder,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/payments/process-card-payment
 * Authenticated: Processes card payment directly from embedded checkout form (Option B)
 * Inside a Prisma transaction:
 * - Updates payment record to PAID with transaction reference
 * - Updates order to CONFIRMED and paymentStatus to PAID
 * - Clears customer's cart
 */
async function processDirectCardPayment(req, res, next) {
  try {
    const userId = req.user.id;
    const { orderId, cardholderName, cardNumber, expiry, cvc } = req.body;

    if (!orderId) {
      return res.status(400).json({ success: false, message: 'Order ID is required.' });
    }

    if (!cardholderName || !cardNumber || !expiry || !cvc) {
      return res.status(400).json({
        success: false,
        message: 'All card fields (Cardholder Name, Card Number, Expiry Date, CVC) are required.',
      });
    }

    // Clean card number
    const cleanNumber = cardNumber.replace(/\s+/g, '');
    if (cleanNumber.length < 13 || cleanNumber.length > 19) {
      return res.status(400).json({
        success: false,
        message: 'Invalid card number format. Please enter a valid 16-digit debit/credit card.',
      });
    }

    const last4 = cleanNumber.slice(-4);
    const brand = cleanNumber.startsWith('4')
      ? 'Visa'
      : cleanNumber.startsWith('5')
      ? 'Mastercard'
      : cleanNumber.startsWith('3')
      ? 'American Express'
      : 'Card';

    // Verify order exists & belongs to user
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true, items: true, address: true },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    if (order.userId !== userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Unauthorized.' });
    }

    if (order.paymentStatus === 'PAID') {
      return res.status(200).json({
        success: true,
        message: 'Order has already been paid.',
        order,
      });
    }

    const stripe = getStripeInstance();
    if (!stripe) {
      return res.status(400).json({
        success: false,
        message: 'Direct card processing is unavailable without Stripe configured. Please use Stripe Checkout.',
      });
    }

    const expiryParts = expiry.split('/');
    const expMonth = parseInt(expiryParts[0]?.trim(), 10);
    const expYearRaw = expiryParts[1]?.trim() || '';
    const expYear = parseInt(expYearRaw.length === 2 ? '20' + expYearRaw : expYearRaw, 10);

    let paymentIntent;
    try {
      const paymentMethodObj = await stripe.paymentMethods.create({
        type: 'card',
        card: {
          number: cleanNumber,
          exp_month: expMonth,
          exp_year: expYear,
          cvc: String(cvc).trim(),
        },
      });

      paymentIntent = await stripe.paymentIntents.create({
        amount: Math.max(100, Math.round(Number(order.totalAmount) * 100)),
        currency: 'pkr',
        payment_method: paymentMethodObj.id,
        confirm: true,
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: 'never',
        },
        metadata: {
          orderId: order.id,
          orderNumber: order.orderNumber,
        },
      });
    } catch (chargeErr) {
      return res.status(400).json({
        success: false,
        message: `Card payment authorization failed: ${chargeErr.message}`,
      });
    }

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({
        success: false,
        message: `Payment not completed. Charge status: ${paymentIntent.status}`,
      });
    }

    const transactionId = paymentIntent.id;

    // Execute atomic PostgreSQL transaction (Rule 5)
    const updatedOrder = await prisma.$transaction(async (tx) => {
      // 1. Update Payment record
      if (order.payment) {
        await tx.payment.update({
          where: { id: order.payment.id },
          data: {
            status: 'PAID',
            method: `CARD_${brand.toUpperCase()}`,
            transactionId,
          },
        });
      }

      // 2. Update Order status
      const ord = await tx.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'PAID',
          paymentMethod: 'Credit / Debit Card',
          status: 'CONFIRMED',
        },
        include: {
          items: true,
          payment: true,
          address: true,
        },
      });

      // 3. Decrement inventory stock on verified successful payment
      for (const item of (order.items || [])) {
        if (item.productId) {
          const res = await tx.product.updateMany({
            where: {
              id: item.productId,
              stock: { gte: item.quantity },
            },
            data: {
              stock: { decrement: item.quantity },
            },
          });
          if (res.count === 0) {
            throw new Error(`Insufficient stock for product ID "${item.productId}" during card payment settlement.`);
          }
        }
      }

      // 4. Clear user cart
      const userCart = await tx.cart.findUnique({ where: { userId } });
      if (userCart) {
        await tx.cartItem.deleteMany({ where: { cartId: userCart.id } });
      }

      return ord;
    });

    const serializedOrder = {
      ...updatedOrder,
      subtotal: Number(updatedOrder.subtotal),
      discountAmount: Number(updatedOrder.discountAmount),
      shippingFee: Number(updatedOrder.shippingFee),
      totalAmount: Number(updatedOrder.totalAmount),
      items: updatedOrder.items.map((item) => ({
        ...item,
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice),
      })),
    };

    return res.status(200).json({
      success: true,
      message: 'Card payment processed successfully!',
      order: serializedOrder,
      cardBrand: brand,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/payments/webhook
 * Stripe webhook handler for checkout.session.completed
 */
async function handleStripeWebhook(req, res) {
  const sig = req.headers['stripe-signature'];
  const stripe = getStripeInstance();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe || !webhookSecret) {
    return res.status(400).json({ error: 'Stripe webhook secret is not configured' });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error(`Stripe Webhook signature verification failed:`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const orderId = session.client_reference_id || session.metadata?.orderId;
    if (orderId) {
      try {
        const order = await prisma.order.findUnique({
          where: { id: orderId },
          include: { payment: true, items: true },
        });

        if (order && order.paymentStatus !== 'PAID') {
          await prisma.$transaction(async (tx) => {
            if (order.payment) {
              await tx.payment.update({
                where: { id: order.payment.id },
                data: {
                  status: 'PAID',
                  transactionId: session.payment_intent || session.id,
                },
              });
            }

            await tx.order.update({
              where: { id: order.id },
              data: {
                paymentStatus: 'PAID',
                status: order.status === 'PENDING' ? 'CONFIRMED' : order.status,
              },
            });

            for (const item of (order.items || [])) {
              if (item.productId) {
                const res = await tx.product.updateMany({
                  where: {
                    id: item.productId,
                    stock: { gte: item.quantity },
                  },
                  data: {
                    stock: { decrement: item.quantity },
                  },
                });
                if (res.count === 0) {
                  throw new Error(`Insufficient stock for product ID "${item.productId}" during webhook settlement.`);
                }
              }
            }
          });
        }
      } catch (err) {
        console.error('Error processing checkout.session.completed in webhook:', err);
      }
    }
  }

  return res.json({ received: true });
}

module.exports = {
  getStripeConfig,
  createCheckoutSession,
  verifyCheckoutSession,
  processDirectCardPayment,
  handleStripeWebhook,
};
