'use client';

import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, Zap } from 'lucide-react';
import { useUser } from '@auth0/nextjs-auth0/client';

declare global {
  interface Window {
    Razorpay: any;
  }
}

type PlanType = 'Monthly' | 'HalfYearly' | 'Yearly';

const TEST_MODE_UPI_SUCCESS = 'success@razorpay';
const TEST_MODE_UPI_FAILURE = 'failure@razorpay';

const planConfig: Array<{ planType: PlanType; title: string; priceDisplay: string; period: string }> = [
  { planType: 'Monthly', title: 'Monthly', priceDisplay: '₹999', period: '/month' },
  { planType: 'HalfYearly', title: 'Half Yearly', priceDisplay: '₹5,499', period: '/6 months' },
  { planType: 'Yearly', title: 'Yearly', priceDisplay: '₹9,999', period: '/year' },
];

const getTestModeHint = (code: string, description: string) => {
  const text = `${code} ${description}`.toLowerCase();
  if (text.includes('bad_request') || text.includes('invalid')) {
    return 'This is Razorpay test mode. Use Razorpay test credentials for the selected method and complete the bank/UPI authorization screen.';
  }

  if (text.includes('cancelled') || text.includes('dismissed')) {
    return 'Payment popup was closed before completion. Retry and finish all steps in the Razorpay window.';
  }

  return 'In test mode, real bank/card/UPI credentials often fail. Use Razorpay test credentials for the method you selected.';
};

interface SubscriptionStatus {
  plan: string;
  isTrialActive: boolean;
  activeSubscription: any;
  trialEndDate: string | null;
  subscriptionEndDate: string | null;
}

export function SubscriptionStatus() {
  const { user, isLoading: isUserLoading } = useUser();
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [processingPlan, setProcessingPlan] = useState<PlanType | null>(null);

  useEffect(() => {
    if (isUserLoading) {
      return;
    }

    if (user?.sub) {
      fetchSubscriptionStatus(user.sub);
      return;
    }

    setLoading(false);
  }, [isUserLoading, user?.sub]);

  const fetchSubscriptionStatus = async (userId: string) => {
    try {
      const response = await fetch(
        `/api/subscription/user-status?userId=${userId}`,
        {
          cache: 'no-store',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch subscription status');
      }

      const data = await response.json();
      setStatus(data);
    } catch (err) {
      console.error('Error fetching subscription status:', err);
    } finally {
      setLoading(false);
    }
  };

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

  const startPlanPurchase = async (planType: PlanType) => {
    if (!user?.sub) {
      alert('Please login first');
      return;
    }

    const userId = user.sub;

    try {
      setProcessingPlan(planType);
      const razorpayLoaded = await loadRazorpayScript();
      if (!razorpayLoaded) {
        throw new Error('Unable to load Razorpay. Please check internet and try again.');
      }

      const orderResponse = await fetch('/api/subscription/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, planType }),
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
          userId,
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
                userId,
                planType,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                notes: 'Dashboard popup plan purchase',
              }),
            });

            if (!verifyResponse.ok) {
              const errorPayload = await verifyResponse.json().catch(() => null);
              throw new Error(errorPayload?.error || 'Payment verification failed');
            }

            setIsPlanModalOpen(false);
            await fetchSubscriptionStatus(userId);
            alert(`${planType} plan activated successfully.`);
          } catch (verifyError: any) {
            console.error('Payment verification failed:', verifyError);
            alert(
              `Payment was completed but verification failed. Please contact support with Payment ID ${response.razorpay_payment_id}.`,
            );
          }
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', (failure: any) => {
        const description = failure?.error?.description || 'Payment failed';
        const code = failure?.error?.code || '';
        const paymentId = failure?.error?.metadata?.payment_id || 'N/A';

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
    } catch (error: any) {
      console.error('Plan purchase failed:', error);
      alert(error?.message || 'Unable to start plan purchase. Please try again.');
    } finally {
      setProcessingPlan(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!status) {
    return null;
  }

  const isTrialActive = status.isTrialActive;
  const isProActive = status.activeSubscription && !isTrialActive;
  const trialEndDate = status.trialEndDate ? new Date(status.trialEndDate) : null;
  const subscriptionEndDate = status.subscriptionEndDate
    ? new Date(status.subscriptionEndDate)
    : null;

  const getTrialDaysRemaining = () => {
    if (!trialEndDate) return 0;
    const now = new Date();
    const days = Math.ceil((trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, days);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const planModal = isPlanModalOpen ? (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl p-6 md:p-8">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-xl md:text-2xl font-bold text-gray-900">Choose Premium Plan</h3>
          <button
            onClick={() => setIsPlanModalOpen(false)}
            className="text-sm px-3 py-1 rounded-md border border-gray-300 hover:bg-gray-50"
          >
            Close
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {planConfig.map((plan) => (
            <div key={plan.planType} className="border border-gray-200 rounded-xl p-4">
              <h4 className="font-semibold text-gray-900 text-lg">{plan.title}</h4>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {plan.priceDisplay}
                <span className="text-sm font-medium text-gray-500 ml-1">{plan.period}</span>
              </p>
              <button
                onClick={() => startPlanPurchase(plan.planType)}
                disabled={processingPlan === plan.planType}
                className="mt-4 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2 rounded-lg"
              >
                {processingPlan === plan.planType ? 'Processing...' : `Pay ${plan.priceDisplay}`}
              </button>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-gray-500">
          Test mode tip: Use UPI ID {TEST_MODE_UPI_SUCCESS} for success and {TEST_MODE_UPI_FAILURE} for failure.
        </p>
      </div>
    </div>
  ) : null;

  if (isTrialActive) {
    const daysRemaining = getTrialDaysRemaining();
    const daysUsed = 30 - daysRemaining;
    const progressPercentage = (daysUsed / 30) * 100;

    return (
      <>
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-lg border-2 border-blue-300 p-6 shadow-md">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 rounded-full p-3">
                <Zap className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-lg">Free Trial Active</h3>
                <p className="text-gray-600">{daysRemaining} days remaining</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">
                Expires {formatDate(trialEndDate!)}
              </div>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Trial Progress</span>
              <span>{daysUsed}/30 days</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>

          <button
            onClick={() => setIsPlanModalOpen(true)}
            className="mt-4 w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-2 rounded-lg transition-all"
          >
            Upgrade to Pro
          </button>
        </div>
        {planModal}
      </>
    );
  }

  if (isProActive && status.activeSubscription) {
    const planType = status.activeSubscription.planType;
    const endDate = subscriptionEndDate;

    return (
      <div className="bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 rounded-lg border-2 border-green-300 p-6 shadow-md">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 rounded-full p-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-lg">Pro Plan Active</h3>
              <p className="text-gray-600">{planType} billing</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">
              Expires {formatDate(endDate!)}
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="bg-white bg-opacity-50 rounded p-3">
            <div className="text-xs text-gray-600 font-medium">Plan Type</div>
            <div className="text-lg font-semibold text-gray-900">{planType}</div>
          </div>
          <div className="bg-white bg-opacity-50 rounded p-3">
            <div className="text-xs text-gray-600 font-medium">Status</div>
            <div className="text-lg font-semibold text-green-600">Active</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border-2 border-gray-300 p-6 shadow-md">
      <div className="flex items-center gap-3">
        <div className="bg-gray-100 rounded-full p-3">
          <AlertCircle className="w-6 h-6 text-gray-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 text-lg">Trial Expired</h3>
          <p className="text-gray-600">Upgrade to Pro to continue using the service</p>
        </div>
      </div>

      <button
        onClick={() => setIsPlanModalOpen(true)}
        className="mt-4 w-full bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900 text-white font-semibold py-2 rounded-lg transition-all"
      >
        View Plans
      </button>

      {planModal}
    </div>
  );
}
