#!/usr/bin/env tsx

/**
 * Seed database with fake data for development
 * Usage: npm run seed:fake
 */

import path from "path";
import dotenv from "dotenv";
import { fakeDataGenerator } from "../src/utils/fakeDataGenerator";
import prisma from "../src/prismaClient";

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), ".env") });

async function main() {
  try {
    if (!fakeDataGenerator) {
      console.error(
        "❌ Fake data generator only available in development environment",
      );
      process.exit(1);
    }

    console.log("🎭 Generating and seeding fake data...\n");

    await fakeDataGenerator.seedDatabase(prisma, {
      users: 15,
      admins: 3,
      transactionsPerUser: 5,
      cryptoOrdersPerUser: 3,
      paymentsPerUser: 2,
      supportTicketsPerUser: 1,
    });

    console.log("\n🎉 Fake data seeding completed successfully!");
    console.log("\n📋 Generated data includes:");
    console.log("   • Users with realistic profiles and balances");
    console.log("   • Admin accounts with strong passwords");
    console.log("   • Transaction history for all users");
    console.log("   • Crypto orders in various states");
    console.log("   • Payment records");
    console.log("   • Support tickets");
    console.log("   • Admin settings configuration");
    console.log("\n🔐 Admin credentials are logged above for testing");
  } catch (error) {
    console.error("❌ Error seeding fake data:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
