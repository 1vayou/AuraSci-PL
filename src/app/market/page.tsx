"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store";
import {
  Search, TrendingUp, Filter, Database, Cpu, Lock, Zap,
  ArrowLeft, Flame, Users, Star, ChevronRight,
} from "lucide-react";
import ActivityFeed from "@/components/ActivityFeed";
import ProtocolBadges from "@/components/ProtocolBadges";
import type { ResearchTag } from "@/types";

const TAGS: ResearchTag[] = ["#Longevity", "#AI-Bio", "#Neuroscience", "#Genomics", "#Quantum", "#Climate", "#Tier-1", "#DeSci"];

export default function MarketPage() {
  const router = useRouter();
  const intents = useAppStore((s) => s.intents);
  const [search, setSearch] = useState("");
  const [tag, setTag] = useState<ResearchTag | "">("");

  const filtered = intents.filter((i) => {
    const matchSearch = !search ||
      i.title.toLowerCase().includes(search.toLowerCase()) ||
      i.ticker.toLowerCase().includes(search.toLowerCase());
    const matchTag = !tag || i.tags?.includes(tag);
    return matchSearch && matchTag;
  });

  const totalEscrowed = intents.reduce((s, i) => s + i.escrowedAmountUSDC, 0);
  const totalScientists = [...new Set(intents.map((i) => i.scientistId))].length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/")} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
              <ArrowLeft className="w-4 h-4 text-gray-500" />
            </button>
            <div>
              <h1 className="font-bold text-gray-900">Research Market</h1>
              <p className="text-xs text-gray-400">ERC-8004 Verified · EIP-8183 Escrowed · IPFS Pinned</p>
            </div>
          </div>
          <button onClick={() => router.push("/dashboard/scientist")}
            className="text-sm font-medium bg-orange-500 text-white px-4 py-1.5 rounded-full hover:bg-orange-600 transition-colors">
            My Dashboard
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Total Escrowed", value: `$${(totalEscrowed / 1000).toFixed(0)}K USDC`, icon: Lock, color: "purple" },
            { label: "Active Intents", value: String(intents.length), icon: Flame, color: "orange" },
            { label: "Scientists", value: String(totalScientists), icon: Users, color: "emerald" },
            { label: "IPFS Artifacts", value: `${intents.length * 3}+`, icon: Database, color: "emerald" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-100 p-4 aura-shadow">
              <Icon className={`w-4 h-4 mb-2 ${color === "purple" ? "text-purple-500" : color === "orange" ? "text-orange-500" : "text-emerald-500"}`} />
              <p className="text-xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-400">{label}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-6">
          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Search + Filter */}
            <div className="flex gap-3 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by title, ticker…"
                  className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-orange-300 focus:ring-1 focus:ring-orange-200 transition-colors"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select value={tag} onChange={(e) => setTag(e.target.value as ResearchTag | "")}
                  className="pl-9 pr-8 py-2.5 text-sm bg-white border border-gray-200 rounded-xl appearance-none focus:outline-none focus:border-orange-300 transition-colors cursor-pointer">
                  <option value="">All Tags</option>
                  {TAGS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            {/* Intent Cards */}
            <div className="space-y-3">
              {filtered.map((intent) => {
                const pct = Math.min(100, Math.round((intent.escrowedAmountUSDC / intent.fundingGoalUSDC) * 100));
                const activeMilestone = intent.milestones.find((m) => m.status === "in_progress");

                return (
                  <button key={intent.id}
                    onClick={() => router.push(`/intent/${intent.id}`)}
                    className="w-full bg-white rounded-2xl border border-gray-100 p-5 text-left aura-shadow card-hover group">
                    {/* Top row */}
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-orange-500 font-mono">{intent.ticker}</span>
                          {intent.trendingRank === 1 && (
                            <span className="flex items-center gap-0.5 text-xs text-orange-400 font-medium">
                              <TrendingUp className="w-3 h-3" /> Trending #1
                            </span>
                          )}
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                            ${intent.aiScore && intent.aiScore >= 90 ? "bg-emerald-50 text-emerald-600" :
                              intent.aiScore && intent.aiScore >= 80 ? "bg-orange-50 text-orange-600" :
                              "bg-gray-50 text-gray-500"}`}>
                            AI Score {intent.aiScore}
                          </span>
                        </div>
                        <h3 className="font-semibold text-gray-900 text-sm leading-snug">{intent.title}</h3>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-orange-400 transition-colors flex-shrink-0 mt-1" />
                    </div>

                    {/* Protocol badges */}
                    <div className="mb-3">
                      <ProtocolBadges
                        ipfsCid={intent.ipfsCid}
                        agentId={intent.agentId}
                        agentReputation={intent.agentReputation}
                        registrationTxHash={intent.registrationTxHash}
                        size="sm"
                      />
                    </div>

                    {/* Progress bar */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                        <span>${intent.escrowedAmountUSDC.toLocaleString()} USDC escrowed</span>
                        <span className="font-medium">{pct}% of ${(intent.fundingGoalUSDC / 1000).toFixed(0)}K goal</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-700
                          ${pct >= 80 ? "bg-emerald-500" : pct >= 50 ? "bg-orange-400" : "bg-orange-300"}`}
                          style={{ width: `${pct}%` }} />
                      </div>
                    </div>

                    {/* Bottom row */}
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" />{intent.supporterCount?.toLocaleString()}</span>
                        <span className="flex items-center gap-1"><Star className="w-3 h-3" />{intent.boostScore}</span>
                        {intent.tags?.slice(0, 2).map((t) => (
                          <span key={t} className="px-1.5 py-0.5 bg-gray-50 rounded text-gray-400">{t}</span>
                        ))}
                      </div>
                      {activeMilestone && (
                        <span className="text-orange-500 font-medium">{activeMilestone.label} in progress</span>
                      )}
                    </div>
                  </button>
                );
              })}
              {filtered.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <Database className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>No intents match your search.</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar — Activity Feed */}
          <div className="hidden lg:block w-72 flex-shrink-0">
            <div className="bg-white rounded-2xl border border-gray-100 p-4 sticky top-24">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-gray-900">Protocol Activity</p>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
              </div>
              <div className="flex gap-1.5 flex-wrap mb-3">
                <span className="badge-erc8004"><Cpu className="w-3 h-3" />ERC-8004</span>
                <span className="badge-ipfs"><Database className="w-3 h-3" />IPFS</span>
                <span className="badge-erc8183"><Lock className="w-3 h-3" />Escrow</span>
                <span className="badge-x402"><Zap className="w-3 h-3" />x402</span>
              </div>
              <div className="slim-scroll max-h-[520px] overflow-y-auto -mx-2 px-2">
                <ActivityFeed limit={20} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
