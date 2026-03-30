"use client";

import { useRouter } from "next/navigation";
import { useAppStore } from "@/store";
import {
  Plus, Database, Cpu, Lock, Zap, TrendingUp, CheckCircle2,
  Clock, ExternalLink, ArrowRight, Flame,
} from "lucide-react";
import ActivityFeed from "@/components/ActivityFeed";
import ProtocolBadges from "@/components/ProtocolBadges";
import { NETWORK } from "@/lib/protocol";

export default function ScientistDashboard() {
  const router = useRouter();
  const { currentUser, intents, activityLogs } = useAppStore();
  const profile = currentUser.profile;

  const myIntents = profile
    ? intents.filter((i) => i.scientistId === profile.id)
    : intents.slice(0, 2); // demo fallback

  const totalEscrowed = myIntents.reduce((s, i) => s + i.escrowedAmountUSDC, 0);
  const totalVerified = myIntents.flatMap((i) => i.milestones).filter((m) => m.status === "ai_verified").length;
  const totalReleased = myIntents.flatMap((i) => i.milestones)
    .filter((m) => m.status === "ai_verified")
    .reduce((s, m) => s + m.releaseAmountUSDC, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-bold text-gray-900">Scientist Dashboard</h1>
            <p className="text-xs text-gray-400">
              {profile?.agentNftId ?? "ERC-8004 Agent"} · {profile?.affiliation ?? "AuraSci Protocol"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/market")}
              className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
              Browse Market
            </button>
            <button onClick={() => router.push("/dashboard/scientist/create-intent")}
              className="flex items-center gap-1.5 text-sm font-medium bg-orange-500 text-white px-4 py-2 rounded-full hover:bg-orange-600 transition-colors">
              <Plus className="w-4 h-4" /> New Intent
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Escrowed USDC", value: `$${(totalEscrowed / 1000).toFixed(0)}K`, icon: Lock, color: "purple" },
            { label: "AI Verified", value: `${totalVerified} Milestones`, icon: CheckCircle2, color: "emerald" },
            { label: "Released", value: `$${(totalReleased / 1000).toFixed(0)}K`, icon: TrendingUp, color: "orange" },
            { label: "Aura Credits", value: String(currentUser.auraCredits), icon: Flame, color: "orange" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-100 p-4 aura-shadow">
              <Icon className={`w-4 h-4 mb-2 ${color === "purple" ? "text-purple-500" : color === "emerald" ? "text-emerald-500" : "text-orange-500"}`} />
              <p className="text-xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-400">{label}</p>
            </div>
          ))}
        </div>

        {/* Agent Profile */}
        {profile?.agentNftId && (
          <div className="bg-white rounded-2xl border border-orange-100 p-5 mb-5 aura-shadow">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                  <Cpu className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{profile.agentNftId}</p>
                  <p className="text-xs text-gray-400">ERC-8004 Identity Registry · Filecoin EVM</p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="text-center">
                  <p className="text-xl font-bold text-orange-500">{profile.reputationScore ?? 85}</p>
                  <p className="text-xs text-gray-400">Reputation</p>
                </div>
                {profile.agentManifestCid && (
                  <a href={`https://w3s.link/ipfs/${profile.agentManifestCid}`}
                    target="_blank" rel="noopener noreferrer"
                    className="badge-ipfs hover:opacity-80 transition-opacity cursor-pointer">
                    <Database className="w-3 h-3" />agent.json
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
                <span className="badge-erc8004"><Cpu className="w-3 h-3" />{NETWORK.name}</span>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-6">
          {/* Intents */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">My Research Intents</h2>
              <button onClick={() => router.push("/dashboard/scientist/create-intent")}
                className="flex items-center gap-1 text-xs text-orange-500 hover:underline">
                <Plus className="w-3.5 h-3.5" /> New Intent
              </button>
            </div>

            {myIntents.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center">
                <Database className="w-10 h-10 mx-auto mb-3 text-gray-200" />
                <p className="text-sm text-gray-400 mb-4">No intents yet. Publish your first research intent.</p>
                <button onClick={() => router.push("/dashboard/scientist/create-intent")}
                  className="text-sm font-medium bg-orange-500 text-white px-6 py-2.5 rounded-xl hover:bg-orange-600 transition-colors">
                  Publish Intent
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {myIntents.map((intent) => {
                  const pct = Math.min(100, Math.round((intent.escrowedAmountUSDC / intent.fundingGoalUSDC) * 100));
                  return (
                    <div key={intent.id} className="bg-white rounded-2xl border border-gray-100 p-5 aura-shadow">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-orange-500 font-mono text-sm">{intent.ticker}</span>
                            <span className="text-xs px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full">AI {intent.aiScore}</span>
                          </div>
                          <h3 className="font-semibold text-gray-900 text-sm">{intent.title}</h3>
                        </div>
                        <button onClick={() => router.push(`/intent/${intent.id}`)}
                          className="flex items-center gap-1 text-xs text-orange-500 hover:underline flex-shrink-0">
                          View <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="mb-3">
                        <ProtocolBadges
                          ipfsCid={intent.ipfsCid}
                          agentId={intent.agentId}
                          agentReputation={intent.agentReputation}
                          size="sm"
                        />
                      </div>

                      {/* Funding */}
                      <div className="mb-3">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>${intent.escrowedAmountUSDC.toLocaleString()} / ${intent.fundingGoalUSDC.toLocaleString()}</span>
                          <span>{pct}%</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${pct >= 80 ? "bg-emerald-500" : "bg-orange-400"}`}
                            style={{ width: `${pct}%` }} />
                        </div>
                      </div>

                      {/* Milestones */}
                      <div className="flex gap-2 flex-wrap">
                        {intent.milestones.map((ms) => (
                          <div key={ms.id} className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs border
                            ${ms.status === "ai_verified" ? "ms-verified" :
                              ms.status === "in_progress" ? "ms-in-progress" :
                              ms.status === "proof_submitted" ? "ms-submitted" : "ms-locked"}`}>
                            {ms.status === "ai_verified" ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                            {ms.label}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white rounded-2xl border border-gray-100 p-4 sticky top-24">
              <div className="flex items-center gap-2 mb-3">
                <p className="text-sm font-semibold text-gray-900">Protocol Activity</p>
                <span className="flex h-2 w-2 relative ml-auto">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
              </div>
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
