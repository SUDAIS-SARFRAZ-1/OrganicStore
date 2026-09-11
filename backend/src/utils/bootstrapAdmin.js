const bcrypt = require('bcrypt');
const { prisma } = require('../config/db');

/**
 * Bootstraps the initial store administrator account from environment variables.
 * Guarantees that public user registration can never claim admin rights.
 * Additional admins can only be promoted via the Admin Dashboard.
 */
async function bootstrapAdmin() {
  const adminEmail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const adminPassword = (process.env.ADMIN_PASSWORD || '').trim();
  const adminName = (process.env.ADMIN_NAME || 'Store Administrator').trim();

  if (!adminEmail || !adminPassword) {
    return;
  }

  try {
    const existing = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (!existing) {
      const passwordHash = await bcrypt.hash(adminPassword, 12);
      const user = await prisma.user.create({
        data: {
          name: adminName,
          email: adminEmail,
          passwordHash,
          role: 'ADMIN',
          isVerified: true,
          tokenVersion: 1,
        },
      });

      await prisma.cart.create({
        data: { userId: user.id },
      });

      console.log(`[BOOTSTRAP] Initial Admin account created: ${adminEmail}`);
    } else {
      // Ensure the designated admin email always holds verified ADMIN role
      if (existing.role !== 'ADMIN' || !existing.isVerified) {
        await prisma.user.update({
          where: { id: existing.id },
          data: { role: 'ADMIN', isVerified: true },
        });
        console.log(`[BOOTSTRAP] Verified & assigned ADMIN role to: ${adminEmail}`);
      }
    }
  } catch (error) {
    console.error('[BOOTSTRAP] Error during admin initialization:', error.message);
  }
}

module.exports = { bootstrapAdmin };
