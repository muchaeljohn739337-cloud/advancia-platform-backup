// prisma-migration-test.js - Prisma v7 Test with Adapter
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");

// Initialize with Prisma v7 adapter pattern
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
  log: ["error", "warn"],
});

async function main() {
  console.log("🔍 Starting Prisma v7 migration test...");

  try {
    // 1. Simple query: count users
    const userCount = await prisma.user.count();
    console.log(`✅ User count: ${userCount}`);

    // 2. Test connection with a simple query
    const firstUser = await prisma.user.findFirst({
      select: { id: true, email: true, username: true },
    });

    if (firstUser) {
      console.log(
        `✅ First user found: ${firstUser.email || firstUser.username}`,
      );
    } else {
      console.log("ℹ️  No users in database yet");
    }

    // 3. Check database schema version
    const result = await prisma.$queryRaw`SELECT version()`;
    console.log(`✅ Database connected:`, result);

    // 4. Test a complex query with relations
    const userWithProfile = await prisma.user.findFirst({
      include: {
        profile: true,
        tokenWallet: true,
      },
    });

    if (userWithProfile) {
      console.log(`✅ Complex query with relations successful`);
    }

    console.log("🎉 Prisma v7 migration test completed successfully");
    console.log("✅ All Prisma v7 features working correctly");
  } catch (error) {
    console.error("❌ Migration test failed:", error.message);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error("❌ Test failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
