import bcrypt from "bcryptjs";
import request from "supertest";
import { v4 as uuidv4 } from "uuid";
import app from "../app";
import prisma from "../prismaClient";

describe("Security Whitelist Tests", () => {
  let authToken: string;
  let userId: string;
  let testUser: any;

  beforeAll(async () => {
    // Create test user
    const hashedPassword = await bcrypt.hash("Test123!", 10);
    userId = uuidv4();

    testUser = await prisma.user.create({
      data: {
        id: userId,
        email: `test-${Date.now()}@example.com`,
        username: `testuser-${Date.now()}`,
        passwordHash: hashedPassword,
        updatedAt: new Date(),
        whitelistedIPs: [],
      },
    });

    // Login to get token
    const loginRes = await request(app).post("/api/auth/login").send({
      email: testUser.email,
      password: "Test123!",
    });

    authToken = loginRes.body.token;
  });

  afterAll(async () => {
    // Cleanup: Delete whitelisted addresses
    await prisma.whitelistedAddress.deleteMany({
      where: { userId },
    });

    // Cleanup: Delete test user
    await prisma.user.delete({ where: { id: userId } });

    await prisma.$disconnect();
  });

  describe("IP Whitelist", () => {
    test("Should get empty IP whitelist initially", async () => {
      const res = await request(app)
        .get("/api/security/whitelist/ips")
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.ips).toEqual([]);
    });

    test("Should add IP to whitelist", async () => {
      const res = await request(app)
        .post("/api/security/whitelist/ip")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ ip: "192.168.1.100", label: "Home" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.ips).toContain("192.168.1.100");
    });

    test("Should reject invalid IP format", async () => {
      const res = await request(app)
        .post("/api/security/whitelist/ip")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ ip: "invalid-ip" });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("Invalid IP address format");
    });

    test("Should reject duplicate IP", async () => {
      const res = await request(app)
        .post("/api/security/whitelist/ip")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ ip: "192.168.1.100" });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("already whitelisted");
    });

    test("Should remove IP from whitelist", async () => {
      const res = await request(app)
        .delete("/api/security/whitelist/ip/192.168.1.100")
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.ips).not.toContain("192.168.1.100");
    });
  });

  describe("Wallet Address Whitelist", () => {
    let addressId: string;

    test("Should get empty address whitelist initially", async () => {
      const res = await request(app)
        .get("/api/security/whitelist/addresses")
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.addresses).toEqual([]);
    });

    test("Should add wallet address to whitelist", async () => {
      const res = await request(app)
        .post("/api/security/whitelist/address")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          address: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
          currency: "BTC",
          label: "My BTC Wallet",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.address.address).toBe(
        "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
      );
      expect(res.body.address.verified).toBe(false);

      addressId = res.body.address.id;
    });

    test("Should reject duplicate address", async () => {
      const res = await request(app)
        .post("/api/security/whitelist/address")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          address: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
          currency: "BTC",
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("already whitelisted");
    });

    test("Should verify whitelisted address", async () => {
      const res = await request(app)
        .post(`/api/security/whitelist/address/${addressId}/verify`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.address.verified).toBe(true);
    });

    test("Should remove address from whitelist", async () => {
      const res = await request(app)
        .delete(`/api/security/whitelist/address/${addressId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe("Withdrawal Security Checks", () => {
    beforeEach(async () => {
      // Give test user some BTC balance
      await prisma.user.update({
        where: { id: userId },
        data: { btcBalance: 0.1 },
      });
    });

    test("Should block withdrawal from non-whitelisted IP when whitelist is active", async () => {
      // Add a different IP to whitelist
      await request(app)
        .post("/api/security/whitelist/ip")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ ip: "10.0.0.1" });

      const res = await request(app)
        .post("/api/withdrawals/request")
        .set("Authorization", `Bearer ${authToken}`)
        .set("X-Forwarded-For", "192.168.1.100") // Simulate different IP
        .send({
          balanceType: "BTC",
          amount: "0.001",
          withdrawalAddress: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toContain("IP not whitelisted");

      // Cleanup
      await request(app)
        .delete("/api/security/whitelist/ip/10.0.0.1")
        .set("Authorization", `Bearer ${authToken}`);
    });

    test("Should block withdrawal to non-whitelisted address", async () => {
      const res = await request(app)
        .post("/api/withdrawals/request")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          balanceType: "BTC",
          amount: "0.001",
          withdrawalAddress: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toContain("not whitelisted");
    });

    test("Should allow withdrawal after whitelisting address", async () => {
      // Whitelist and verify address
      const addRes = await request(app)
        .post("/api/security/whitelist/address")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          address: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
          currency: "BTC",
        });

      await request(app)
        .post(
          `/api/security/whitelist/address/${addRes.body.address.id}/verify`,
        )
        .set("Authorization", `Bearer ${authToken}`);

      // Try withdrawal again
      const res = await request(app)
        .post("/api/withdrawals/request")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          balanceType: "BTC",
          amount: "0.001",
          withdrawalAddress: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
        });

      expect(res.status).not.toBe(403);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
