const bcrypt = require('bcrypt');
const { prisma } = require('../config/db');

/**
 * User Controller
 * Handles customer profile, password change, address management, and wishlist.
 * Enforces Rule 3 (lean queries), Rule 5 ($transaction), Rule 6 (server-side logic), and Rule 23 (authenticated).
 */

/**
 * GET /api/users/profile
 * Retrieves user profile with account statistics.
 */
async function getProfile(req, res, next) {
  try {
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        avatar: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            orders: true,
            addresses: true,
            wishlistItems: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    return res.status(200).json({
      success: true,
      profile: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        avatar: user.avatar,
        role: user.role,
        memberSince: user.createdAt,
        stats: {
          ordersCount: user._count.orders,
          addressesCount: user._count.addresses,
          wishlistCount: user._count.wishlistItems,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/users/profile
 * Updates user name and phone.
 */
async function updateProfile(req, res, next) {
  try {
    const userId = req.user.id;
    const { name, phone } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Name is required.',
      });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        name: name.trim(),
        phone: phone ? phone.trim() : null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        avatar: true,
        role: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: updated,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/users/change-password
 * Securely changes password after verifying the existing password hash.
 */
async function changePassword(req, res, next) {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required.',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.',
      });
    }

    // Retrieve user's current passwordHash
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect.',
      });
    }

    // Hash new password with salt rounds 10
    const newHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully.',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/users/addresses
 * Returns all saved delivery addresses for the user.
 */
async function getAddresses(req, res, next) {
  try {
    const userId = req.user.id;

    const addresses = await prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });

    return res.status(200).json({
      success: true,
      addresses,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/users/addresses
 * Creates a new saved address. Handles default address toggling in a transaction.
 */
async function createAddress(req, res, next) {
  try {
    const userId = req.user.id;
    const { recipientName, phone, street, city, state, postalCode, country, isDefault } = req.body;

    if (!recipientName || !phone || !street || !city) {
      return res.status(400).json({
        success: false,
        message: 'Recipient name, phone, street, and city are required.',
      });
    }

    const newAddress = await prisma.$transaction(async (tx) => {
      // If setting as default, unset any existing default address for this user
      if (isDefault) {
        await tx.address.updateMany({
          where: { userId, isDefault: true },
          data: { isDefault: false },
        });
      }

      // Check if user has any existing addresses; if none, make this first one default
      const count = await tx.address.count({ where: { userId } });
      const makeDefault = isDefault || count === 0;

      return tx.address.create({
        data: {
          userId,
          recipientName: recipientName.trim(),
          phone: phone.trim(),
          street: street.trim(),
          city: city.trim(),
          state: state ? state.trim() : null,
          postalCode: postalCode ? postalCode.trim() : '00000',
          country: country ? country.trim() : 'Pakistan',
          isDefault: makeDefault,
        },
      });
    });

    return res.status(201).json({
      success: true,
      message: 'Address saved successfully.',
      address: newAddress,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/users/addresses/:id
 * Updates an address owned by the user.
 */
async function updateAddress(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { recipientName, phone, street, city, state, postalCode, country, isDefault } = req.body;

    const existing = await prisma.address.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Address not found.',
      });
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (isDefault) {
        await tx.address.updateMany({
          where: { userId, isDefault: true, id: { not: id } },
          data: { isDefault: false },
        });
      }

      return tx.address.update({
        where: { id },
        data: {
          recipientName: recipientName !== undefined ? recipientName.trim() : existing.recipientName,
          phone: phone !== undefined ? phone.trim() : existing.phone,
          street: street !== undefined ? street.trim() : existing.street,
          city: city !== undefined ? city.trim() : existing.city,
          state: state !== undefined ? (state ? state.trim() : null) : existing.state,
          postalCode: postalCode !== undefined ? (postalCode ? postalCode.trim() : '00000') : existing.postalCode,
          country: country !== undefined ? (country ? country.trim() : 'Pakistan') : existing.country,
          isDefault: isDefault !== undefined ? Boolean(isDefault) : existing.isDefault,
        },
      });
    });

    return res.status(200).json({
      success: true,
      message: 'Address updated successfully.',
      address: updated,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/users/addresses/:id
 * Deletes an address owned by the user.
 */
async function deleteAddress(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const existing = await prisma.address.findFirst({
      where: { id, userId },
      include: {
        _count: {
          select: { orders: true },
        },
      },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Address not found.',
      });
    }

    if (existing._count.orders > 0) {
      return res.status(400).json({
        success: false,
        message: 'This address is linked to your previous order history and cannot be deleted. You can edit it or add a new delivery address instead.',
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.address.delete({ where: { id } });

      // If deleted address was default, promote another address to default
      if (existing.isDefault) {
        const nextAddress = await tx.address.findFirst({
          where: { userId },
          orderBy: { createdAt: 'desc' },
        });

        if (nextAddress) {
          await tx.address.update({
            where: { id: nextAddress.id },
            data: { isDefault: true },
          });
        }
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Address deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/users/addresses/:id/default
 * Sets the chosen address as default.
 */
async function setDefaultAddress(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const existing = await prisma.address.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Address not found.',
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });

      await tx.address.update({
        where: { id },
        data: { isDefault: true },
      });
    });

    return res.status(200).json({
      success: true,
      message: 'Default address updated.',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/users/wishlist
 * Returns the user's wishlist products with pricing and active stock info.
 */
async function getWishlist(req, res, next) {
  try {
    const userId = req.user.id;

    const items = await prisma.wishlistItem.findMany({
      where: { userId },
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
            category: { select: { name: true, slug: true } },
            images: { where: { isPrimary: true }, select: { url: true }, take: 1 },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = items.map((w) => ({
      id: w.id,
      productId: w.product.id,
      name: w.product.name,
      slug: w.product.slug,
      category: w.product.category,
      price: Number(w.product.price),
      salePrice: w.product.salePrice !== null ? Number(w.product.salePrice) : null,
      onSale: w.product.salePrice !== null,
      stock: w.product.stock,
      inStock: w.product.isActive && w.product.stock > 0,
      image: w.product.images[0]?.url || null,
      addedAt: w.createdAt,
    }));

    return res.status(200).json({
      success: true,
      wishlist: formatted,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/users/wishlist/:productId
 * Toggles product in user's wishlist.
 */
async function toggleWishlist(req, res, next) {
  try {
    const userId = req.user.id;
    const { productId } = req.params;

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, name: true },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.',
      });
    }

    const existing = await prisma.wishlistItem.findUnique({
      where: {
        userId_productId: { userId, productId },
      },
    });

    if (existing) {
      await prisma.wishlistItem.delete({
        where: { id: existing.id },
      });

      return res.status(200).json({
        success: true,
        action: 'removed',
        message: `Removed "${product.name}" from your wishlist.`,
      });
    } else {
      await prisma.wishlistItem.create({
        data: { userId, productId },
      });

      return res.status(201).json({
        success: true,
        action: 'added',
        message: `Saved "${product.name}" to your wishlist!`,
      });
    }
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/users/wishlist/:productId
 * Removes a product from user's wishlist.
 */
async function removeFromWishlist(req, res, next) {
  try {
    const userId = req.user.id;
    const { productId } = req.params;

    const existing = await prisma.wishlistItem.findUnique({
      where: {
        userId_productId: { userId, productId },
      },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Item not in wishlist.',
      });
    }

    await prisma.wishlistItem.delete({ where: { id: existing.id } });

    return res.status(200).json({
      success: true,
      message: 'Item removed from wishlist.',
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  getWishlist,
  toggleWishlist,
  removeFromWishlist,
};
