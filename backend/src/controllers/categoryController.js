const { prisma } = require('../config/db');

/**
 * Helper to slugify a name
 */
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w-]+/g, '') // Remove all non-word chars
    .replace(/--+/g, '-'); // Replace multiple - with single -
}

/**
 * GET /api/categories
 * Returns all categories with product count for dynamic navigation and filters
 */
async function getCategories(req, res, next) {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        image: true,
        createdAt: true,
        _count: {
          select: { products: true },
        },
      },
    });

    const formattedCategories = categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      image: cat.image,
      createdAt: cat.createdAt,
      productCount: cat._count.products,
    }));

    return res.status(200).json({
      success: true,
      categories: formattedCategories,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/categories/:slug
 * Fetch single category by slug with details
 */
async function getCategoryBySlug(req, res, next) {
  try {
    const { slug } = req.params;

    const category = await prisma.category.findUnique({
      where: { slug: slug.toLowerCase() },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        image: true,
        createdAt: true,
        _count: {
          select: { products: true },
        },
      },
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: `Category '${slug}' not found.`,
      });
    }

    return res.status(200).json({
      success: true,
      category: {
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        image: category.image,
        productCount: category._count.products,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/categories (Admin only)
 * Create a new category
 */
async function createCategory(req, res, next) {
  try {
    const { name, slug, description, image } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Category name is required.',
      });
    }

    const finalSlug = slugify(slug || name);

    // Check slug uniqueness
    const existing = await prisma.category.findUnique({
      where: { slug: finalSlug },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: `A category with slug '${finalSlug}' already exists.`,
      });
    }

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        slug: finalSlug,
        description: description ? description.trim() : null,
        image: image ? image.trim() : null,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        image: true,
        createdAt: true,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Category created successfully.',
      category: {
        ...category,
        productCount: 0,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/categories/:id (Admin only)
 * Update existing category
 */
async function updateCategory(req, res, next) {
  try {
    const { id } = req.params;
    const { name, slug, description, image } = req.body;

    const existing = await prisma.category.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Category not found.',
      });
    }

    const updateData = {};
    if (name) updateData.name = name.trim();
    if (slug) {
      const finalSlug = slugify(slug);
      // Ensure slug isn't taken by another category
      const slugConflict = await prisma.category.findFirst({
        where: {
          slug: finalSlug,
          NOT: { id },
        },
      });

      if (slugConflict) {
        return res.status(409).json({
          success: false,
          message: `Slug '${finalSlug}' is already taken.`,
        });
      }
      updateData.slug = finalSlug;
    }
    if (description !== undefined) updateData.description = description ? description.trim() : null;
    if (image !== undefined) updateData.image = image ? image.trim() : null;

    const updated = await prisma.category.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        image: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { products: true },
        },
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Category updated successfully.',
      category: {
        id: updated.id,
        name: updated.name,
        slug: updated.slug,
        description: updated.description,
        image: updated.image,
        productCount: updated._count.products,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/categories/:id (Admin only)
 * Delete a category
 */
async function deleteCategory(req, res, next) {
  try {
    const { id } = req.params;

    const existing = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Category not found.',
      });
    }

    if (existing._count.products > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category '${existing.name}'. It currently contains ${existing._count.products} product(s). Reassign or delete products first.`,
      });
    }

    await prisma.category.delete({
      where: { id },
    });

    return res.status(200).json({
      success: true,
      message: `Category '${existing.name}' deleted successfully.`,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getCategories,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
};
