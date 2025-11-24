// Minimal diagnostic startup script to test Render deployment
import dotenv from 'dotenv';
dotenv.config();

console.log('=== DIAGNOSTIC STARTUP ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✓ Set' : '✗ Missing');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '✓ Set' : '✗ Missing');

// Test database connection
async function testDatabase() {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    console.log('Testing database connection...');
    await prisma.$connect();
    console.log('✓ Database connected successfully');

    const userCount = await prisma.user.count();
    console.log(`✓ Found ${userCount} users in database`);

    await prisma.$disconnect();
    console.log('✓ Database disconnected');
    return true;
  } catch (error) {
    console.error('✗ Database connection failed:', error);
    return false;
  }
}

// Test basic Express server
async function testServer() {
  try {
    const express = require('express');
    const app = express();
    const PORT = process.env.PORT || 4000;

    app.get('/api/health', (req: any, res: any) => {
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
      });
    });

    const server = app.listen(PORT, () => {
      console.log(`✓ Server listening on port ${PORT}`);
      console.log(`✓ Health endpoint: http://localhost:${PORT}/api/health`);
    });

    return server;
  } catch (error) {
    console.error('✗ Server startup failed:', error);
    throw error;
  }
}

async function main() {
  console.log('\n1. Testing database connection...');
  const dbOk = await testDatabase();

  if (!dbOk) {
    console.error(
      '\n✗ FATAL: Database connection failed. Check DATABASE_URL and network.',
    );
    process.exit(1);
  }

  console.log('\n2. Starting minimal server...');
  await testServer();

  console.log(
    '\n✓ All diagnostics passed. Server should be responding to health checks.',
  );
}

main().catch((error) => {
  console.error('\n✗ FATAL ERROR:', error);
  process.exit(1);
});
