# User Experience & Usability Guide

## 🎯 Creating Great UX for Advancia Pay

Complete guide to user flows, usability patterns, and creating delightful experiences.

---

## 📋 Table of Contents

1. [UX Principles](#ux-principles)
2. [User Flows](#user-flows)
3. [Navigation Patterns](#navigation-patterns)
4. [Form UX](#form-ux)
5. [Error Handling](#error-handling)
6. [Loading States](#loading-states)
7. [Empty States](#empty-states)
8. [Onboarding](#onboarding)

---

## 🎯 UX Principles

### 1. Don't Make Users Think

**Every action should be obvious**

```tsx
// ❌ BAD: Unclear action
<button>Submit</button>

// ✅ GOOD: Clear, specific action
<button>Send $50.00 to John Smith</button>

// ❌ BAD: Technical jargon
<p>Transaction hash: 0x742d35Cc6...</p>

// ✅ GOOD: User-friendly
<p>
  Payment confirmed
  <span className="text-xs text-gray-500">
    (Confirmation #12345)
  </span>
</p>
```

### 2. Provide Instant Feedback

**Users should never wonder if something worked**

```tsx
function SendMoneyButton() {
  const [status, setStatus] = useState("idle");

  const handleSend = async () => {
    // Immediate visual feedback
    setStatus("sending");

    try {
      await sendMoney();

      // Success feedback
      setStatus("success");
      toast.success("Money sent successfully!");
      confetti(); // Celebrate success!
    } catch (error) {
      // Error feedback
      setStatus("error");
      toast.error("Failed to send. Please try again.");
      vibrate(); // Haptic feedback
    }
  };

  return (
    <Button onClick={handleSend} disabled={status === "sending"} className={status === "success" ? "bg-green-600" : status === "error" ? "bg-red-600" : "bg-blue-600"}>
      {status === "idle" && "Send Money"}
      {status === "sending" && (
        <>
          <Spinner /> Sending...
        </>
      )}
      {status === "success" && (
        <>
          <CheckIcon /> Sent!
        </>
      )}
      {status === "error" && (
        <>
          <ErrorIcon /> Failed
        </>
      )}
    </Button>
  );
}
```

### 3. Reduce Cognitive Load

**Minimize the number of decisions and inputs**

```tsx
// ❌ BAD: Too many fields, all at once
function BadRegistrationForm() {
  return (
    <form>
      <Input label="First Name" />
      <Input label="Last Name" />
      <Input label="Email" />
      <Input label="Phone" />
      <Input label="Password" />
      <Input label="Confirm Password" />
      <Input label="Date of Birth" />
      <Input label="Address Line 1" />
      <Input label="Address Line 2" />
      <Input label="City" />
      <Input label="State" />
      <Input label="Zip Code" />
      <Input label="Country" />
      <button>Register</button>
    </form>
  );
}

// ✅ GOOD: Multi-step, progressive disclosure
function GoodRegistrationFlow() {
  const [step, setStep] = useState(1);

  return (
    <div>
      {/* Progress indicator */}
      <StepIndicator current={step} total={3} />

      {step === 1 && (
        <div>
          <h2>Create Account</h2>
          <Input label="Email" />
          <Input label="Password" />
          <Button onClick={() => setStep(2)}>Continue</Button>
        </div>
      )}

      {step === 2 && (
        <div>
          <h2>Personal Info</h2>
          <Input label="First Name" />
          <Input label="Last Name" />
          <Input label="Phone" />
          <Button onClick={() => setStep(3)}>Continue</Button>
        </div>
      )}

      {step === 3 && (
        <div>
          <h2>Verify Identity</h2>
          <p>We'll send a code to your email</p>
          <Button onClick={handleSubmit}>Send Code</Button>
        </div>
      )}
    </div>
  );
}
```

### 4. Forgiving & Helpful

**Prevent errors, and when they happen, help users recover**

```tsx
// Smart input formatting
function PhoneInput({ value, onChange }) {
  const formatPhone = (input: string) => {
    // Remove non-digits
    const digits = input.replace(/\D/g, "");

    // Format as (123) 456-7890
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  };

  return <Input value={formatPhone(value)} onChange={(e) => onChange(e.target.value)} placeholder="(555) 123-4567" maxLength={14} />;
}

// Undo functionality
function DeleteWithUndo({ onDelete }) {
  const [deleted, setDeleted] = useState(false);

  const handleDelete = () => {
    setDeleted(true);

    // Show undo toast
    const undoToast = toast(
      (t) => (
        <div>
          <p>Transaction deleted</p>
          <Button
            size="sm"
            onClick={() => {
              setDeleted(false);
              toast.dismiss(t.id);
            }}
          >
            Undo
          </Button>
        </div>
      ),
      { duration: 5000 },
    );

    // Actually delete after 5 seconds
    setTimeout(() => {
      if (deleted) {
        onDelete();
      }
    }, 5000);
  };

  return (
    <Button variant="danger" onClick={handleDelete}>
      Delete
    </Button>
  );
}

// Confirmation with preview
function ConfirmTransaction({ transaction, onConfirm }) {
  return (
    <Modal>
      <h2>Confirm Payment</h2>

      {/* Clear preview of action */}
      <div className="bg-gray-50 p-4 rounded-lg my-4">
        <div className="flex justify-between mb-2">
          <span className="text-gray-600">To</span>
          <span className="font-semibold">{transaction.recipient}</span>
        </div>
        <div className="flex justify-between mb-2">
          <span className="text-gray-600">Amount</span>
          <span className="font-bold text-2xl">${transaction.amount}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Fee</span>
          <span>${transaction.fee}</span>
        </div>
        <div className="border-t mt-2 pt-2 flex justify-between">
          <span className="font-semibold">Total</span>
          <span className="font-bold">${transaction.total}</span>
        </div>
      </div>

      {/* Clear actions */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="primary" onClick={onConfirm}>
          Confirm & Send
        </Button>
      </div>
    </Modal>
  );
}
```

### 5. Consistency

**Similar things should look and behave similarly**

```tsx
// Consistent status indicators across the app
export const StatusBadge = ({ status }: { status: "success" | "pending" | "failed" }) => {
  const config = {
    success: {
      color: "bg-green-100 text-green-800 border-green-300",
      icon: <CheckCircleIcon className="w-4 h-4" />,
      label: "Completed",
    },
    pending: {
      color: "bg-yellow-100 text-yellow-800 border-yellow-300",
      icon: <ClockIcon className="w-4 h-4" />,
      label: "Pending",
    },
    failed: {
      color: "bg-red-100 text-red-800 border-red-300",
      icon: <XCircleIcon className="w-4 h-4" />,
      label: "Failed",
    },
  };

  const { color, icon, label } = config[status];

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${color}`}>
      {icon}
      {label}
    </span>
  );
};

// Use consistently everywhere
function TransactionRow({ transaction }) {
  return (
    <tr>
      <td>{transaction.date}</td>
      <td>{transaction.recipient}</td>
      <td>${transaction.amount}</td>
      <td>
        <StatusBadge status={transaction.status} />
      </td>
    </tr>
  );
}

function TransactionCard({ transaction }) {
  return (
    <Card>
      <StatusBadge status={transaction.status} />
      {/* ... */}
    </Card>
  );
}
```

---

## 🔄 User Flows

### Registration Flow

```tsx
// Complete registration user flow
function RegistrationFlow() {
  const [step, setStep] = useState(1);
  const [userData, setUserData] = useState({});

  // Step 1: Email & Password
  const Step1 = () => (
    <div className="max-w-md mx-auto">
      <h1 className="text-3xl font-bold mb-2">Create Account</h1>
      <p className="text-gray-600 mb-6">Start managing your money better</p>

      <form onSubmit={handleStep1}>
        <Input label="Email" type="email" required autoFocus icon={<MailIcon />} />
        <PasswordInput label="Password" required helper="At least 8 characters with uppercase, lowercase, and number" />

        <Button type="submit" fullWidth className="mt-6">
          Continue
        </Button>
      </form>

      <p className="text-center mt-4 text-sm text-gray-600">
        Already have an account? <Link href="/login" className="text-blue-600 hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );

  // Step 2: Personal Info
  const Step2 = () => (
    <div className="max-w-md mx-auto">
      <h1 className="text-3xl font-bold mb-2">Personal Information</h1>
      <p className="text-gray-600 mb-6">Help us get to know you</p>

      <form onSubmit={handleStep2}>
        <div className="grid grid-cols-2 gap-4">
          <Input label="First Name" required />
          <Input label="Last Name" required />
        </div>
        <PhoneInput label="Phone Number" required />
        <DateInput label="Date of Birth" required />

        <div className="flex gap-3 mt-6">
          <Button variant="outline" onClick={() => setStep(1)}>
            Back
          </Button>
          <Button type="submit" fullWidth>
            Continue
          </Button>
        </div>
      </form>
    </div>
  );

  // Step 3: Email Verification
  const Step3 = () => (
    <div className="max-w-md mx-auto text-center">
      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <MailIcon className="w-8 h-8 text-blue-600" />
      </div>

      <h1 className="text-3xl font-bold mb-2">Check Your Email</h1>
      <p className="text-gray-600 mb-6">
        We sent a verification code to
        <br />
        <strong>{userData.email}</strong>
      </p>

      <OTPInput length={6} onComplete={handleVerify} />

      <p className="mt-6 text-sm text-gray-600">
        Didn't receive the code? <button className="text-blue-600 hover:underline" onClick={handleResend}>
          Resend
        </button>
      </p>
    </div>
  );

  // Step 4: Success
  const Step4 = () => (
    <div className="max-w-md mx-auto text-center">
      <SuccessAnimation />

      <h1 className="text-3xl font-bold mb-2">Welcome to Advancia Pay!</h1>
      <p className="text-gray-600 mb-6">Your account has been created successfully</p>

      <Button onClick={handleGoToDashboard} fullWidth>
        Go to Dashboard
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Progress indicator */}
      <div className="fixed top-0 left-0 right-0 bg-white border-b p-4">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Step {step} of 4</span>
            <span className="text-sm text-gray-600">{Math.round((step / 4) * 100)}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${(step / 4) * 100}%` }} />
          </div>
        </div>
      </div>

      {/* Current step */}
      <div className="w-full mt-20">
        {step === 1 && <Step1 />}
        {step === 2 && <Step2 />}
        {step === 3 && <Step3 />}
        {step === 4 && <Step4 />}
      </div>
    </div>
  );
}
```

### Send Money Flow

```tsx
function SendMoneyFlow() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({});

  // Step 1: Recipient
  const SelectRecipient = () => (
    <div>
      <h2 className="text-2xl font-bold mb-4">Send Money</h2>

      {/* Recent recipients */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-600 mb-3">Recent</h3>
        <div className="grid grid-cols-4 gap-3">
          {recentRecipients.map((recipient) => (
            <button key={recipient.id} onClick={() => handleSelectRecipient(recipient)} className="flex flex-col items-center p-3 rounded-lg hover:bg-gray-50 transition">
              <Avatar src={recipient.avatar} name={recipient.name} size="lg" />
              <span className="text-sm mt-2 truncate w-full text-center">{recipient.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Or enter new */}
      <div>
        <h3 className="text-sm font-medium text-gray-600 mb-3">Or enter email/phone</h3>
        <Input placeholder="Email or phone number" icon={<SearchIcon />} onChange={handleSearchRecipient} />
      </div>
    </div>
  );

  // Step 2: Amount
  const EnterAmount = () => (
    <div>
      <button onClick={() => setStep(1)} className="flex items-center text-gray-600 mb-4 hover:text-gray-900">
        <ArrowLeftIcon className="w-5 h-5 mr-2" />
        Back
      </button>

      <div className="text-center mb-6">
        <p className="text-sm text-gray-600 mb-2">Send to</p>
        <div className="flex items-center justify-center gap-3">
          <Avatar src={formData.recipient.avatar} name={formData.recipient.name} />
          <span className="font-semibold text-lg">{formData.recipient.name}</span>
        </div>
      </div>

      {/* Large amount input */}
      <div className="text-center mb-8">
        <div className="text-6xl font-bold mb-2">
          $<input type="number" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} className="border-none outline-none w-64 text-center" placeholder="0" autoFocus />
        </div>
        <p className="text-gray-600">
          Available: <strong>${balance.toFixed(2)}</strong>
        </p>
      </div>

      {/* Quick amounts */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[10, 20, 50, 100].map((amount) => (
          <button key={amount} onClick={() => setFormData({ ...formData, amount })} className="py-3 border-2 rounded-lg hover:border-blue-600 transition">
            ${amount}
          </button>
        ))}
      </div>

      <Button onClick={() => setStep(3)} fullWidth disabled={!formData.amount || formData.amount > balance}>
        Continue
      </Button>
    </div>
  );

  // Step 3: Confirm
  const ConfirmPayment = () => (
    <div>
      <button onClick={() => setStep(2)} className="flex items-center text-gray-600 mb-4 hover:text-gray-900">
        <ArrowLeftIcon className="w-5 h-5 mr-2" />
        Back
      </button>

      <h2 className="text-2xl font-bold mb-6">Confirm Payment</h2>

      {/* Summary card */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Avatar src={formData.recipient.avatar} name={formData.recipient.name} />
            <div>
              <p className="font-semibold">{formData.recipient.name}</p>
              <p className="text-sm opacity-90">{formData.recipient.email}</p>
            </div>
          </div>
          <ArrowRightIcon className="w-6 h-6" />
        </div>
        <div className="text-4xl font-bold">${formData.amount}</div>
      </div>

      {/* Details */}
      <div className="space-y-3 mb-6">
        <DetailRow label="Payment method" value="Bank Account (•••• 1234)" />
        <DetailRow label="Fee" value="$0.00" />
        <DetailRow label="Arrives" value="Instantly" />
        <div className="border-t pt-3">
          <DetailRow label="Total" value={`$${parseFloat(formData.amount).toFixed(2)}`} bold />
        </div>
      </div>

      {/* Note (optional) */}
      <Input label="Add a note (optional)" placeholder="What's this for?" value={formData.note} onChange={(e) => setFormData({ ...formData, note: e.target.value })} />

      <Button onClick={handleSendMoney} fullWidth className="mt-6" loading={sending}>
        Send ${formData.amount}
      </Button>
    </div>
  );

  // Step 4: Success
  const PaymentSuccess = () => (
    <div className="text-center">
      <SuccessAnimation />

      <h2 className="text-2xl font-bold mb-2">Payment Sent!</h2>
      <p className="text-gray-600 mb-6">
        ${formData.amount} sent to {formData.recipient.name}
      </p>

      <div className="flex gap-3">
        <Button variant="outline" onClick={handleShare}>
          <ShareIcon className="w-5 h-5 mr-2" />
          Share Receipt
        </Button>
        <Button onClick={handleDone} fullWidth>
          Done
        </Button>
      </div>

      <button onClick={handleSendAnother} className="mt-4 text-blue-600 hover:underline">
        Send to someone else
      </button>
    </div>
  );

  return (
    <Modal open={open} onClose={onClose}>
      <div className="max-w-md w-full">
        {step === 1 && <SelectRecipient />}
        {step === 2 && <EnterAmount />}
        {step === 3 && <ConfirmPayment />}
        {step === 4 && <PaymentSuccess />}
      </div>
    </Modal>
  );
}
```

---

## 🧭 Navigation Patterns

### Dashboard Navigation

```tsx
function DashboardLayout({ children }) {
  const pathname = usePathname();

  const navigation = [
    { name: "Home", href: "/dashboard", icon: HomeIcon },
    { name: "Transactions", href: "/transactions", icon: ReceiptIcon, badge: 5 },
    { name: "Cards", href: "/cards", icon: CreditCardIcon },
    { name: "Analytics", href: "/analytics", icon: ChartIcon },
  ];

  const secondaryNav = [
    { name: "Settings", href: "/settings", icon: SettingsIcon },
    { name: "Help", href: "/help", icon: HelpIcon },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white border-r px-6">
          {/* Logo */}
          <div className="flex h-16 shrink-0 items-center">
            <Logo className="h-8 w-auto" />
          </div>

          {/* Main navigation */}
          <nav className="flex flex-1 flex-col">
            <ul className="flex flex-1 flex-col gap-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={`
                        group flex gap-x-3 rounded-lg p-3 text-sm font-semibold transition-colors
                        ${isActive ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-50"}
                      `}
                    >
                      <item.icon className="h-6 w-6 shrink-0" />
                      {item.name}
                      {item.badge && <span className="ml-auto bg-blue-600 text-white text-xs rounded-full px-2 py-0.5">{item.badge}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>

            {/* Secondary navigation */}
            <ul className="mt-auto space-y-1 mb-4">
              {secondaryNav.map((item) => (
                <li key={item.name}>
                  <Link href={item.href} className="group flex gap-x-3 rounded-lg p-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                    <item.icon className="h-6 w-6 shrink-0" />
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>

            {/* User profile */}
            <UserProfile />
          </nav>
        </div>
      </aside>

      {/* Mobile navigation */}
      <div className="lg:hidden">
        <MobileNav navigation={navigation} />
      </div>

      {/* Main content */}
      <main className="lg:pl-64">
        <div className="px-4 py-6 sm:px-6 lg:px-8">{children}</div>
      </main>

      {/* Quick actions FAB (mobile) */}
      <div className="lg:hidden fixed bottom-6 right-6">
        <button className="w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 flex items-center justify-center">
          <PlusIcon className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}

// Breadcrumbs for deep navigation
function Breadcrumbs({ items }) {
  return (
    <nav className="flex mb-6" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2">
        {items.map((item, index) => (
          <li key={item.href} className="flex items-center">
            {index > 0 && <ChevronRightIcon className="h-5 w-5 text-gray-400 mx-2" />}
            {index === items.length - 1 ? (
              <span className="text-gray-900 font-medium">{item.name}</span>
            ) : (
              <Link href={item.href} className="text-gray-600 hover:text-gray-900">
                {item.name}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

// Usage
<Breadcrumbs
  items={[
    { name: "Dashboard", href: "/dashboard" },
    { name: "Transactions", href: "/transactions" },
    { name: "Transaction #12345", href: "/transactions/12345" },
  ]}
/>;
```

### Tab Navigation

```tsx
function TabNavigation({ tabs, activeTab, onChange }) {
  return (
    <div className="border-b border-gray-200">
      <nav className="-mb-px flex space-x-8" aria-label="Tabs">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${isActive ? "border-blue-600 text-blue-600" : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"}
              `}
              aria-current={isActive ? "page" : undefined}
            >
              {tab.icon && <tab.icon className="inline-block w-5 h-5 mr-2" />}
              {tab.name}
              {tab.count !== undefined && <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2 rounded-full text-xs">{tab.count}</span>}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

// Usage
function TransactionsPage() {
  const [activeTab, setActiveTab] = useState("all");

  const tabs = [
    { id: "all", name: "All", count: 142 },
    { id: "sent", name: "Sent", count: 67 },
    { id: "received", name: "Received", count: 75 },
    { id: "pending", name: "Pending", count: 3 },
  ];

  return (
    <div>
      <TabNavigation tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      <div className="mt-6">
        {activeTab === "all" && <AllTransactions />}
        {activeTab === "sent" && <SentTransactions />}
        {activeTab === "received" && <ReceivedTransactions />}
        {activeTab === "pending" && <PendingTransactions />}
      </div>
    </div>
  );
}
```

---

## 📝 Form UX

### Inline Validation

```tsx
function SmartForm() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [touched, setTouched] = useState(false);

  // Validate on blur (not on every keystroke)
  const validateEmail = () => {
    if (!email) {
      setEmailError("Email is required");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Please enter a valid email");
    } else {
      setEmailError("");
    }
  };

  return (
    <div>
      <label htmlFor="email" className="block text-sm font-medium mb-1">
        Email
      </label>
      <div className="relative">
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => {
            setTouched(true);
            validateEmail();
          }}
          className={`
            w-full px-4 py-2 border rounded-lg
            ${emailError && touched ? "border-red-500" : "border-gray-300"}
          `}
        />

        {/* Show checkmark when valid */}
        {email && !emailError && touched && <CheckIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-600" />}
      </div>

      {/* Show error only after touched */}
      {emailError && touched && (
        <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
          <ErrorIcon className="w-4 h-4" />
          {emailError}
        </p>
      )}
    </div>
  );
}
```

### Smart Defaults & Autocomplete

```tsx
function SendMoneyForm() {
  return (
    <form>
      {/* Remember last recipient */}
      <Input label="Recipient" defaultValue={lastRecipient} list="recent-recipients" />
      <datalist id="recent-recipients">
        {recentRecipients.map((recipient) => (
          <option key={recipient.id} value={recipient.email}>
            {recipient.name}
          </option>
        ))}
      </datalist>

      {/* Smart amount suggestions */}
      <div>
        <label>Amount</label>
        <CurrencyInput />
        <div className="mt-2 flex gap-2">
          <span className="text-sm text-gray-600">Quick:</span>
          {[10, 20, 50, 100].map((amount) => (
            <button key={amount} type="button" onClick={() => setAmount(amount)} className="px-3 py-1 text-sm border rounded hover:bg-gray-50">
              ${amount}
            </button>
          ))}
        </div>
      </div>

      {/* Auto-save drafts */}
      <AutoSaveDraft formData={formData} />
    </form>
  );
}
```

---

## ⚠️ Error Handling

### Error Messages

```tsx
// ❌ BAD: Technical, unhelpful
<p>Error: ECONNREFUSED 127.0.0.1:5432</p>

// ✅ GOOD: User-friendly, actionable
<ErrorMessage>
  <h3>We couldn't connect to the server</h3>
  <p>Please check your internet connection and try again.</p>
  <Button onClick={retry}>Try Again</Button>
</ErrorMessage>

// ❌ BAD: Vague
<p>Invalid input</p>

// ✅ GOOD: Specific
<p>Password must be at least 8 characters with one uppercase letter and one number</p>

// ❌ BAD: Scary
<p>FATAL ERROR: Transaction failed</p>

// ✅ GOOD: Calm, helpful
<p>We couldn't process this transaction. Your money is safe. Please try again or contact support.</p>
```

### Error States

```tsx
function ErrorBoundaryUI({ error, reset }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md text-center">
        {/* Friendly illustration */}
        <div className="mb-6">
          <ErrorIllustration />
        </div>

        <h1 className="text-2xl font-bold mb-2">Oops, something went wrong</h1>

        <p className="text-gray-600 mb-6">We're sorry for the inconvenience. Our team has been notified and is working on it.</p>

        <div className="flex flex-col gap-3">
          <Button onClick={reset} fullWidth>
            Try Again
          </Button>
          <Button variant="outline" onClick={() => router.push("/dashboard")}>
            Go to Dashboard
          </Button>
        </div>

        {/* Show error details in dev mode */}
        {process.env.NODE_ENV === "development" && (
          <details className="mt-6 text-left">
            <summary className="cursor-pointer text-sm text-gray-600">Error details (dev only)</summary>
            <pre className="mt-2 p-4 bg-gray-100 rounded text-xs overflow-auto">
              {error.message}
              {error.stack}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}

// 404 Page
function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md text-center">
        <h1 className="text-9xl font-bold text-gray-200 mb-4">404</h1>
        <h2 className="text-2xl font-bold mb-2">Page Not Found</h2>
        <p className="text-gray-600 mb-6">The page you're looking for doesn't exist or has been moved.</p>
        <Button onClick={() => router.push("/dashboard")}>Go Home</Button>
      </div>
    </div>
  );
}
```

---

## ⏳ Loading States

### Skeleton Screens

```tsx
function TransactionListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="animate-pulse flex items-center gap-4 p-4 border rounded-lg">
          {/* Avatar skeleton */}
          <div className="w-12 h-12 bg-gray-200 rounded-full" />

          <div className="flex-1">
            {/* Text skeletons */}
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-2" />
            <div className="h-3 bg-gray-200 rounded w-1/3" />
          </div>

          {/* Amount skeleton */}
          <div className="h-6 bg-gray-200 rounded w-20" />
        </div>
      ))}
    </div>
  );
}

// Progressive loading
function DashboardWithProgressive() {
  const { data: stats, isLoading: statsLoading } = useQuery("stats");
  const { data: transactions, isLoading: txLoading } = useQuery("transactions");

  return (
    <div>
      {/* Show stats immediately when loaded */}
      {statsLoading ? <StatsSkeleton /> : <StatsGrid stats={stats} />}

      {/* Show transactions after */}
      {txLoading ? <TransactionListSkeleton /> : <TransactionList transactions={transactions} />}
    </div>
  );
}
```

### Progress Indicators

```tsx
// Determinate progress (known duration)
function FileUploadProgress({ progress }) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-2">
        <span>Uploading...</span>
        <span>{progress}%</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}

// Indeterminate progress (unknown duration)
function TransactionProcessing() {
  return (
    <div className="flex flex-col items-center p-8">
      <LoadingSpinner size="lg" />
      <p className="mt-4 font-medium">Processing transaction...</p>
      <p className="text-sm text-gray-600">This usually takes a few seconds</p>
    </div>
  );
}

// Step-by-step progress
function MultiStepProgress({ steps, currentStep }) {
  return (
    <div className="flex items-center justify-between">
      {steps.map((step, index) => (
        <div key={index} className="flex items-center flex-1">
          {/* Step circle */}
          <div
            className={`
            w-10 h-10 rounded-full flex items-center justify-center font-semibold
            ${
              index < currentStep
                ? "bg-green-600 text-white" // Completed
                : index === currentStep
                  ? "bg-blue-600 text-white" // Current
                  : "bg-gray-200 text-gray-600" // Upcoming
            }
          `}
          >
            {index < currentStep ? <CheckIcon className="w-6 h-6" /> : index + 1}
          </div>

          {/* Step label */}
          <span className="ml-2 text-sm font-medium">{step}</span>

          {/* Connector line */}
          {index < steps.length - 1 && (
            <div
              className={`
              flex-1 h-0.5 mx-4
              ${index < currentStep ? "bg-green-600" : "bg-gray-200"}
            `}
            />
          )}
        </div>
      ))}
    </div>
  );
}
```

---

## 📭 Empty States

```tsx
// Empty transaction list
function EmptyTransactions() {
  return (
    <div className="text-center py-12">
      <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <ReceiptIcon className="w-12 h-12 text-gray-400" />
      </div>

      <h3 className="text-xl font-semibold mb-2">No transactions yet</h3>
      <p className="text-gray-600 mb-6">Start by sending money to someone or requesting payment</p>

      <div className="flex gap-3 justify-center">
        <Button onClick={() => openSendMoney()}>
          <SendIcon className="w-5 h-5 mr-2" />
          Send Money
        </Button>
        <Button variant="outline" onClick={() => openRequestMoney()}>
          Request Money
        </Button>
      </div>
    </div>
  );
}

// Empty search results
function NoSearchResults({ query }) {
  return (
    <div className="text-center py-12">
      <SearchIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
      <h3 className="text-xl font-semibold mb-2">No results for "{query}"</h3>
      <p className="text-gray-600 mb-6">Try adjusting your search or filters</p>
      <Button variant="outline" onClick={clearFilters}>
        Clear Filters
      </Button>
    </div>
  );
}

// First-time setup
function EmptyDashboard() {
  return (
    <div className="text-center py-12">
      <WelcomeIllustration />

      <h2 className="text-2xl font-bold mb-2">Welcome to Advancia Pay!</h2>
      <p className="text-gray-600 mb-8 max-w-md mx-auto">Let's get you started with a quick tour of the platform</p>

      <Button onClick={startOnboarding}>Start Tour</Button>
    </div>
  );
}
```

---

## 🎓 Onboarding

```tsx
function OnboardingTour() {
  const [step, setStep] = useState(0);

  const steps = [
    {
      target: "#balance",
      title: "Your Balance",
      content: "This shows your current balance and recent activity.",
      placement: "bottom",
    },
    {
      target: "#send-money",
      title: "Send Money",
      content: "Click here to send money to anyone instantly.",
      placement: "bottom",
    },
    {
      target: "#transactions",
      title: "Transaction History",
      content: "View all your past transactions and download statements.",
      placement: "left",
    },
  ];

  return (
    <Joyride
      steps={steps}
      continuous
      showProgress
      showSkipButton
      styles={{
        options: {
          primaryColor: "#0073FF",
        },
      }}
    />
  );
}

// Checklist onboarding
function OnboardingChecklist() {
  const [completed, setCompleted] = useState({
    profile: false,
    verify: false,
    addBank: false,
    firstTransaction: false,
  });

  const tasks = [
    {
      id: "profile",
      title: "Complete your profile",
      description: "Add your name and photo",
      action: () => router.push("/settings/profile"),
    },
    {
      id: "verify",
      title: "Verify your email",
      description: "Check your inbox for verification link",
      action: () => router.push("/settings/security"),
    },
    {
      id: "addBank",
      title: "Add a bank account",
      description: "Link your bank for easy transfers",
      action: () => router.push("/settings/payment-methods"),
    },
    {
      id: "firstTransaction",
      title: "Send your first payment",
      description: "Try sending money to someone",
      action: () => openSendMoney(),
    },
  ];

  const completedCount = Object.values(completed).filter(Boolean).length;
  const progress = (completedCount / tasks.length) * 100;

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Get Started</h3>
        <span className="text-sm text-gray-600">
          {completedCount} of {tasks.length} completed
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-6">
        <div className="h-full bg-blue-600 transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>

      {/* Task list */}
      <div className="space-y-3">
        {tasks.map((task) => (
          <div
            key={task.id}
            className={`
              flex items-center gap-3 p-3 rounded-lg border transition
              ${completed[task.id] ? "bg-green-50 border-green-200" : "bg-white border-gray-200 hover:border-blue-300"}
            `}
          >
            {/* Checkbox */}
            <div
              className={`
              w-6 h-6 rounded-full border-2 flex items-center justify-center
              ${completed[task.id] ? "bg-green-600 border-green-600" : "border-gray-300"}
            `}
            >
              {completed[task.id] && <CheckIcon className="w-4 h-4 text-white" />}
            </div>

            {/* Task info */}
            <div className="flex-1">
              <p className={`font-medium ${completed[task.id] && "line-through text-gray-600"}`}>{task.title}</p>
              <p className="text-sm text-gray-600">{task.description}</p>
            </div>

            {/* Action */}
            {!completed[task.id] && (
              <Button size="sm" onClick={task.action}>
                Start
              </Button>
            )}
          </div>
        ))}
      </div>

      {/* Celebration */}
      {progress === 100 && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg text-center">
          <p className="font-semibold text-green-800 mb-2">🎉 All set up!</p>
          <p className="text-sm text-green-700">You're ready to use Advancia Pay</p>
        </div>
      )}
    </Card>
  );
}
```

---

**🎉 Complete UX Foundation Ready!**

Your app now has comprehensive UX patterns for exceptional user experience!
