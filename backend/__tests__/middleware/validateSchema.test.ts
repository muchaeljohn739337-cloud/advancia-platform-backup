import { Request, Response } from "express";
import { z } from "zod";
import { validateSchema } from "../../src/middleware/validateSchema";

describe("validateSchema middleware", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.Mock;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    req = { body: {}, query: {}, params: {} };
    res = { status: statusMock, json: jsonMock };
    next = jest.fn();
  });

  describe("body validation", () => {
    const testSchema = z.object({
      email: z.string().email(),
      age: z.number().min(18),
    });

    it("should call next() with valid body", () => {
      req.body = { email: "test@example.com", age: 25 };
      const middleware = validateSchema(testSchema, "body");
      middleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(statusMock).not.toHaveBeenCalled();
    });

    it("should return 400 with invalid body", () => {
      req.body = { email: "invalid-email", age: 15 };
      const middleware = validateSchema(testSchema, "body");
      middleware(req as Request, res as Response, next);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "Invalid request",
          details: expect.arrayContaining([
            expect.objectContaining({ path: expect.any(String) }),
          ]),
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it("should parse and transform valid data", () => {
      const transformSchema = z.object({
        value: z.string().transform((s) => s.toUpperCase()),
      });
      req.body = { value: "hello" };
      const middleware = validateSchema(transformSchema, "body");
      middleware(req as Request, res as Response, next);

      expect(req.body.value).toBe("HELLO");
      expect(next).toHaveBeenCalled();
    });

    it("should return multiple validation errors", () => {
      req.body = { email: "bad", age: 10 };
      const middleware = validateSchema(testSchema, "body");
      middleware(req as Request, res as Response, next);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          details: expect.arrayContaining([
            expect.objectContaining({ path: "email" }),
            expect.objectContaining({ path: "age" }),
          ]),
        })
      );
    });
  });

  describe("query validation", () => {
    const querySchema = z.object({
      page: z
        .string()
        .transform(Number)
        .refine((n) => n > 0),
      limit: z.string().transform(Number).optional(),
    });

    it("should validate query params", () => {
      req.query = { page: "1", limit: "10" };
      const middleware = validateSchema(querySchema, "query");
      middleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
      expect(req.query).toEqual({ page: 1, limit: 10 });
    });

    it("should reject invalid query params", () => {
      req.query = { page: "0" };
      const middleware = validateSchema(querySchema, "query");
      middleware(req as Request, res as Response, next);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("params validation", () => {
    const paramsSchema = z.object({
      id: z.string().uuid(),
    });

    it("should validate route params", () => {
      req.params = { id: "550e8400-e29b-41d4-a716-446655440000" };
      const middleware = validateSchema(paramsSchema, "params");
      middleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
    });

    it("should reject invalid UUID", () => {
      req.params = { id: "not-a-uuid" };
      const middleware = validateSchema(paramsSchema, "params");
      middleware(req as Request, res as Response, next);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "Invalid request",
        })
      );
    });
  });

  describe("edge cases", () => {
    it("should default to body source", () => {
      const schema = z.object({ test: z.string() });
      req.body = { test: "value" };
      const middleware = validateSchema(schema);
      middleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
    });

    it("should handle empty objects", () => {
      const schema = z.object({}).strict();
      req.body = {};
      const middleware = validateSchema(schema, "body");
      middleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
    });

    it("should handle nested validation errors", () => {
      const schema = z.object({
        user: z.object({
          profile: z.object({
            email: z.string().email(),
          }),
        }),
      });
      req.body = { user: { profile: { email: "bad" } } };
      const middleware = validateSchema(schema, "body");
      middleware(req as Request, res as Response, next);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          details: expect.arrayContaining([
            expect.objectContaining({ path: "user.profile.email" }),
          ]),
        })
      );
    });

    it("should handle non-Zod errors gracefully", () => {
      const schema = z.object({ test: z.string() });
      // Force a non-Zod error by passing undefined
      req.body = undefined;
      const middleware = validateSchema(schema, "body");
      middleware(req as Request, res as Response, next);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining("Invalid request"),
        })
      );
    });
  });
});
