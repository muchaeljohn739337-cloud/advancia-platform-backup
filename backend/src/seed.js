import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import qrcode from 'qrcode';
import speakeasy from 'speakeasy';
import { query } from './db.js';

async function seedAdmin() {
  try {
    // Check if admin exists
    const existing = await query('SELECT id FROM users WHERE email = $1', [
      'admin@advancia.com',
    ]);
    if (existing.rowCount > 0) {
      console.log('Admin user already exists.');
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 12);

    // Generate TOTP secret
    const secret = speakeasy.generateSecret({
      name: 'advancia (admin@advancia.com)',
      length: 20,
    });

    console.log('Admin TOTP Secret:', secret.base32);

    // Generate QR code
    qrcode.toDataURL(secret.otpauth_url, (err, dataUrl) => {
      if (err) console.error('QR Code error:', err);
      else console.log('Scan this QR with Google Authenticator:', dataUrl);
    });

    // Generate backup codes
    const backupCodes = [];
    const hashedBackupCodes = [];
    for (let i = 0; i < 5; i++) {
      const code = crypto.randomBytes(4).toString('hex');
      backupCodes.push(code);
      hashedBackupCodes.push(await bcrypt.hash(code, 12));
    }

    console.log('Backup codes (save securely):', backupCodes);

    // Insert admin user with 2FA (use Prisma camelCase column names with explicit ID and username)
    await query(
      `INSERT INTO users (id, email, username, "passwordHash", role, "totpSecret", "totpEnabled", "totpVerified", "backupCodes", "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
      [
        'admin@advancia.com',
        'admin',
        hashedPassword,
        'ADMIN',
        secret.base32,
        true,
        true,
        JSON.stringify(hashedBackupCodes),
      ],
    );

    console.log(
      'Admin user seeded with 2FA: admin@advancia.com / admin123 + TOTP',
    );
  } catch (error) {
    console.error('Error seeding admin:', error);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedAdmin().then(() => process.exit(0));
}

export { seedAdmin };
