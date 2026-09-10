const { prisma } = require('../config/db');

/**
 * PUBLIC: Get active home sections
 * GET /api/home/sections
 */
async function getHomeSections(req, res, next) {
  try {
    const sections = await prisma.homeSection.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        type: true,
        title: true,
        subtitle: true,
        bannerImage: true,
        linkUrl: true,
        categoryId: true,
        category: { select: { id: true, name: true, slug: true } },
        sortOrder: true,
        metadata: true,
      },
    });

    res.json({ success: true, sections });
  } catch (error) {
    next(error);
  }
}

/**
 * PUBLIC: Get active testimonials
 * GET /api/home/testimonials
 */
async function getTestimonials(req, res, next) {
  try {
    const testimonials = await prisma.testimonial.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        authorName: true,
        authorRole: true,
        rating: true,
        content: true,
        avatarUrl: true,
        sortOrder: true,
      },
    });

    res.json({ success: true, testimonials });
  } catch (error) {
    next(error);
  }
}

/**
 * PUBLIC: Get active brand logos
 * GET /api/home/brands
 */
async function getBrandLogos(req, res, next) {
  try {
    const brands = await prisma.brandLogo.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        name: true,
        logoUrl: true,
        websiteUrl: true,
        sortOrder: true,
      },
    });

    res.json({ success: true, brands });
  } catch (error) {
    next(error);
  }
}

// ─── ADMIN: Home Sections ─────────────────────────────────────────

/**
 * ADMIN: Create home section
 * POST /api/admin/home/sections
 */
async function createHomeSection(req, res, next) {
  try {
    const { type, title, subtitle, bannerImage, linkUrl, categoryId, sortOrder, metadata } = req.body;

    if (!type || !title) {
      return res.status(400).json({ success: false, message: 'type and title are required.' });
    }

    const validTypes = ['BEST_SELLING', 'TRENDING', 'CATEGORY_BANNER', 'PROMO_BANNER', 'DEAL_OF_DAY'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ success: false, message: `Invalid type. Must be one of: ${validTypes.join(', ')}` });
    }

    const section = await prisma.homeSection.create({
      data: {
        type,
        title,
        subtitle: subtitle || null,
        bannerImage: bannerImage || null,
        linkUrl: linkUrl || null,
        categoryId: categoryId || null,
        sortOrder: sortOrder ?? 0,
        metadata: metadata || null,
      },
      select: {
        id: true,
        type: true,
        title: true,
        subtitle: true,
        bannerImage: true,
        linkUrl: true,
        categoryId: true,
        sortOrder: true,
        isActive: true,
        metadata: true,
      },
    });

    res.status(201).json({ success: true, section });
  } catch (error) {
    next(error);
  }
}

/**
 * ADMIN: Update home section
 * PUT /api/admin/home/sections/:id
 */
async function updateHomeSection(req, res, next) {
  try {
    const { id } = req.params;
    const { type, title, subtitle, bannerImage, linkUrl, categoryId, sortOrder, isActive, metadata } = req.body;

    if (type) {
      const validTypes = ['BEST_SELLING', 'TRENDING', 'CATEGORY_BANNER', 'PROMO_BANNER', 'DEAL_OF_DAY'];
      if (!validTypes.includes(type)) {
        return res.status(400).json({ success: false, message: `Invalid type. Must be one of: ${validTypes.join(', ')}` });
      }
    }

    const existing = await prisma.homeSection.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Home section not found.' });
    }

    const section = await prisma.homeSection.update({
      where: { id },
      data: {
        ...(type !== undefined && { type }),
        ...(title !== undefined && { title }),
        ...(subtitle !== undefined && { subtitle }),
        ...(bannerImage !== undefined && { bannerImage }),
        ...(linkUrl !== undefined && { linkUrl }),
        ...(categoryId !== undefined && { categoryId }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(isActive !== undefined && { isActive }),
        ...(metadata !== undefined && { metadata }),
      },
      select: {
        id: true,
        type: true,
        title: true,
        subtitle: true,
        bannerImage: true,
        linkUrl: true,
        categoryId: true,
        sortOrder: true,
        isActive: true,
        metadata: true,
      },
    });

    res.json({ success: true, section });
  } catch (error) {
    next(error);
  }
}

/**
 * ADMIN: Delete home section
 * DELETE /api/admin/home/sections/:id
 */
async function deleteHomeSection(req, res, next) {
  try {
    const { id } = req.params;

    const existing = await prisma.homeSection.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Home section not found.' });
    }

    await prisma.homeSection.delete({ where: { id } });
    res.json({ success: true, message: 'Home section deleted.' });
  } catch (error) {
    next(error);
  }
}

// ─── ADMIN: Testimonials ──────────────────────────────────────────

/**
 * ADMIN: Get all testimonials (including inactive)
 * GET /api/admin/home/testimonials
 */
async function getAllTestimonials(req, res, next) {
  try {
    const testimonials = await prisma.testimonial.findMany({
      orderBy: { sortOrder: 'asc' },
    });
    res.json({ success: true, testimonials });
  } catch (error) {
    next(error);
  }
}

/**
 * ADMIN: Create testimonial
 * POST /api/admin/home/testimonials
 */
async function createTestimonial(req, res, next) {
  try {
    const { authorName, authorRole, rating, content, avatarUrl, sortOrder } = req.body;

    if (!authorName || !content) {
      return res.status(400).json({ success: false, message: 'authorName and content are required.' });
    }

    if (rating !== undefined && (rating < 1 || rating > 5)) {
      return res.status(400).json({ success: false, message: 'rating must be between 1 and 5.' });
    }

    const testimonial = await prisma.testimonial.create({
      data: {
        authorName,
        authorRole: authorRole || null,
        rating: rating ?? 5,
        content,
        avatarUrl: avatarUrl || null,
        sortOrder: sortOrder ?? 0,
      },
    });

    res.status(201).json({ success: true, testimonial });
  } catch (error) {
    next(error);
  }
}

/**
 * ADMIN: Update testimonial
 * PUT /api/admin/home/testimonials/:id
 */
async function updateTestimonial(req, res, next) {
  try {
    const { id } = req.params;
    const { authorName, authorRole, rating, content, avatarUrl, sortOrder, isActive } = req.body;

    if (rating !== undefined && (rating < 1 || rating > 5)) {
      return res.status(400).json({ success: false, message: 'rating must be between 1 and 5.' });
    }

    const existing = await prisma.testimonial.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Testimonial not found.' });
    }

    const testimonial = await prisma.testimonial.update({
      where: { id },
      data: {
        ...(authorName !== undefined && { authorName }),
        ...(authorRole !== undefined && { authorRole }),
        ...(rating !== undefined && { rating }),
        ...(content !== undefined && { content }),
        ...(avatarUrl !== undefined && { avatarUrl }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    res.json({ success: true, testimonial });
  } catch (error) {
    next(error);
  }
}

/**
 * ADMIN: Delete testimonial
 * DELETE /api/admin/home/testimonials/:id
 */
async function deleteTestimonial(req, res, next) {
  try {
    const { id } = req.params;

    const existing = await prisma.testimonial.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Testimonial not found.' });
    }

    await prisma.testimonial.delete({ where: { id } });
    res.json({ success: true, message: 'Testimonial deleted.' });
  } catch (error) {
    next(error);
  }
}

/**
 * ADMIN: Bulk update or reorder testimonials according to preference
 * PUT /api/admin/home/testimonials
 */
async function updateHomeTestimonialsBulk(req, res, next) {
  try {
    const { testimonials } = req.body;
    if (!Array.isArray(testimonials)) {
      return res.status(400).json({ success: false, message: 'testimonials array is required.' });
    }

    const updates = testimonials.map((t, idx) => {
      return prisma.testimonial.upsert({
        where: { id: t.id || 'temp-id-' + idx },
        update: {
          authorName: t.authorName || 'Verified Customer',
          authorRole: t.authorRole || null,
          rating: parseInt(t.rating, 10) || 5,
          content: t.content || '',
          avatarUrl: t.avatarUrl || null,
          sortOrder: t.sortOrder !== undefined ? parseInt(t.sortOrder, 10) : idx,
          isActive: t.isActive !== undefined ? Boolean(t.isActive) : true,
        },
        create: {
          authorName: t.authorName || 'Verified Customer',
          authorRole: t.authorRole || null,
          rating: parseInt(t.rating, 10) || 5,
          content: t.content || '',
          avatarUrl: t.avatarUrl || null,
          sortOrder: t.sortOrder !== undefined ? parseInt(t.sortOrder, 10) : idx,
          isActive: t.isActive !== undefined ? Boolean(t.isActive) : true,
        },
      });
    });

    await prisma.$transaction(updates);

    const allTestimonials = await prisma.testimonial.findMany({
      orderBy: { sortOrder: 'asc' },
    });

    res.json({
      success: true,
      message: 'Testimonials updated successfully.',
      testimonials: allTestimonials,
    });
  } catch (error) {
    next(error);
  }
}

// ─── ADMIN: Brand Logos ───────────────────────────────────────────

/**
 * ADMIN: Get all brand logos (including inactive)
 * GET /api/admin/home/brands
 */
async function getAllBrandLogos(req, res, next) {
  try {
    const brands = await prisma.brandLogo.findMany({
      orderBy: { sortOrder: 'asc' },
    });
    res.json({ success: true, brands });
  } catch (error) {
    next(error);
  }
}

/**
 * ADMIN: Create brand logo
 * POST /api/admin/home/brands
 */
async function createBrandLogo(req, res, next) {
  try {
    const { name, logoUrl, websiteUrl, sortOrder } = req.body;

    if (!name || !logoUrl) {
      return res.status(400).json({ success: false, message: 'name and logoUrl are required.' });
    }

    const brand = await prisma.brandLogo.create({
      data: {
        name,
        logoUrl,
        websiteUrl: websiteUrl || null,
        sortOrder: sortOrder ?? 0,
      },
    });

    res.status(201).json({ success: true, brand });
  } catch (error) {
    next(error);
  }
}

/**
 * ADMIN: Update brand logo
 * PUT /api/admin/home/brands/:id
 */
async function updateBrandLogo(req, res, next) {
  try {
    const { id } = req.params;
    const { name, logoUrl, websiteUrl, sortOrder, isActive } = req.body;

    const existing = await prisma.brandLogo.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Brand logo not found.' });
    }

    const brand = await prisma.brandLogo.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(logoUrl !== undefined && { logoUrl }),
        ...(websiteUrl !== undefined && { websiteUrl }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    res.json({ success: true, brand });
  } catch (error) {
    next(error);
  }
}

/**
 * ADMIN: Delete brand logo
 * DELETE /api/admin/home/brands/:id
 */
async function deleteBrandLogo(req, res, next) {
  try {
    const { id } = req.params;

    const existing = await prisma.brandLogo.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Brand logo not found.' });
    }

    await prisma.brandLogo.delete({ where: { id } });
    res.json({ success: true, message: 'Brand logo deleted.' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getHomeSections,
  getTestimonials,
  getBrandLogos,
  createHomeSection,
  updateHomeSection,
  deleteHomeSection,
  getAllTestimonials,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
  updateHomeTestimonialsBulk,
  getAllBrandLogos,
  createBrandLogo,
  updateBrandLogo,
  deleteBrandLogo,
};
