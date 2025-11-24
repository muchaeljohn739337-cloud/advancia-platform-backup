# Payment Error & Status Codes

Standardized `code` values returned by payment-related endpoints in `backend/src/routes/paymentsEnhanced.ts` and related webhook flows. Each entry lists: Code, Typical HTTP Status, Meaning, Client Handling Guidance.

| Code                               | HTTP | Meaning                                                          | Client Handling                                         |
| ---------------------------------- | ---- | ---------------------------------------------------------------- | ------------------------------------------------------- |
| STRIPE_NOT_CONFIGURED              | 503  | Stripe keys/webhook secret missing or invalid server config      | Show maintenance banner; retry after admin fixes config |
| MISSING_PAYMENT_METHOD_ID          | 400  | Required `paymentMethodId` not provided                          | Prompt user to select or add a payment method           |
| USER_NOT_FOUND                     | 404  | Auth user record missing (race condition or deleted)             | Force logout and redirect to signup/login               |
| PAYMENT_METHOD_SAVED               | 200  | New payment method persisted/attached                            | Show success toast; update local list                   |
| PAYMENT_METHODS_LIST               | 200  | List of payment methods returned (may be empty)                  | Render list; if empty show onboarding CTA               |
| NO_PAYMENT_METHODS                 | 404  | User has no Stripe customer / saved methods                      | Offer add payment method flow                           |
| UNAUTHORIZED_PAYMENT_METHOD        | 403  | Attempt to remove/access method not owned by user                | Show permission error; do not retry                     |
| PAYMENT_METHOD_REMOVED             | 200  | Payment method detached successfully                             | Remove item locally; toast success                      |
| INVALID_AMOUNT                     | 400  | Amount missing, non-numeric, or <= 0                             | Validate form; highlight amount field                   |
| SUBSCRIPTION_CREATED               | 200  | New subscription initiated                                       | Show active subscription UI, store ID                   |
| SUBSCRIPTIONS_LIST                 | 200  | Subscription list returned                                       | Render current status; if empty offer upgrade plan      |
| UNAUTHORIZED_SUBSCRIPTION          | 403  | User attempted to cancel subscription they do not own            | Display error; refresh list                             |
| SUBSCRIPTION_CANCELED_IMMEDIATE    | 200  | Subscription fully canceled now                                  | Update UI to reflect cancellation immediately           |
| SUBSCRIPTION_CANCEL_SCHEDULED      | 200  | Cancellation scheduled at period end                             | Show banner with remaining time                         |
| MISSING_PAYMENT_METHOD_OR_AMOUNT   | 400  | Off-session charge missing method or amount invalid              | Validate inputs before POST                             |
| CUSTOMER_NOT_FOUND                 | 404  | Stripe customer ID absent for user                               | Initiate customer creation or prompt add method         |
| PAYMENT_INTENT_OFF_SESSION_SUCCESS | 200  | Off-session PaymentIntent created & confirmation status returned | Show success; track intent ID                           |
| CARD_ERROR                         | 400  | Stripe card error (decline, insufficient funds, etc.)            | Show card-specific message; offer new method            |
| OFF_SESSION_PAYMENT_FAILED         | 500  | Generic failure after off-session attempt                        | Retry with user confirmation or new method              |
| PAYMENT_INTENT_REUSED              | 200  | Existing recent intent reused instead of creating new            | Use returned intent; avoid duplicate UI                 |
| PAYMENT_INTENT_CREATE_FAILED       | 500  | Stripe API error while creating PaymentIntent                    | Allow manual retry; log to monitoring                   |
| MISSING_PAYMENT_INTENT_ID          | 400  | Required intent ID absent in refund / charge lookup              | Bug in client; re-request intent list                   |
| CHARGE_NOT_FOUND                   | 404  | Charge for given PaymentIntent not found                         | Refresh or wait for webhook completion                  |
| REFUND_SUCCESS                     | 200  | Refund processed successfully                                    | Show refund confirmation; update transaction status     |
| REFUND_FAILED                      | 500  | Error from Stripe when refunding                                 | Provide admin retry option; escalate if persistent      |

## Webhook Event Status (Socket Emissions)

Webhook (`paymentsWebhook.ts`) emits `payment-status` with fields: `paymentIntentId`, `status`, `amount`, `currency`. These do not include a `code` but statuses map to Stripe lifecycle:

| Status                  | Meaning                                                | Recommended UI                               |
| ----------------------- | ------------------------------------------------------ | -------------------------------------------- |
| succeeded               | Payment captured                                       | Mark transaction as complete                 |
| processing              | Awaiting confirmation/capture                          | Spinner / pending badge                      |
| requires_payment_method | Previous attempt failed; new method needed             | Prompt user to update card                   |
| requires_action         | Additional auth needed (3DS/SCA)                       | Trigger Stripe.js handleCardAction           |
| canceled                | Intent canceled (timeout or manual)                    | Show canceled badge; allow restart           |
| requires_confirmation   | Created; awaiting server confirmation                  | Short pending state                          |
| requires_capture        | Authorized but not captured                            | Admin capture UI (if manual capture enabled) |
| failed                  | Terminal failure (mapped internally when charges fail) | Show failure banner; allow retry             |

## Client Implementation Notes

-   Always branch logic on `response.code` when present instead of parsing `error` string.
-   Retry Strategy: Only retry automatically on transient 5xx (e.g., `PAYMENT_INTENT_CREATE_FAILED`, `REFUND_FAILED`). Do NOT auto-retry card declines (`CARD_ERROR`).
-   Idempotency: `PAYMENT_INTENT_REUSED` indicates server reused an existing intent—client should not create another.
-   Logging: Log all non-2xx codes plus `CARD_ERROR` with sufficient context (userId, amount, intentId).
-   Telemetry: Tag metrics with `code` to aggregate failure types.

## Adding New Codes

1. Prefer UPPER_SNAKE_CASE.
2. Keep semantics narrow & action-oriented.
3. Ensure unique mapping to a single decision branch.
4. Add entry to this file immediately with handling guidance.

## Deprecation Policy

-   Codes can be deprecated by removing them from responses and adding a note here (Deprecated) for one release cycle before deletion.

## Versioning

-   Maintain changes via git history; no separate versioning needed. Consider adding a "Last Updated" line if change frequency grows.

_Last Updated: 2025-11-20_

## Common Error Patterns

### Payment Declined

-   **Code:** `CARD_ERROR`
-   **HTTP Status:** `400`
-   **Meaning:** The card was declined, has insufficient funds, or another issue preventing the charge.
-   **Client Handling:** Display a user-friendly error message indicating the card issue. Suggest the user check their card details, ensure sufficient funds, or try a different payment method.
