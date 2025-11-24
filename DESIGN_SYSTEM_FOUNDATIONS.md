# Advancia Pay Design System Foundations

## 🎨 Complete Design System for Great User Experience

A comprehensive guide to creating exceptional look, feel, functionality, and usability for Advancia Pay.

---

## 📋 Table of Contents

1. [Design Principles](#design-principles)
2. [Color System](#color-system)
3. [Typography](#typography)
4. [Spacing & Layout](#spacing--layout)
5. [Components](#components)
6. [Animations & Interactions](#animations--interactions)
7. [Accessibility](#accessibility)
8. [Responsive Design](#responsive-design)

---

## 🎯 Design Principles

### 1. Trust First

**Financial apps must build trust immediately**

```tsx
// Visual indicators of security
<SecurityBadge>
  <ShieldIcon />
  <span>Bank-Level Security</span>
  <span className="text-xs">256-bit Encryption</span>
</SecurityBadge>

// Show SSL/HTTPS prominently
<Header>
  <LockIcon className="text-green-500" />
  <span>Secure Connection</span>
</Header>

// Display trust signals
<TrustIndicators>
  <Badge>PCI DSS Compliant</Badge>
  <Badge>SOC 2 Certified</Badge>
  <Badge>GDPR Compliant</Badge>
</TrustIndicators>
```

**Key Principles:**

-   ✅ Always show security status
-   ✅ Use green for secure, red for warnings
-   ✅ Display certifications/compliance badges
-   ✅ Show real-time verification states
-   ✅ Provide clear error messages

### 2. Clarity Over Cleverness

**Make everything obvious and understandable**

```tsx
// ❌ BAD: Confusing
<Button>Submit</Button>

// ✅ GOOD: Clear action
<Button>Send $50.00 to John Smith</Button>

// ❌ BAD: Vague
<StatusBadge>Processing</StatusBadge>

// ✅ GOOD: Specific
<StatusBadge>
  <SpinnerIcon />
  Processing Payment (Est. 2 min)
</StatusBadge>
```

### 3. Feedback First

**Always acknowledge user actions immediately**

```tsx
// Instant feedback on interactions
function TransactionButton() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSubmit = async () => {
    setStatus("loading");
    try {
      await submitTransaction();
      setStatus("success");
      // Show success toast
      toast.success("Transaction completed successfully!");
    } catch (error) {
      setStatus("error");
      toast.error("Transaction failed. Please try again.");
    }
  };

  return (
    <Button
      onClick={handleSubmit}
      disabled={status === "loading"}
      className={`
        ${status === "loading" && "opacity-75 cursor-wait"}
        ${status === "success" && "bg-green-600"}
        ${status === "error" && "bg-red-600"}
      `}
    >
      {status === "loading" && <Spinner />}
      {status === "success" && <CheckIcon />}
      {status === "error" && <ErrorIcon />}
      {status === "idle" && "Send Payment"}
    </Button>
  );
}
```

### 4. Progressive Disclosure

**Don't overwhelm - show information progressively**

```tsx
// Basic info first, details on demand
function TransactionCard({ transaction }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border rounded-lg p-4">
      {/* Always visible */}
      <div className="flex justify-between">
        <div>
          <h3 className="font-semibold">{transaction.recipient}</h3>
          <p className="text-sm text-gray-600">{transaction.date}</p>
        </div>
        <div className="text-right">
          <p className="font-bold text-lg">${transaction.amount}</p>
          <StatusBadge status={transaction.status} />
        </div>
      </div>

      {/* Expandable details */}
      {expanded && (
        <div className="mt-4 pt-4 border-t">
          <DetailRow label="Transaction ID" value={transaction.id} />
          <DetailRow label="Payment Method" value={transaction.method} />
          <DetailRow label="Fee" value={`$${transaction.fee}`} />
          <DetailRow label="Description" value={transaction.description} />
        </div>
      )}

      <button onClick={() => setExpanded(!expanded)} className="mt-2 text-blue-600 text-sm">
        {expanded ? "Show Less" : "Show Details"}
      </button>
    </div>
  );
}
```

---

## 🎨 Color System

### Primary Palette

```typescript
// colors.ts
export const colors = {
  // Primary Brand Colors
  primary: {
    50: "#E6F1FF", // Lightest
    100: "#CCE3FF",
    200: "#99C7FF",
    300: "#66ABFF",
    400: "#338FFF",
    500: "#0073FF", // Main brand color
    600: "#005CCC",
    700: "#004599",
    800: "#002E66",
    900: "#001733", // Darkest
  },

  // Success (Green)
  success: {
    50: "#E6F9F0",
    100: "#CCF3E1",
    500: "#10B981", // Main
    600: "#059669",
    700: "#047857",
  },

  // Warning (Orange/Yellow)
  warning: {
    50: "#FFF9E6",
    100: "#FFF3CC",
    500: "#F59E0B", // Main
    600: "#D97706",
    700: "#B45309",
  },

  // Error (Red)
  error: {
    50: "#FEE2E2",
    100: "#FECACA",
    500: "#EF4444", // Main
    600: "#DC2626",
    700: "#B91C1C",
  },

  // Neutral Grays
  gray: {
    50: "#F9FAFB",
    100: "#F3F4F6",
    200: "#E5E7EB",
    300: "#D1D5DB",
    400: "#9CA3AF",
    500: "#6B7280",
    600: "#4B5563",
    700: "#374151",
    800: "#1F2937",
    900: "#111827",
  },

  // Special Financial Colors
  financial: {
    income: "#10B981", // Green for money in
    expense: "#EF4444", // Red for money out
    pending: "#F59E0B", // Orange for pending
    crypto: "#F7931A", // Bitcoin orange
    fiat: "#4B5563", // Gray for fiat
  },
};
```

### Usage Guidelines

```tsx
// Transaction amounts
function AmountDisplay({ amount, type }: { amount: number; type: "income" | "expense" }) {
  return (
    <span className={`font-bold ${type === "income" ? "text-green-600" : "text-red-600"}`}>
      {type === "income" ? "+" : "-"}${Math.abs(amount).toFixed(2)}
    </span>
  );
}

// Status indicators
function StatusBadge({ status }: { status: "success" | "pending" | "failed" }) {
  const styles = {
    success: "bg-green-100 text-green-800 border-green-300",
    pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
    failed: "bg-red-100 text-red-800 border-red-300",
  };

  return <span className={`px-3 py-1 rounded-full text-sm font-medium border ${styles[status]}`}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>;
}
```

---

## ✍️ Typography

### Font System

```css
/* fonts.css */
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap");

:root {
  /* Font Families */
  --font-primary: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --font-monospace: "SF Mono", Monaco, "Cascadia Code", "Roboto Mono", monospace;

  /* Font Sizes */
  --text-xs: 0.75rem; /* 12px */
  --text-sm: 0.875rem; /* 14px */
  --text-base: 1rem; /* 16px */
  --text-lg: 1.125rem; /* 18px */
  --text-xl: 1.25rem; /* 20px */
  --text-2xl: 1.5rem; /* 24px */
  --text-3xl: 1.875rem; /* 30px */
  --text-4xl: 2.25rem; /* 36px */
  --text-5xl: 3rem; /* 48px */

  /* Font Weights */
  --font-light: 300;
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;
  --font-extrabold: 800;

  /* Line Heights */
  --leading-none: 1;
  --leading-tight: 1.25;
  --leading-normal: 1.5;
  --leading-relaxed: 1.75;
}
```

### Typography Scale

```tsx
// Typography components
export const Typography = {
  // Display (Hero sections)
  Display1: ({ children }) => <h1 className="text-5xl font-extrabold leading-tight tracking-tight">{children}</h1>,

  Display2: ({ children }) => <h2 className="text-4xl font-bold leading-tight tracking-tight">{children}</h2>,

  // Headings
  H1: ({ children }) => <h1 className="text-3xl font-bold leading-tight">{children}</h1>,

  H2: ({ children }) => <h2 className="text-2xl font-semibold leading-tight">{children}</h2>,

  H3: ({ children }) => <h3 className="text-xl font-semibold leading-normal">{children}</h3>,

  H4: ({ children }) => <h4 className="text-lg font-medium leading-normal">{children}</h4>,

  // Body text
  BodyLarge: ({ children }) => <p className="text-lg leading-relaxed">{children}</p>,

  Body: ({ children }) => <p className="text-base leading-normal">{children}</p>,

  BodySmall: ({ children }) => <p className="text-sm leading-normal">{children}</p>,

  // Special
  Caption: ({ children }) => <span className="text-xs text-gray-600 leading-normal">{children}</span>,

  Monospace: ({ children }) => <code className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">{children}</code>,
};

// Usage example
function DashboardHeader() {
  return (
    <div>
      <Typography.H1>Dashboard</Typography.H1>
      <Typography.BodySmall>Welcome back, {user.name}</Typography.BodySmall>
    </div>
  );
}
```

### Number Formatting (Critical for Financial Apps)

```typescript
// formatters.ts
export const formatters = {
  // Currency
  currency: (amount: number, currency = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  },

  // Large numbers (K, M, B)
  compact: (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      notation: "compact",
      compactDisplay: "short",
    }).format(amount);
  },

  // Percentage
  percent: (value: number, decimals = 2) => {
    return `${value.toFixed(decimals)}%`;
  },

  // Crypto (8 decimal places)
  crypto: (amount: number, symbol = "BTC") => {
    return `${amount.toFixed(8)} ${symbol}`;
  },

  // Date/Time
  date: (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  },

  dateTime: (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  },

  // Relative time (2 minutes ago)
  relative: (date: Date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  },
};

// Usage
function TransactionAmount({ amount }) {
  return <div className="font-mono text-2xl font-bold">{formatters.currency(amount)}</div>;
}
```

---

## 📐 Spacing & Layout

### Spacing Scale

```typescript
// spacing.ts
export const spacing = {
  0: "0px",
  1: "0.25rem", // 4px
  2: "0.5rem", // 8px
  3: "0.75rem", // 12px
  4: "1rem", // 16px
  5: "1.25rem", // 20px
  6: "1.5rem", // 24px
  8: "2rem", // 32px
  10: "2.5rem", // 40px
  12: "3rem", // 48px
  16: "4rem", // 64px
  20: "5rem", // 80px
  24: "6rem", // 96px
};

// Usage with Tailwind
// p-4 = 16px padding
// m-6 = 24px margin
// gap-3 = 12px gap
```

### Grid System

```tsx
// Container component
export function Container({ children, size = "default" }) {
  const sizes = {
    sm: "max-w-3xl", // 768px
    default: "max-w-5xl", // 1024px
    lg: "max-w-7xl", // 1280px
    full: "max-w-full",
  };

  return <div className={`mx-auto px-4 sm:px-6 lg:px-8 ${sizes[size]}`}>{children}</div>;
}

// Grid layouts
export function GridLayout({ children, cols = 3 }) {
  const colClasses = {
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
  };

  return <div className={`grid ${colClasses[cols]} gap-6`}>{children}</div>;
}

// Dashboard layout example
function DashboardLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r">
        <Navigation />
      </aside>

      {/* Main content */}
      <main className="ml-64 p-8">
        <Container>{children}</Container>
      </main>
    </div>
  );
}
```

### Card Layouts

```tsx
// Card component system
export function Card({ children, padding = "default", shadow = "default" }) {
  const paddings = {
    sm: "p-3",
    default: "p-6",
    lg: "p-8",
  };

  const shadows = {
    none: "",
    sm: "shadow-sm",
    default: "shadow-md",
    lg: "shadow-lg",
  };

  return <div className={`bg-white rounded-lg border ${paddings[padding]} ${shadows[shadow]}`}>{children}</div>;
}

// Specialized cards
export function StatCard({ title, value, change, icon: Icon }) {
  return (
    <Card>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold">{value}</p>
          {change && (
            <p className={`text-sm mt-2 ${change > 0 ? "text-green-600" : "text-red-600"}`}>
              {change > 0 ? "↑" : "↓"} {Math.abs(change)}%
            </p>
          )}
        </div>
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
          <Icon className="w-6 h-6 text-blue-600" />
        </div>
      </div>
    </Card>
  );
}

// Usage
function Dashboard() {
  return (
    <GridLayout cols={3}>
      <StatCard title="Total Balance" value="$12,543.00" change={12.5} icon={WalletIcon} />
      <StatCard title="This Month" value="$3,250.00" change={-5.2} icon={TrendingUpIcon} />
      <StatCard title="Transactions" value="142" change={8.1} icon={ReceiptIcon} />
    </GridLayout>
  );
}
```

---

## 🧩 Components

### Button System

```tsx
// Button.tsx
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ children, variant = "primary", size = "md", loading = false, icon, fullWidth = false, disabled, className = "", ...props }, ref) => {
  const baseStyles = "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2";

  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 active:bg-blue-800",
    secondary: "bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500 active:bg-gray-800",
    outline: "border-2 border-blue-600 text-blue-600 hover:bg-blue-50 focus:ring-blue-500",
    ghost: "text-gray-700 hover:bg-gray-100 focus:ring-gray-500",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 active:bg-red-800",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm gap-1.5",
    md: "px-4 py-2 text-base gap-2",
    lg: "px-6 py-3 text-lg gap-2.5",
  };

  const disabledStyles = "opacity-50 cursor-not-allowed";

  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`
          ${baseStyles}
          ${variants[variant]}
          ${sizes[size]}
          ${fullWidth ? "w-full" : ""}
          ${disabled || loading ? disabledStyles : ""}
          ${className}
        `}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {!loading && icon && icon}
      {children}
    </button>
  );
});

// Usage examples
function ButtonExamples() {
  return (
    <div className="space-y-4">
      <Button variant="primary">Primary Button</Button>
      <Button variant="secondary">Secondary Button</Button>
      <Button variant="outline">Outline Button</Button>
      <Button variant="danger">Delete Account</Button>
      <Button loading>Processing...</Button>
      <Button icon={<PlusIcon />}>Add Item</Button>
      <Button size="sm">Small</Button>
      <Button size="lg">Large</Button>
      <Button fullWidth>Full Width</Button>
    </div>
  );
}
```

### Input System

```tsx
// Input.tsx
import { InputHTMLAttributes, forwardRef, useState } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
  icon?: React.ReactNode;
  endIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ label, error, helper, icon, endIcon, className = "", ...props }, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</div>}

        <input
          ref={ref}
          className={`
              w-full px-4 py-2 border rounded-lg
              ${icon ? "pl-10" : ""}
              ${endIcon ? "pr-10" : ""}
              ${error ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"}
              focus:outline-none focus:ring-2 focus:border-transparent
              disabled:bg-gray-100 disabled:cursor-not-allowed
              transition-colors duration-200
              ${className}
            `}
          {...props}
        />

        {endIcon && <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">{endIcon}</div>}
      </div>

      {error && (
        <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
          <ErrorIcon className="w-4 h-4" />
          {error}
        </p>
      )}

      {helper && !error && <p className="mt-1 text-sm text-gray-500">{helper}</p>}
    </div>
  );
});

// Specialized inputs
export function CurrencyInput({ value, onChange, ...props }) {
  return <Input type="number" step="0.01" icon={<span className="font-medium">$</span>} value={value} onChange={onChange} placeholder="0.00" {...props} />;
}

export function SearchInput({ onSearch, ...props }) {
  return <Input type="search" icon={<SearchIcon className="w-5 h-5" />} placeholder="Search..." onChange={(e) => onSearch?.(e.target.value)} {...props} />;
}

export function PasswordInput({ ...props }) {
  const [visible, setVisible] = useState(false);

  return (
    <Input
      type={visible ? "text" : "password"}
      endIcon={
        <button type="button" onClick={() => setVisible(!visible)} className="hover:text-gray-600">
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      }
      {...props}
    />
  );
}
```

---

## ✨ Animations & Interactions

### Micro-interactions

```tsx
// Hover effects
const hoverEffects = {
  lift: "hover:scale-105 hover:shadow-lg transition-all duration-200",
  glow: "hover:shadow-xl hover:shadow-blue-500/50 transition-shadow duration-300",
  slide: "hover:translate-x-1 transition-transform duration-200",
  rotate: "hover:rotate-3 transition-transform duration-200",
};

// Loading states
export function LoadingSpinner({ size = "md" }) {
  const sizes = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  return (
    <div className={`${sizes[size]} animate-spin`}>
      <svg className="text-blue-600" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
    </div>
  );
}

// Skeleton loading
export function SkeletonLoader() {
  return (
    <div className="animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
    </div>
  );
}

// Success animation
export function SuccessCheckmark() {
  return (
    <div className="relative w-16 h-16">
      <svg className="checkmark" viewBox="0 0 52 52">
        <circle className="checkmark__circle" cx="26" cy="26" r="25" fill="none" stroke="#10B981" strokeWidth="2" />
        <path className="checkmark__check" fill="none" stroke="#10B981" strokeWidth="3" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
      </svg>

      <style jsx>{`
        .checkmark__circle {
          stroke-dasharray: 166;
          stroke-dashoffset: 166;
          animation: stroke 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
        }
        .checkmark__check {
          stroke-dasharray: 48;
          stroke-dashoffset: 48;
          animation: stroke 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.6s forwards;
        }
        @keyframes stroke {
          100% {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </div>
  );
}

// Ripple effect (Material Design style)
export function RippleButton({ children, onClick }) {
  const [ripples, setRipples] = useState([]);

  const handleClick = (e) => {
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const ripple = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      id: Date.now(),
    };

    setRipples([...ripples, ripple]);
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== ripple.id));
    }, 600);

    onClick?.(e);
  };

  return (
    <button className="relative overflow-hidden px-6 py-3 bg-blue-600 text-white rounded-lg" onClick={handleClick}>
      {children}
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="absolute bg-white rounded-full animate-ping opacity-75"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: 20,
            height: 20,
            transform: "translate(-50%, -50%)",
          }}
        />
      ))}
    </button>
  );
}
```

### Page Transitions

```tsx
// Using Framer Motion
import { motion, AnimatePresence } from "framer-motion";

// Fade transition
export function FadeIn({ children, delay = 0 }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3, delay }}>
      {children}
    </motion.div>
  );
}

// Slide up transition
export function SlideUp({ children, delay = 0 }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4, delay }}>
      {children}
    </motion.div>
  );
}

// Stagger children
export function StaggerContainer({ children }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0 },
        show: {
          opacity: 1,
          transition: {
            staggerChildren: 0.1,
          },
        },
      }}
      initial="hidden"
      animate="show"
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 },
      }}
    >
      {children}
    </motion.div>
  );
}

// Usage
function TransactionList({ transactions }) {
  return (
    <StaggerContainer>
      {transactions.map((transaction) => (
        <StaggerItem key={transaction.id}>
          <TransactionCard transaction={transaction} />
        </StaggerItem>
      ))}
    </StaggerContainer>
  );
}
```

---

## ♿ Accessibility (A11y)

### WCAG 2.1 AA Compliance

```tsx
// Skip to main content
export function SkipToContent() {
  return (
    <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded">
      Skip to main content
    </a>
  );
}

// Accessible button
export function AccessibleButton({ children, ariaLabel, ...props }) {
  return (
    <button aria-label={ariaLabel} className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2" {...props}>
      {children}
    </button>
  );
}

// Screen reader only text
export function ScreenReaderOnly({ children }) {
  return <span className="sr-only">{children}</span>;
}

// Accessible form
export function AccessibleForm() {
  return (
    <form aria-labelledby="form-title">
      <h2 id="form-title">Login Form</h2>

      <div>
        <label htmlFor="email">Email Address</label>
        <input id="email" type="email" aria-required="true" aria-describedby="email-hint" />
        <p id="email-hint" className="text-sm text-gray-600">
          We'll never share your email
        </p>
      </div>

      <div>
        <label htmlFor="password">Password</label>
        <input id="password" type="password" aria-required="true" aria-invalid={hasError} aria-describedby="password-error" />
        {hasError && (
          <p id="password-error" role="alert" className="text-red-600">
            Password must be at least 8 characters
          </p>
        )}
      </div>

      <button type="submit" aria-busy={isSubmitting}>
        {isSubmitting ? "Logging in..." : "Log In"}
      </button>
    </form>
  );
}

// Keyboard navigation
export function KeyboardNavigable({ items, onSelect }) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const handleKeyDown = (e) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, items.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        onSelect(items[selectedIndex]);
        break;
    }
  };

  return (
    <div role="listbox" tabIndex={0} onKeyDown={handleKeyDown} aria-activedescendant={`item-${selectedIndex}`}>
      {items.map((item, index) => (
        <div key={item.id} id={`item-${index}`} role="option" aria-selected={index === selectedIndex} className={index === selectedIndex ? "bg-blue-100" : ""}>
          {item.label}
        </div>
      ))}
    </div>
  );
}
```

### Color Contrast

```typescript
// Ensure WCAG AA compliance (4.5:1 for normal text, 3:1 for large text)
export const accessibleColors = {
  // ✅ GOOD: High contrast
  goodContrast: [
    { bg: "#FFFFFF", text: "#000000" }, // 21:1
    { bg: "#0073FF", text: "#FFFFFF" }, // 4.53:1
    { bg: "#10B981", text: "#FFFFFF" }, // 3.04:1 (large text only)
  ],

  // ❌ BAD: Low contrast
  badContrast: [
    { bg: "#FFFFFF", text: "#CCCCCC" }, // 1.6:1 - FAILS
    { bg: "#F0F0F0", text: "#FFFFFF" }, // 1.1:1 - FAILS
  ],
};
```

---

## 📱 Responsive Design

### Breakpoints

```typescript
// tailwind.config.js
module.exports = {
  theme: {
    screens: {
      sm: "640px", // Mobile landscape
      md: "768px", // Tablet
      lg: "1024px", // Desktop
      xl: "1280px", // Large desktop
      "2xl": "1536px", // Extra large
    },
  },
};

// Usage
<div
  className="
  px-4           /* Mobile: 16px padding */
  sm:px-6        /* Tablet: 24px padding */
  lg:px-8        /* Desktop: 32px padding */

  text-base      /* Mobile: 16px */
  lg:text-lg     /* Desktop: 18px */

  grid-cols-1    /* Mobile: 1 column */
  md:grid-cols-2 /* Tablet: 2 columns */
  lg:grid-cols-3 /* Desktop: 3 columns */
"
>
  Content
</div>;
```

### Mobile-First Approach

```tsx
// Responsive navigation
export function ResponsiveNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Logo className="h-8 w-auto" />
          </div>

          {/* Desktop menu */}
          <div className="hidden md:flex items-center space-x-8">
            <NavLink href="/dashboard">Dashboard</NavLink>
            <NavLink href="/transactions">Transactions</NavLink>
            <NavLink href="/settings">Settings</NavLink>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2" aria-label="Toggle menu">
              {mobileMenuOpen ? <XIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <MobileNavLink href="/dashboard">Dashboard</MobileNavLink>
            <MobileNavLink href="/transactions">Transactions</MobileNavLink>
            <MobileNavLink href="/settings">Settings</MobileNavLink>
          </div>
        </div>
      )}
    </nav>
  );
}

// Responsive cards
export function ResponsiveCard() {
  return (
    <div
      className="
      /* Mobile: Full width, small padding */
      w-full p-4
      
      /* Tablet: Half width, medium padding */
      sm:w-1/2 sm:p-6
      
      /* Desktop: Third width, large padding */
      lg:w-1/3 lg:p-8
    "
    >
      Card content
    </div>
  );
}

// Responsive typography
export function ResponsiveHeading() {
  return (
    <h1
      className="
      text-2xl      /* Mobile: 24px */
      sm:text-3xl   /* Tablet: 30px */
      lg:text-4xl   /* Desktop: 36px */
      font-bold
      leading-tight
    "
    >
      Responsive Heading
    </h1>
  );
}
```

### Touch-Friendly Mobile Design

```tsx
// Minimum touch target: 44x44px (Apple HIG) or 48x48px (Material Design)
export function TouchFriendlyButton() {
  return (
    <button
      className="
      min-h-[44px]      /* Minimum height */
      min-w-[44px]      /* Minimum width */
      px-6 py-3         /* Comfortable padding */
      text-lg           /* Larger text on mobile */
      active:scale-95   /* Tactile feedback */
      transition-transform
    "
    >
      Tap Me
    </button>
  );
}

// Mobile-optimized input
export function MobileInput() {
  return (
    <input
      type="text"
      className="
        w-full
        h-12              /* Taller for easier tapping */
        px-4              /* More horizontal padding */
        text-base         /* At least 16px to prevent zoom on iOS */
        border-2          /* Thicker border */
        rounded-lg
      "
      inputMode="numeric" /* Show number keyboard on mobile */
    />
  );
}

// Swipe actions
export function SwipeableCard() {
  const [swipeDistance, setSwipeDistance] = useState(0);

  return (
    <div className="relative overflow-hidden" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
      {/* Background actions (revealed on swipe) */}
      <div className="absolute inset-y-0 right-0 flex items-center bg-red-600 text-white px-4">
        <TrashIcon />
        <span className="ml-2">Delete</span>
      </div>

      {/* Main content */}
      <div className="bg-white p-4 transition-transform" style={{ transform: `translateX(${swipeDistance}px)` }}>
        Card content
      </div>
    </div>
  );
}
```

---

**🎉 You now have a complete design system foundation for Advancia Pay!**

Next: Review `UX_EXPERIENCE_GUIDE.md` for user flow patterns and usability best practices.
