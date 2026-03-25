'use client';

import React from 'react';
import { Check, Zap } from 'lucide-react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useRouter } from 'next/navigation';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface PricingPlan {
  name: string;
  billingPeriod: string;
  price: number;
  priceDisplay: string;
  popular?: boolean;
  features: string[];
  planType: string;
}

const TEST_MODE_UPI_SUCCESS = 'success@razorpay';
const TEST_MODE_UPI_FAILURE = 'failure@razorpay';

const pricingPlans: PricingPlan[] = [
  {
    name: 'Monthly',
    billingPeriod: 'month',
    price: 999,
    priceDisplay: '₹999',
    planType: 'Monthly',
    features: [
      'Core GST filing workflows',
      'Invoice and record management',
      'Email support',
      'Basic reporting',
      'Data backup',
      'Dashboard access',
    ],
  },
  {
    name: 'Half Yearly',
    billingPeriod: '6 months',
    price: 5499,
    priceDisplay: '₹5,499',
    popular: true,
    planType: 'HalfYearly',
    features: [
      'Standard GST return support',
      'Extended invoice handling',
      'Priority support',
      'Business analytics',
      'API access',
      'Multi-user support',
      'Custom integrations',
      'Audit trail',
    ],
  },
  {
    name: 'Yearly',
    billingPeriod: 'year',
    price: 9999,
    priceDisplay: '₹9,999',
    planType: 'Yearly',
    features: [
      'Multi-location support',
      'Dedicated account manager',
      'Custom integrations',
      'White-label solution',
      'Priority phone support',
      'Advanced security',
      'Custom reports',
      'Training sessions',
    ],
  },
];

const getTestModeHint = (code: string, description: string) => {
  const text = `${code} ${description}`.toLowerCase();

  const commonTestCredentials =
    'Use test card: 4111 1111 1111 1111 | Expiry: any future date | CVV: any 3 digits | OTP: 123456';
  
  if (text.includes('international') || text.includes('card_not_supported')) {
    return `International cards require additional verification. Try these options:\n1. Use UPI or NetBanking if available in your country\n2. Contact support for manual payment processing\n3. Use an Indian Debit/Credit card for faster processing\n\n${commonTestCredentials}`;
  }

  if (text.includes('incorrect card details') || text.includes('card details')) {
    return `You are in Razorpay test mode, so real card details usually fail.\n${commonTestCredentials}`;
  }

  if (text.includes('bad_request') || text.includes('invalid')) {
    return `This is Razorpay test mode. Use Razorpay test credentials for the selected method and complete the bank/UPI authorization screen.\n${commonTestCredentials}`;
  }

  if (text.includes('cancelled') || text.includes('dismissed')) {
    return 'Payment popup was closed before completion. Retry and finish all steps in the Razorpay window.';
  }

  return `In test mode, real bank/card/UPI credentials often fail. Use Razorpay test credentials for the method you selected.\n${commonTestCredentials}`;
};

export function PricingCards() {
  const { user } = useUser();
  const router = useRouter();

  const loadRazorpayScript = async (): Promise<boolean> => {
    if (typeof window === 'undefined') {
      return false;
    }

    if (window.Razorpay) {
      return true;
    }

    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePlanSelect = async (planType: string) => {
    try {
      if (!user?.sub) {
        alert('Please login first');
        return;
      }

      const razorpayLoaded = await loadRazorpayScript();
      if (!razorpayLoaded) {
        alert('Unable to load Razorpay. Please check internet and try again.');
        return;
      }

      const orderResponse = await fetch('/api/subscription/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.sub,
          planType,
        }),
      });

      if (!orderResponse.ok) {
        const errorPayload = await orderResponse.json().catch(() => null);
        throw new Error(errorPayload?.error || 'Failed to create payment order');
      }

      const order = await orderResponse.json();
      const isTestMode = typeof order.keyId === 'string' && order.keyId.startsWith('rzp_test_');

      const options = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'Smart GST',
        description: `${planType} subscription`,
        order_id: order.orderId,
        prefill: {
          name: user.name || '',
          email: user.email || '',
        },
        notes: {
          userId: user.sub,
          planType,
        },
        theme: {
          color: '#2563eb',
        },
        method: {
          upi: true,
          netbanking: true,
          card: true,
          wallet: true,
          paylater: true,
          emi: true,
          international: true,
        },
        retry: {
          enabled: true,
          max_count: 2,
        },
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          try {
            const verifyResponse = await fetch('/api/subscription/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: user.sub,
                planType,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                notes: 'Self-service purchase from pricing screen',
              }),
            });

            if (!verifyResponse.ok) {
              const errorPayload = await verifyResponse.json().catch(() => null);
              throw new Error(errorPayload?.error || 'Payment verification failed');
            }

            alert(`${planType} plan activated successfully.`);
            router.push('/dashboard');
            router.refresh();
          } catch (verifyError: any) {
            console.error('Payment verification failed:', verifyError);
            alert(
              `Payment was completed but verification failed. Please contact support with Payment ID ${response.razorpay_payment_id}.`,
            );
          }
        },
        modal: {
          ondismiss: () => {
            console.log('Razorpay checkout dismissed');
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', (failure: any) => {
        const description = failure?.error?.description || 'Payment failed';
        const code = failure?.error?.code || '';
        const paymentId = failure?.error?.metadata?.payment_id || 'N/A';

        // Check for international card specific errors
        if (description.toLowerCase().includes('international') || code.includes('card_not_supported')) {
          console.warn('Payment failed (international/card_not_supported):', {
            code,
            description,
            paymentId,
          });
          return;
        }

        if (isTestMode) {
          const testHint = getTestModeHint(code, description);
          console.warn('Payment failed (test mode):', {
            code: code || 'unknown_error',
            description,
            paymentId,
            hint: testHint,
          });
          return;
        }

        console.warn('Payment failed:', {
          code: code || 'unknown_error',
          description,
          paymentId,
        });
      });
      razorpay.open();
    } catch (error) {
      console.error('Error selecting plan:', error);
      alert((error as Error)?.message || 'Error selecting plan. Please try again.');
    }
  };

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Simple, Transparent Pricing</h2>
        <p className="text-xl text-gray-600">
          Start with a 30-day free trial. No credit card required.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {pricingPlans.map((plan) => (
          <div
            key={plan.planType}
            className={`rounded-lg overflow-hidden transition-all duration-300 ${
              plan.popular
                ? 'ring-2 ring-purple-600 shadow-2xl transform scale-105'
                : 'border border-gray-200 shadow-lg'
            }`}
          >
            {plan.popular && (
              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-center py-2 font-semibold text-sm">
                Most Popular
              </div>
            )}

            <div
              className={`p-8 ${
                plan.popular ? 'bg-gradient-to-br from-purple-50 to-indigo-50' : 'bg-white'
              }`}
            >
              {/* Plan Name and Price */}
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="flex items-baseline">
                  <span className="text-4xl font-bold text-gray-900">{plan.priceDisplay}</span>
                  <span className="text-gray-600 ml-2">/ {plan.billingPeriod}</span>
                </div>
              </div>

              {/* Description */}
              <p className="text-gray-600 text-sm mb-6">
                {plan.name === 'Monthly' && 'Flexible monthly billing for regular GST operations'}
                {plan.name === 'Half Yearly' &&
                  'Balanced option for medium-term compliance planning'}
                {plan.name === 'Yearly' && 'Long-term billing for full-year GST management'}
              </p>

              {/* CTA Button */}
              <button
                onClick={() => handlePlanSelect(plan.planType)}
                className={`w-full py-3 rounded-lg font-semibold mb-8 transition-all duration-200 ${
                  plan.popular
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {plan.popular ? '→ Choose Half Yearly' : 'Choose Plan'} →
              </button>

              {/* Features List */}
              <div className="space-y-4">
                <p className="font-semibold text-gray-800 text-sm mb-4">
                  What's included:
                </p>
                {plan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Additional Info */}
      <div className="mt-16 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-50 px-6 py-3 rounded-full">
          <Zap className="w-5 h-5 text-blue-600" />
          <p className="text-gray-700">
            First 30 days are free! Cancel anytime.
          </p>
        </div>
        <p className="mt-4 text-sm text-gray-600">
          Test mode: Use UPI ID {TEST_MODE_UPI_SUCCESS} for success and {TEST_MODE_UPI_FAILURE} for failure.
        </p>
      </div>
    </div>
  );
}
