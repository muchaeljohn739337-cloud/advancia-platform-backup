import express from "express";
import request from "supertest";

// Declare mock function holders
process.env.STRIPE_SECRET_KEY = "sk_test_dummy";
process.env.STRIPE_WEBHOOK_SECRET = "whsec_dummy";
const mockFindFirst = jest.fn();
const mockCreate = jest.fn();
const mockStripePaymentIntentsCreate = jest.fn().mockResolvedValue({
  id: "pi_new",
  client_secret: "cs_new",
  status: "requires_payment_method",
  amount: 5000,
  currency: "usd",
});
const mockStripePaymentIntentsRetrieve = jest
  .fn()
  .mockImplementation((id: string) =>
    Promise.resolve({
      id,
      client_secret: `cs_${id}`,
      status: "requires_payment_method",
      amount: 5000,
      currency: "usd",
    }),
  );

// Mock PrismaClient directly to avoid real DB connections
jest.mock("@prisma/client", () => {
  const PrismaClientMock = function () {
    return {
      user: {
        findUnique: jest
          .fn()
          .mockResolvedValue({ id: "user_1", stripeCustomerId: "cus_test" }),
      },
      transaction: {
        findFirst: (...args: any[]) => mockFindFirst(...args),
        create: (...args: any[]) => mockCreate(...args),
      },
      $transaction: (ops: any) => Promise.all(ops),
      $connect: jest.fn(),
    } as any;
  } as any;
  return { __esModule: true, PrismaClient: PrismaClientMock };
});

// Mock stripe BEFORE importing router
jest.mock("stripe", () =>
  jest.fn().mockImplementation(() => ({
    paymentIntents: {
      create: (...args: any[]) => mockStripePaymentIntentsCreate(...args),
      retrieve: (...args: any[]) => mockStripePaymentIntentsRetrieve(...args),
    },
  })),
);

// Mock auth middleware to bypass JWT validation while setting req.user
jest.mock("../../middleware/auth", () => ({
  __esModule: true,
  authenticateToken: (req: any, _res: any, next: any) => {
    req.user = { id: "user_1", email: "test@example.com" };
    next();
  },
  requireAdmin: (_req: any, _res: any, next: any) => next(),
}));

// Import router AFTER mocks so it receives mocked dependencies
import router from "../paymentsEnhanced";

// Helper to build app with user injection
function buildApp(userId: string = "user_1") {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    // Attach a fake authenticated user
    (req as any).user = { id: userId, email: "test@example.com" };
    next();
  });
  app.use("/api/payments", router);
  return app;
}

// Reset env dup window for predictable behavior
const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  jest.clearAllMocks();
  process.env.PAYMENT_INTENT_DUP_WINDOW_MS = "90000"; // 90s
});

afterAll(() => {
  process.env = ORIGINAL_ENV;
});

describe("POST /api/payments/create-intent duplicate guard", () => {
  test("reuses recent intent when matching transaction exists", async () => {
    const now = new Date();
    // Mock findFirst returns existing transaction inside window
    mockFindFirst.mockResolvedValue({
      id: "tx_existing",
      userId: "user_1",
      amount: 5000,
      currency: "USD",
      paymentIntentId: "pi_existing",
      orderId: "pi_existing",
      status: "pending",
      createdAt: now,
    });

    const app = buildApp();
    const res = await request(app)
      .post("/api/payments/create-intent")
      .send({ amount: 50.0, currency: "USD" });

    expect(res.status).toBe(200);
    expect(res.body.code).toBe("PAYMENT_INTENT_REUSED");
    expect(res.body.paymentIntentId).toBe("pi_existing");
    // Should not create new transaction
    expect(mockCreate).not.toHaveBeenCalled();
  });

  test("creates new intent when no existing transaction found", async () => {
    mockFindFirst.mockResolvedValue(null);
    mockCreate.mockResolvedValue({
      id: "tx_new",
      userId: "user_1",
      amount: 5000,
      currency: "USD",
      paymentIntentId: "pi_new",
      status: "pending",
      createdAt: new Date(),
    });

    const app = buildApp();
    const res = await request(app)
      .post("/api/payments/create-intent")
      .send({ amount: 50.0, currency: "USD" });

    expect(res.status).toBe(200);
    // New flow may not set a code on success (only on reuse); ensure not reused
    expect(res.body.code).not.toBe("PAYMENT_INTENT_REUSED");
    expect(res.body.paymentIntentId).toBe("pi_new");
    expect(mockCreate).toHaveBeenCalled();
  });
});
