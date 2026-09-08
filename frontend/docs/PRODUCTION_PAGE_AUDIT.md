# Production Page & State Audit

## Verified Project Data
- **Application Type:** College Campus Canteen / Food Delivery App (Next.js + Express/Prisma)
- **Authentication Model:** Custom JWT/Bcrypt based authentication for Students, Vendors, and Admins.
- **Payment/Business Model:** Campus Credits System (Virtual wallet/points). No real external payment gateway (Stripe/Razorpay) is currently integrated.
- **Important User Roles:** Student, Vendor, Admin, Rider.
- **Data-Sensitive Features:** Geolocation tracking for riders, Student profile data (name, email, phone).

## Audit Table

| Category | Page or state | Status | Evidence | Applicability reason | Required action |
|---|---|---|---|---|---|
| Legal | Privacy Policy | EXISTS_AND_ADEQUATE | `app/privacy/page.tsx` exists but lacks formal legal entity names and data retention details | Collects student location and order history | Mark as needing review; request missing legal entity details from user |
| Legal | Terms of Service | EXISTS_AND_ADEQUATE | `app/terms/page.tsx` exists but lacks jurisdiction and entity names | Governs campus orders and credits | Request missing entity and jurisdiction |
| Legal | Cookie Policy | NOT_APPLICABLE | Codebase scan shows no tracking cookies (only auth JWT in localStorage/Auth Context) | No marketing/tracking cookies used | None |
| Legal | Cookie Preferences | NOT_APPLICABLE | No non-essential cookies used | No consent required | None |
| Legal | Refund Policy | EXISTS_AND_ADEQUATE | `app/refunds/page.tsx` exists but uses generic terms | Credits/wallet system needs explicit refund rules | Request actual refund rules from user |
| Legal | Cancellation Policy | EXISTS_AND_ADEQUATE | No explicit cancellation terms in UI/docs | Orders can be cancelled before preparation | Add cancellation rules to Terms |
| Legal | Shipping Policy | NOT_APPLICABLE | Uses local campus delivery via riders | It's local delivery, not shipping | None |
| Legal | Return / Exchange Policy | NOT_APPLICABLE | Food items cannot be returned | Perishable goods | None |
| Legal | Disclaimer | NOT_APPLICABLE | Standard food app, no high-risk advice | Not a high-risk information service | None |
| Legal | Accessibility Statement | EXISTS_AND_ADEQUATE | No statement exists | Public-facing UI | Add placeholder; cannot claim WCAG yet |
| Legal | Data Processing Agreement | NOT_APPLICABLE | B2C app, not B2B data processor | Doesn't process data for other businesses | None |
| Legal | Acceptable Use Policy | EXISTS_AND_ADEQUATE | Missing | Needed for reviews and AI Waiter usage | Add to Terms |
| Legal | Security Policy | EXISTS_AND_ADEQUATE | Missing | Collects PII and location | Draft basic security policy |
| Legal | Responsible Disclosure | NOT_APPLICABLE | Small college project | No bug bounty program exists | None |
| Legal | Community Guidelines | EXISTS_AND_ADEQUATE | Missing | Reviews feature allows UGC | Draft basic review guidelines |
| Customer Lifecycle | Login | EXISTS_AND_ADEQUATE | `app/(auth)/login/page.tsx` | JWT Auth exists | None |
| Customer Lifecycle | Register | EXISTS_AND_ADEQUATE | `app/(auth)/signup/page.tsx` | Signup exists | None |
| Customer Lifecycle | Email Verification | NOT_APPLICABLE | No SMTP or email verification logic in backend auth controller | Not implemented | None |
| Customer Lifecycle | Forgot Password | EXISTS_AND_ADEQUATE | Missing from auth routes | Standard account feature | Blocked by missing SMTP/Email provider |
| Customer Lifecycle | Reset Password | EXISTS_AND_ADEQUATE | Missing | Standard account feature | Blocked by missing SMTP |
| Customer Lifecycle | Onboarding | NOT_APPLICABLE | Profile creation handles setup | App is self-explanatory | None |
| Customer Lifecycle | Account Settings | EXISTS_AND_ADEQUATE | `app/shop/profile/page.tsx` exists but lacks password change | Needs basic security controls | Add password change UI |
| Customer Lifecycle | Billing | NOT_APPLICABLE | Uses prepaid Campus Credits | No subscriptions or recurring billing | None |
| Customer Lifecycle | Upgrade / Downgrade | NOT_APPLICABLE | No subscriptions | N/A | None |
| Customer Lifecycle | Cancel Subscription | NOT_APPLICABLE | No subscriptions | N/A | None |
| Customer Lifecycle | Payment Success | NOT_APPLICABLE | Credit deduction is instant in cart | No external gateway redirect | None |
| Customer Lifecycle | Payment Failed | NOT_APPLICABLE | Credit check is synchronous | No external gateway | None |
| Customer Lifecycle | Support / Help | EXISTS_AND_ADEQUATE | `app/contact/page.tsx` exists but lacks real contact info | Needs real support emails/phones | Request details from user |
| UX States | 404 | EXISTS_AND_ADEQUATE | `app/not-found.tsx` | Catch-all unknown routes | None |
| UX States | 403 | EXISTS_AND_ADEQUATE | No dedicated 403 page | Role-based routing needs clear denied state | Implement 403 UI |
| UX States | 500 | EXISTS_AND_ADEQUATE | No `error.tsx` found in root | Standard error boundary | Implement global `error.tsx` |
| UX States | Maintenance | EXISTS_AND_ADEQUATE | No maintenance mode | Important for deployments | Implement simple flag/state |
| UX States | Offline | EXISTS_AND_ADEQUATE | PWA manifest exists but no offline UI | PWA requires offline state | Implement offline banner |
| UX States | Empty State | EXISTS_AND_ADEQUATE | Seen in cart and orders | Already used | None |
| UX States | Loading State | EXISTS_AND_ADEQUATE | Used across UI (Loader2) | Already used | None |
| UX States | Session Expired | EXISTS_AND_ADEQUATE | Missing automatic redirect on 401 | JWT expiry needs smooth UX | Add interceptor logic |

