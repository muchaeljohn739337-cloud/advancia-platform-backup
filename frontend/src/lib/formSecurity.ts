/**
 * Form Security System
 *
 * Provides comprehensive form protection including:
 * - Submit protection (prevent double submission)
 * - Client-side validation
 * - Field-level encryption
 * - CSRF protection
 * - Rate limiting
 * - Input sanitization
 */

import CryptoJS from 'crypto-js';
import { InputSecurity } from './security';

// ============================================
// 1. FORM SUBMIT PROTECTION
// ============================================

export class FormSubmitProtection {
  private static submittingForms = new Set<string>();
  private static submitTimestamps = new Map<string, number>();
  private static readonly MIN_SUBMIT_INTERVAL = 1000; // 1 second

  /**
   * Check if form can be submitted
   */
  static canSubmit(formId: string): boolean {
    // Check if already submitting
    if (this.submittingForms.has(formId)) {
      console.warn('Form is already being submitted:', formId);
      return false;
    }

    // Check rate limiting
    const lastSubmit = this.submitTimestamps.get(formId);
    if (lastSubmit && Date.now() - lastSubmit < this.MIN_SUBMIT_INTERVAL) {
      console.warn('Form submitted too quickly:', formId);
      return false;
    }

    return true;
  }

  /**
   * Mark form as submitting
   */
  static startSubmit(formId: string): void {
    this.submittingForms.add(formId);
    this.submitTimestamps.set(formId, Date.now());
  }

  /**
   * Mark form as done submitting
   */
  static endSubmit(formId: string): void {
    this.submittingForms.delete(formId);
  }

  /**
   * Reset form submit state
   */
  static reset(formId: string): void {
    this.submittingForms.delete(formId);
    this.submitTimestamps.delete(formId);
  }
}

// ============================================
// 2. FORM VALIDATION
// ============================================

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  min?: number;
  max?: number;
  email?: boolean;
  url?: boolean;
  phone?: boolean;
  custom?: (value: any) => boolean | string;
}

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

export class FormValidator {
  /**
   * Validate single field
   */
  static validateField(name: string, value: any, rules: ValidationRule): string | null {
    // Required check
    if (rules.required && (!value || value.toString().trim() === '')) {
      return `${name} is required`;
    }

    // Skip other checks if empty and not required
    if (!value || value.toString().trim() === '') {
      return null;
    }

    const stringValue = value.toString().trim();

    // Email validation
    if (rules.email && !this.isValidEmail(stringValue)) {
      return `${name} must be a valid email address`;
    }

    // URL validation
    if (rules.url && !this.isValidURL(stringValue)) {
      return `${name} must be a valid URL`;
    }

    // Phone validation
    if (rules.phone && !this.isValidPhone(stringValue)) {
      return `${name} must be a valid phone number`;
    }

    // Min length
    if (rules.minLength && stringValue.length < rules.minLength) {
      return `${name} must be at least ${rules.minLength} characters`;
    }

    // Max length
    if (rules.maxLength && stringValue.length > rules.maxLength) {
      return `${name} must not exceed ${rules.maxLength} characters`;
    }

    // Pattern validation
    if (rules.pattern && !rules.pattern.test(stringValue)) {
      return `${name} format is invalid`;
    }

    // Numeric min/max
    if (typeof value === 'number' || !isNaN(parseFloat(stringValue))) {
      const numValue = typeof value === 'number' ? value : parseFloat(stringValue);

      if (rules.min !== undefined && numValue < rules.min) {
        return `${name} must be at least ${rules.min}`;
      }

      if (rules.max !== undefined && numValue > rules.max) {
        return `${name} must not exceed ${rules.max}`;
      }
    }

    // Custom validation
    if (rules.custom) {
      const result = rules.custom(value);
      if (result === false) {
        return `${name} is invalid`;
      }
      if (typeof result === 'string') {
        return result;
      }
    }

    return null;
  }

  /**
   * Validate entire form
   */
  static validate(
    data: Record<string, any>,
    rules: Record<string, ValidationRule>
  ): ValidationResult {
    const errors: Record<string, string> = {};

    for (const [fieldName, fieldRules] of Object.entries(rules)) {
      const value = data[fieldName];
      const error = this.validateField(fieldName, value, fieldRules);

      if (error) {
        errors[fieldName] = error;
      }
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors,
    };
  }

  /**
   * Email validation
   */
  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * URL validation
   */
  private static isValidURL(url: string): boolean {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }

  /**
   * Phone validation
   */
  private static isValidPhone(phone: string): boolean {
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');
    // Check if it's between 10-15 digits
    return digits.length >= 10 && digits.length <= 15;
  }

  /**
   * Password strength validation
   */
  static validatePassword(password: string): {
    valid: boolean;
    strength: 'weak' | 'medium' | 'strong';
    message: string;
  } {
    if (password.length < 8) {
      return {
        valid: false,
        strength: 'weak',
        message: 'Password must be at least 8 characters',
      };
    }

    let strength = 0;

    // Check for lowercase
    if (/[a-z]/.test(password)) strength++;

    // Check for uppercase
    if (/[A-Z]/.test(password)) strength++;

    // Check for numbers
    if (/[0-9]/.test(password)) strength++;

    // Check for special characters
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    if (strength < 2) {
      return {
        valid: false,
        strength: 'weak',
        message: 'Password is too weak. Use a mix of letters, numbers, and symbols',
      };
    }

    if (strength < 3) {
      return {
        valid: true,
        strength: 'medium',
        message: 'Password strength is medium',
      };
    }

    return {
      valid: true,
      strength: 'strong',
      message: 'Password is strong',
    };
  }
}

// ============================================
// 3. FIELD ENCRYPTION
// ============================================

export class FieldEncryption {
  private static readonly ENCRYPTION_KEY =
    process.env.NEXT_PUBLIC_FORM_ENCRYPTION_KEY || 'advancia-default-key-change-in-production';

  /**
   * Encrypt sensitive field data
   */
  static encrypt(data: string): string {
    try {
      return CryptoJS.AES.encrypt(data, this.ENCRYPTION_KEY).toString();
    } catch (error) {
      console.error('Encryption failed:', error);
      return data;
    }
  }

  /**
   * Decrypt field data
   */
  static decrypt(encryptedData: string): string {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedData, this.ENCRYPTION_KEY);
      return bytes.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error('Decryption failed:', error);
      return encryptedData;
    }
  }

  /**
   * Encrypt specific form fields
   */
  static encryptFields(data: Record<string, any>, fieldsToEncrypt: string[]): Record<string, any> {
    const encrypted = { ...data };

    for (const field of fieldsToEncrypt) {
      if (encrypted[field]) {
        encrypted[field] = this.encrypt(encrypted[field].toString());
      }
    }

    return encrypted;
  }

  /**
   * Hash sensitive data (one-way)
   */
  static hash(data: string): string {
    return CryptoJS.SHA256(data).toString();
  }
}

// ============================================
// 4. CSRF PROTECTION
// ============================================

export class CSRFProtection {
  private static readonly TOKEN_KEY = '__csrf_token';
  private static readonly TOKEN_EXPIRY = 3600000; // 1 hour

  /**
   * Generate CSRF token
   */
  static generateToken(): string {
    const token = CryptoJS.lib.WordArray.random(32).toString();
    const expiry = Date.now() + this.TOKEN_EXPIRY;

    sessionStorage.setItem(this.TOKEN_KEY, token);
    sessionStorage.setItem(`${this.TOKEN_KEY}_expiry`, expiry.toString());

    return token;
  }

  /**
   * Get current CSRF token (generate if needed)
   */
  static getToken(): string {
    const token = sessionStorage.getItem(this.TOKEN_KEY);
    const expiry = sessionStorage.getItem(`${this.TOKEN_KEY}_expiry`);

    // Generate new token if expired or doesn't exist
    if (!token || !expiry || Date.now() > parseInt(expiry)) {
      return this.generateToken();
    }

    return token;
  }

  /**
   * Validate CSRF token
   */
  static validateToken(token: string): boolean {
    const storedToken = sessionStorage.getItem(this.TOKEN_KEY);
    const expiry = sessionStorage.getItem(`${this.TOKEN_KEY}_expiry`);

    if (!storedToken || !expiry) {
      return false;
    }

    if (Date.now() > parseInt(expiry)) {
      return false;
    }

    return token === storedToken;
  }

  /**
   * Add CSRF token to headers
   */
  static addToHeaders(headers: Record<string, string> = {}): Record<string, string> {
    return {
      ...headers,
      'X-CSRF-Token': this.getToken(),
    };
  }
}

// ============================================
// 5. RATE LIMITING
// ============================================

export class FormRateLimiter {
  private static attempts = new Map<string, number[]>();
  private static readonly MAX_ATTEMPTS = 5;
  private static readonly TIME_WINDOW = 60000; // 1 minute

  /**
   * Check if form submission is rate limited
   */
  static isRateLimited(formId: string): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(formId) || [];

    // Remove old attempts outside time window
    const recentAttempts = attempts.filter((timestamp) => now - timestamp < this.TIME_WINDOW);

    this.attempts.set(formId, recentAttempts);

    return recentAttempts.length >= this.MAX_ATTEMPTS;
  }

  /**
   * Record form submission attempt
   */
  static recordAttempt(formId: string): void {
    const attempts = this.attempts.get(formId) || [];
    attempts.push(Date.now());
    this.attempts.set(formId, attempts);
  }

  /**
   * Reset rate limit for form
   */
  static reset(formId: string): void {
    this.attempts.delete(formId);
  }

  /**
   * Get remaining attempts
   */
  static getRemainingAttempts(formId: string): number {
    const now = Date.now();
    const attempts = this.attempts.get(formId) || [];
    const recentAttempts = attempts.filter((timestamp) => now - timestamp < this.TIME_WINDOW);

    return Math.max(0, this.MAX_ATTEMPTS - recentAttempts.length);
  }
}

// ============================================
// 6. SECURE FORM HANDLER
// ============================================

export interface SecureFormConfig {
  formId: string;
  validationRules?: Record<string, ValidationRule>;
  encryptFields?: string[];
  enableCSRF?: boolean;
  enableRateLimit?: boolean;
  sanitizeInputs?: boolean;
  onSubmit: (data: Record<string, any>) => Promise<any>;
  onSuccess?: (result: any) => void;
  onError?: (error: any) => void;
}

export class SecureFormHandler {
  private config: SecureFormConfig;

  constructor(config: SecureFormConfig) {
    this.config = {
      enableCSRF: true,
      enableRateLimit: true,
      sanitizeInputs: true,
      ...config,
    };
  }

  /**
   * Handle secure form submission
   */
  async submit(formData: Record<string, any>): Promise<{
    success: boolean;
    data?: any;
    errors?: Record<string, string>;
    message?: string;
  }> {
    try {
      // 1. Check submit protection
      if (!FormSubmitProtection.canSubmit(this.config.formId)) {
        return {
          success: false,
          message: 'Please wait before submitting again',
        };
      }

      // 2. Check rate limiting
      if (this.config.enableRateLimit && FormRateLimiter.isRateLimited(this.config.formId)) {
        const remaining = FormRateLimiter.getRemainingAttempts(this.config.formId);
        return {
          success: false,
          message: `Too many attempts. Please try again later. (${remaining} attempts remaining)`,
        };
      }

      // 3. Sanitize inputs
      let processedData = { ...formData };
      if (this.config.sanitizeInputs) {
        processedData = this.sanitizeFormData(processedData);
      }

      // 4. Validate form
      if (this.config.validationRules) {
        const validation = FormValidator.validate(processedData, this.config.validationRules);
        if (!validation.valid) {
          return {
            success: false,
            errors: validation.errors,
            message: 'Please fix the errors in the form',
          };
        }
      }

      // 5. Encrypt sensitive fields
      if (this.config.encryptFields && this.config.encryptFields.length > 0) {
        processedData = FieldEncryption.encryptFields(processedData, this.config.encryptFields);
      }

      // 6. Add CSRF token
      if (this.config.enableCSRF) {
        processedData._csrf = CSRFProtection.getToken();
      }

      // 7. Mark as submitting
      FormSubmitProtection.startSubmit(this.config.formId);

      // 8. Record rate limit attempt
      if (this.config.enableRateLimit) {
        FormRateLimiter.recordAttempt(this.config.formId);
      }

      // 9. Submit form
      const result = await this.config.onSubmit(processedData);

      // 10. Success callback
      if (this.config.onSuccess) {
        this.config.onSuccess(result);
      }

      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      // Error callback
      if (this.config.onError) {
        this.config.onError(error);
      }

      return {
        success: false,
        message: error.message || 'An error occurred while submitting the form',
      };
    } finally {
      // Always end submit state
      FormSubmitProtection.endSubmit(this.config.formId);
    }
  }

  /**
   * Sanitize all form data
   */
  private sanitizeFormData(data: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};

    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string') {
        sanitized[key] = InputSecurity.sanitizeInput(value);
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeFormData(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Reset form security state
   */
  reset(): void {
    FormSubmitProtection.reset(this.config.formId);
    FormRateLimiter.reset(this.config.formId);
  }
}

// ============================================
// 7. FORM SECURITY UTILITIES
// ============================================

export const FormSecurityUtils = {
  /**
   * Generate secure form ID
   */
  generateFormId(prefix: string = 'form'): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },

  /**
   * Prevent autocomplete on sensitive fields
   */
  disableAutocomplete(element: HTMLInputElement): void {
    element.setAttribute('autocomplete', 'off');
    element.setAttribute('data-form-type', 'other');
  },

  /**
   * Clear form data from memory
   */
  clearFormData(formElement: HTMLFormElement): void {
    const inputs = formElement.querySelectorAll('input, textarea');
    inputs.forEach((input) => {
      (input as HTMLInputElement).value = '';
    });
  },

  /**
   * Detect form field tampering
   */
  detectTampering(
    originalData: Record<string, any>,
    currentData: Record<string, any>,
    protectedFields: string[]
  ): boolean {
    for (const field of protectedFields) {
      if (originalData[field] !== currentData[field]) {
        console.warn('Form tampering detected on field:', field);
        return true;
      }
    }
    return false;
  },
};
