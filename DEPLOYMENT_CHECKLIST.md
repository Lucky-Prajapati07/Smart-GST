# International Card Payment Support - Deployment Checklist

## Pre-Deployment

- [ ] Review all changes in PR
- [ ] Run backend tests
- [ ] Run frontend tests
- [ ] Load test Razorpay integration
- [ ] Test with Razorpay test credentials (international cards)

## Configuration Changes Required

### Razorpay Account Setup
1. [ ] Login to https://dashboard.razorpay.com
2. [ ] Go to Settings → Payment Methods
3. [ ] Ensure "International Cards" is enabled
4. [ ] Verify card networks: Visa, Mastercard, Amex enabled
5. [ ] Check 3D Secure settings (recommended: Conditional)

### Environment Variables
- [ ] `RAZORPAY_KEY_ID`: rzp_test_SVSgp8Hd9a8GIl (already configured)
- [ ] `RAZORPAY_KEY_SECRET`: vwtLS9lIhuoPrV2Ov3768MUO (already configured)

### Backend Configuration
- [ ] Verify webhook endpoint is accessible: `/subscription/razorpay/webhook`
- [ ] Configure Razorpay webhook: POST to your domain + `/subscription/razorpay/webhook`
- [ ] Test webhook with Razorpay test events

### Frontend Configuration
- [ ] Verify `NEXT_PUBLIC_API_URL` points to correct backend
- [ ] Test Razorpay script loading from CDN
- [ ] Verify error messages display correctly

## Code Changes to Deploy

### Backend Files
- [ ] `src/subscription/subscription.service.ts` - Updated with international card support and webhook handler
- [ ] `src/subscription/subscription.controller.ts` - Added webhook endpoint

### Frontend Files
- [ ] `components/pricing-cards.tsx` - Updated Razorpay config and error handling

### Documentation Files
- [ ] `PAYMENT_SUPPORT_GUIDE.md` - Support guidelines (for team reference)

## Deployment Steps

1. **Staging Environment**
   ```bash
   # Backend
   cd backend
   npm install  # (if new dependencies)
   npm run build
   npm run start:dev
   
   # Frontend
   cd Smart-GST-Filing-main
   npm install  # (if new dependencies)
   npm run build
   npm run dev
   ```

2. **Test in Staging**
   - [ ] Test international card payment with Razorpay test mode
   - [ ] Simulate payment failure and verify error message
   - [ ] Check webhook delivery and logging
   - [ ] Verify email notifications work

3. **Production Deployment**
   ```bash
   # Follow your normal deployment process
   # Update backend
   # Update frontend
   # Verify Razorpay webhook configuration points to production URL
   ```

## Post-Deployment Verification

### Backend
- [ ] Webhook endpoint is accessible
- [ ] Razorpay credentials are correct
- [ ] Order creation works for all plan types
- [ ] Payment verification succeeds for valid payments
- [ ] Webhook events are being received and logged

### Frontend
- [ ] Pricing page loads correctly
- [ ] Razorpay checkout opens with international payment methods
- [ ] Error messages display for failed payments
- [ ] Successful payments redirect to dashboard

### End-to-End Flow
1. [ ] Test complete payment flow with test card
2. [ ] Verify subscription is created
3. [ ] Confirm user sees "Pro" plan in dashboard
4. [ ] Check subscription end date is correct

## Rollback Plan

If issues occur:
1. Revert `subscription.service.ts` to previous version
2. Revert `pricing-cards.tsx` to previous version
3. Remove webhook endpoint from `subscription.controller.ts`
4. Redeploy backend and frontend
5. Verify old payment flow still works

## Monitoring (Post-Deployment)

### Dashboard Metrics
- Monitor payment success rate
- Track international card vs domestic cards
- Alert on webhook failures
- Alert on refund volume spikes

### Logs to Monitor
```bash
# Check for payment failures
grep "payment.failed" backend-logs

# Check for webhook issues
grep "Razorpay webhook" backend-logs

# Check for refunds
grep "refund.created" backend-logs
```

### Customer Support
- [ ] Train support team on new error messages
- [ ] Share PAYMENT_SUPPORT_GUIDE.md with team
- [ ] Setup alert for payment failure reports
- [ ] Monitor refund requests

## Success Criteria

✓ All test cases passed
✓ International cards can attempt payment (even if some fail)
✓ Payment failures are handled gracefully
✓ Error messages guide customers to solutions
✓ Refunds are processed automatically
✓ No degradation in payment success rate for domestic users
✓ Support team can troubleshoot payment issues

## Timeline

- **Pre-deployment Testing**: 2 hours
- **Staging Deployment**: 1 hour
- **Staging Verification**: 2 hours
- **Production Deployment**: 1 hour
- **Production Verification**: 1 hour
- **Total**: ~7 hours

## Contact for Issues

- **Backend Issues**: Dev Team
- **Frontend Issues**: Frontend Team
- **Payment Issues**: Razorpay Support (support@razorpay.com)
- **Customer Support**: Support Team (escalate to dev team)
