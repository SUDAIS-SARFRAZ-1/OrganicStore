const { prisma } = require('../config/db');

/**
 * Coupon Controller
 * Handles coupon validation and public coupon discovery.
 * Enforces Rule 6 & 8: All business logic, discount math, and validation happen on the server.
 */

/**
 * GET /api/coupons/public
 * Returns active public coupons for customer self-serve display (PRD 3.4 & 6.3).
 */
async function getPublicCoupons(req, res, next) {
  try {
    const now = new Date();
    // Allow up to 2 minutes clock skew tolerance for startsAt
    const skewWindow = new Date(Date.now() + 120000);

    const coupons = await prisma.coupon.findMany({
      where: {
        isActive: true,
        isPublic: true,
        startsAt: { lte: skewWindow },
        expiresAt: { gte: now },
      },
      select: {
        id: true,
        code: true,
        description: true,
        discountType: true,
        discountValue: true,
        minOrderAmount: true,
        maxDiscountAmount: true,
        expiresAt: true,
        usageLimit: true,
        timesUsed: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Only surface coupons that haven't hit their usage ceiling
    const available = coupons.filter(
      (c) => c.usageLimit === null || c.timesUsed < c.usageLimit
    );

    const formatted = available.map((c) => ({
      id: c.id,
      code: c.code,
      description: c.description,
      discountType: c.discountType,
      discountValue: Number(c.discountValue),
      minOrderAmount: Number(c.minOrderAmount),
      maxDiscountAmount: c.maxDiscountAmount ? Number(c.maxDiscountAmount) : null,
      expiresAt: c.expiresAt,
    }));

    return res.status(200).json({
      success: true,
      coupons: formatted,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/coupons/validate
 * Validates a coupon code against current cart total and returns server-computed discount.
 * Body: { code: string, cartTotal: number }
 */
async function validateCoupon(req, res, next) {
  try {
    const { code, cartTotal } = req.body;

    if (!code || typeof code !== 'string' || !code.trim()) {
      return res.status(400).json({
        success: false,
        valid: false,
        message: 'A valid coupon code is required.',
      });
    }

    const numericTotal = Number(cartTotal);
    if (isNaN(numericTotal) || numericTotal < 0) {
      return res.status(400).json({
        success: false,
        valid: false,
        message: 'A valid cart total is required for discount calculation.',
      });
    }

    const trimmedCode = code.trim().toUpperCase();
    const coupon = await prisma.coupon.findUnique({
      where: { code: trimmedCode },
    });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        valid: false,
        message: `Coupon code "${trimmedCode}" is invalid.`,
      });
    }

    const now = new Date();

    // Check active status
    if (!coupon.isActive) {
      return res.status(400).json({
        success: false,
        valid: false,
        message: `Coupon code "${trimmedCode}" is inactive.`,
      });
    }

    // Check validity window
    if (now < new Date(coupon.startsAt)) {
      return res.status(400).json({
        success: false,
        valid: false,
        message: `Coupon code "${trimmedCode}" is not active yet.`,
      });
    }

    if (now > new Date(coupon.expiresAt)) {
      return res.status(400).json({
        success: false,
        valid: false,
        message: `Coupon code "${trimmedCode}" has expired.`,
      });
    }

    // Check usage limits
    if (coupon.usageLimit && coupon.timesUsed >= coupon.usageLimit) {
      return res.status(400).json({
        success: false,
        valid: false,
        message: `Coupon code "${trimmedCode}" usage limit has been reached.`,
      });
    }

    // Check minimum order amount
    const minOrder = Number(coupon.minOrderAmount);
    if (numericTotal < minOrder) {
      return res.status(400).json({
        success: false,
        valid: false,
        message: `Coupon "${trimmedCode}" requires a minimum order amount of ₨ ${minOrder.toFixed(2)}.`,
        minOrderAmount: minOrder,
      });
    }

    // Compute discount server-side (Rule 6)
    let calculatedDiscount = 0;
    const discountVal = Number(coupon.discountValue);

    if (coupon.discountType === 'PERCENTAGE') {
      calculatedDiscount = (numericTotal * discountVal) / 100;
      if (coupon.maxDiscountAmount) {
        const maxDisc = Number(coupon.maxDiscountAmount);
        if (calculatedDiscount > maxDisc) {
          calculatedDiscount = maxDisc;
        }
      }
    } else if (coupon.discountType === 'FIXED') {
      calculatedDiscount = Math.min(numericTotal, discountVal);
    }

    // Round to 2 decimals
    calculatedDiscount = Math.round(calculatedDiscount * 100) / 100;

    return res.status(200).json({
      success: true,
      valid: true,
      message: `Coupon "${coupon.code}" applied successfully!`,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: discountVal,
        discountAmount: calculatedDiscount,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Admin: GET /api/coupons
 */
async function getAllCoupons(req, res, next) {
  try {
    const coupons = await prisma.coupon.findMany({
      include: {
        _count: {
          select: { orders: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const now = new Date();
    const formatted = coupons.map((c) => {
      const realUsed = Math.max(c.timesUsed || 0, c._count?.orders || 0);
      const isExpired = c.expiresAt ? new Date(c.expiresAt) < now : false;
      return {
        ...c,
        timesUsed: realUsed,
        usedCount: realUsed,
        orderCount: c._count?.orders || 0,
        isExpired,
        discountValue: Number(c.discountValue),
        minOrderAmount: Number(c.minOrderAmount),
        maxDiscountAmount: c.maxDiscountAmount ? Number(c.maxDiscountAmount) : null,
      };
    });

    const totalCoupons = formatted.length;
    const activeCount = formatted.filter((c) => c.isActive && !c.isExpired).length;
    const totalRedemptions = formatted.reduce((sum, c) => sum + (c.timesUsed || 0), 0);

    return res.status(200).json({
      success: true,
      coupons: formatted,
      stats: {
        totalCoupons,
        activeCount,
        totalRedemptions,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Admin: POST /api/coupons
 */
async function createCoupon(req, res, next) {
  try {
    const {
      code,
      description,
      discountType,
      discountValue,
      minOrderAmount,
      maxDiscountAmount,
      isPublic,
      isActive,
      startsAt,
      expiresAt,
      usageLimit,
    } = req.body;

    if (!code || !discountType || discountValue === undefined || !expiresAt) {
      return res.status(400).json({
        success: false,
        message: 'Code, discountType, discountValue, and expiresAt are required.',
      });
    }

    // Default time to end of selected day (23:59:59.999Z) if no specific time was passed
    let resolvedExpiresAt = new Date(expiresAt);
    if (typeof expiresAt === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(expiresAt.trim())) {
      resolvedExpiresAt = new Date(`${expiresAt.trim()}T23:59:59.999Z`);
    }

    const created = await prisma.coupon.create({
      data: {
        code: code.trim().toUpperCase(),
        description: description || null,
        discountType,
        discountValue: parseFloat(discountValue),
        minOrderAmount: minOrderAmount !== undefined ? parseFloat(minOrderAmount) : 0,
        maxDiscountAmount: maxDiscountAmount ? parseFloat(maxDiscountAmount) : null,
        isPublic: isPublic !== undefined ? Boolean(isPublic) : true,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        startsAt: startsAt ? new Date(startsAt) : new Date(),
        expiresAt: resolvedExpiresAt,
        usageLimit: usageLimit ? parseInt(usageLimit, 10) : null,
      },
    });

    return res.status(201).json({
      success: true,
      coupon: created,
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({
        success: false,
        message: `A coupon with code "${req.body.code}" already exists.`,
      });
    }
    next(error);
  }
}

/**
 * Admin: DELETE /api/coupons/:id
 */
async function deleteCoupon(req, res, next) {
  try {
    const { id } = req.params;
    await prisma.coupon.delete({ where: { id } });
    return res.status(200).json({
      success: true,
      message: 'Coupon deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getPublicCoupons,
  validateCoupon,
  getAllCoupons,
  createCoupon,
  deleteCoupon,
};
