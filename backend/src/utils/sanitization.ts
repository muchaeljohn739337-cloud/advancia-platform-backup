import { NextFunction, Request, Response } from 'express';
import validator from 'validator';

/**
 * Input Sanitization Utility
 *
 * Protects against XSS, SQL injection, and other security threats
 * Use with all user inputs before rendering or storing
 */

export class InputSanitizer {
  /**
   * Sanitize string input - removes HTML tags and dangerous characters
   */
  static sanitizeString(input: string): string {
    if (typeof input !== 'string') return '';

    return validator.escape(validator.stripLow(validator.trim(input)));
  }

  /**
   * Sanitize email - validates and normalizes email addresses
   */
  static sanitizeEmail(email: string): string | null {
    if (!email || typeof email !== 'string') return null;

    const trimmed = validator.trim(email.toLowerCase());
    return validator.isEmail(trimmed)
      ? validator.normalizeEmail(trimmed) || trimmed
      : null;
  }

  /**
   * Sanitize URL - validates and normalizes URLs
   */
  static sanitizeURL(url: string): string | null {
    if (!url || typeof url !== 'string') return null;

    const trimmed = validator.trim(url);
    return validator.isURL(trimmed, {
      protocols: ['http', 'https'],
      require_protocol: true,
    })
      ? trimmed
      : null;
  }

  /**
   * Sanitize numeric input
   */
  static sanitizeNumber(input: any): number | null {
    const num = Number(input);
    return !isNaN(num) && isFinite(num) ? num : null;
  }

  /**
   * Sanitize alphanumeric input (usernames, IDs, etc.)
   */
  static sanitizeAlphanumeric(
    input: string,
    allowUnderscore = true,
  ): string | null {
    if (!input || typeof input !== 'string') return null;

    const pattern = allowUnderscore ? /^[a-zA-Z0-9_]+$/ : /^[a-zA-Z0-9]+$/;
    const trimmed = validator.trim(input);

    return pattern.test(trimmed) ? trimmed : null;
  }

  /**
   * Sanitize phone number - removes non-numeric characters
   */
  static sanitizePhone(phone: string): string | null {
    if (!phone || typeof phone !== 'string') return null;

    const cleaned = phone.replace(/\D/g, '');
    return validator.isMobilePhone(cleaned) ? cleaned : null;
  }

  /**
   * Sanitize object - recursively sanitizes all string values
   */
  static sanitizeObject<T extends Record<string, any>>(obj: T): T {
    const sanitized = { ...obj };

    for (const key in sanitized) {
      const value = sanitized[key];

      if (typeof value === 'string') {
        sanitized[key] = this.sanitizeString(value) as any;
      } else if (Array.isArray(value)) {
        sanitized[key] = value.map((item) =>
          typeof item === 'string' ? this.sanitizeString(item) : item,
        ) as any;
      } else if (value && typeof value === 'object') {
        sanitized[key] = this.sanitizeObject(value) as any;
      }
    }

    return sanitized;
  }

  /**
   * Sanitize HTML for safe rendering - allows basic formatting only
   */
  static sanitizeHTML(html: string, allowedTags: string[] = []): string {
    if (!html || typeof html !== 'string') return '';

    // If no tags allowed, strip all HTML
    if (allowedTags.length === 0) {
      return validator.escape(validator.stripLow(html));
    }

    // Basic whitelist implementation
    const tagPattern = new RegExp(
      `<(?!\/?(${allowedTags.join('|')})\b)[^>]+>`,
      'gi',
    );
    return validator.escape(html.replace(tagPattern, ''));
  }

  /**
   * Remove SQL injection patterns
   */
  static removeSQLInjection(input: string): string {
    if (!input || typeof input !== 'string') return '';

    // Remove common SQL injection patterns
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/gi,
      /(--|;|\/\*|\*\/|xp_|sp_)/gi,
      /('|(\\')|(--)|;|\/\*|\*\/)/gi,
    ];

    let sanitized = input;
    sqlPatterns.forEach((pattern) => {
      sanitized = sanitized.replace(pattern, '');
    });

    return validator.trim(sanitized);
  }

  /**
   * Sanitize filename - removes path traversal attempts
   */
  static sanitizeFilename(filename: string): string | null {
    if (!filename || typeof filename !== 'string') return null;

    // Remove path traversal attempts
    const sanitized = filename.replace(/[^a-zA-Z0-9._-]/g, '');

    // Check for directory traversal
    if (
      sanitized.includes('..') ||
      sanitized.includes('/') ||
      sanitized.includes('\\')
    ) {
      return null;
    }

    return sanitized.substring(0, 255); // Limit length
  }

  /**
   * Validate and sanitize JSON input
   */
  static sanitizeJSON(input: string): object | null {
    try {
      const parsed = JSON.parse(input);
      return this.sanitizeObject(parsed);
    } catch {
      return null;
    }
  }

  /**
   * Sanitize credit card number (for logging - NEVER store raw cards!)
   */
  static maskCreditCard(cardNumber: string): string {
    if (!cardNumber || typeof cardNumber !== 'string') return '';

    const cleaned = cardNumber.replace(/\D/g, '');
    if (cleaned.length < 13) return '****';

    // Show last 4 digits only
    return `****-****-****-${cleaned.slice(-4)}`;
  }

  /**
   * Sanitize password (for validation - NEVER log passwords!)
   */
  static validatePassword(password: string): {
    valid: boolean;
    message?: string;
  } {
    if (!password || typeof password !== 'string') {
      return { valid: false, message: 'Password is required' };
    }

    if (password.length < 8) {
      return {
        valid: false,
        message: 'Password must be at least 8 characters',
      };
    }

    if (!/(?=.*[a-z])/.test(password)) {
      return {
        valid: false,
        message: 'Password must contain lowercase letter',
      };
    }

    if (!/(?=.*[A-Z])/.test(password)) {
      return {
        valid: false,
        message: 'Password must contain uppercase letter',
      };
    }

    if (!/(?=.*\d)/.test(password)) {
      return { valid: false, message: 'Password must contain a number' };
    }

    return { valid: true };
  }
}

/**
 * Express middleware to automatically sanitize request body
 */
export const sanitizeRequestBody = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (req.body && typeof req.body === 'object') {
    req.body = InputSanitizer.sanitizeObject(req.body);
  }
  next();
};

/**
 * Express middleware to sanitize query parameters
 */
export const sanitizeQueryParams = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (req.query && typeof req.query === 'object') {
    req.query = InputSanitizer.sanitizeObject(req.query as Record<string, any>);
  }
  next();
};

/**
 * Express middleware to sanitize URL parameters
 */
export const sanitizeUrlParams = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (req.params && typeof req.params === 'object') {
    req.params = InputSanitizer.sanitizeObject(req.params);
  }
  next();
};

/**
 * Combined sanitization middleware (body + query + params)
 */
export const sanitizeAllInputs = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  sanitizeRequestBody(req, res, () => {});
  sanitizeQueryParams(req, res, () => {});
  sanitizeUrlParams(req, res, () => {});
  next();
};

// Export singleton instance
export const sanitizer = InputSanitizer;
