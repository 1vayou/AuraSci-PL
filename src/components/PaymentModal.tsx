'use client';

import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { parseUnits } from 'viem';
import { X, CreditCard, Wallet, Loader2, CheckCircle2, AlertCircle, Zap } from 'lucide-react';
import { USDC_ADDRESS_BASE_SEPOLIA, ESCROW_RECEIVER, USDC_ABI } from '@/lib/web3';

type PaymentMethod = 'card' | 'crypto';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (method: PaymentMethod, amount: number, txHash?: string) => void;
  intentId: string;
  intentTitle: string;
  ticker: string;
  defaultAmount?: number;
}

export default function PaymentModal({
  isOpen, onClose, onSuccess,
  intentId, intentTitle, ticker, defaultAmount = 500,
}: PaymentModalProps) {
  const [method, setMethod] = useState<PaymentMethod>('card');
  const [amount, setAmount] = useState(String(defaultAmount));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Web3
  const { address, isConnected } = useAccount();
  const { writeContract, data: txHash, isPending: isTxPending } = useWriteContract();
  const { isLoading: isTxConfirming, isSuccess: isTxConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  if (!isOpen) return null;

  const parsedAmount = parseFloat(amount);
  const isValidAmount = parsedAmount > 0;

  // ── Stripe Card Payment ──────────────────────────────────────────────────
  const handleStripePayment = async () => {
    if (!isValidAmount) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intentId, intentTitle, ticker, amountUSDC: parsedAmount }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      if (!data.url) throw new Error('No checkout URL returned');
      window.location.href = data.url;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Payment failed');
      setLoading(false);
    }
  };

  // ── USDC Crypto Payment ──────────────────────────────────────────────────
  const handleCryptoPayment = async () => {
    if (!isValidAmount || !isConnected) return;
    setError(null);
    try {
      writeContract({
        address: USDC_ADDRESS_BASE_SEPOLIA,
        abi: USDC_ABI,
        functionName: 'transfer',
        args: [ESCROW_RECEIVER, parseUnits(String(parsedAmount), 6)],
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Transaction failed');
    }
  };

  // Handle tx confirmation
  if (isTxConfirmed && txHash) {
    onSuccess('crypto', parsedAmount, txHash);
  }

  const presetAmounts = [100, 500, 1000, 5000];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-gray-900">Fund Research</h2>
            <p className="text-xs text-gray-400">{ticker} · EIP-8183 Escrow</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Payment method toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setMethod('card')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all ${
                method === 'card'
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-200'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              Card (Stripe)
            </button>
            <button
              onClick={() => setMethod('crypto')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all ${
                method === 'crypto'
                  ? 'bg-purple-500 text-white shadow-lg shadow-purple-200'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Wallet className="w-4 h-4" />
              USDC (Crypto)
            </button>
          </div>

          {/* Amount */}
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Amount (USDC)</label>
            <div className="flex gap-2 mt-2">
              {presetAmounts.map((preset) => (
                <button
                  key={preset}
                  onClick={() => setAmount(String(preset))}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    amount === String(preset)
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  ${preset >= 1000 ? `${preset / 1000}K` : preset}
                </button>
              ))}
            </div>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="1"
              className="w-full mt-2 px-4 py-3 text-lg font-bold text-center border border-gray-200 rounded-xl focus:outline-none focus:border-orange-300 focus:ring-1 focus:ring-orange-200"
              placeholder="Custom amount"
            />
          </div>

          {/* Crypto: Wallet Connect */}
          {method === 'crypto' && (
            <div className="space-y-3">
              {!isConnected ? (
                <div className="flex flex-col items-center gap-3 py-3">
                  <p className="text-sm text-gray-500">Connect wallet to pay with USDC on Base Sepolia</p>
                  <ConnectButton />
                </div>
              ) : (
                <div className="bg-purple-50 rounded-xl p-3 text-sm">
                  <div className="flex items-center gap-2 text-purple-700">
                    <Wallet className="w-3.5 h-3.5" />
                    <span className="font-mono text-xs">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
                    <span className="ml-auto text-xs text-purple-500">Base Sepolia · USDC</span>
                  </div>
                </div>
              )}

              {/* Tx status */}
              {isTxPending && (
                <div className="flex items-center gap-2 text-sm text-orange-600 bg-orange-50 rounded-xl p-3">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Confirm transaction in your wallet...
                </div>
              )}
              {isTxConfirming && (
                <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 rounded-xl p-3">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Waiting for confirmation on Base Sepolia...
                </div>
              )}
              {isTxConfirmed && (
                <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 rounded-xl p-3">
                  <CheckCircle2 className="w-4 h-4" />
                  Payment confirmed! Escrow funded.
                </div>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-xl p-3">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {/* Submit */}
          {method === 'card' ? (
            <button
              onClick={handleStripePayment}
              disabled={!isValidAmount || loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CreditCard className="w-4 h-4" />
              )}
              Pay ${parsedAmount || 0} with Card
            </button>
          ) : (
            <button
              onClick={handleCryptoPayment}
              disabled={!isValidAmount || !isConnected || isTxPending || isTxConfirming || isTxConfirmed}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-purple-500 text-white font-semibold rounded-xl hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isTxPending || isTxConfirming ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Zap className="w-4 h-4" />
              )}
              {isTxConfirmed ? 'Funded!' : `Send ${parsedAmount || 0} USDC`}
            </button>
          )}

          {/* Info */}
          <p className="text-xs text-gray-400 text-center">
            {method === 'card'
              ? 'Powered by Stripe. Funds are escrowed and released on milestone verification.'
              : 'USDC on Base Sepolia testnet. Funds go to EIP-8183 escrow contract.'}
          </p>
        </div>
      </div>
    </div>
  );
}
