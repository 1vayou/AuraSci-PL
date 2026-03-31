"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useAppStore } from "@/store";
import {
  ArrowLeft, Database, Lock, Zap, CheckCircle2, Clock, AlertCircle,
  ExternalLink, Users, Star, Loader2, ShieldCheck, Cpu, Coins, CreditCard, Wallet,
} from "lucide-react";
import ProtocolBadges from "@/components/ProtocolBadges";
import IPFSUploader from "@/components/IPFSUploader";
import PaymentModal from "@/components/PaymentModal";
import type { MilestoneStatus, IPFSUploadResult } from "@/types";
import { NETWORK } from "@/lib/protocol";
import { useAccount, useWalletClient, usePublicClient } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { payAndFetch } from "@/lib/x402-client";

const STATUS_CONFIG: Record<MilestoneStatus, { label: string; color: string; icon: React.ReactNode }> = {
  locked:           { label: "Locked",           color: "ms-locked",      icon: <Lock className="w-3.5 h-3.5" /> },
  in_progress:      { label: "In Progress",      color: "ms-in-progress", icon: <Clock className="w-3.5 h-3.5" /> },
  proof_submitted:  { label: "Proof Submitted",  color: "ms-submitted",   icon: <AlertCircle className="w-3.5 h-3.5" /> },
  ai_verified:      { label: "AI Verified",      color: "ms-verified",    icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  released:         { label: "Released",         color: "ms-released",    icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
};

export default function IntentPage() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();
  const intent  = useAppStore((s) => s.intents.find((i) => i.id === id));
  const scientists = useAppStore((s) => s.scientists);
  const currentUser = useAppStore((s) => s.currentUser);
  const updateMilestone = useAppStore((s) => s.updateMilestone);
  const addPatronage    = useAppStore((s) => s.addPatronage);
  const boostIntent     = useAppStore((s) => s.boostIntent);

  const [verifying, setVerifying] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [x402Loading, setX402Loading] = useState(false);
  const [x402Data, setX402Data] = useState<string | null>(null);
  const [x402Error, setX402Error] = useState<string | null>(null);
  const [uploadedCid, setUploadedCid] = useState<string | null>(null);

  // Wallet hooks for x402 payment
  const { isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  if (!intent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">Intent not found</p>
          <button onClick={() => router.push("/market")} className="text-orange-500 text-sm hover:underline">
            ← Back to Market
          </button>
        </div>
      </div>
    );
  }

  const scientist = scientists.find((s) => s.id === intent.scientistId);
  const pct = Math.min(100, Math.round((intent.escrowedAmountUSDC / intent.fundingGoalUSDC) * 100));
  const isScientist = currentUser.role === "scientist" && currentUser.profile?.id === intent.scientistId;

  // AI verify milestone
  const handleVerify = async (milestoneId: string) => {
    setVerifying(milestoneId);
    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify", intentId: id, milestoneId, agentId: intent.agentId }),
      });
      const data = await res.json();
      if (data.verified) {
        updateMilestone(intent.id, milestoneId, { status: "ai_verified" });
      }
    } finally {
      setVerifying(null);
    }
  };

  // Payment success handler (both Stripe and Crypto)
  const handlePaymentSuccess = (method: 'card' | 'crypto', amount: number, txHash?: string) => {
    addPatronage(intent.id, {
      id: `${method}_${Date.now()}`,
      name: method === 'card' ? 'Stripe Patron' : 'Crypto Patron',
      amountUSDC: amount,
      escrowTxHash: txHash ?? `0xEscrow${Date.now().toString(16)}`,
      walletAddress: method === 'crypto' ? txHash : undefined,
    });
    setShowPaymentModal(false);
  };

  // x402 payment — real wallet-signed flow via @x402/core + @x402/evm
  const handleX402 = async () => {
    if (!walletClient || !publicClient) return;
    setX402Loading(true);
    setX402Data(null);
    setX402Error(null);
    try {
      const result = await payAndFetch(
        "/api/x402",
        { resource: `/intents/${id}/data`, intentId: id },
        walletClient,
        publicClient,
      );
      if (result.ok) {
        setX402Data(JSON.stringify(result.data, null, 2));
      } else {
        setX402Error((result.data as { error?: string })?.error ?? "Payment failed");
      }
    } catch (err) {
      setX402Error(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setX402Loading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
          <button onClick={() => router.push("/market")} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-4 h-4 text-gray-500" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-orange-500 font-mono text-sm">{intent.ticker}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                ${intent.aiScore && intent.aiScore >= 90 ? "bg-emerald-50 text-emerald-600" : "bg-orange-50 text-orange-600"}`}>
                AI Score {intent.aiScore}
              </span>
            </div>
            <p className="text-sm font-semibold text-gray-900 truncate">{intent.title}</p>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Main column ─────────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Overview */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 aura-shadow">
            <h2 className="font-semibold text-gray-900 mb-3">{intent.title}</h2>
            <p className="text-sm text-gray-600 leading-relaxed mb-4">{intent.coreHypothesis}</p>
            <ProtocolBadges
              ipfsCid={intent.ipfsCid}
              agentId={intent.agentId}
              agentReputation={intent.agentReputation}
              registrationTxHash={intent.registrationTxHash}
            />
          </div>

          {/* Milestones */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 aura-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Milestone Roadmap</h3>
              <span className="badge-erc8004"><Cpu className="w-3 h-3" />ERC-8004 Gated</span>
            </div>
            <div className="space-y-4">
              {intent.milestones.map((ms) => {
                const cfg = STATUS_CONFIG[ms.status];
                return (
                  <div key={ms.id}
                    className={`rounded-xl border p-4 transition-colors ${cfg.color}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border ${cfg.color}`}>
                          {cfg.icon} {ms.label} · {ms.sublabel}
                        </span>
                        <span className="text-xs text-gray-400">{ms.estTime}</span>
                      </div>
                      <span className="text-sm font-bold text-gray-900">
                        ${ms.releaseAmountUSDC.toLocaleString()}
                      </span>
                    </div>

                    <p className="text-sm text-gray-700 mt-2 font-medium">{ms.objective}</p>
                    <p className="text-xs text-gray-500 mt-1">{ms.deliverables}</p>

                    {/* IPFS CID + tx */}
                    {ms.ipfsCid && (
                      <div className="flex items-center gap-2 mt-2">
                        <a href={`https://w3s.link/ipfs/${ms.ipfsCid}`} target="_blank" rel="noopener noreferrer"
                          className="badge-ipfs hover:opacity-80 transition-opacity text-xs">
                          <Database className="w-3 h-3" />{ms.ipfsCid.slice(0, 16)}…
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                        {ms.verificationTxHash && (
                          <a href={`${NETWORK.explorer}${ms.verificationTxHash}`}
                            target="_blank" rel="noopener noreferrer"
                            className="text-xs text-gray-400 hover:text-orange-500 font-mono flex items-center gap-1">
                            VerifyTx: {ms.verificationTxHash.slice(0, 10)}…
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>
                    )}

                    {/* IPFS upload for proof submission */}
                    {ms.status === "in_progress" && isScientist && (
                      <div className="mt-3">
                        <IPFSUploader
                          label="Upload proof artifact to IPFS"
                          onUploaded={(r: IPFSUploadResult) => setUploadedCid(r.cid)}
                        />
                        {uploadedCid && (
                          <button
                            onClick={() => updateMilestone(intent.id, ms.id, { status: "proof_submitted", ipfsCid: uploadedCid })}
                            className="mt-2 w-full py-2 rounded-xl bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition-colors">
                            Submit Proof (IPFS pinned)
                          </button>
                        )}
                      </div>
                    )}

                    {/* AI verify button */}
                    {ms.status === "proof_submitted" && (
                      <button
                        onClick={() => handleVerify(ms.id)}
                        disabled={verifying === ms.id}
                        className="mt-3 flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white text-xs font-medium rounded-xl hover:bg-emerald-600 transition-colors disabled:opacity-60">
                        {verifying === ms.id ? (
                          <><Loader2 className="w-3.5 h-3.5 animate-spin" />ERC-8004 Verifying…</>
                        ) : (
                          <><ShieldCheck className="w-3.5 h-3.5" />Trigger ERC-8004 AI Verification</>
                        )}
                      </button>
                    )}

                    {ms.status === "ai_verified" && ms.escrowTxHash && (
                      <div className="mt-2 flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-xs text-emerald-600 font-medium">EIP-8183 Escrow Released</span>
                        <span className="text-xs text-gray-400 font-mono">{ms.escrowTxHash.slice(0, 14)}…</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* x402 Premium Data */}
          <div className="bg-white rounded-2xl border border-blue-100 p-6 aura-shadow">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-blue-500" />
              <h3 className="font-semibold text-gray-900">x402 Premium Research Data</h3>
              <span className="badge-x402">HTTP 402</span>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Access full datasets and AI analysis reports via x402 micropayments (0.50 USDC).
              Pays via wallet signature → facilitator verifies → settles on Base Sepolia.
            </p>
            {x402Data ? (
              <div className="bg-gray-900 rounded-xl p-4">
                <pre className="text-xs text-emerald-400 overflow-auto slim-scroll max-h-40">{x402Data}</pre>
              </div>
            ) : !isConnected ? (
              <div className="space-y-3">
                <p className="text-xs text-gray-400">Connect your wallet to pay with x402</p>
                <ConnectButton />
              </div>
            ) : (
              <div className="space-y-3">
                <button onClick={handleX402} disabled={x402Loading || !walletClient}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-500 text-white text-sm font-medium rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-60">
                  {x402Loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                  {x402Loading ? "Signing & settling…" : "Pay 0.50 USDC via x402 · Access Data"}
                </button>
                {x402Error && (
                  <p className="text-xs text-red-500">{x402Error}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Sidebar ─────────────────────────────────────────────────────── */}
        <div className="space-y-4">
          {/* Funding */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 aura-shadow">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">EIP-8183 Escrow</h3>
              <Lock className="w-4 h-4 text-purple-400" />
            </div>
            <div className="mb-2">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>${intent.escrowedAmountUSDC.toLocaleString()} USDC</span>
                <span>{pct}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${pct >= 80 ? "bg-emerald-500" : "bg-orange-400"}`}
                  style={{ width: `${pct}%` }} />
              </div>
              <p className="text-xs text-gray-400 mt-1">Goal: ${intent.fundingGoalUSDC.toLocaleString()} USDC</p>
            </div>

            <button onClick={() => setShowPaymentModal(true)}
              className="w-full mt-3 flex items-center justify-center gap-2 py-3 bg-orange-500 text-white text-sm font-semibold rounded-xl hover:bg-orange-600 transition-colors">
              <Coins className="w-4 h-4" />
              Fund This Research
            </button>
            <div className="flex gap-2 mt-2">
              <span className="flex items-center gap-1 text-xs text-gray-400"><CreditCard className="w-3 h-3" />Card</span>
              <span className="flex items-center gap-1 text-xs text-gray-400"><Wallet className="w-3 h-3" />USDC</span>
              <span className="ml-auto text-xs text-gray-400">Escrow-protected</span>
            </div>

            {/* Patrons */}
            {intent.patrons && intent.patrons.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-50">
                <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Patrons</p>
                <div className="space-y-1.5">
                  {intent.patrons.slice(0, 4).map((p) => (
                    <div key={p.id} className="flex items-center justify-between text-xs">
                      <span className="text-gray-700">{p.name}</span>
                      <span className="font-medium text-gray-900">${p.amountUSDC.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Scientist */}
          {scientist && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5 aura-shadow">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Scientist</h3>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {scientist.fullName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-900">{scientist.fullName}</p>
                  <p className="text-xs text-gray-400">{scientist.affiliation}</p>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{scientist.bio}</p>
                </div>
              </div>
              {scientist.agentNftId && (
                <div className="mt-3 pt-3 border-t border-gray-50 space-y-1.5">
                  <div className="badge-erc8004 w-full justify-center">
                    <Cpu className="w-3 h-3" />{scientist.agentNftId}
                    <span className="ml-1 text-orange-400">★{scientist.reputationScore}</span>
                  </div>
                  {scientist.agentManifestCid && (
                    <a href={`https://w3s.link/ipfs/${scientist.agentManifestCid}`}
                      target="_blank" rel="noopener noreferrer"
                      className="badge-ipfs w-full justify-center hover:opacity-80 transition-opacity cursor-pointer">
                      <Database className="w-3 h-3" />agent.json manifest
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Stats */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 aura-shadow">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Stats</h3>
            <div className="space-y-2">
              {[
                { label: "Supporters", value: intent.supporterCount?.toLocaleString() ?? "0", icon: Users },
                { label: "Boost Score", value: String(intent.boostScore ?? 0), icon: Star },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-gray-500">
                    <Icon className="w-3.5 h-3.5" />{label}
                  </div>
                  <span className="font-semibold text-gray-900">{value}</span>
                </div>
              ))}
            </div>
            <button onClick={() => boostIntent(intent.id, 100)}
              className="mt-3 w-full py-2 text-xs font-medium text-orange-500 border border-orange-200 rounded-xl hover:bg-orange-50 transition-colors">
              ⚡ Boost +100 Aura
            </button>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={handlePaymentSuccess}
        intentId={intent.id}
        intentTitle={intent.title}
        ticker={intent.ticker}
      />
    </div>
  );
}
