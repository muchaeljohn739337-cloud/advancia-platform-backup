// Quick database connection test
require("dotenv").config();
const { PrismaClient } = require("@prisma/client");

console.log("🔍 Testing database connection...");
console.log(
  "📍 DATABASE_URL:",
  process.env.DATABASE_URL?.substring(0, 30) + "...",
);

const prisma = new PrismaClient();

prisma
  .$connect()
  .then(async () => {
    console.log("✅ Database connected successfully!");

    // Test a simple query
    const userCount = await prisma.user.count();
    console.log(`📊 Users in database: ${userCount}`);

    await prisma.$disconnect();
    console.log("✅ All tests passed");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Database connection failed:", err.message);
    console.error("Full error:", err);
    process.exit(1);
  });
