# 🧪 User Acceptance Testing (UAT) Guide

**Platform**: Advancia Pay Ledger  
**Version**: 1.0.0  
**Test Date**: November 10, 2025  
**Completion**: 100%

---

## 📋 UAT Overview

### Purpose

Verify all features work correctly from an end-user perspective before production deployment.

### Test Environment

-   **Frontend**: <http://localhost:3000>
-   **Backend**: <http://localhost:4000>
-   **Database**: PostgreSQL (Development)
-   **Test Data**: Seeded users and transactions

### Test Users

#### Regular User

-   **Email**: <test@example.com>
-   **Password**: Test123!@#
-   **Role**: USER

#### Admin User

-   **Email**: <admin@advancia.com>
-   **Password**: Admin@123
-   **Role**: ADMIN

---

## ✅ Test Scenarios

### Category 1: Authentication & Authorization

#### Test 1.1: User Registration

**Objective**: Verify new user can register

**Steps**:

1. Navigate to `/register`
2. Fill in:
   -   Email: `newuser@test.com`
   -   Username: `newuser`
   -   Password: `NewUser123!`
   -   Confirm Password: `NewUser123!`
3. Click "Register"

**Expected Result**:

-   ✅ Registration successful
-   ✅ Redirect to login or dashboard
-   ✅ Email verification sent (check logs)
-   ✅ User created in database with USER role

**Status**: [ ] Pass [ ] Fail

---

#### Test 1.2: User Login

**Objective**: Verify user can login with credentials

**Steps**:

1. Navigate to `/login`
2. Enter Email: `test@example.com`
3. Enter Password: `Test123!@#`
4. Click "Login"

**Expected Result**:

-   ✅ Login successful
-   ✅ Redirect to `/dashboard`
-   ✅ JWT token stored in localStorage
-   ✅ User session active

**Status**: [ ] Pass [ ] Fail

---

#### Test 1.3: Admin Login with OTP

**Objective**: Verify admin 2-step authentication

**Steps**:

1. Navigate to `/admin/login`
2. Enter Email: `admin@advancia.com`
3. Enter Password: `Admin@123`
4. Enter Phone: `+1234567890`
5. Click "Continue"
6. Check backend console for OTP
7. Enter 6-digit OTP
8. Click "Verify Code"

**Expected Result**:

-   ✅ OTP sent (check logs)
-   ✅ OTP verification successful
-   ✅ Admin tokens issued
-   ✅ Redirect to `/admin/sessions`

**Status**: [ ] Pass [ ] Fail

---

#### Test 1.4: 2FA Setup

**Objective**: Enable and verify TOTP 2FA

**Steps**:

1. Login as regular user
2. Go to `/dashboard/settings` or `/dashboard/2fa`
3. Click "Enable 2FA"
4. Scan QR code with Google Authenticator
5. Enter 6-digit code from app
6. Save backup codes
7. Logout and login again
8. Enter 2FA code when prompted

**Expected Result**:

-   ✅ QR code displayed
-   ✅ 2FA enabled successfully
-   ✅ 10 backup codes generated
-   ✅ Login requires 2FA code

**Status**: [ ] Pass [ ] Fail

---

### Category 2: Dashboard & Profile

#### Test 2.1: View Dashboard

**Objective**: User can view dashboard with balance and recent activity

**Steps**:

1. Login as regular user
2. View dashboard at `/dashboard`

**Expected Result**:

-   ✅ USD balance displayed
-   ✅ Recent transactions shown (if any)
-   ✅ Quick action buttons visible
-   ✅ Navigation menu accessible
-   ✅ No console errors

**Status**: [ ] Pass [ ] Fail

---

#### Test 2.2: Update Profile

**Objective**: User can update profile information

**Steps**:

1. Go to `/dashboard/profile`
2. Update:
   -   First Name: `John`
   -   Last Name: `Doe`
   -   Phone: `+1234567890`
   -   City: `New York`
3. Click "Save Changes"

**Expected Result**:

-   ✅ Profile updated successfully
-   ✅ Success notification shown
-   ✅ Changes reflected immediately
-   ✅ Database updated

**Status**: [ ] Pass [ ] Fail

---

### Category 3: Financial Transactions

#### Test 3.1: View Transaction History

**Objective**: User can view all transactions

**Steps**:

1. Navigate to `/dashboard/transactions`
2. View transaction list
3. Filter by date/type (if available)

**Expected Result**:

-   ✅ Transactions displayed in table
-   ✅ Columns: Date, Type, Amount, Status
-   ✅ Pagination working (if many transactions)
-   ✅ Export to CSV available

**Status**: [ ] Pass [ ] Fail

---

#### Test 3.2: Create Transaction

**Objective**: User can create a new transaction

**Steps**:

1. Go to transactions page
2. Click "New Transaction"
3. Enter:
   -   Amount: `100.00`
   -   Type: `DEPOSIT`
   -   Description: `Test deposit`
4. Submit

**Expected Result**:

-   ✅ Transaction created
-   ✅ Balance updated
-   ✅ Appears in transaction list
-   ✅ Confirmation shown

**Status**: [ ] Pass [ ] Fail

---

### Category 4: Debit Cards

#### Test 4.1: Request Virtual Card

**Objective**: User can request a virtual debit card

**Steps**:

1. Navigate to `/dashboard/cards`
2. Click "Request New Card"
3. Select "Virtual Card"
4. Enter cardholder name
5. Submit request

**Expected Result**:

-   ✅ Card created successfully
-   ✅ Card number generated (masked)
-   ✅ Expiry date and CVV shown
-   ✅ Card status: ACTIVE
-   ✅ Daily limit: Default value

**Status**: [ ] Pass [ ] Fail

---

#### Test 4.2: Freeze/Unfreeze Card

**Objective**: User can freeze and unfreeze card

**Steps**:

1. Go to `/dashboard/cards`
2. Select a card
3. Click "Freeze Card"
4. Confirm action
5. Wait for update
6. Click "Unfreeze Card"

**Expected Result**:

-   ✅ Card status changes to FROZEN
-   ✅ Freeze confirmation shown
-   ✅ Card status changes back to ACTIVE
-   ✅ Unfreeze confirmation shown

**Status**: [ ] Pass [ ] Fail

---

#### Test 4.3: Change Card PIN

**Objective**: User can update card PIN

**Steps**:

1. Select a card
2. Click "Change PIN"
3. Enter old PIN: `1234`
4. Enter new PIN: `5678`
5. Confirm new PIN: `5678`
6. Submit

**Expected Result**:

-   ✅ PIN updated successfully
-   ✅ Confirmation message shown
-   ✅ PIN hashed in database
-   ✅ Old PIN no longer works

**Status**: [ ] Pass [ ] Fail

---

#### Test 4.4: Set Spending Limits

**Objective**: User can set daily/monthly spending limits

**Steps**:

1. Select a card
2. Click "Set Limits"
3. Set Daily Limit: `500`
4. Set Monthly Limit: `2000`
5. Save changes

**Expected Result**:

-   ✅ Limits updated
-   ✅ Confirmation shown
-   ✅ Limits enforced on transactions
-   ✅ Database updated

**Status**: [ ] Pass [ ] Fail

---

#### Test 4.5: Request Physical Card

**Objective**: User can request physical card delivery

**Steps**:

1. Have a virtual card
2. Click "Request Physical Card"
3. Enter shipping address
4. Confirm request

**Expected Result**:

-   ✅ Physical card request created
-   ✅ Status shows "Processing"
-   ✅ Confirmation email sent
-   ✅ Card type updated in database

**Status**: [ ] Pass [ ] Fail

---

### Category 5: Payments & Subscriptions

#### Test 5.1: Save Payment Method

**Objective**: User can save a payment method

**Steps**:

1. Navigate to `/dashboard/payment-methods`
2. Click "Add Payment Method"
3. Enter card details:
   -   Card Number: `4242 4242 4242 4242` (Stripe test)
   -   Expiry: `12/25`
   -   CVC: `123`
   -   Name: `John Doe`
4. Click "Save"

**Expected Result**:

-   ✅ Payment method saved
-   ✅ Last 4 digits shown
-   ✅ Card brand displayed (Visa)
-   ✅ Can be set as default

**Status**: [ ] Pass [ ] Fail

---

#### Test 5.2: Subscribe to Plan

**Objective**: User can subscribe to a paid plan

**Steps**:

1. Go to `/dashboard/subscriptions`
2. View available plans
3. Select "Pro Plan" ($29.99/month)
4. Click "Subscribe"
5. Select payment method
6. Confirm subscription

**Expected Result**:

-   ✅ Subscription created
-   ✅ Payment processed (Stripe test mode)
-   ✅ Plan status: ACTIVE
-   ✅ Next billing date shown
-   ✅ Invoice generated

**Status**: [ ] Pass [ ] Fail

---

#### Test 5.3: Cancel Subscription

**Objective**: User can cancel active subscription

**Steps**:

1. Go to subscriptions page
2. Click "Cancel Subscription"
3. Select cancellation reason
4. Confirm cancellation

**Expected Result**:

-   ✅ Subscription scheduled for cancellation
-   ✅ Access continues until period end
-   ✅ Status shows "Cancels on [date]"
-   ✅ Confirmation email sent

**Status**: [ ] Pass [ ] Fail

---

### Category 6: Crypto Trading

#### Test 6.1: View Crypto Wallets

**Objective**: User can view crypto wallet balances

**Steps**:

1. Navigate to `/dashboard/crypto-charts` or crypto page
2. View wallet balances

**Expected Result**:

-   ✅ BTC balance shown
-   ✅ ETH balance shown
-   ✅ USDT balance shown
-   ✅ USD equivalent displayed
-   ✅ Current exchange rates shown

**Status**: [ ] Pass [ ] Fail

---

#### Test 6.2: Crypto Swap

**Objective**: User can swap between cryptocurrencies

**Steps**:

1. Go to crypto swap page
2. Select From: `BTC`
3. Select To: `ETH`
4. Enter amount: `0.01`
5. Review swap preview (rate, fee, you receive)
6. Click "Swap"
7. Confirm transaction

**Expected Result**:

-   ✅ Swap preview shows correct calculation
-   ✅ 0.5% fee applied
-   ✅ Exchange rate displayed
-   ✅ Swap executed successfully
-   ✅ Balances updated
-   ✅ Transaction recorded

**Status**: [ ] Pass [ ] Fail

---

#### Test 6.3: View Price Charts

**Objective**: User can view crypto price charts

**Steps**:

1. Go to crypto charts page
2. Select cryptocurrency (BTC, ETH, USDT)
3. Select time period (7, 30, 90 days)
4. View chart

**Expected Result**:

-   ✅ Chart loads with historical data
-   ✅ Time period selection works
-   ✅ High/Low/Volume data shown
-   ✅ 24h change displayed
-   ✅ Chart is interactive (hover for details)

**Status**: [ ] Pass [ ] Fail

---

### Category 7: Rewards & Gamification

#### Test 7.1: View Rewards Dashboard

**Objective**: User can view rewards and tier status

**Steps**:

1. Navigate to `/dashboard/rewards`
2. View current tier
3. Check achievements
4. View leaderboard

**Expected Result**:

-   ✅ Current tier displayed (Bronze/Silver/Gold/Platinum/Diamond)
-   ✅ Total tokens shown
-   ✅ Progress to next tier visible
-   ✅ Achievements listed (locked/unlocked)
-   ✅ Leaderboard shows rankings

**Status**: [ ] Pass [ ] Fail

---

#### Test 7.2: Claim Daily Bonus

**Objective**: User can claim daily login bonus

**Steps**:

1. Go to rewards page
2. Click "Claim Daily Bonus"
3. View confirmation

**Expected Result**:

-   ✅ Bonus tokens credited
-   ✅ Token balance updated
-   ✅ Success message shown
-   ✅ Button disabled until next day

**Status**: [ ] Pass [ ] Fail

---

#### Test 7.3: Generate Referral Link

**Objective**: User can generate and share referral link

**Steps**:

1. Go to rewards/referral tab
2. Click "Generate Referral Link"
3. Copy link
4. View referral stats

**Expected Result**:

-   ✅ Unique referral link generated
-   ✅ Copy to clipboard works
-   ✅ Referral count shown
-   ✅ Tokens earned from referrals displayed

**Status**: [ ] Pass [ ] Fail

---

### Category 8: Health Monitoring (MedBeds)

#### Test 8.1: View Health Dashboard

**Objective**: User can view health monitoring data

**Steps**:

1. Navigate to `/dashboard/health-monitoring`
2. View Overview tab
3. Check Vitals tab
4. Review Sessions tab
5. Read Insights tab

**Expected Result**:

-   ✅ 6 vital signs displayed (Heart Rate, BP, O2, etc.)
-   ✅ Status indicators (Good/Fair/Poor)
-   ✅ Charts show health history
-   ✅ Session effectiveness data shown
-   ✅ AI insights provided

**Status**: [ ] Pass [ ] Fail

---

#### Test 8.2: Book MedBed Session

**Objective**: User can book a MedBed session

**Steps**:

1. Go to `/dashboard/medbeds`
2. Select available time slot
3. Choose session type
4. Enter payment details (Stripe test card)
5. Confirm booking

**Expected Result**:

-   ✅ Available slots shown
-   ✅ Session price displayed
-   ✅ Payment processed successfully
-   ✅ Booking confirmed
-   ✅ Confirmation email sent

**Status**: [ ] Pass [ ] Fail

---

### Category 9: Invoices

#### Test 9.1: Generate Invoice

**Objective**: System can generate PDF invoice

**Steps**:

1. Make a transaction/purchase
2. Go to `/dashboard/invoices`
3. Click "Generate Invoice" or view auto-generated
4. Download PDF

**Expected Result**:

-   ✅ Invoice created automatically
-   ✅ PDF generated successfully
-   ✅ Invoice contains: Number, Date, Items, Amount
-   ✅ Download works correctly
-   ✅ Invoice status: PAID/PENDING

**Status**: [ ] Pass [ ] Fail

---

#### Test 9.2: Send Invoice via Email

**Objective**: Invoice can be emailed to user

**Steps**:

1. View invoice
2. Click "Email Invoice"
3. Confirm email address
4. Send

**Expected Result**:

-   ✅ Email sent successfully
-   ✅ PDF attached to email
-   ✅ Professional email template
-   ✅ Confirmation shown in UI

**Status**: [ ] Pass [ ] Fail

---

### Category 10: Admin Panel

#### Test 10.1: View Admin Dashboard

**Objective**: Admin can access dashboard with analytics

**Steps**:

1. Login as admin
2. Navigate to `/admin/dashboard`
3. View metrics

**Expected Result**:

-   ✅ Total users count shown
-   ✅ Revenue charts displayed
-   ✅ Transaction volume graph
-   ✅ User growth chart
-   ✅ System health metrics

**Status**: [ ] Pass [ ] Fail

---

#### Test 10.2: Manage Users

**Objective**: Admin can view and manage users

**Steps**:

1. Go to `/admin/users`
2. Search for user
3. View user details
4. Update user (change role/status)

**Expected Result**:

-   ✅ User list loads with pagination
-   ✅ Search functionality works
-   ✅ Can view user profile
-   ✅ Can suspend/activate user
-   ✅ Can change user role (USER/ADMIN/MODERATOR)

**Status**: [ ] Pass [ ] Fail

---

#### Test 10.3: Bulk User Operations

**Objective**: Admin can perform bulk operations on users

**Steps**:

1. Go to users page
2. Select multiple users (checkboxes)
3. Click "Bulk Actions"
4. Choose action:
   -   Activate/Deactivate
   -   Assign Role
   -   Send Email
   -   Export to CSV
5. Confirm action

**Expected Result**:

-   ✅ Multi-select works correctly
-   ✅ All 8 bulk actions available
-   ✅ Confirmation dialog shown
-   ✅ Action applied to selected users
-   ✅ Success message displayed

**Status**: [ ] Pass [ ] Fail

---

#### Test 10.4: Approve Withdrawals

**Objective**: Admin can approve/reject withdrawal requests

**Steps**:

1. Go to `/admin/withdrawals`
2. View pending withdrawals
3. Click "Approve" or "Reject"
4. Add notes (optional)
5. Confirm action

**Expected Result**:

-   ✅ Pending withdrawals listed
-   ✅ Withdrawal details shown (amount, user, method)
-   ✅ Approve/reject actions work
-   ✅ Status updated to APPROVED/REJECTED
-   ✅ User notified via email

**Status**: [ ] Pass [ ] Fail

---

#### Test 10.5: View Admin Logs

**Objective**: Admin can view system audit logs

**Steps**:

1. Navigate to `/admin/logs`
2. Filter by:
   -   Date range
   -   Log type
   -   User
3. Search logs
4. Export logs

**Expected Result**:

-   ✅ Logs displayed in chronological order
-   ✅ Filters work correctly
-   ✅ Search functionality operational
-   ✅ Export to CSV works
-   ✅ Pagination for large datasets

**Status**: [ ] Pass [ ] Fail

---

#### Test 10.6: Monitor Active Sessions

**Objective**: Admin can view and manage active user sessions

**Steps**:

1. Go to `/admin/sessions`
2. View active sessions
3. Kill a session (force logout)

**Expected Result**:

-   ✅ Active sessions listed
-   ✅ Session details shown (user, IP, device, time)
-   ✅ Can terminate session
-   ✅ User is logged out immediately
-   ✅ Real-time updates (if available)

**Status**: [ ] Pass [ ] Fail

---

### Category 11: Security & Permissions

#### Test 11.1: Rate Limiting

**Objective**: API rate limiting prevents abuse

**Steps**:

1. Make 100 rapid requests to `/api/auth/login`
2. Observe response

**Expected Result**:

-   ✅ After N requests, get 429 status
-   ✅ Error message: "Too many requests"
-   ✅ Retry-After header present
-   ✅ Requests resume after cooldown

**Status**: [ ] Pass [ ] Fail

---

#### Test 11.2: Unauthorized Access Prevention

**Objective**: Users cannot access admin routes

**Steps**:

1. Login as regular user
2. Try to access `/admin/users` directly
3. Try API call to admin endpoint

**Expected Result**:

-   ✅ Redirect to login or access denied
-   ✅ 403 Forbidden status code
-   ✅ Error message shown
-   ✅ No sensitive data exposed

**Status**: [ ] Pass [ ] Fail

---

#### Test 11.3: XSS Protection

**Objective**: Input sanitization prevents XSS attacks

**Steps**:

1. Try to enter `<script>alert('XSS')</script>` in profile fields
2. Submit form
3. View profile

**Expected Result**:

-   ✅ Script tags escaped/sanitized
-   ✅ No script execution
-   ✅ Data displayed safely
-   ✅ Database stores sanitized version

**Status**: [ ] Pass [ ] Fail

---

### Category 12: Accessibility & UI/UX

#### Test 12.1: Mobile Responsiveness

**Objective**: Platform works on mobile devices

**Steps**:

1. Open site on mobile or resize browser to 375px width
2. Navigate through pages
3. Test interactions

**Expected Result**:

-   ✅ All pages render correctly
-   ✅ Navigation menu accessible (hamburger)
-   ✅ Forms are usable
-   ✅ Buttons and links clickable
-   ✅ No horizontal scrolling

**Status**: [ ] Pass [ ] Fail

---

#### Test 12.2: Viewport Zooming

**Objective**: Users can zoom in/out on pages

**Steps**:

1. Open any page
2. Use browser zoom (Ctrl + / Ctrl -)
3. Or pinch-to-zoom on mobile

**Expected Result**:

-   ✅ Page zooms correctly
-   ✅ No maximum-scale=1 restriction
-   ✅ WCAG 2.1 Level AA compliant
-   ✅ Content remains readable

**Status**: [ ] Pass [ ] Fail

---

#### Test 12.3: Keyboard Navigation

**Objective**: Site is navigable via keyboard only

**Steps**:

1. Use Tab key to navigate
2. Use Enter/Space to activate buttons
3. Use arrow keys where applicable

**Expected Result**:

-   ✅ Focus indicators visible
-   ✅ Logical tab order
-   ✅ All interactive elements accessible
-   ✅ Can complete full user flow

**Status**: [ ] Pass [ ] Fail

---

### Category 13: Error Handling

#### Test 13.1: Network Error Handling

**Objective**: App handles network failures gracefully

**Steps**:

1. Disconnect internet
2. Try to perform action (e.g., login, transaction)
3. Reconnect

**Expected Result**:

-   ✅ User-friendly error message shown
-   ✅ No app crash
-   ✅ Retry mechanism available
-   ✅ State recovers when reconnected

**Status**: [ ] Pass [ ] Fail

---

#### Test 13.2: Invalid Input Handling

**Objective**: Forms validate input and show helpful errors

**Steps**:

1. Submit login form with invalid email
2. Try to transfer negative amount
3. Enter text in number fields

**Expected Result**:

-   ✅ Validation errors displayed
-   ✅ Error messages are clear
-   ✅ Fields highlighted in red
-   ✅ Form cannot submit with invalid data

**Status**: [ ] Pass [ ] Fail

---

## 📊 UAT Summary

### Test Statistics

-   **Total Scenarios**: 50+
-   **Categories**: 13
-   **Critical Paths**: 15
-   **Nice-to-Have**: 10

### Pass Criteria

-   ✅ All critical features work as expected
-   ✅ No data loss or corruption
-   ✅ Security measures functioning
-   ✅ Performance within acceptable limits
-   ✅ UI/UX meets accessibility standards

### Defect Severity Levels

**Critical (P0)**: Blocks core functionality, data loss
**High (P1)**: Major feature broken, workaround exists
**Medium (P2)**: Minor feature issue, doesn't block workflow
**Low (P3)**: Cosmetic, enhancement request

### Sign-Off

**Tester Name**: ********\_********  
**Date**: ********\_********  
**Overall Result**: [ ] PASS [ ] FAIL  
**Comments**:

---

---

---

## 🚀 Post-UAT Actions

### If All Tests Pass

1. ✅ Mark platform as production-ready
2. ✅ Proceed with deployment
3. ✅ Set up monitoring and alerts
4. ✅ Prepare rollback plan
5. ✅ Schedule go-live

### If Tests Fail

1. 📝 Document all failures
2. 🐛 Create bug tickets with severity
3. 🔧 Fix critical and high-priority issues
4. 🔄 Re-run failed tests
5. 📊 Update test results

---

**UAT Completion Date**: ********\_********  
**Production Deployment Date**: ********\_********  
**Version Released**: 1.0.0
