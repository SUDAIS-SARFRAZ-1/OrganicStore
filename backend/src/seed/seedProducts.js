require('dotenv').config();
const { prisma, pool } = require('../config/db');

const initialProducts = [
  // GROCERIES
  {
    name: 'Natural Organic Raw Honey',
    slug: 'natural-organic-raw-honey',
    description: '100% pure raw wildflower honey harvested ethically from certified organic apiaries. Unfiltered, unpasteurized, and rich in natural enzymes and antioxidants.',
    price: 18.50,
    salePrice: 15.00,
    stock: 45,
    isFeatured: true,
    categorySlug: 'groceries',
    images: [
      { url: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=600&q=80', isPrimary: true },
      { url: 'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?auto=format&fit=crop&w=600&q=80', isPrimary: false },
    ],
  },
  {
    name: 'Extra Virgin Cold-Pressed Olive Oil',
    slug: 'extra-virgin-cold-pressed-olive-oil',
    description: 'First cold-pressed extra virgin olive oil made from handpicked organic olives. Features a delicate, fruity bouquet with a velvety peppery finish.',
    price: 24.00,
    salePrice: null,
    stock: 30,
    isFeatured: true,
    categorySlug: 'groceries',
    images: [
      { url: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80', isPrimary: true },
    ],
  },
  {
    name: 'Organic Rolled Wholegrain Oats 1kg',
    slug: 'organic-rolled-wholegrain-oats-1kg',
    description: 'Sustainably farmed gluten-free whole grain oats. High in fiber and slow-release complex carbohydrates for sustained morning energy.',
    price: 12.00,
    salePrice: 9.50,
    stock: 60,
    isFeatured: false,
    categorySlug: 'groceries',
    images: [
      { url: 'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?auto=format&fit=crop&w=600&q=80', isPrimary: true },
    ],
  },
  {
    name: 'Raw Organic Almond Butter 350g',
    slug: 'raw-organic-almond-butter-350g',
    description: 'Creamy single-ingredient stoneground almond butter without added sugars, palm oils, or artificial preservatives.',
    price: 16.00,
    salePrice: null,
    stock: 25,
    isFeatured: false,
    categorySlug: 'groceries',
    images: [
      { url: 'https://images.unsplash.com/photo-1528751014936-863e6e7a319c?auto=format&fit=crop&w=600&q=80', isPrimary: true },
    ],
  },

  // JUICES
  {
    name: 'Cold-Pressed Fresh Orange Juice 500ml',
    slug: 'cold-pressed-fresh-orange-juice-500ml',
    description: 'Freshly squeezed sun-ripened Valencia oranges with zero added sugars, water, or concentrates. Packed with natural Vitamin C.',
    price: 8.50,
    salePrice: 6.99,
    stock: 50,
    isFeatured: true,
    categorySlug: 'juice',
    images: [
      { url: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=600&q=80', isPrimary: true },
    ],
  },
  {
    name: 'Green Detox Cleanser Juice',
    slug: 'green-detox-cleanser-juice',
    description: 'Revitalizing blend of organic kale, crisp green apple, cucumber, celery, fresh ginger, and a squeeze of lime.',
    price: 9.50,
    salePrice: null,
    stock: 40,
    isFeatured: false,
    categorySlug: 'juice',
    images: [
      { url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80', isPrimary: true },
    ],
  },
  {
    name: 'Pure Organic Pomegranate Nectar',
    slug: 'pure-organic-pomegranate-nectar',
    description: 'Deep ruby cold-extracted pomegranate juice with tart, vibrant notes and exceptional polyphenol antioxidant concentrations.',
    price: 11.00,
    salePrice: 8.99,
    stock: 35,
    isFeatured: true,
    categorySlug: 'juice',
    images: [
      { url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80', isPrimary: true },
    ],
  },

  // FRESH FRUITS
  {
    name: 'Farm Fresh Organic Bananas (Bunch)',
    slug: 'farm-fresh-organic-bananas',
    description: 'Sweet, potassium-rich Cavendish bananas cultivated on certified regenerative organic farms. Perfect everyday snack.',
    price: 4.50,
    salePrice: 3.50,
    stock: 75,
    isFeatured: true,
    categorySlug: 'fresh-fruits',
    images: [
      { url: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=600&q=80', isPrimary: true },
    ],
  },
  {
    name: 'Crisp Red Organic Apples 1kg',
    slug: 'crisp-red-organic-apples-1kg',
    description: 'Orchard-grown organic Gala apples boasting a firm, satisfying crunch and balanced sweet-tart natural flavor profile.',
    price: 7.99,
    salePrice: null,
    stock: 55,
    isFeatured: false,
    categorySlug: 'fresh-fruits',
    images: [
      { url: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=600&q=80', isPrimary: true },
    ],
  },
  {
    name: 'Fresh Sweet Strawberries 500g',
    slug: 'fresh-sweet-strawberries-500g',
    description: 'Succulent pesticide-free field strawberries picked at peak ripeness for an explosion of aromatic berry sweetness.',
    price: 9.00,
    salePrice: 7.50,
    stock: 40,
    isFeatured: true,
    categorySlug: 'fresh-fruits',
    images: [
      { url: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=600&q=80', isPrimary: true },
    ],
  },

  // FRESH VEGETABLES
  {
    name: 'Garden Fresh Vine Tomatoes 1kg',
    slug: 'garden-fresh-vine-tomatoes-1kg',
    description: 'Aromatic vine-ripened tomatoes bursting with savory umami flavor and rich lycopene nutrients. Ideal for salads and sauces.',
    price: 5.50,
    salePrice: null,
    stock: 65,
    isFeatured: true,
    categorySlug: 'fresh-vegetables',
    images: [
      { url: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80', isPrimary: true },
    ],
  },
  {
    name: 'Fresh Organic Baby Spinach 250g',
    slug: 'fresh-organic-baby-spinach-250g',
    description: 'Tender, pre-washed baby spinach leaves packed with plant iron, folate, and dietary fibers.',
    price: 3.99,
    salePrice: 2.99,
    stock: 45,
    isFeatured: false,
    categorySlug: 'fresh-vegetables',
    images: [
      { url: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=600&q=80', isPrimary: true },
    ],
  },
  {
    name: 'Crisp Organic Broccoli Florets',
    slug: 'crisp-organic-broccoli-florets',
    description: 'Nutrient-dense dark green broccoli heads hand-harvested daily from certified pesticide-free growers.',
    price: 4.80,
    salePrice: 3.99,
    stock: 35,
    isFeatured: false,
    categorySlug: 'fresh-vegetables',
    images: [
      { url: 'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?auto=format&fit=crop&w=600&q=80', isPrimary: true },
    ],
  },

  // ORGANIC TEAS
  {
    name: 'Ceremonial Matcha Green Tea 50g',
    slug: 'ceremonial-matcha-green-tea-50g',
    description: 'Shade-grown first-harvest stone-ground Japanese Uji matcha powder. Imparts a brilliant emerald hue and rich umami sweetness.',
    price: 28.00,
    salePrice: 22.50,
    stock: 20,
    isFeatured: true,
    categorySlug: 'organic-teas',
    images: [
      { url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80', isPrimary: true },
    ],
  },
  {
    name: 'Organic Chamomile Blossom Infusion',
    slug: 'organic-chamomile-blossom-infusion',
    description: 'Whole whole-head Egyptian chamomile flowers for a soothing, caffeine-free bedtime botanical beverage.',
    price: 10.50,
    salePrice: null,
    stock: 40,
    isFeatured: false,
    categorySlug: 'organic-teas',
    images: [
      { url: 'https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&w=600&q=80', isPrimary: true },
    ],
  },
];

async function seed() {
  console.log('Seeding initial organic products...');

  const categories = await prisma.category.findMany({
    select: { id: true, slug: true },
  });
  const categoryMap = new Map(categories.map((c) => [c.slug, c.id]));

  for (const item of initialProducts) {
    const categoryId = categoryMap.get(item.categorySlug);
    if (!categoryId) {
      console.warn(`Category slug '${item.categorySlug}' not found. Skipping ${item.name}`);
      continue;
    }

    const existing = await prisma.product.findUnique({
      where: { slug: item.slug },
    });

    if (existing) {
      await prisma.product.update({
        where: { id: existing.id },
        data: {
          name: item.name,
          description: item.description,
          price: item.price,
          salePrice: item.salePrice,
          stock: item.stock,
          isFeatured: item.isFeatured,
          categoryId,
        },
      });
    } else {
      await prisma.product.create({
        data: {
          name: item.name,
          slug: item.slug,
          description: item.description,
          price: item.price,
          salePrice: item.salePrice,
          stock: item.stock,
          isFeatured: item.isFeatured,
          categoryId,
          images: {
            create: item.images.map((img, idx) => ({
              url: img.url,
              isPrimary: img.isPrimary,
              sortOrder: idx,
            })),
          },
        },
      });
    }
  }

  const count = await prisma.product.count();
  console.log(`Successfully seeded products! Total active in DB: ${count}`);

  await prisma.$disconnect();
  await pool.end();
}

seed().catch(async (e) => {
  console.error('Failed to seed products:', e);
  await prisma.$disconnect();
  await pool.end();
  process.exit(1);
});
