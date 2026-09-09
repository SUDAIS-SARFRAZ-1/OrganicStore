/**
 * Seed Home Content: Testimonials, Brand Logos, and Deal-of-Day Section
 * Usage: node src/seed/seedHomeContent.js
 */
require('dotenv').config();
const { prisma } = require('../config/db');

const TESTIMONIALS = [
  {
    authorName: 'Ayesha Khan',
    authorRole: 'Health & Wellness Enthusiast',
    rating: 5,
    content:
      'The quality of organic produce is outstanding. Every fruit and vegetable tastes incredibly fresh — exactly how nature intended. I have been ordering weekly for 6 months now and never been disappointed.',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
    sortOrder: 1,
  },
  {
    authorName: 'Ahmad Raza',
    authorRole: 'Home Chef & Food Blogger',
    rating: 5,
    content:
      'Finally a grocery store that takes organic seriously. The cold-pressed juices are phenomenal and the delivery is always on time. My family has completely switched to Organic Store for our daily essentials.',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    sortOrder: 2,
  },
  {
    authorName: 'Fatima Noor',
    authorRole: 'Nutritionist & Fitness Coach',
    rating: 5,
    content:
      'As a nutritionist, I recommend Organic Store to all my clients. Their certified organic range, transparent sourcing, and competitive pricing make healthy eating accessible for everyone.',
    avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80',
    sortOrder: 3,
  },
];

const BRAND_LOGOS = [
  {
    name: 'USDA Organic',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/USDA_organic_seal.svg/200px-USDA_organic_seal.svg.png',
    websiteUrl: 'https://www.usda.gov/topics/organic',
    sortOrder: 1,
  },
  {
    name: 'EcoCert',
    logoUrl: 'https://images.seeklogo.com/logo-png/52/1/ecocert-logo-png_seeklogo-524947.png',
    websiteUrl: 'https://www.ecocert.com',
    sortOrder: 2,
  },
  {
    name: 'Non-GMO Project',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/4/43/Non-GMO_Project_logo.svg/200px-Non-GMO_Project_logo.svg.png',
    websiteUrl: 'https://www.nongmoproject.org',
    sortOrder: 3,
  },
  {
    name: 'Fair Trade Certified',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/4/43/Fairtrade_Certification_Mark.svg/200px-Fairtrade_Certification_Mark.svg.png',
    websiteUrl: 'https://www.fairtradecertified.org',
    sortOrder: 4,
  },
  {
    name: 'Soil Association',
    logoUrl: 'https://images.seeklogo.com/logo-png/52/1/soil-association-organic-logo-png_seeklogo-529523.png',
    websiteUrl: 'https://www.soilassociation.org',
    sortOrder: 5,
  },
];

const HOME_SECTIONS = [
  {
    type: 'DEAL_OF_DAY',
    title: 'Deal of the Day',
    subtitle: 'Fresh organic honey — 40% off for the next 24 hours only!',
    bannerImage: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=1200&q=80',
    linkUrl: '/shop',
    sortOrder: 1,
    metadata: { discountPercent: 40, badgeText: 'LIMITED TIME' },
  },
];

async function seedHomeContent() {
  try {
    // Clear existing data
    await prisma.testimonial.deleteMany();
    await prisma.brandLogo.deleteMany();
    await prisma.homeSection.deleteMany();

    // Seed testimonials
    const testimonials = await prisma.testimonial.createMany({ data: TESTIMONIALS });

    // Seed brand logos
    const brands = await prisma.brandLogo.createMany({ data: BRAND_LOGOS });

    // Seed home sections
    const sections = await prisma.homeSection.createMany({ data: HOME_SECTIONS });

    console.log(`Seeded ${testimonials.count} testimonials`);
    console.log(`Seeded ${brands.count} brand logos`);
    console.log(`Seeded ${sections.count} home sections`);
    console.log('Home content seeded successfully.');
  } catch (error) {
    console.error('Error seeding home content:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedHomeContent();
