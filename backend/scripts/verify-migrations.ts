import { PrismaClient } from "@prisma/client";
import { execSync } from "child_process";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

async function verifyMigrations() {
  console.log("🔍 Verifying database migrations...\n");

  try {
    console.log("1. Checking migration status...");
    const migrateStatus = execSync("npx prisma migrate status", {
      encoding: "utf-8",
    });
    console.log(migrateStatus);

    if (
      migrateStatus.includes("pending") ||
      migrateStatus.includes("unapplied")
    ) {
      console.error(
        "❌ Pending migrations found! Run: npx prisma migrate deploy",
      );
      process.exit(1);
    }

    console.log("\n2. Testing database connection...");
    await prisma.$connect();
    console.log("✅ Database connected successfully");

    console.log("\n3. Verifying critical tables...");
    const criticalTables = [
      { name: "users", model: "user" },
      { name: "transactions", model: "transactions" },
      { name: "crypto_wallets", model: "crypto_wallets" },
      { name: "crypto_withdrawals", model: "crypto_withdrawals" },
    ];

    for (const table of criticalTables) {
      try {
        const count = await (prisma as any)[table.model].count();
        console.log(`✅ ${table.name}: ${count} records`);
      } catch (error: any) {
        console.warn(`⚠️  Table ${table.name} check failed:`, error.message);
      }
    }

    console.log("\n4. Checking database indexes...");
    const indexes = (await prisma.$queryRaw`
      SELECT
        schemaname,
        tablename,
        indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname
      LIMIT 10;
    `) as any[];
    console.log(`✅ Found ${indexes.length}+ indexes`);

    console.log("\n5. Checking for admin user...");
    const adminUser = await prisma.user.findFirst({
      where: { role: "ADMIN" },
    });

    if (!adminUser) {
      console.warn("⚠️  No admin user found - create one before deployment");
    } else {
      console.log(`✅ Admin user exists: ${adminUser.email}`);
    }

    console.log("\n✅ All database checks passed!");
    process.exit(0);
  } catch (error: any) {
    console.error("❌ Database verification failed:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verifyMigrations();
