# Form Security Implementation Guide

## 🔒 Complete Form Security System for Advancia Pay

Comprehensive protection for all forms including login, registration, transactions, and more.

---

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Frontend Security](#frontend-security)
3. [Backend Security](#backend-security)
4. [Complete Examples](#complete-examples)
5. [Security Features](#security-features)
6. [Testing](#testing)

---

## 🚀 Quick Start

### Step 1: Install Dependencies

```bash
# Frontend
cd frontend
npm install crypto-js
npm install --save-dev @types/crypto-js

# Backend
cd backend
npm install express-validator express-rate-limit
```

### Step 2: Frontend Setup

```tsx
// app/page.tsx or any form page
import { useSecureForm } from "@/hooks/useSecureForm";

function MyForm() {
  const { values, errors, isSubmitting, handleChange, handleSubmit } = useSecureForm(
    async (data) => {
      const response = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return response.json();
    },
    {
      formId: "my-form",
      validationRules: {
        email: { required: true, email: true },
        password: { required: true, minLength: 8 },
      },
      enableCSRF: true,
      enableRateLimit: true,
      sanitizeInputs: true,
    },
  );

  return (
    <form onSubmit={handleSubmit}>
      <input type="email" value={values.email || ""} onChange={(e) => handleChange("email", e.target.value)} />
      {errors.email && <span>{errors.email}</span>}

      <button type="submit" disabled={isSubmitting}>
        Submit
      </button>
    </form>
  );
}
```

### Step 3: Backend Setup

```typescript
// backend/src/routes/myRoute.ts
import { Router } from "express";
import { loginValidation, formRateLimiter, CSRFProtection, sanitizeBody } from "../middleware/formValidation";

const router = Router();

router.post(
  "/login",
  formRateLimiter, // Rate limiting
  sanitizeBody, // Input sanitization
  CSRFProtection.middleware(), // CSRF verification
  loginValidation, // Field validation
  async (req, res) => {
    // Your login logic here
    res.json({ success: true });
  },
);

export default router;
```

---

## 🛡️ Frontend Security

### 1. Using useSecureForm Hook

```tsx
import { useSecureForm } from "@/hooks/useSecureForm";

function LoginForm() {
  const {
    values, // Form values
    errors, // Validation errors
    isSubmitting, // Submit state
    handleChange, // Input change handler
    handleSubmit, // Form submit handler
    validateField, // Validate single field
    validateAll, // Validate all fields
    reset, // Reset form
    isRateLimited, // Check rate limit
    getRemainingAttempts, // Get remaining attempts
  } = useSecureForm(
    async (data) => {
      // Your submit logic
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return response.json();
    },
    {
      formId: "login-form",
      validationRules: {
        email: {
          required: true,
          email: true,
        },
        password: {
          required: true,
          minLength: 8,
          custom: (value) => {
            // Custom validation
            if (!/[A-Z]/.test(value)) {
              return "Password must contain uppercase letter";
            }
            return true;
          },
        },
      },
      encryptFields: ["password"], // Encrypt before sending
      enableCSRF: true, // Add CSRF token
      enableRateLimit: true, // Client-side rate limit
      sanitizeInputs: true, // Sanitize inputs
      onSuccess: (result) => {
        console.log("Success:", result);
      },
      onError: (error) => {
        console.error("Error:", error);
      },
    },
  );

  return (
    <form onSubmit={handleSubmit}>
      {/* Email field */}
      <input
        type="email"
        value={values.email || ""}
        onChange={(e) => handleChange("email", e.target.value, true)}
        // Third parameter: enable real-time validation
      />
      {errors.email && <span className="error">{errors.email}</span>}

      {/* Password field */}
      <input type="password" value={values.password || ""} onChange={(e) => handleChange("password", e.target.value, true)} />
      {errors.password && <span className="error">{errors.password}</span>}

      {/* Submit button */}
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Submitting..." : "Login"}
      </button>

      {/* Rate limit indicator */}
      {getRemainingAttempts() < 3 && <p>⚠️ {getRemainingAttempts()} attempts remaining</p>}
    </form>
  );
}
```

### 2. Validation Rules

```typescript
const validationRules = {
  // Required field
  username: {
    required: true,
  },

  // Email validation
  email: {
    required: true,
    email: true,
  },

  // Length validation
  name: {
    required: true,
    minLength: 2,
    maxLength: 100,
  },

  // Pattern validation
  zipCode: {
    pattern: /^\d{5}$/,
    required: true,
  },

  // Numeric validation
  age: {
    min: 18,
    max: 120,
    required: true,
  },

  // URL validation
  website: {
    url: true,
  },

  // Phone validation
  phone: {
    phone: true,
  },

  // Custom validation
  confirmPassword: {
    custom: (value, allValues) => {
      if (value !== allValues.password) {
        return "Passwords do not match";
      }
      return true;
    },
  },
};
```

### 3. Password Strength Indicator

```tsx
import { usePasswordStrength } from "@/hooks/useSecureForm";

function PasswordField() {
  const [password, setPassword] = useState("");
  const { strength, message, isValid } = usePasswordStrength(password);

  return (
    <div>
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />

      {/* Strength indicator */}
      <div className="strength-bar">
        <div className={`fill strength-${strength}`} />
      </div>

      <p className={`strength-${strength}`}>{message}</p>
    </div>
  );
}
```

### 4. Field Encryption

```tsx
import { FieldEncryption } from "@/lib/formSecurity";

// Encrypt before storing
const encrypted = FieldEncryption.encrypt(sensitiveData);

// Decrypt when needed
const decrypted = FieldEncryption.decrypt(encrypted);

// Encrypt specific fields
const formData = {
  email: "user@example.com",
  ssn: "123-45-6789",
  creditCard: "4111111111111111",
};

const encrypted = FieldEncryption.encryptFields(formData, ["ssn", "creditCard"]);
// Only ssn and creditCard are encrypted
```

---

## 🔐 Backend Security

### 1. Validation Middleware

```typescript
// Use pre-built validations
import { loginValidation, registrationValidation, transactionValidation, contactFormValidation } from "../middleware/formValidation";

// Login endpoint
router.post("/login", loginValidation, async (req, res) => {
  // req.body is now validated
  const { email, password } = req.body;
});

// Custom validation
import { ValidationRules, createValidation } from "../middleware/formValidation";

const customValidation = createValidation([ValidationRules.email(), ValidationRules.name("firstName"), ValidationRules.amount(), body("customField").trim().isLength({ min: 5 }).withMessage("Custom field must be at least 5 characters")]);

router.post("/custom", customValidation, async (req, res) => {
  // Handle validated data
});
```

### 2. CSRF Protection

```typescript
import { CSRFProtection } from "../middleware/formValidation";

// Generate token endpoint
router.get("/csrf-token", CSRFProtection.getTokenHandler());

// Protect routes
router.post("/sensitive-action", CSRFProtection.middleware(), async (req, res) => {
  // CSRF token is verified
  res.json({ success: true });
});
```

### 3. Rate Limiting

```typescript
import { formRateLimiter, strictRateLimiter } from "../middleware/formValidation";

// Standard rate limit (5 requests/minute)
router.post("/login", formRateLimiter, async (req, res) => {
  // ...
});

// Strict rate limit (3 requests/15 minutes)
router.post("/reset-password", strictRateLimiter, async (req, res) => {
  // ...
});

// Custom rate limit
import rateLimit from "express-rate-limit";

const customLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // 10 requests
  message: "Too many requests",
});

router.post("/api/endpoint", customLimiter, async (req, res) => {
  // ...
});
```

### 4. Input Sanitization

```typescript
import { sanitizeBody } from "../middleware/formValidation";

// Sanitize all inputs
router.post("/submit", sanitizeBody, async (req, res) => {
  // req.body is sanitized (null bytes removed, etc.)
});
```

### 5. File Upload Validation

```typescript
import { validateFileUpload } from "../middleware/formValidation";
import multer from "multer";

const upload = multer({ dest: "uploads/" });

router.post(
  "/upload",
  upload.single("file"),
  validateFileUpload(
    ["image/jpeg", "image/png", "application/pdf"], // Allowed types
    5 * 1024 * 1024, // 5MB max size
  ),
  async (req, res) => {
    // File is validated
    const file = req.file;
    res.json({ success: true, filename: file.filename });
  },
);
```

### 6. Complete Protected Endpoint

```typescript
import { Router } from "express";
import { loginValidation, formRateLimiter, CSRFProtection, sanitizeBody, formSecurityHeaders, validateHoneypot } from "../middleware/formValidation";
import { authenticateToken } from "../middleware/auth";

const router = Router();

router.post(
  "/protected-form",
  formSecurityHeaders, // Security headers
  formRateLimiter, // Rate limiting
  sanitizeBody, // Input sanitization
  validateHoneypot("website"), // Bot detection
  CSRFProtection.middleware(), // CSRF protection
  loginValidation, // Field validation
  authenticateToken, // Authentication (if needed)
  async (req, res) => {
    // All security checks passed!
    try {
      const result = await processForm(req.body);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },
);

export default router;
```

---

## 🎯 Complete Examples

### Example 1: Secure Registration Form

```tsx
"use client";

import { useSecureForm } from "@/hooks/useSecureForm";
import axios from "axios";

export default function RegistrationForm() {
  const { values, errors, isSubmitting, handleChange, handleSubmit } = useSecureForm(
    async (data) => {
      const response = await axios.post("/api/auth/register", data);
      return response.data;
    },
    {
      formId: "registration-form",
      validationRules: {
        firstName: { required: true, minLength: 2, maxLength: 50 },
        lastName: { required: true, minLength: 2, maxLength: 50 },
        email: { required: true, email: true },
        password: { required: true, minLength: 8 },
        confirmPassword: {
          required: true,
          custom: (value) => value === values.password || "Passwords must match",
        },
        terms: { required: true },
      },
      encryptFields: ["password", "confirmPassword"],
      enableCSRF: true,
      sanitizeInputs: true,
      onSuccess: () => {
        alert("Registration successful!");
      },
    },
  );

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Create Account</h2>

      {/* First Name */}
      <div className="mb-4">
        <label className="block mb-2">First Name</label>
        <input type="text" value={values.firstName || ""} onChange={(e) => handleChange("firstName", e.target.value, true)} className="w-full px-4 py-2 border rounded" />
        {errors.firstName && <p className="text-red-600 text-sm">{errors.firstName}</p>}
      </div>

      {/* Last Name */}
      <div className="mb-4">
        <label className="block mb-2">Last Name</label>
        <input type="text" value={values.lastName || ""} onChange={(e) => handleChange("lastName", e.target.value, true)} className="w-full px-4 py-2 border rounded" />
        {errors.lastName && <p className="text-red-600 text-sm">{errors.lastName}</p>}
      </div>

      {/* Email */}
      <div className="mb-4">
        <label className="block mb-2">Email</label>
        <input type="email" value={values.email || ""} onChange={(e) => handleChange("email", e.target.value, true)} className="w-full px-4 py-2 border rounded" />
        {errors.email && <p className="text-red-600 text-sm">{errors.email}</p>}
      </div>

      {/* Password */}
      <div className="mb-4">
        <label className="block mb-2">Password</label>
        <input type="password" value={values.password || ""} onChange={(e) => handleChange("password", e.target.value, true)} className="w-full px-4 py-2 border rounded" />
        {errors.password && <p className="text-red-600 text-sm">{errors.password}</p>}
      </div>

      {/* Confirm Password */}
      <div className="mb-4">
        <label className="block mb-2">Confirm Password</label>
        <input type="password" value={values.confirmPassword || ""} onChange={(e) => handleChange("confirmPassword", e.target.value, true)} className="w-full px-4 py-2 border rounded" />
        {errors.confirmPassword && <p className="text-red-600 text-sm">{errors.confirmPassword}</p>}
      </div>

      {/* Terms */}
      <div className="mb-6">
        <label className="flex items-center">
          <input type="checkbox" checked={values.terms || false} onChange={(e) => handleChange("terms", e.target.checked)} className="mr-2" />I agree to the Terms and Conditions
        </label>
        {errors.terms && <p className="text-red-600 text-sm">{errors.terms}</p>}
      </div>

      <button type="submit" disabled={isSubmitting} className="w-full py-3 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400">
        {isSubmitting ? "Creating Account..." : "Sign Up"}
      </button>
    </form>
  );
}
```

### Example 2: Transaction Form with Amount Validation

```tsx
import { useSecureForm } from "@/hooks/useSecureForm";

export default function TransactionForm() {
  const { values, errors, isSubmitting, handleChange, handleSubmit } = useSecureForm(
    async (data) => {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return response.json();
    },
    {
      formId: "transaction-form",
      validationRules: {
        amount: {
          required: true,
          min: 0.01,
          max: 10000,
          custom: (value) => {
            const num = parseFloat(value);
            if (isNaN(num)) return "Invalid amount";
            if (num % 0.01 !== 0) return "Amount must have max 2 decimal places";
            return true;
          },
        },
        description: { required: true, minLength: 5, maxLength: 200 },
        type: { required: true },
      },
      enableCSRF: true,
      sanitizeInputs: true,
    },
  );

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
        <label>Amount ($)</label>
        <input type="number" step="0.01" value={values.amount || ""} onChange={(e) => handleChange("amount", e.target.value, true)} className="w-full px-4 py-2 border rounded" />
        {errors.amount && <p className="text-red-600">{errors.amount}</p>}
      </div>

      <div className="mb-4">
        <label>Description</label>
        <textarea value={values.description || ""} onChange={(e) => handleChange("description", e.target.value, true)} className="w-full px-4 py-2 border rounded" />
        {errors.description && <p className="text-red-600">{errors.description}</p>}
      </div>

      <div className="mb-4">
        <label>Type</label>
        <select value={values.type || ""} onChange={(e) => handleChange("type", e.target.value)} className="w-full px-4 py-2 border rounded">
          <option value="">Select...</option>
          <option value="credit">Credit</option>
          <option value="debit">Debit</option>
        </select>
        {errors.type && <p className="text-red-600">{errors.type}</p>}
      </div>

      <button type="submit" disabled={isSubmitting} className="w-full py-2 bg-green-600 text-white rounded">
        {isSubmitting ? "Processing..." : "Submit Transaction"}
      </button>
    </form>
  );
}
```

---

## ✅ Security Checklist

Before deploying:

-   [ ] Install crypto-js for frontend encryption
-   [ ] Install express-validator and express-rate-limit for backend
-   [ ] Enable CSRF protection on all POST/PUT/DELETE routes
-   [ ] Add rate limiting to all form endpoints
-   [ ] Validate all inputs on both client and server
-   [ ] Sanitize all user inputs
-   [ ] Encrypt sensitive fields (passwords, SSN, credit cards)
-   [ ] Add honeypot fields to detect bots
-   [ ] Implement proper error messages (don't leak info)
-   [ ] Test all validation rules
-   [ ] Test rate limiting
-   [ ] Test CSRF protection
-   [ ] Add security headers
-   [ ] Enable HTTPS in production
-   [ ] Monitor for suspicious activity

---

**🎉 Your forms are now fully secured with enterprise-grade protection!**
