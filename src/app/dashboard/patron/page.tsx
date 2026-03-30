"use client";

import { useRouter } from "next/navigation";
import { useAppStore } from "@/store";
import { ArrowLeft, Lock, TrendingUp, Database, Zap, Coins, ExternalLink } from "lucide-react";
import ActivityFeed from "@/components/ActivityFeed";
import ProtocolBadges from "@/components/ProtocolBadges";

export default function PatronDashboard() {
  const router = useRouter();
  const { intents, currentUser } = useAppStore();

  const myPatronage = intents.filter((i) => i.patrons?.some((p) => p.name === "You"));
  const totalFunded = myPatronage.reduce((s, i) => {
    return s + (i.patrons?.filter((p) => p.name === "You").reduce((a, p) => a + p.amountUSDC, 0) ?? 0);
  }, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/market")} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
              <ArrowLeft className="w-4 h-4 text-gray-500" />
            </button>
            <div>
              <h1 className="font-bold text-gray-900">Patron Dashboard</h1>
              <p className="text-xs text-gray-400">EIP-8183 Escrow · x402 Data Access · IPFS Verified</p>
            </div>
          </div>
          <button onClick={() => router.push("/market")}
            className="text-sm font-medium bg-orange-500 text-white px-4 py-2 rounded-full hover:bg-orange-600 transition-colors">
            Browse Research
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "Total Funded", value: `$${totalFunded.toLocaleString()} USDC`, icon: Coins, color: "orange" },
            { label: "Intents Backed", value: String(myPatronage.length || intents.length), icon: Database, color: "emerald" },
            { label: "Aura Credits", value: String(currentUser.auraCredits), icon: TrendingUp, color: "orange" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-100 p-4 aura-shadow">
              <Icon className={`w-4 h-4 mb-2 ${color === "orange" ? "text-orange-500" : "text-emerald-500"}`} />
              <p className="text-xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-400">{label}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-6">
          <div className="flex-1 min-w-0 space-y-4">
            <h2 className="font-semibold text-gray-900">Funded Research</h2>
            {intents.map((intent) => {
              const pct = Math.min(100, Math.round((intent.escrowedAmountUSDC / intent.fundingGoalUSDC) * 100));
              const myShare = intent.patrons?.filter((p) => p.name === "You").reduce((s, p) => s + p.amountUSDC, 0) ?? 0;
              return (
                <button key={intent.id}
                  onClick={() => router.push(`/intent/${intent.id}`)}
                  className="w-full bg-white rounded-2xl border border-gray-100 p-5 text-left aura-shadow card-hover">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-orange-500 font-mono text-sm">{intent.ticker}</span>
                        {myShare > 0 && <span className="badge-erc8183"><Lock className="w-3 h-3" />Your escrow: ${myShare.toLocaleString()}</span>}
                      </div>
                      <h3 className="font-semibold text-sm text-gray-900">{intent.title}</h3>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${intent.aiScore && intent.aiScore >= 90 ? "bg-emerald-50 text-emerald-600" : "bg-orange-50 text-orange-600"}`}>
                      AI {intent.aiScore}
                    </span>
                  </div>

                  <ProtocolBadges ipfsCid={intent.ipfsCid} agentId={intent.agentId} agentReputation={intent.agentReputation} size="sm" />

                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>${intent.escrowedAmountUSDC.toLocaleString()} escrowed</span>
                      <span>{pct}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${pct >= 80 ? "bg-emerald-500" : "bg-orange-400"}`}
                        style={{ width: `${pct}%` }} />
                    </div>
                  </div>

                  {intent.ipfsCid && (
                    <div className="mt-2">
                      <a href={`https://w3s.link/ipfs/${intent.ipfsCid}`}
                        target="_blank" rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="badge-ipfs hover:opacity-80 transition-opacity inline-flex">
                        <Database className="w-3 h-3" />IPFS Verified
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white rounded-2xl border border-gray-100 p-4 sticky top-24">
              <p className="text-sm font-semibold text-gray-900 mb-3">Live Activity</p>
              <div className="slim-scroll max-h-96 overflow-y-auto -mx-2 px-2">
                <ActivityFeed limit={15} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
