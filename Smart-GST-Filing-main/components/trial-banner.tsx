'use client';

import React, { useEffect, useState } from 'react';
import { X, AlertCircle, Zap } from 'lucide-react';

export function TrialBanner() {
  const [trialStatus, setTrialStatus] = useState<any>(null);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrialStatus();
  }, []);

  const fetchTrialStatus = async () => {
    try {
      const auth0User = (window as any).auth0User;
      if (!auth0User?.sub) {
        return;
      }

      const response = await fetch(
        `/api/subscription/trial-status?userId=${auth0User.sub}`,
        {
          cache: 'no-store',
        }
      );

      if (response.ok) {
        const data = await response.json();
        setTrialStatus(data);
      }
    } catch (error) {
      console.error('Error fetching trial status:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || dismissed || !trialStatus?.isTrialActive) {
    return null;
  }

  const daysRemaining = trialStatus.daysRemaining || 0;
  const isUrgent = daysRemaining <= 3;
  const isExpiring = daysRemaining <= 7;

  return (
    <div
      className={`${
        isUrgent
          ? 'bg-gradient-to-r from-red-500 via-orange-500 to-red-600'
          : isExpiring
            ? 'bg-gradient-to-r from-amber-500 to-orange-500'
            : 'bg-gradient-to-r from-blue-500 to-indigo-600'
      } text-white px-4 py-3 flex items-center justify-between shadow-lg`}
    >
      <div className="flex items-center gap-3 flex-1">
        {isUrgent ? (
          <AlertCircle className="w-5 h-5 flex-shrink-0 animate-pulse" />
        ) : (
          <Zap className="w-5 h-5 flex-shrink-0" />
        )}
        <div className="flex-1">
          <span className="font-semibold">
            Free Trial: {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} remaining
          </span>
          <p className="text-sm opacity-90">
            {isUrgent
              ? 'Your trial is expiring soon!'
              : isExpiring
                ? 'Upgrade to Pro to keep using all features'
                : 'Upgrade to Pro to continue using this service after your trial'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 ml-4">
        <a
          href="/pricing"
          className="bg-white text-blue-600 hover:bg-gray-100 px-4 py-2 rounded font-semibold text-sm transition-colors"
        >
          Upgrade Now
        </a>
        <button
          onClick={() => setDismissed(true)}
          className="bg-white/20 hover:bg-white/30 p-1.5 rounded transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
