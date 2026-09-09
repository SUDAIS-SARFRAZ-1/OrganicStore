const { prisma } = require('../config/db');

/**
 * Helper to slugify a name
 */
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
}

/**
 * Formats a product model into the standard response shape
 * Computes onSale, discountPercentage, and inStock server-side (Rules 6 & 7)
 */
function formatProduct(product) {
  const price = Number(product.price);
  const salePrice = product.salePrice !== null ? Number(product.salePrice) : null;
  const onSale = salePrice !== null && salePrice < price;
  const discountPercentage = onSale ? Math.round(((price - salePrice) / price) * 100) : null;
  const currentPrice = onSale ? salePrice : price;

  // Compute review stats if reviews are present
  let averageRating = 5;
  let reviewsCount = 0;
  if (product.reviews && product.reviews.length > 0) {
    reviewsCount = product.reviews.length;
    const totalScore = product.reviews.reduce((sum, r) => sum + r.rating, 0);
    averageRating = Number((totalScore / reviewsCount).toFixed(1));
  }

  // Primary image
  let primaryImage = null;
  if (product.images && product.images.length > 0) {
    const primary = product.images.find((img) => img.isPrimary) || product.images[0];
    primaryImage = primary.url;
  }

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    price,
    salePrice,
    currentPrice,
    onSale,
    discountPercentage,
    stock: product.stock,
    inStock: product.stock > 0,
    isFeatured: product.isFeatured,
    isActive: product.isActive,
    createdAt: product.createdAt,
    category: product.category
      ? {
          id: product.category.id,
          name: product.category.name,
          slug: product.category.slug,
        }
      : null,
    primaryImage,
    images: product.images || [],
    averageRating,
    reviewsCount,
  };
}

/**
 * GET /api/products
 * Query products with pagination, category filter, price range, search, and sorting
 */
async function getProducts(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 12));
    const skip = (page - 1) * limit;

    const { category, search, minPrice, maxPrice, sort, featured } = req.query;

    // Build Prisma filter clause
    const where = {
      isActive: true,
    };

    // Category filter by slug or ID
    if (category && category !== 'all') {
      where.category = {
        OR: [{ slug: category.toLowerCase() }, { id: category }],
      };
    }

    // Search by name or description
    if (search && search.trim().length > 0) {
      const searchTerm = search.trim();
      where.OR = [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    // Price range filters
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice && !isNaN(Number(minPrice))) {
        where.price.gte = Number(minPrice);
      }
      if (maxPrice && !isNaN(Number(maxPrice))) {
        where.price.lte = Number(maxPrice);
      }
    }

    // Featured flag
    if (featured === 'true') {
      where.isFeatured = true;
    }

    // Sorting strategy
    let orderBy = [{ createdAt: 'desc' }];
    if (sort === 'price_asc') {
      orderBy = [{ price: 'asc' }];
    } else if (sort === 'price_desc') {
      orderBy = [{ price: 'desc' }];
    } else if (sort === 'popularity') {
      orderBy = [{ orderItems: { _count: 'desc' } }, { isFeatured: 'desc' }];
    } else if (sort === 'latest') {
      orderBy = [{ createdAt: 'desc' }];
    }

    // Execute query with total count in parallel (Prisma transaction / Promise.all)
    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          price: true,
          salePrice: true,
          stock: true,
          isFeatured: true,
          isActive: true,
          createdAt: true,
          category: {
            select: { id: true, name: true, slug: true },
          },
          images: {
            orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
            select: { id: true, url: true, isPrimary: true, altText: true },
          },
          reviews: {
            where: { isApproved: true },
            select: { rating: true },
          },
        },
      }),
    ]);

    const formattedProducts = products.map(formatProduct);
    const totalPages = Math.ceil(total / limit);

    return res.status(200).json({
      success: true,
      products: formattedProducts,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/products/:identifier
 * Fetch single product by ID or Slug, plus 4 related products
 */
async function getProductByIdOrSlug(req, res, next) {
  try {
    const { identifier } = req.params;

    const product = await prisma.product.findFirst({
      where: {
        OR: [{ id: identifier }, { slug: identifier.toLowerCase() }],
        isActive: true,
      },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
        images: {
          orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
        },
        reviews: {
          where: { isApproved: true },
          include: {
            user: { select: { id: true, name: true, avatar: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.',
      });
    }

    // Fetch related products from the same category
    const relatedProducts = await prisma.product.findMany({
      where: {
        categoryId: product.categoryId,
        id: { not: product.id },
        isActive: true,
      },
      take: 4,
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        price: true,
        salePrice: true,
        stock: true,
        isFeatured: true,
        isActive: true,
        createdAt: true,
        category: { select: { id: true, name: true, slug: true } },
        images: {
          where: { isPrimary: true },
          take: 1,
          select: { id: true, url: true, isPrimary: true },
        },
        reviews: {
          where: { isApproved: true },
          select: { rating: true },
        },
      },
    });

    return res.status(200).json({
      success: true,
      product: formatProduct(product),
      relatedProducts: relatedProducts.map(formatProduct),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/products (Admin only)
 * Create new product with images
 */
async function createProduct(req, res, next) {
  try {
    const {
      name,
      slug,
      description,
      price,
      salePrice,
      stock,
      categoryId,
      isFeatured,
      images,
    } = req.body;

    if (!name || !description || price === undefined || !categoryId) {
      return res.status(400).json({
        success: false,
        message: 'Name, description, price, and categoryId are required.',
      });
    }

    const numPrice = Number(price);
    const numSalePrice = salePrice !== undefined && salePrice !== null && salePrice !== '' ? Number(salePrice) : null;
    const numStock = parseInt(stock, 10) || 0;

    if (isNaN(numPrice) || numPrice <= 0) {
      return res.status(400).json({ success: false, message: 'Price must be a positive number.' });
    }

    if (numSalePrice !== null && (isNaN(numSalePrice) || numSalePrice >= numPrice)) {
      return res.status(400).json({
        success: false,
        message: 'Sale price must be lower than original price.',
      });
    }

    // Verify category exists
    const categoryExists = await prisma.category.findUnique({
      where: { id: categoryId },
    });
    if (!categoryExists) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }

    const finalSlug = slugify(slug || name);

    // Check slug uniqueness
    const existingSlug = await prisma.product.findUnique({
      where: { slug: finalSlug },
    });
    if (existingSlug) {
      return res.status(409).json({
        success: false,
        message: `Product slug '${finalSlug}' is already taken.`,
      });
    }

    // Prepare images data
    const imageCreates = [];
    if (Array.isArray(images) && images.length > 0) {
      images.forEach((img, idx) => {
        imageCreates.push({
          url: typeof img === 'string' ? img : img.url,
          isPrimary: typeof img === 'object' ? Boolean(img.isPrimary) : idx === 0,
          sortOrder: idx,
        });
      });
    }

    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        slug: finalSlug,
        description: description.trim(),
        price: numPrice,
        salePrice: numSalePrice,
        stock: numStock,
        categoryId,
        isFeatured: Boolean(isFeatured),
        images: {
          create: imageCreates,
        },
      },
      include: {
        category: true,
        images: true,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Product created successfully.',
      product: formatProduct(product),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/products/:id (Admin only)
 * Update existing product
 */
async function updateProduct(req, res, next) {
  try {
    const { id } = req.params;
    const {
      name,
      slug,
      description,
      price,
      salePrice,
      stock,
      categoryId,
      isFeatured,
      isActive,
      images,
    } = req.body;

    const existing = await prisma.product.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const updateData = {};
    if (name) updateData.name = name.trim();
    if (description) updateData.description = description.trim();
    if (price !== undefined) {
      const numPrice = Number(price);
      if (isNaN(numPrice) || numPrice <= 0) {
        return res.status(400).json({ success: false, message: 'Invalid price.' });
      }
      updateData.price = numPrice;
    }
    if (salePrice !== undefined) {
      if (salePrice === null || salePrice === '') {
        updateData.salePrice = null;
      } else {
        const numSalePrice = Number(salePrice);
        const effectivePrice = updateData.price !== undefined ? updateData.price : Number(existing.price);
        if (isNaN(numSalePrice) || numSalePrice >= effectivePrice) {
          return res.status(400).json({
            success: false,
            message: 'Sale price must be lower than original price.',
          });
        }
        updateData.salePrice = numSalePrice;
      }
    }
    if (stock !== undefined) updateData.stock = parseInt(stock, 10) || 0;
    if (categoryId) updateData.categoryId = categoryId;
    if (isFeatured !== undefined) updateData.isFeatured = Boolean(isFeatured);
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);

    if (slug) {
      const finalSlug = slugify(slug);
      const conflict = await prisma.product.findFirst({
        where: { slug: finalSlug, NOT: { id } },
      });
      if (conflict) {
        return res.status(409).json({ success: false, message: `Slug '${finalSlug}' already exists.` });
      }
      updateData.slug = finalSlug;
    }

    // Handle image updates if provided
    if (Array.isArray(images)) {
      await prisma.productImage.deleteMany({ where: { productId: id } });
      const imageCreates = images.map((img, idx) => ({
        productId: id,
        url: typeof img === 'string' ? img : img.url,
        isPrimary: typeof img === 'object' ? Boolean(img.isPrimary) : idx === 0,
        sortOrder: idx,
      }));
      await prisma.productImage.createMany({ data: imageCreates });
    }

    const updated = await prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        images: true,
        reviews: { where: { isApproved: true } },
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Product updated successfully.',
      product: formatProduct(updated),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/products/:id (Admin only)
 * Deletes a product or deactivates it if orders exist
 */
async function deleteProduct(req, res, next) {
  try {
    const { id } = req.params;

    const existing = await prisma.product.findUnique({
      where: { id },
      include: {
        orderItems: { select: { id: true }, take: 1 },
      },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    // If order history exists, softly deactivate instead of breaking order foreign keys
    if (existing.orderItems.length > 0) {
      await prisma.product.update({
        where: { id },
        data: { isActive: false },
      });
      return res.status(200).json({
        success: true,
        message: `Product '${existing.name}' has existing order history. It has been deactivated.`,
      });
    }

    await prisma.product.delete({ where: { id } });

    return res.status(200).json({
      success: true,
      message: `Product '${existing.name}' deleted successfully.`,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getProducts,
  getProductByIdOrSlug,
  createProduct,
  updateProduct,
  deleteProduct,
};
