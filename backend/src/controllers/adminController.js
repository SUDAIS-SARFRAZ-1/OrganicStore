const { prisma } = require('../config/db');

/**
 * Admin Controller
 * Provides store-wide telemetry, performance metrics, and customer management.
 * Enforces Rule 1 (Prisma only) & Rule 24 (Role checks).
 */

/**
 * GET /api/admin/dashboard/stats
 * Aggregates revenue, order volume, catalog health, low-stock alerts, and recent sales trends.
 */
async function getDashboardStats(req, res, next) {
  try {
    const [
      ordersAggregate,
      totalOrdersCount,
      totalCustomersCount,
      totalProductsCount,
      lowStockProducts,
      recentOrders,
    ] = await Promise.all([
      // Total Revenue from all non-cancelled orders
      prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: { status: { not: 'CANCELLED' } },
      }),

      // Total orders
      prisma.order.count(),

      // Total registered customers
      prisma.user.count({ where: { role: 'CUSTOMER' } }),

      // Total products
      prisma.product.count({ where: { isActive: true } }),

      // Low stock products (stock <= 5)
      prisma.product.findMany({
        where: { stock: { lte: 5 }, isActive: true },
        select: {
          id: true,
          name: true,
          stock: true,
          price: true,
          category: { select: { name: true } },
          images: { take: 1, select: { url: true } },
        },
        orderBy: { stock: 'asc' },
        take: 10,
      }),

      // 5 most recent orders
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { name: true, email: true } },
          address: { select: { city: true } },
        },
      }),
    ]);

    const totalRevenue = Number(ordersAggregate._sum.totalAmount || 0);

    // Compute sales trend: last 7 days daily totals
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const recentDailyOrders = await prisma.order.findMany({
      where: {
        createdAt: { gte: sevenDaysAgo },
        status: { not: 'CANCELLED' },
      },
      select: {
        createdAt: true,
        totalAmount: true,
      },
    });

    // Bucket by day
    const trendMap = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const key = d.toISOString().slice(5, 10); // MM-DD
      trendMap[key] = 0;
    }

    recentDailyOrders.forEach((o) => {
      const key = o.createdAt.toISOString().slice(5, 10);
      if (trendMap[key] !== undefined) {
        trendMap[key] += Number(o.totalAmount);
      }
    });

    const salesTrend = Object.entries(trendMap).map(([day, revenue]) => ({
      day,
      revenue: Number(revenue.toFixed(2)),
    }));

    return res.status(200).json({
      success: true,
      stats: {
        totalRevenue,
        totalOrders: totalOrdersCount,
        totalCustomers: totalCustomersCount,
        totalProducts: totalProductsCount,
        lowStockCount: lowStockProducts.length,
      },
      lowStockProducts: lowStockProducts.map((p) => ({
        id: p.id,
        name: p.name,
        stock: p.stock,
        price: Number(p.price),
        categoryName: p.category?.name || 'General',
        image: p.images?.[0]?.url || null,
      })),
      recentOrders: recentOrders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        customerName: o.user?.name || 'Guest',
        customerEmail: o.user?.email || '',
        city: o.address?.city || '',
        totalAmount: Number(o.totalAmount),
        status: o.status,
        paymentStatus: o.paymentStatus,
        createdAt: o.createdAt,
      })),
      salesTrend,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/admin/customers
 * Lists registered customers with aggregate order counts and spend.
 */
async function getCustomers(req, res, next) {
  try {
    const { search, page = 1, limit = 20 } = req.query;

    const take = parseInt(limit, 10) || 20;
    const skip = (parseInt(page, 10) - 1) * take;

    const where = {};
    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          createdAt: true,
          orders: {
            where: { status: { not: 'CANCELLED' } },
            select: { totalAmount: true },
          },
          _count: {
            select: { orders: true, reviews: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.user.count({ where }),
    ]);

    const customers = users.map((u) => {
      const totalSpent = u.orders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        role: u.role,
        joinedAt: u.createdAt,
        ordersCount: u._count.orders,
        reviewsCount: u._count.reviews,
        totalSpent: Number(totalSpent.toFixed(2)),
      };
    });

    return res.status(200).json({
      success: true,
      customers,
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
 * PUT /api/admin/customers/:id/role
 * Updates customer account role (CUSTOMER <-> ADMIN).
 */
async function updateCustomerRole(req, res, next) {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['CUSTOMER', 'ADMIN'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be CUSTOMER or ADMIN.',
      });
    }

    // Protect self-demotion check
    if (req.user.id === id && role !== 'ADMIN') {
      return res.status(400).json({
        success: false,
        message: 'You cannot remove your own admin privileges.',
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, name: true, email: true, role: true },
    });

    return res.status(200).json({
      success: true,
      message: `User ${updatedUser.name} role updated to ${updatedUser.role}.`,
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getDashboardStats,
  getCustomers,
  updateCustomerRole,
};
