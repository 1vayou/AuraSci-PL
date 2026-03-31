'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { useAppStore } from '@/store';
import { CheckCircle2, ArrowLeft } from 'lucide-react';

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const addPatronage = useAppStore((s) => s.addPatronage);
  const processed = useRef(false);

  const intentId = searchParams.get('intent_id');
  const amount = parseFloat(searchParams.get('amount') ?? '0');
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (intentId && amount > 0 && !processed.current) {
      processed.current = true;
      addPatronage(intentId, {
        id: `stripe_${sessionId?.slice(0, 12) ?? Date.now()}`,
        name: 'Stripe Patron',
        amountUSDC: amount,
        escrowTxHash: `0xStripe${sessionId?.slice(0, 20) ?? Date.now().toString(16)}`,
      });
    }
  }, [intentId, amount, sessionId, addPatronage]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl border border-gray-100 p-8 max-w-md w-full mx-4 text-center shadow-lg">
        <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-emerald-500" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
        <p className="text-sm text-gray-500 mb-1">
          ${amount.toLocaleString()} USDC funded via Stripe
        </p>
        <p className="text-xs text-gray-400 mb-6">
          Funds have been escrowed under EIP-8183. They will be released upon milestone verification.
        </p>
        {sessionId && (
          <p className="text-xs text-gray-300 font-mono mb-6 truncate">
            Session: {sessionId}
          </p>
        )}
        <div className="flex gap-3">
          <button
            onClick={() => router.push(intentId ? `/intent/${intentId}` : '/market')}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-orange-500 text-white text-sm font-medium rounded-xl hover:bg-orange-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Intent
          </button>
          <button
            onClick={() => router.push('/market')}
            className="flex-1 py-2.5 bg-gray-50 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-100 transition-colors"
          >
            Browse Market
          </button>
        </div>
      </div>
    </div>
  );
}
