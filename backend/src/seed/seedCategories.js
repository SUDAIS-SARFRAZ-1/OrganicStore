require('dotenv').config();
const { prisma, pool } = require('../config/db');

const initialCategories = [
  {
    name: 'Groceries',
    slug: 'groceries',
    description: 'Fresh organic pantry essentials, grains, dairy, and farm staples.',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Juice',
    slug: 'juice',
    description: 'Cold-pressed 100% organic raw juices and natural fruit nectars.',
    image: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Fresh Fruits',
    slug: 'fresh-fruits',
    description: 'Directly sourced seasonal fruits ripened naturally under the sun.',
    image: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Fresh Vegetables',
    slug: 'fresh-vegetables',
    description: 'Crisp pesticide-free greens, roots, and farm-fresh garden vegetables.',
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Organic Teas',
    slug: 'organic-teas',
    description: 'Hand-plucked herbal infusions, green teas, and calming botanicals.',
    image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80',
  },
];

async function seed() {
  console.log('Seeding initial categories...');

  for (const cat of initialCategories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {
        name: cat.name,
        description: cat.description,
        image: cat.image,
      },
      create: {
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        image: cat.image,
      },
    });
  }

  const allCategories = await prisma.category.findMany({
    select: { id: true, name: true, slug: true },
  });

  console.log(`Successfully seeded ${allCategories.length} categories:`);
  allCategories.forEach((c) => console.log(` - ${c.name} (${c.slug})`));

  await prisma.$disconnect();
  await pool.end();
}

seed().catch(async (e) => {
  console.error('Failed to seed categories:', e);
  await prisma.$disconnect();
  await pool.end();
  process.exit(1);
});
