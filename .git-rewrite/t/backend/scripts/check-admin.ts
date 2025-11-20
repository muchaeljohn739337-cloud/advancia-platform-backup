import prisma from "../src/prismaClient";

async function checkAdminUsers() {
  console.log("🔍 Checking for admin users...\n");

  const adminUsers = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: {
      id: true,
      email: true,
      username: true,
      role: true,
      active: true,
      createdAt: true,
    },
  });

  console.log(`Found ${adminUsers.length} admin user(s):\n`);
  adminUsers.forEach((user, index) => {
    console.log(`Admin ${index + 1}:`);
    console.log(`  ID: ${user.id}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Username: ${user.username}`);
    console.log(`  Role: ${user.role}`);
    console.log(`  Active: ${user.active}`);
    console.log(`  Created: ${user.createdAt}`);
    console.log("");
  });

  // Check default admin credentials
  const defaultEmail = process.env.ADMIN_EMAIL || "admin@advancia.com";
  const defaultUser = await prisma.user.findUnique({
    where: { email: defaultEmail },
    select: {
      id: true,
      email: true,
      username: true,
      role: true,
      active: true,
    },
  });

  console.log(`\n📧 Default admin email check (${defaultEmail}):`);
  if (defaultUser) {
    console.log(`✅ User exists:`);
    console.log(`   Email: ${defaultUser.email}`);
    console.log(`   Username: ${defaultUser.username}`);
    console.log(`   Role: ${defaultUser.role}`);
    console.log(`   Active: ${defaultUser.active}`);
  } else {
    console.log(`❌ No user found with email: ${defaultEmail}`);
  }

  console.log(`\n📝 Expected credentials:`);
  console.log(`   Email: ${defaultEmail}`);
  console.log(`   Password: ${process.env.ADMIN_PASS || "Admin@123"}`);

  await prisma.$disconnect();
}

checkAdminUsers().catch(console.error);
