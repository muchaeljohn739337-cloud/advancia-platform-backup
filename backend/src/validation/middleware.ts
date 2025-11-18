import { NextFunction, Request, Response } from "express";
import { ZodError, ZodSchema } from "zod";
import { validationSchemas } from "./schemas";

/**
 * Validation middleware factory
 * Creates middleware that validates request data against a Zod schema
 */
export function validate(
  schema: ZodSchema,
  property: "body" | "query" | "params" = "body"
) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req[property];
      const validatedData = schema.parse(data);

      // Replace the original data with validated/sanitized data
      (req as any)[property] = validatedData;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Format Zod errors for client
        const formattedErrors = error.issues.map((err) => ({
          field: err.path.join("."),
          message: err.message,
          code: err.code,
        }));

        return res.status(400).json({
          error: "Validation failed",
          details: formattedErrors,
        });
      }

      // Unknown validation error
      console.error("Validation middleware error:", error);
      return res.status(500).json({
        error: "Internal validation error",
      });
    }
  };
}

/**
 * Pre-configured validation middleware for common schemas
 */
export const validators = {
  // User endpoints
  userRegistration: validate(validationSchemas.userRegistration),
  userLogin: validate(validationSchemas.userLogin),
  passwordChange: validate(validationSchemas.passwordChange),

  // Transaction endpoints
  transaction: validate(validationSchemas.transaction),

  // Payment endpoints
  payment: validate(validationSchemas.payment),

  // Crypto endpoints
  cryptoOrder: validate(validationSchemas.cryptoOrder),

  // Admin endpoints
  adminUserCreate: validate(validationSchemas.adminUserCreate),

  // Contact/Support endpoints
  contact: validate(validationSchemas.contact),

  // File upload endpoints
  fileUpload: validate(validationSchemas.fileUpload),

  // IP block endpoints
  ipBlock: validate(validationSchemas.ipBlock),

  // Settings endpoints
  settings: validate(validationSchemas.settings),

  // Generic validators
  id: validate(validationSchemas.id, "params"),
  pagination: validate(validationSchemas.pagination, "query"),
  search: validate(validationSchemas.search, "query"),
};

/**
 * Sanitization middleware
 * Additional sanitization beyond basic null byte removal
 */
export function sanitizeInput(req: Request, res: Response, next: NextFunction) {
  const sanitizeString = (str: string): string => {
    if (typeof str !== "string") return str;

    return (
      str
        // Remove null bytes
        .replace(/\0/g, "")
        // Remove potential XSS vectors
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
        // Trim whitespace
        .trim()
        // Limit length to prevent buffer overflow attempts
        .substring(0, 10000)
    );
  };

  const sanitizeObject = (obj: any): any => {
    if (typeof obj === "string") {
      return sanitizeString(obj);
    }

    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }

    if (typeof obj === "object" && obj !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        // Skip sensitive fields that shouldn't be logged/modified
        if (["password", "passwordHash", "token", "secret"].includes(key)) {
          sanitized[key] = value;
        } else {
          sanitized[key] = sanitizeObject(value);
        }
      }
      return sanitized;
    }

    return obj;
  };

  // Sanitize request data
  if (req.body) req.body = sanitizeObject(req.body);
  // Note: req.query is read-only, sanitize values but don't reassign
  if (req.query) {
    Object.keys(req.query).forEach((key) => {
      const sanitized = sanitizeObject(req.query[key]);
      if (sanitized !== req.query[key]) {
        (req.query as any)[key] = sanitized;
      }
    });
  }
  if (req.params) req.params = sanitizeObject(req.params);

  next();
}
