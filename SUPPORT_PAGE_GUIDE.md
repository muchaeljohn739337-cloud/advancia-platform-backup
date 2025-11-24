# VeePN-Style Support Page - Implementation Guide

## 🎯 Overview

Professional support center inspired by VeePN's help.veepn.com with:

-   **Comprehensive support ticket form** with email, subject, category dropdown, description, system logs, and file attachments
-   **Live chat widget** (bottom-right floating button) with real-time messaging, quick actions, minimize/maximize, and AI-powered responses
-   **VeePN-style footer** with product links, features, help sections, company info, social links, and payment partner disclosure

---

## 📁 Files Created/Modified

### 1. **Support Chat Widget Component**

**Location:** `frontend/src/components/SupportChatWidget.tsx`

**Features:**

-   Floating chat button (bottom-right corner) with green online indicator and pulse animation
-   Expandable chat interface (400px wide × 600px height)
-   Message history with timestamps and role-based styling (user: blue, assistant: gray)
-   Quick action buttons for common questions (Deposits, Withdrawals, Rewards)
-   Minimize/maximize functionality
-   Loading states with animated dots
-   Real-time AI responses via `/api/ai/chat` endpoint
-   Welcome message on first open
-   Persistent state during session

**Styling:**

-   Gradient blue header (from-blue-600 to-blue-700)
-   Rounded message bubbles (user: right-aligned, assistant: left-aligned)
-   Smooth animations and transitions
-   Responsive design adapts to mobile screens
-   Shadow effects and hover states

### 2. **Support Page**

**Location:** `frontend/src/app/support/page.tsx`

**Form Fields:**

-   **Email Address\*** (required) - User's contact email
-   **Subject\*** (required) - Brief description of issue
-   **Request Topic\*** (required) - Dropdown categories:
    -   General Inquiry
    -   Billing & Payments
    -   Technical Issue
    -   Security Concern
    -   Account Management
    -   Feature Request
    -   Other
-   **Description\*** (required) - Detailed explanation (8 rows textarea)
-   **System Logs** (optional) - Monospace textarea for error messages/logs
-   **Attachments** (optional) - File upload with drag-and-drop support
    -   Accepts: Images (PNG, JPG), PDFs, Documents (DOC, DOCX), Text files, Log files
    -   Max file size: 10MB per file
    -   Multiple files supported
    -   Shows file list with name, size, and remove button

**Page Sections:**

1. **Header Banner** - Blue gradient with mail icon, title "Submit a Request", subtitle
2. **Help Notice** - Blue info box suggesting live chat and FAQ for faster help
3. **Support Form** - Comprehensive ticket submission form
4. **What to Expect** - 4-point list of response time and process expectations
5. **Footer** - VeePN-style navigation with 4 columns (Products, Features, Help, Company)
6. **Company Disclosure** - Payment partners, legal entity, compliance info (VeePN format)
7. **Chat Widget** - Floating button opens live support chat

**Footer Structure (VeePN Style):**

-   **Products Column:** Dashboard, Deposit Funds, Wallet, Rewards, Transactions
-   **Features Column:** Bank-Level Security (Shield icon), Instant Transfers (Zap icon), Multi-Currency Support (CreditCard icon), Pricing, API Access
-   **Help Column:** FAQ, Support Center, Privacy Policy, Terms of Service, Contact Us
-   **Company Column:** About Us, Careers, Blog, Security, Compliance
-   **Social Links:** Twitter, GitHub, LinkedIn (centered with hover effects)
-   **Company Disclosure:**
    -   Copyright notice with current year auto-update
    -   "Services provided by Advancia Technologies LLC, registered in Delaware, USA"
    -   "Payment Processing Partners: Stripe Inc. (USA) and Cryptomus (International)"
    -   Compliance badges: PCI DSS Compliant (green shield icon), FinCEN MSB Registration: Pending, State Money Transmitter Licenses: Applied

---

## 🎨 Design Features

### Chat Widget

-   **Colors:** Blue gradient header, white background, blue for user messages, gray for assistant
-   **Icons:** MessageCircle (chat button), X (close), Minimize2/Maximize2 (minimize/maximize), Send (send message)
-   **Animations:**
    -   Green pulse dot on chat button
    -   Scale up (110%) on hover
    -   Bounce animation for typing indicator (3 dots with staggered delays)
    -   Smooth open/close transitions
-   **Accessibility:**
    -   ARIA labels on all buttons
    -   Keyboard navigation (Enter to send)
    -   High contrast text
    -   Focus states

### Support Form

-   **Layout:** Clean, centered design (max-width: 1024px)
-   **Colors:**
    -   Blue gradient header banner
    -   White form card with shadow
    -   Blue focus states on inputs
    -   Green for success messages, red for errors
-   **Icons:**
    -   Mail (header)
    -   HelpCircle (info notice)
    -   Upload (file upload area)
    -   FileText (attached files)
    -   Send (submit button and remove file)
    -   Shield, Zap, CreditCard (footer features)
    -   Twitter, Github, Linkedin (social links)
-   **Responsive:** Adapts to mobile, tablet, desktop screens

### Footer

-   **Layout:** 4-column grid on desktop, stacks on mobile
-   **Background:** Slate-900 (dark gray)
-   **Text Colors:** White headers, slate-300 for links, slate-400 for disclosure
-   **Hover Effects:** Links turn white on hover
-   **Icons:** Embedded in feature list and social links

---

## 🔌 Integration Guide

### Adding Chat Widget to Other Pages

The chat widget is currently included on the support page. To add it globally:

1. **Import in Layout:**

```tsx
import SupportChatWidget from "@/components/SupportChatWidget";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <SupportChatWidget />
      </body>
    </html>
  );
}
```

2. **Conditional Rendering:**

```tsx
{
  /* Show chat only on authenticated pages */
}
{
  isAuthenticated && <SupportChatWidget />;
}
```

### Customizing Chat Responses

The chat widget calls `/api/ai/chat` endpoint. To implement real AI:

**Current Implementation (Mock):**

```typescript
// frontend/src/app/api/ai/chat/route.ts
export async function POST(req: Request) {
  const { prompt } = await req.json();
  return Response.json({ reply: "Mock response" });
}
```

**Production Implementation (OpenAI):**

```typescript
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  const { prompt } = await req.json();

  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      { role: "system", content: "You are Advancia Pay support assistant..." },
      { role: "user", content: prompt },
    ],
  });

  return Response.json({ reply: completion.choices[0].message.content });
}
```

### Handling File Uploads

Currently, files are stored in component state. To implement backend upload:

**Frontend (already implemented):**

```tsx
const [files, setFiles] = useState<File[]>([]);

function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
  if (e.target.files) {
    const newFiles = Array.from(e.target.files);
    setFiles((prev) => [...prev, ...newFiles]);
  }
}
```

**Backend API Route:**

```typescript
// backend/src/routes/support.ts
import multer from "multer";
import path from "path";

const upload = multer({
  dest: "uploads/support-attachments/",
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx|txt|log/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Invalid file type"));
    }
  },
});

router.post("/contact", authenticateToken, upload.array("attachments", 5), async (req, res) => {
  const { email, subject, category, message, systemLogs } = req.body;
  const files = req.files as Express.Multer.File[];

  const ticket = await prisma.supportTicket.create({
    data: {
      userId: req.user.userId,
      email,
      subject,
      category,
      message,
      systemLogs,
      attachments: files.map((f) => f.path),
    },
  });

  res.json({ success: true, ticketId: ticket.id });
});
```

---

## 🚀 Usage Examples

### Opening Chat Widget Programmatically

Add a ref to the widget:

```tsx
// In SupportChatWidget.tsx
export default forwardRef<{ open: () => void }>(function SupportChatWidget(props, ref) {
  const [open, setOpen] = useState(false);

  useImperativeHandle(ref, () => ({
    open: () => setOpen(true),
  }));

  // ... rest of component
});

// In parent component
const chatRef = useRef<{ open: () => void }>(null);

<button onClick={() => chatRef.current?.open()}>
  Open Support Chat
</button>

<SupportChatWidget ref={chatRef} />
```

### Customizing Quick Actions

Edit the quick actions section in `SupportChatWidget.tsx`:

```tsx
<button onClick={() => setInput("Your custom question here")} className="text-xs px-3 py-1.5 bg-white border border-slate-200 rounded-full hover:border-blue-500 hover:text-blue-600 transition-colors">
  🎯 Custom Action
</button>
```

### Adding More Form Fields

In `page.tsx`, add new field to formData state:

```tsx
const [formData, setFormData] = useState({
  email: "",
  subject: "",
  category: "GENERAL",
  priority: "MEDIUM", // Add this
  message: "",
  systemLogs: "",
});

// Add dropdown in form
<select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })}>
  <option value="LOW">Low</option>
  <option value="MEDIUM">Medium</option>
  <option value="HIGH">High</option>
  <option value="URGENT">Urgent</option>
</select>;
```

---

## 🔧 Configuration

### Environment Variables

Required for production AI chat:

```env
# .env.local (Frontend)
NEXT_PUBLIC_API_URL=https://api.advanciapayledger.com

# .env (Backend)
OPENAI_API_KEY=sk-...
EMAIL_USER=support@advanciapayledger.com
EMAIL_PASSWORD=your-email-password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
```

### Chat Widget Settings

In `SupportChatWidget.tsx`, customize dimensions:

```tsx
style={{
  width: minimized ? '320px' : '400px',  // Change width
  height: minimized ? '64px' : '600px',  // Change height
  maxHeight: 'calc(100vh - 100px)'       // Max height
}}
```

### Form Validation

Current validation:

-   Email: Browser built-in email validation
-   Subject: Required
-   Category: Must select from dropdown
-   Description: Required

Add custom validation:

```tsx
async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();

  // Custom validation
  if (formData.message.length < 20) {
    setMessage({
      type: "error",
      text: "Description must be at least 20 characters",
    });
    return;
  }

  // ... rest of submit logic
}
```

---

## 📊 Backend Requirements

### Database Schema (Prisma)

Add support ticket model to `schema.prisma`:

```prisma
model SupportTicket {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  email       String
  subject     String
  category    String   // GENERAL, BILLING, TECHNICAL, SECURITY, ACCOUNT, FEATURE_REQUEST, OTHER
  priority    String   @default("MEDIUM") // LOW, MEDIUM, HIGH, URGENT
  message     String   @db.Text
  systemLogs  String?  @db.Text
  attachments String[] // Array of file paths
  status      String   @default("OPEN") // OPEN, IN_PROGRESS, RESOLVED, CLOSED
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("support_tickets")
}

// Add relation to User model
model User {
  // ... existing fields
  supportTickets SupportTicket[]
}
```

Run migration:

```bash
cd backend
npx prisma migrate dev --name add-support-tickets
npx prisma generate
```

### API Endpoints

**POST /api/support/contact** - Create support ticket

-   Headers: `Authorization: Bearer <token>`
-   Body: `{ email, subject, category, message, systemLogs? }`
-   Files: Multipart form data (optional attachments)
-   Response: `{ success: true, ticketId: string }`

**GET /api/support/my-tickets** - Get user's tickets

-   Headers: `Authorization: Bearer <token>`
-   Response: `{ tickets: SupportTicket[] }`

**GET /api/support/my-tickets/:id** - Get specific ticket

-   Headers: `Authorization: Bearer <token>`
-   Response: `{ ticket: SupportTicket }`

**POST /api/ai/chat** - AI chat endpoint

-   Body: `{ prompt: string }`
-   Response: `{ reply: string }`

---

## 🎯 Testing Checklist

### Chat Widget

-   [ ] Chat button appears in bottom-right corner
-   [ ] Green online indicator pulses
-   [ ] Chat opens on button click
-   [ ] Welcome message appears on first open
-   [ ] User can type and send messages
-   [ ] Quick action buttons populate input field
-   [ ] Minimize/maximize buttons work
-   [ ] Close button hides widget
-   [ ] Loading animation shows while waiting for response
-   [ ] Messages scroll automatically
-   [ ] Timestamps display correctly
-   [ ] Responsive on mobile screens

### Support Form

-   [ ] Email validation works
-   [ ] Subject field is required
-   [ ] Category dropdown populates correctly
-   [ ] Description textarea accepts input
-   [ ] System logs textarea accepts input
-   [ ] File upload accepts valid file types
-   [ ] Multiple files can be uploaded
-   [ ] File list displays with name and size
-   [ ] Remove file button works
-   [ ] Form submits successfully
-   [ ] Success message displays after submission
-   [ ] Error handling works for API failures
-   [ ] Form clears after successful submission
-   [ ] Responsive on mobile screens

### Footer

-   [ ] All links are functional (or redirect appropriately)
-   [ ] Social links open in new tab
-   [ ] Hover effects work on all links
-   [ ] Icons display correctly
-   [ ] Company disclosure shows payment partners
-   [ ] Copyright year updates automatically
-   [ ] Responsive grid layout on mobile

---

## 🚀 Deployment Notes

1. **Chat Widget Position:**
   -   Ensure no z-index conflicts with other components
   -   Test on pages with fixed headers/footers
   -   Verify mobile positioning doesn't overlap important content

2. **API Integration:**
   -   Configure CORS to allow chat API calls
   -   Set up rate limiting on `/api/ai/chat` endpoint
   -   Implement authentication for support ticket endpoints

3. **File Upload:**
   -   Configure storage solution (AWS S3, Azure Blob, etc.)
   -   Set up CDN for serving uploaded files
   -   Implement virus scanning for uploaded files
   -   Configure max file size limits on server

4. **Email Notifications:**
   -   Set up automated email on ticket submission
   -   Configure admin notifications for new tickets
   -   Implement ticket update emails

5. **Performance:**
   -   Lazy load chat widget component
   -   Optimize icon imports (use tree shaking)
   -   Minify and compress assets
   -   Cache AI responses for common questions

---

## 🎨 Customization Guide

### Changing Colors

Chat widget colors in `SupportChatWidget.tsx`:

```tsx
// Header
className = "bg-gradient-to-r from-blue-600 to-blue-700";

// User messages
className = "bg-blue-600 text-white";

// Assistant messages
className = "bg-slate-100 text-slate-900";

// Chat button
className = "bg-gradient-to-r from-blue-600 to-blue-700";
```

Support page colors in `page.tsx`:

```tsx
// Header banner
className = "bg-gradient-to-r from-blue-600 to-blue-700";

// Submit button
className = "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800";

// Footer
className = "bg-slate-900";
```

### Changing Icons

Replace Lucide icons with alternatives:

```tsx
import { MessageSquare, HelpCircle, Rocket } from "lucide-react";

// Replace MessageCircle with MessageSquare
<MessageSquare className="h-6 w-6" />;
```

### Modifying Footer Links

Edit footer section in `page.tsx`:

```tsx
{
  /* Add new column */
}
<div>
  <h4 className="font-bold text-lg mb-4">Resources</h4>
  <ul className="space-y-2 text-sm text-slate-300">
    <li>
      <Link href="/docs">Documentation</Link>
    </li>
    <li>
      <Link href="/api">API Reference</Link>
    </li>
  </ul>
</div>;
```

---

## 📝 Future Enhancements

-   [ ] **Real-time Notifications:** Socket.IO for live ticket updates
-   [ ] **Chat History Persistence:** Save chat messages to database
-   [ ] **Multi-agent Support:** Route questions to specialized AI agents
-   [ ] **Voice Input:** Add speech-to-text for chat widget
-   [ ] **File Preview:** Show image/PDF previews before upload
-   [ ] **Ticket Status Tracking:** Real-time status updates page
-   [ ] **Automated Responses:** Rule-based auto-replies for common questions
-   [ ] **Analytics Dashboard:** Track support metrics (response time, resolution rate)
-   [ ] **Multi-language Support:** i18n for chat and form
-   [ ] **Chatbot Training:** Fine-tune AI on support ticket history

---

## 🆘 Troubleshooting

### Chat Widget Not Appearing

-   Check z-index conflicts in CSS
-   Verify component is imported and rendered
-   Check console for JavaScript errors
-   Ensure `/api/ai/chat` endpoint exists

### Form Submission Fails

-   Check network tab for API errors
-   Verify authentication token is present
-   Check backend logs for errors
-   Ensure CORS is configured correctly

### File Upload Not Working

-   Check file size is under 10MB
-   Verify file type is allowed
-   Check browser console for errors
-   Ensure `handleFileChange` is bound correctly

### Chat Responses Slow

-   Check API response time in Network tab
-   Optimize AI model (use faster model like GPT-3.5)
-   Implement caching for common questions
-   Add timeout handling

---

## 📚 Related Documentation

-   [Backend API Documentation](./API_REFERENCE.md)
-   [Authentication Guide](./ADMIN_LOGIN_GUIDE.md)
-   [Deployment Guide](./DEPLOYMENT_GUIDE.md)
-   [Maintenance Mode](./MAINTENANCE_MODE_GUIDE.md)
-   [Footer Component](./frontend/src/components/Footer.tsx)

---

## 👥 Support

For questions about this implementation:

-   **Chat Widget:** <support@advanciapayledger.com>
-   **GitHub Issues:** github.com/advanciapayledger/issues
-   **Documentation:** docs.advanciapayledger.com

---

_Last Updated: November 19, 2025_
