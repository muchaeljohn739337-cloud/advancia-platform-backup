import bcrypt from "bcrypt";
import { query } from "./db.js";

async function seedAdmin() {
  try {
    // Check if admin exists
    const existing = await query("SELECT id FROM users WHERE email = $1", [
      "admin@advvancia.com",
    ]);
    if (existing.rowCount > 0) {
      console.log("Admin user already exists.");
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash("admin123", 12);

    // Insert admin user
    await query(
      "INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3)",
      ["admin@advvancia.com", hashedPassword, "admin"]
    );

    console.log("Admin user seeded: admin@advvancia.com / admin123");
  } catch (error) {
    console.error("Error seeding admin:", error);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedAdmin().then(() => process.exit(0));
}

export { seedAdmin };
