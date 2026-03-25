# Payment Support Guide - International Cards & Failures

## Issue: "International Cards Not Supported"

### Problem
Customers using international credit/debit cards receive error: "International cards are not supported. Please contact our support team for help"

### Root Cause
Razorpay payment gateway requires explicit international card support configuration, which has been enabled in the system.

---

## Solution Implemented

### 1. **Automatic International Card Support**
- ✅ Backend now accepts international cards in Razorpay orders
- ✅ Frontend explicitly enables international payment methods
- ✅ Customers can try alternative payment methods

### 2. **Enhanced Error Messages**
When international card payment fails, customers see:
```
Payment failed: [Error Code] - International cards require additional verification

International Card Support:
Your international card may need additional verification. Please try:

1. Using UPI or NetBanking if available in your region
2. Contacting your card issuer to enable international transactions
3. Using a different payment method
4. Reaching out to our support team for manual payment processing

If the amount was deducted from your account, it will be credited 
back within 5-7 working days.
```

### 3. **Automatic Refund Processing**
- Payment webhook automatically logs refund events
- Refund tracking is linked to subscription records
- Support team can monitor via logs

---

## Support Team Instructions

### Handling Customer Complaints

#### Scenario 1: Payment Failed But Amount Deducted
**Customer:** "My credit card was charged but subscription didn't activate"

**Action:**
1. Note the payment ID from customer
2. Check Razorpay dashboard: https://dashboard.razorpay.com
3. Search for payment ID in Razorpay
4. Check payment status:
   - If FAILED: Initiate refund from Razorpay dashboard
   - If AUTHORIZED: Contact Razorpay support
5. Log in subscription notes: `"Refund issued for Payment ID XXX - Amount will be credited in 5-7 working days"`

#### Scenario 2: Customer Wants Manual Payment Setup
**Customer:** "Can we set up manual payment/invoice for international customers?"

**Action:**
1. Use admin dashboard to manually create subscription for user
2. Set payment method as "Manual" or "Invoice"
3. Send invoice to customer email
4. Mark as Active once payment is received

#### Scenario 3: International Card Keeps Failing
**Customer:** "Both my cards fail, but they work on other platforms"

**Action:**
1. Suggest alternative methods:
   - **UPI**: Fastest for India-based transactions
   - **NetBanking**: Works with international bank transfers
   - **PayPal**: Can route international payments
2. If customer insists:
   - Offer 3-day free trial to test the platform
   - Then process manual subscription setup with invoice

---

## Technical Details for Admin

### Webhook Events Being Tracked
Located in: `backend/src/subscription/subscription.service.ts`

1. **payment.failed**
   - Triggered when payment authorization fails
   - Logged in subscription notes
   - Support team notified

2. **payment.authorized**
   - Triggered when payment is authorized
   - Subscription activated
   - Email sent to customer

3. **refund.created**
   - Triggered when refund is issued
   - Automatically logged in subscription
   - Tracked with refund ID and amount

### Checking Webhook Logs
1. Navigate to backend logs
2. Search for "Razorpay webhook received"
3. Filter by event type: `payment.failed`, `refund.created`

### Manual Refund Process
If Razorpay refund doesn't auto-trigger:

1. Go to Razorpay Dashboard
2. Find the payment
3. Click "Refund"
4. Enter amount (typically full refund)
5. Confirm refund
6. System webhook will log it automatically

---

## Configuration Files Modified

### Backend: `subscription.service.ts`
- Added `partial_payments: true` for flexibility
- Added comprehensive webhook handler
- Webhook processes: failures, refunds, authorizations

### Frontend: `pricing-cards.tsx`
- Added `international: true` to payment methods
- Enhanced error messages for international cards
- Better UX for payment failures
- Refund timeline information

### Webhook Endpoint
- **URL:** `/subscription/razorpay/webhook`
- **Method:** POST
- **Authentication:** Already validates Razorpay signature in verify endpoint

---

## Refund Policy

### Automatic Refunds (5-7 Business Days)
- Customer payment fails: Automatic refund issued
- Amount returned to original payment method
- No manual action needed if Razorpay processes automatically

### Manual Refunds
For cases where automatic refund fails:
1. Admin initiates refund from Razorpay dashboard
2. Log the refund in subscription notes
3. Send email to customer confirming:
   - Refund amount
   - Expected credit date (5-7 business days)
   - Refund reference number

### Email Template
```
Subject: Payment Refund Confirmation - Smart GST Filing

Dear [Customer Name],

We're processing a refund for your failed subscription payment.

Refund Details:
- Amount: ₹[Amount]
- Reference Number: [Payment/Refund ID]
- Expected Credit: 5-7 business days
- Refunded to: [Last 4 digits of card used]

The refund will be credited back to your original payment method 
automatically. If you have questions, please contact our support team.

Best regards,
Smart GST Support Team
```

---

## FAQ for Support Team

**Q: Why do international cards fail?**
A: Razorpay may reject cards that don't match transaction patterns or require additional verification from the card issuer.

**Q: What's the difference between failed and declined?**
- **Failed**: System error or Razorpay issue (we handle with auto-refund)
- **Declined**: Card issuer rejected it (customer needs to contact their bank)

**Q: Can we force international card payments?**
A: No. If card issuer declines, transaction fails. We've enabled support, but final decision is with the bank.

**Q: How long for refund to appear?**
A: 5-7 business days typically, but depends on customer's bank.

**Q: Should we disable international cards again?**
A: No. We've configured proper support. Customers benefit from the option.

---

## Escalation Contacts

1. **Razorpay Support**
   - Email: support@razorpay.com
   - Dashboard: https://dashboard.razorpay.com
   - Live Chat: Available in dashboard

2. **Customer Support Escalation**
   - Issue: International customer can't pay any other way
   - Action: Approve manual subscription + invoice

3. **Technical Issues**
   - Contact: Backend development team
   - For: Webhook failures, payment verification issues

---

## Next Steps (Future Enhancements)

1. **Add Multiple Payment Gateways**
   - PayPal for international customers
   - Stripe for broader card support
   - Local payment methods per region

2. **Implement Retry Logic**
   - Automatic retry on payment failure
   - Progressive delay (2x backoff)
   - Max 3 retries before manual intervention

3. **Admin Dashboard Features**
   - Real-time payment failure alerts
   - Refund management interface
   - Customer payment history visibility
   - Manual subscription override

4. **Email Notifications**
   - Payment failure alerts to customer
   - Refund processing updates
   - Alternative payment suggestions
