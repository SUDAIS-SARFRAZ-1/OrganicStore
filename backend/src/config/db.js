const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('../../generated/prisma');

// Use DIRECT_URL for local/session connection or DATABASE_URL with connection pool
const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;

const pool = new Pool({
  connectionString,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
  log: process.env.DEBUG_SQL === 'true' ? ['query', 'warn', 'error'] : ['error'],
});

module.exports = {
  prisma,
  pool,
};
