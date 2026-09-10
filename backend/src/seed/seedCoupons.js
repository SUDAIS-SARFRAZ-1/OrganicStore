require('dotenv').config();
const { prisma, pool } = require('../config/db');

const initialCoupons = [
  {
    code: 'ORGANIC25',
    description: 'Get 25% off on orders above ₨ 1,000 (Maximum discount ₨ 500)',
    discountType: 'PERCENTAGE',
    discountValue: 25.00,
    minOrderAmount: 1000.00,
    maxDiscountAmount: 500.00,
    isPublic: true,
    isActive: true,
    startsAt: new Date(),
    expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
    usageLimit: 500,
  },
  {
    code: 'FREESHIP',
    description: 'Free Shipping discount of ₨ 150 on orders above ₨ 800',
    discountType: 'FIXED',
    discountValue: 150.00,
    minOrderAmount: 800.00,
    maxDiscountAmount: null,
    isPublic: true,
    isActive: true,
    startsAt: new Date(),
    expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
    usageLimit: 1000,
  },
  {
    code: 'WELCOME10',
    description: '10% instant discount storewide for new organic enthusiasts',
    discountType: 'PERCENTAGE',
    discountValue: 10.00,
    minOrderAmount: 500.00,
    maxDiscountAmount: 300.00,
    isPublic: true,
    isActive: true,
    startsAt: new Date(),
    expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 180 days
    usageLimit: null,
  },
];

async function seed() {
  console.log('Seeding initial coupons...');

  for (const coupon of initialCoupons) {
    await prisma.coupon.upsert({
      where: { code: coupon.code },
      update: {
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        minOrderAmount: coupon.minOrderAmount,
        maxDiscountAmount: coupon.maxDiscountAmount,
        isPublic: coupon.isPublic,
        isActive: coupon.isActive,
        startsAt: coupon.startsAt,
        expiresAt: coupon.expiresAt,
        usageLimit: coupon.usageLimit,
      },
      create: {
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        minOrderAmount: coupon.minOrderAmount,
        maxDiscountAmount: coupon.maxDiscountAmount,
        isPublic: coupon.isPublic,
        isActive: coupon.isActive,
        startsAt: coupon.startsAt,
        expiresAt: coupon.expiresAt,
        usageLimit: coupon.usageLimit,
      },
    });
  }

  const allCoupons = await prisma.coupon.findMany({
    select: { id: true, code: true, discountType: true, discountValue: true, isPublic: true },
  });

  console.log(`Successfully seeded ${allCoupons.length} coupons:`);
  allCoupons.forEach((c) =>
    console.log(` - ${c.code}: ${c.discountType} ${c.discountValue} (Public: ${c.isPublic})`)
  );

  await prisma.$disconnect();
  await pool.end();
}

seed().catch(async (e) => {
  console.error('Failed to seed coupons:', e);
  await prisma.$disconnect();
  await pool.end();
  process.exit(1);
});
