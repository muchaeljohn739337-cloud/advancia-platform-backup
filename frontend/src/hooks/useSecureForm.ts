/**
 * React Hook for Secure Forms
 *
 * Provides easy-to-use form security with validation, encryption, and protection
 */

import {
  CSRFProtection,
  FormRateLimiter,
  FormValidator,
  SecureFormHandler,
  ValidationRule,
} from '@/lib/formSecurity';
import { useCallback, useRef, useState } from 'react';

export interface UseSecureFormOptions {
  formId: string;
  validationRules?: Record<string, ValidationRule>;
  encryptFields?: string[];
  enableCSRF?: boolean;
  enableRateLimit?: boolean;
  sanitizeInputs?: boolean;
  onSuccess?: (result: any) => void;
  onError?: (error: any) => void;
}

export function useSecureForm(
  submitHandler: (data: Record<string, any>) => Promise<any>,
  options: UseSecureFormOptions
) {
  const [values, setValues] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitCount, setSubmitCount] = useState(0);
  const formHandlerRef = useRef<SecureFormHandler | null>(null);

  // Initialize form handler
  if (!formHandlerRef.current) {
    formHandlerRef.current = new SecureFormHandler({
      ...options,
      onSubmit: submitHandler,
    });
  }

  /**
   * Handle input change with validation
   */
  const handleChange = useCallback(
    (name: string, value: any, validate: boolean = false) => {
      setValues((prev) => ({ ...prev, [name]: value }));

      // Clear error when user types
      if (errors[name]) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }

      // Real-time validation if enabled
      if (validate && options.validationRules?.[name]) {
        const error = FormValidator.validateField(name, value, options.validationRules[name]);

        if (error) {
          setErrors((prev) => ({ ...prev, [name]: error }));
        }
      }
    },
    [errors, options.validationRules]
  );

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      if (e) {
        e.preventDefault();
      }

      setIsSubmitting(true);
      setErrors({});

      try {
        const result = await formHandlerRef.current!.submit(values);

        if (result.success) {
          setSubmitCount((prev) => prev + 1);

          // Clear form on success
          setValues({});

          if (options.onSuccess) {
            options.onSuccess(result.data);
          }
        } else {
          if (result.errors) {
            setErrors(result.errors);
          }

          if (result.message) {
            // Show error message
            if (options.onError) {
              options.onError(new Error(result.message));
            }
          }
        }

        return result;
      } finally {
        setIsSubmitting(false);
      }
    },
    [values, options]
  );

  /**
   * Validate single field
   */
  const validateField = useCallback(
    (name: string): boolean => {
      if (!options.validationRules?.[name]) {
        return true;
      }

      const error = FormValidator.validateField(name, values[name], options.validationRules[name]);

      if (error) {
        setErrors((prev) => ({ ...prev, [name]: error }));
        return false;
      }

      return true;
    },
    [values, options.validationRules]
  );

  /**
   * Validate all fields
   */
  const validateAll = useCallback((): boolean => {
    if (!options.validationRules) {
      return true;
    }

    const validation = FormValidator.validate(values, options.validationRules);
    setErrors(validation.errors);
    return validation.valid;
  }, [values, options.validationRules]);

  /**
   * Reset form
   */
  const reset = useCallback(() => {
    setValues({});
    setErrors({});
    setIsSubmitting(false);
    formHandlerRef.current?.reset();
  }, []);

  /**
   * Set field value
   */
  const setValue = useCallback((name: string, value: any) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  }, []);

  /**
   * Set multiple values
   */
  const setFieldValues = useCallback((newValues: Record<string, any>) => {
    setValues((prev) => ({ ...prev, ...newValues }));
  }, []);

  /**
   * Get CSRF token
   */
  const getCsrfToken = useCallback(() => {
    return CSRFProtection.getToken();
  }, []);

  /**
   * Check if rate limited
   */
  const isRateLimited = useCallback(() => {
    return FormRateLimiter.isRateLimited(options.formId);
  }, [options.formId]);

  /**
   * Get remaining attempts
   */
  const getRemainingAttempts = useCallback(() => {
    return FormRateLimiter.getRemainingAttempts(options.formId);
  }, [options.formId]);

  return {
    // State
    values,
    errors,
    isSubmitting,
    submitCount,

    // Handlers
    handleChange,
    handleSubmit,
    setValue,
    setFieldValues,
    reset,

    // Validation
    validateField,
    validateAll,

    // Security
    getCsrfToken,
    isRateLimited,
    getRemainingAttempts,

    // Helpers
    hasErrors: Object.keys(errors).length > 0,
    isValid: Object.keys(errors).length === 0 && Object.keys(values).length > 0,
  };
}

/**
 * Hook for password strength validation
 */
export function usePasswordStrength(password: string) {
  const [strength, setStrength] = useState<'weak' | 'medium' | 'strong'>('weak');
  const [message, setMessage] = useState('');
  const [isValid, setIsValid] = useState(false);

  const validate = useCallback(() => {
    const result = FormValidator.validatePassword(password);
    setStrength(result.strength);
    setMessage(result.message);
    setIsValid(result.valid);
  }, [password]);

  // Validate on password change
  if (password) {
    validate();
  }

  return { strength, message, isValid };
}

/**
 * Hook for form field encryption
 */
export function useFieldEncryption() {
  const encrypt = useCallback((value: string) => {
    return window.btoa(value); // Simple encoding (use crypto-js for production)
  }, []);

  const decrypt = useCallback((encrypted: string) => {
    try {
      return window.atob(encrypted);
    } catch {
      return encrypted;
    }
  }, []);

  return { encrypt, decrypt };
}
