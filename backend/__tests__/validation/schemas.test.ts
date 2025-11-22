import {
  AdminRefundSchema,
  AuthLoginSchema,
  AuthRegisterSchema,
  PaymentChargeSavedSchema,
  PaymentCreateIntentSchema,
  PaymentSaveMethodSchema,
  SubscriptionCancelSchema,
  SubscriptionCreateSchema,
  WithdrawalAdminActionSchema,
  WithdrawalRequestSchema,
} from "../../src/validation/schemas";

describe("Validation Schemas", () => {
  describe("WithdrawalRequestSchema", () => {
    it("should validate valid withdrawal request", () => {
      const valid = {
        balanceType: "btc",
        amount: 0.5,
        withdrawalAddress: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
      };
      expect(() => WithdrawalRequestSchema.parse(valid)).not.toThrow();
    });

    it("should uppercase balanceType", () => {
      const input = {
        balanceType: "eth",
        amount: 1,
        withdrawalAddress: "0x1234567890123456789012345678901234567890",
      };
      const parsed = WithdrawalRequestSchema.parse(input);
      expect(parsed.balanceType).toBe("ETH");
    });

    it("should require withdrawalAddress for crypto", () => {
      const invalid = { balanceType: "BTC", amount: 1 };
      expect(() => WithdrawalRequestSchema.parse(invalid)).toThrow();
    });

    it("should allow USD without withdrawalAddress", () => {
      const valid = { balanceType: "USD", amount: 100 };
      expect(() => WithdrawalRequestSchema.parse(valid)).not.toThrow();
    });

    it("should reject invalid balanceType", () => {
      const invalid = { balanceType: "DOGE", amount: 1 };
      expect(() => WithdrawalRequestSchema.parse(invalid)).toThrow();
    });

    it("should reject negative amount", () => {
      const invalid = { balanceType: "USD", amount: -10 };
      expect(() => WithdrawalRequestSchema.parse(invalid)).toThrow();
    });

    it("should parse string amount to number", () => {
      const input = { balanceType: "USD", amount: "123.45" };
      const parsed = WithdrawalRequestSchema.parse(input);
      expect(parsed.amount).toBe(123.45);
    });
  });

  describe("WithdrawalAdminActionSchema", () => {
    it("should validate approve action", () => {
      const valid = {
        action: "approve" as const,
        adminNotes: "Approved",
        txHash: "0xabc123",
        networkFee: 0.001,
      };
      expect(() => WithdrawalAdminActionSchema.parse(valid)).not.toThrow();
    });

    it("should validate reject action", () => {
      const valid = { action: "reject" as const, adminNotes: "Rejected" };
      expect(() => WithdrawalAdminActionSchema.parse(valid)).not.toThrow();
    });

    it("should reject invalid action", () => {
      const invalid = { action: "pending" };
      expect(() => WithdrawalAdminActionSchema.parse(invalid)).toThrow();
    });

    it("should parse string networkFee", () => {
      const input = { action: "approve" as const, networkFee: "0.002" };
      const parsed = WithdrawalAdminActionSchema.parse(input);
      expect(parsed.networkFee).toBe(0.002);
    });
  });

  describe("AuthRegisterSchema", () => {
    it("should validate valid registration", () => {
      const valid = {
        email: "test@example.com",
        password: "password123",
        username: "testuser",
        firstName: "Test",
        lastName: "User",
      };
      expect(() => AuthRegisterSchema.parse(valid)).not.toThrow();
    });

    it("should reject invalid email", () => {
      const invalid = { email: "notanemail", password: "password123" };
      expect(() => AuthRegisterSchema.parse(invalid)).toThrow();
    });

    it("should reject short password", () => {
      const invalid = { email: "test@example.com", password: "123" };
      expect(() => AuthRegisterSchema.parse(invalid)).toThrow();
    });

    it("should allow optional fields to be missing", () => {
      const valid = { email: "test@example.com", password: "password123" };
      expect(() => AuthRegisterSchema.parse(valid)).not.toThrow();
    });
  });

  describe("AuthLoginSchema", () => {
    it("should validate valid login", () => {
      const valid = { email: "test@example.com", password: "password123" };
      expect(() => AuthLoginSchema.parse(valid)).not.toThrow();
    });

    it("should allow username in email field", () => {
      const valid = { email: "testuser", password: "password123" };
      expect(() => AuthLoginSchema.parse(valid)).not.toThrow();
    });

    it("should reject empty credentials", () => {
      const invalid = { email: "", password: "" };
      expect(() => AuthLoginSchema.parse(invalid)).toThrow();
    });
  });

  describe("PaymentSaveMethodSchema", () => {
    it("should validate payment method ID", () => {
      const valid = { paymentMethodId: "pm_1234567890" };
      expect(() => PaymentSaveMethodSchema.parse(valid)).not.toThrow();
    });

    it("should reject empty paymentMethodId", () => {
      const invalid = { paymentMethodId: "" };
      expect(() => PaymentSaveMethodSchema.parse(invalid)).toThrow();
    });
  });

  describe("PaymentCreateIntentSchema", () => {
    it("should validate payment intent creation", () => {
      const valid = {
        amount: 100.5,
        currency: "usd",
        description: "Test payment",
        metadata: { orderId: "12345" },
      };
      expect(() => PaymentCreateIntentSchema.parse(valid)).not.toThrow();
    });

    it("should reject zero amount", () => {
      const invalid = { amount: 0 };
      expect(() => PaymentCreateIntentSchema.parse(invalid)).toThrow();
    });

    it("should reject negative amount", () => {
      const invalid = { amount: -50 };
      expect(() => PaymentCreateIntentSchema.parse(invalid)).toThrow();
    });

    it("should allow optional fields", () => {
      const valid = { amount: 100 };
      expect(() => PaymentCreateIntentSchema.parse(valid)).not.toThrow();
    });
  });

  describe("PaymentChargeSavedSchema", () => {
    it("should validate charge with saved method", () => {
      const valid = {
        paymentMethodId: "pm_test",
        amount: 50.25,
        description: "Recurring charge",
      };
      expect(() => PaymentChargeSavedSchema.parse(valid)).not.toThrow();
    });

    it("should reject missing paymentMethodId", () => {
      const invalid = { amount: 50 };
      expect(() => PaymentChargeSavedSchema.parse(invalid)).toThrow();
    });
  });

  describe("SubscriptionCreateSchema", () => {
    it("should validate subscription creation", () => {
      const valid = {
        priceId: "price_123",
        paymentMethodId: "pm_123",
        planName: "Premium Plan",
        amount: 29.99,
        interval: "month" as const,
      };
      expect(() => SubscriptionCreateSchema.parse(valid)).not.toThrow();
    });

    it("should validate with minimal fields", () => {
      const valid = { amount: 19.99 };
      expect(() => SubscriptionCreateSchema.parse(valid)).not.toThrow();
    });

    it("should reject invalid interval", () => {
      const invalid = { amount: 10, interval: "quarterly" };
      expect(() => SubscriptionCreateSchema.parse(invalid)).toThrow();
    });
  });

  describe("SubscriptionCancelSchema", () => {
    it("should validate cancel immediately", () => {
      const valid = { immediately: true };
      expect(() => SubscriptionCancelSchema.parse(valid)).not.toThrow();
    });

    it("should validate empty body", () => {
      const valid = {};
      expect(() => SubscriptionCancelSchema.parse(valid)).not.toThrow();
    });
  });

  describe("AdminRefundSchema", () => {
    it("should validate full refund", () => {
      const valid = { paymentIntentId: "pi_1234567890" };
      expect(() => AdminRefundSchema.parse(valid)).not.toThrow();
    });

    it("should validate partial refund", () => {
      const valid = { paymentIntentId: "pi_test", amount: 25.5 };
      expect(() => AdminRefundSchema.parse(valid)).not.toThrow();
    });

    it("should reject missing paymentIntentId", () => {
      const invalid = { amount: 10 };
      expect(() => AdminRefundSchema.parse(invalid)).toThrow();
    });

    it("should reject negative refund amount", () => {
      const invalid = { paymentIntentId: "pi_test", amount: -10 };
      expect(() => AdminRefundSchema.parse(invalid)).toThrow();
    });
  });
});
