import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';

declare global {
  // Allow global prisma in development to prevent hot-reload multiple clients

  var __prisma: PrismaClient | undefined;
}

// Build pg pool + adapter (Prisma 7 style). Use TEST_DATABASE_URL in test mode.
const pool = new Pool({
  connectionString:
    process.env.NODE_ENV === 'test'
      ? process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
      : process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);

const prisma =
  process.env.NODE_ENV === 'test'
    ? new PrismaClient({ adapter, log: ['error'] })
    : (global.__prisma ??
      new PrismaClient({
        adapter,
        log:
          process.env.NODE_ENV === 'development'
            ? ['query', 'error', 'warn']
            : ['error'],
      }));

if (process.env.NODE_ENV === 'development') {
  global.__prisma = prisma;
}

// Add connection retry logic (skip in test mode - use mocks)
if (process.env.NODE_ENV !== 'test') {
  const shouldSkip =
    process.env.SKIP_DATABASE_VALIDATION === '1' ||
    process.env.SKIP_DB_CONNECT === '1';
  if (shouldSkip) {
    console.warn(
      '⚠️  Skipping Prisma $connect() due to SKIP_DATABASE_VALIDATION/CONNECT flag',
    );
  } else {
    let retries = 3;
    const connectWithRetry = async () => {
      while (retries > 0) {
        try {
          await prisma.$connect();
          console.log('✅ Prisma connected successfully');
          break;
        } catch (error) {
          retries--;
          console.error(
            `❌ Prisma connection failed. Retries left: ${retries}`,
          );
          if (retries === 0) {
            console.error(
              'Failed to connect to database after multiple attempts (continuing without DB)',
            );
            // Do NOT throw – allow app to continue for routes that don't need DB
            break;
          }
          // Wait 2 seconds before retry
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }
    };
    connectWithRetry();
  }
}

export default prisma;
export type { PrismaClient };
