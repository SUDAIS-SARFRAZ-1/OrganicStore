const { prisma } = require('../config/db');

/**
 * Cart Controller
 * Enforces Rule 6 & 25: All pricing, stock validation, and totals are computed strictly server-side.
 * Never trusts client numbers. Uses Prisma transactions where applicable (Rule 5).
 */

/**
 * Helper: Resolves active cart for logged-in user or guest session
 */
async function resolveCart(req, res) {
  let cart = null;
  const guestCartId = req.headers['x-cart-id'] || (req.cookies && req.cookies.guest_cart_id);

  if (req.user) {
    // 1. Authenticated customer cart
    cart = await prisma.cart.findUnique({
      where: { userId: req.user.id },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: req.user.id },
      });
    }

    // Check if there was a guest cart that should be merged
    if (guestCartId && guestCartId !== cart.id) {
      const guestCart = await prisma.cart.findFirst({
        where: { id: guestCartId, userId: null },
        include: { items: true },
      });

      if (guestCart && guestCart.items.length > 0) {
        // Merge guest cart items into user cart within a Prisma transaction
        await prisma.$transaction(async (tx) => {
          for (const item of guestCart.items) {
            const existingItem = await tx.cartItem.findUnique({
              where: {
                cartId_productId: {
                  cartId: cart.id,
                  productId: item.productId,
                },
              },
            });

            if (existingItem) {
              await tx.cartItem.update({
                where: { id: existingItem.id },
                data: { quantity: existingItem.quantity + item.quantity },
              });
            } else {
              await tx.cartItem.create({
                data: {
                  cartId: cart.id,
                  productId: item.productId,
                  quantity: item.quantity,
                },
              });
            }
          }

          // Delete the guest cart after successful migration
          await tx.cart.delete({ where: { id: guestCart.id } });
        });

        // Clear guest cookie
        if (res.clearCookie) {
          res.clearCookie('guest_cart_id');
        }
      }
    }
  } else {
    // 2. Guest cart
    if (guestCartId) {
      cart = await prisma.cart.findFirst({
        where: { id: guestCartId, userId: null },
      });
    }

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: null },
      });

      if (res.cookie) {
        res.cookie('guest_cart_id', cart.id, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        });
      }
    }
  }

  return cart;
}

/**
 * Helper: Builds lean, server-calculated cart payload
 */
async function buildCartResponse(cartId) {
  const cart = await prisma.cart.findUnique({
    where: { id: cartId },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              price: true,
              salePrice: true,
              stock: true,
              isActive: true,
              images: {
                where: { isPrimary: true },
                select: { url: true },
                take: 1,
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!cart) return null;

  let totalItems = 0;
  let subtotal = 0;

  const items = cart.items.map((item) => {
    const product = item.product;
    const basePrice = Number(product.price);
    const salePrice = product.salePrice !== null ? Number(product.salePrice) : null;
    const effectiveUnitPrice = salePrice !== null ? salePrice : basePrice;
    const itemSubtotal = Math.round(effectiveUnitPrice * item.quantity * 100) / 100;
    const primaryImage = product.images[0]?.url || null;

    totalItems += item.quantity;
    subtotal += itemSubtotal;

    return {
      id: item.id,
      productId: product.id,
      name: product.name,
      slug: product.slug,
      image: primaryImage,
      price: basePrice,
      salePrice: salePrice,
      unitPrice: effectiveUnitPrice,
      quantity: item.quantity,
      subtotal: itemSubtotal,
      stock: product.stock,
      inStock: product.isActive && product.stock >= item.quantity,
    };
  });

  return {
    id: cart.id,
    items,
    totalItems,
    subtotal: Math.round(subtotal * 100) / 100,
  };
}

/**
 * GET /api/cart
 * Returns the resolved cart with live prices and totals computed on the server.
 */
async function getCart(req, res, next) {
  try {
    const cart = await resolveCart(req, res);
    const cartData = await buildCartResponse(cart.id);

    return res.status(200).json({
      success: true,
      cart: cartData,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/cart/items
 * Adds a product to the cart with server-side stock validation.
 * Body: { productId: string, quantity?: number }
 */
async function addToCart(req, res, next) {
  try {
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required.',
      });
    }

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be a positive integer.',
      });
    }

    // Re-verify product existence and stock against database (Rule 25)
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, name: true, stock: true, isActive: true },
    });

    if (!product || !product.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or is currently unavailable.',
      });
    }

    if (product.stock <= 0) {
      return res.status(400).json({
        success: false,
        message: `"${product.name}" is currently out of stock.`,
      });
    }

    const cart = await resolveCart(req, res);

    // Check existing quantity in cart
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId: product.id,
        },
      },
    });

    const newQuantity = (existingItem ? existingItem.quantity : 0) + qty;
    if (newQuantity > product.stock) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.stock} units of "${product.name}" available in stock.`,
      });
    }

    if (existingItem) {
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: product.id,
          quantity: qty,
        },
      });
    }

    const updatedCart = await buildCartResponse(cart.id);

    return res.status(200).json({
      success: true,
      message: `Added "${product.name}" to cart.`,
      cart: updatedCart,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/cart/items/:id
 * Updates quantity of a cart line item with server-side stock ceiling.
 * Body: { quantity: number }
 */
async function updateCartItem(req, res, next) {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be at least 1.',
      });
    }

    const cart = await resolveCart(req, res);

    const item = await prisma.cartItem.findFirst({
      where: { id, cartId: cart.id },
      include: {
        product: {
          select: { id: true, name: true, stock: true, isActive: true },
        },
      },
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Cart item not found.',
      });
    }

    if (qty > item.product.stock) {
      return res.status(400).json({
        success: false,
        message: `Cannot exceed available stock of ${item.product.stock} for "${item.product.name}".`,
      });
    }

    await prisma.cartItem.update({
      where: { id },
      data: { quantity: qty },
    });

    const updatedCart = await buildCartResponse(cart.id);

    return res.status(200).json({
      success: true,
      cart: updatedCart,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/cart/items/:id
 * Removes a line item from the cart.
 */
async function removeCartItem(req, res, next) {
  try {
    const { id } = req.params;
    const cart = await resolveCart(req, res);

    const item = await prisma.cartItem.findFirst({
      where: { id, cartId: cart.id },
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Cart item not found.',
      });
    }

    await prisma.cartItem.delete({ where: { id } });

    const updatedCart = await buildCartResponse(cart.id);

    return res.status(200).json({
      success: true,
      message: 'Item removed from cart.',
      cart: updatedCart,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/cart
 * Clears all items from the cart.
 */
async function clearCart(req, res, next) {
  try {
    const cart = await resolveCart(req, res);

    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    const updatedCart = await buildCartResponse(cart.id);

    return res.status(200).json({
      success: true,
      message: 'Cart cleared.',
      cart: updatedCart,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
};
