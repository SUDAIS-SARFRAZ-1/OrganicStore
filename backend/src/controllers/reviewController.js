const { prisma } = require('../config/db');

/**
 * Review Controller
 * Enforces server-side purchase-gated review eligibility (Rule 6)
 * Strictly uses Prisma ORM (Rule 1)
 */

/**
 * GET /api/reviews/product/:productId
 * Public: Fetch approved reviews and aggregated score metrics for a product
 */
async function getProductReviews(req, res, next) {
  try {
    const { productId } = req.params;

    // Check if product exists
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

    const reviews = await prisma.review.findMany({
      where: {
        productId,
        isApproved: true,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalReviews = reviews.length;
    let averageRating = 0;
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

    if (totalReviews > 0) {
      const sum = reviews.reduce((acc, r) => {
        distribution[r.rating] = (distribution[r.rating] || 0) + 1;
        return acc + r.rating;
      }, 0);
      averageRating = Number((sum / totalReviews).toFixed(1));
    }

    return res.status(200).json({
      success: true,
      reviews,
      stats: {
        totalReviews,
        averageRating,
        distribution,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/reviews/eligibility/:productId
 * Authenticated: Check if current customer is eligible to submit a review
 * Rule: Customer must have purchased the product and order must be DELIVERED
 */
async function checkEligibility(req, res, next) {
  try {
    const userId = req.user.id;
    const { productId } = req.params;

    // 1. Check if user already submitted a review
    const existingReview = await prisma.review.findFirst({
      where: { userId, productId },
      select: {
        id: true,
        rating: true,
        title: true,
        comment: true,
        createdAt: true,
      },
    });

    if (existingReview) {
      return res.status(200).json({
        success: true,
        eligible: false,
        alreadyReviewed: true,
        existingReview,
        reason: 'You have already submitted a review for this product.',
      });
    }

    // 2. Check for delivered order containing this product
    const deliveredOrder = await prisma.order.findFirst({
      where: {
        userId,
        status: 'DELIVERED',
        items: {
          some: {
            productId,
          },
        },
      },
      select: {
        id: true,
        orderNumber: true,
        updatedAt: true,
      },
    });

    if (!deliveredOrder) {
      // Check if user bought it but order is still pending/processing/shipped
      const anyOrder = await prisma.order.findFirst({
        where: {
          userId,
          items: {
            some: {
              productId,
            },
          },
        },
        select: {
          id: true,
          orderNumber: true,
          status: true,
        },
      });

      return res.status(200).json({
        success: true,
        eligible: false,
        alreadyReviewed: false,
        hasDeliveredOrder: false,
        orderStatus: anyOrder?.status || null,
        reason: anyOrder
          ? `Your order (${anyOrder.orderNumber}) is currently ${anyOrder.status.toLowerCase()}. You can submit a review once it is delivered.`
          : 'Only verified buyers who have received this product in a completed delivery can write a review.',
      });
    }

    return res.status(200).json({
      success: true,
      eligible: true,
      alreadyReviewed: false,
      hasDeliveredOrder: true,
      orderNumber: deliveredOrder.orderNumber,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/reviews
 * Authenticated: Submit a review with server-side validation & eligibility check
 */
async function createReview(req, res, next) {
  try {
    const userId = req.user.id;
    const { productId, rating, title, comment } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required.',
      });
    }

    const numRating = parseInt(rating, 10);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be an integer between 1 and 5.',
      });
    }

    const stripHtml = (txt) => (typeof txt === 'string' ? txt.replace(/<[^>]*>?/gm, '').trim() : '');
    const cleanComment = stripHtml(comment);
    const cleanTitle = title ? stripHtml(title) : null;

    if (!cleanComment || cleanComment.length < 5) {
      return res.status(400).json({
        success: false,
        message: 'Review comment must be at least 5 characters long.',
      });
    }

    if (cleanComment.length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Review comment cannot exceed 1000 characters.',
      });
    }

    if (cleanTitle && cleanTitle.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Review title cannot exceed 100 characters.',
      });
    }

    // Spam / malicious script pattern check (Item 16)
    const spamPattern = /(<script|javascript:|data:text\/html|onload=|onerror=)/i;
    if (spamPattern.test(comment) || (title && spamPattern.test(title))) {
      return res.status(400).json({
        success: false,
        message: 'Review contains prohibited content or script tags.',
      });
    }

    // 1. Verify product exists
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

    // 2. Check if already reviewed (Rule: 1 review per product per customer)
    const existing = await prisma.review.findFirst({
      where: { userId, productId },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this product.',
      });
    }

    // 3. STRICT SERVER-SIDE ELIGIBILITY CHECK (Rule 6: Never trust the client)
    const deliveredOrder = await prisma.order.findFirst({
      where: {
        userId,
        status: 'DELIVERED',
        items: {
          some: {
            productId,
          },
        },
      },
    });

    if (!deliveredOrder) {
      return res.status(403).json({
        success: false,
        message: 'Purchase verification failed: You can only review products that you have purchased and received in a delivered order.',
      });
    }

    // 4. Create review with moderation by default (Item 16)
    const newReview = await prisma.review.create({
      data: {
        userId,
        productId,
        rating: numRating,
        title: cleanTitle,
        comment: cleanComment,
        isApproved: false, // Moderated by default; reviewed in Admin Reviews
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Thank you! Your verified review has been submitted and will appear once reviewed by our team.',
      review: newReview,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/reviews/:id
 * Authenticated: Delete own review (or any review if admin)
 */
async function deleteReview(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const review = await prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found.',
      });
    }

    if (review.userId !== userId && userRole !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this review.',
      });
    }

    await prisma.review.delete({
      where: { id },
    });

    return res.status(200).json({
      success: true,
      message: 'Review deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/admin/reviews (Admin only)
 * List all reviews with approval status and search/filter
 */
async function adminGetReviews(req, res, next) {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const where = {};
    if (status === 'approved') where.isApproved = true;
    if (status === 'pending') where.isApproved = false;

    const take = parseInt(limit, 10) || 20;
    const skip = (parseInt(page, 10) - 1) * take;

    const [reviews, total, activeTestimonials] = await Promise.all([
      prisma.review.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true, avatar: true } },
          product: { select: { id: true, name: true, slug: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.review.count({ where }),
      prisma.testimonial.findMany({
        where: { isActive: true },
        select: { id: true, authorName: true, content: true },
      }),
    ]);

    const enrichedReviews = reviews.map((r) => {
      const matchedTestimonial = activeTestimonials.find(
        (t) => t.authorName === r.user?.name && t.content === r.comment
      );
      return {
        ...r,
        isFeaturedAsTestimonial: Boolean(matchedTestimonial),
        testimonialId: matchedTestimonial ? matchedTestimonial.id : null,
      };
    });

    return res.status(200).json({
      success: true,
      reviews: enrichedReviews,
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
 * PUT /api/admin/reviews/:id/status (Admin only)
 * Approve or hide a review
 */
async function adminToggleReviewStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { isApproved } = req.body;

    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found.',
      });
    }

    const updated = await prisma.review.update({
      where: { id },
      data: { isApproved: Boolean(isApproved) },
    });

    return res.status(200).json({
      success: true,
      message: `Review marked as ${updated.isApproved ? 'approved' : 'hidden'}.`,
      review: updated,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/reviews/admin/:id/feature-testimonial (Admin only)
 * Promote or remove a customer review from homepage testimonials per admin preference
 */
async function adminFeatureReviewAsTestimonial(req, res, next) {
  try {
    const { id } = req.params;
    const { remove, authorRole, sortOrder } = req.body;

    const review = await prisma.review.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
        product: { select: { id: true, name: true } },
      },
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found.',
      });
    }

    // Find any existing testimonial matching this review's author & text
    const existingTestimonial = await prisma.testimonial.findFirst({
      where: {
        authorName: review.user.name,
        content: review.comment,
      },
    });

    if (remove) {
      if (existingTestimonial) {
        await prisma.testimonial.delete({ where: { id: existingTestimonial.id } });
      }
      return res.status(200).json({
        success: true,
        message: 'Review removed from homepage testimonials.',
        isFeatured: false,
      });
    }

    if (existingTestimonial) {
      const updated = await prisma.testimonial.update({
        where: { id: existingTestimonial.id },
        data: {
          isActive: true,
          ...(sortOrder !== undefined && { sortOrder: parseInt(sortOrder, 10) }),
          ...(authorRole && { authorRole }),
        },
      });
      return res.status(200).json({
        success: true,
        message: 'Review featured in homepage testimonials!',
        isFeatured: true,
        testimonial: updated,
      });
    }

    // Create a new Testimonial from the verified customer review
    const roleString = authorRole || `Verified Buyer • ${review.product?.name || 'Organic Produce'}`;
    const newTestimonial = await prisma.testimonial.create({
      data: {
        authorName: review.user.name,
        authorRole: roleString,
        rating: review.rating,
        content: review.comment,
        avatarUrl: review.user.avatar || null,
        sortOrder: sortOrder !== undefined ? parseInt(sortOrder, 10) : 0,
        isActive: true,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Review successfully added to homepage testimonials!',
      isFeatured: true,
      testimonial: newTestimonial,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getProductReviews,
  checkEligibility,
  createReview,
  deleteReview,
  adminGetReviews,
  adminToggleReviewStatus,
  adminFeatureReviewAsTestimonial,
};
