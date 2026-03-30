"use client";

import { useRouter } from "next/navigation";
import {
  FlaskConical, Gem, ShieldCheck, ArrowRight, Atom, Zap, Lock,
  TrendingUp, Database, Cpu, Globe, ChevronRight,
} from "lucide-react";
import { useAppStore } from "@/store";

const PROTOCOL_STACK = [
  { label: "IPFS / Storacha", desc: "Content-addressed decentralised storage", color: "emerald", icon: Database },
  { label: "ERC-8004", desc: "AI agent identity & reputation registries", color: "orange", icon: Cpu },
  { label: "ERC-8183", desc: "Milestone-gated escrow funding jobs", color: "purple", icon: Lock },
  { label: "x402", desc: "HTTP micropayments for API data access", color: "blue", icon: Zap },
];

export default function LandingPage() {
  const router = useRouter();
  const setUserRole = useAppStore((s) => s.setUserRole);

  const goScientist = () => { setUserRole("scientist"); router.push("/onboarding/scientist"); };
  const goPatron    = () => { setUserRole("patron");    router.push("/market"); };

  return (
    <div className="hero-gradient grid-pattern min-h-screen bg-white">
      {/* ── Nav ─────────────────────────────────────────────────────────────── */}
      <nav className="flex items-center justify-between max-w-6xl mx-auto px-6 py-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-orange-400 flex items-center justify-center">
            <Atom className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-gray-900 text-lg">AuraSci</span>
          <span className="text-xs text-gray-400 font-medium ml-1">PL Hackathon</span>
        </div>
        <div className="flex items-center gap-3">
          <a href="https://w3s.link/ipfs/QmXyZ7a8Bk9Lm2Np4Qr6Ts1Uv3Wx5Yz0Ab2Cd4Ef6Gh8Ij"
            target="_blank" rel="noopener noreferrer"
            className="badge-ipfs text-xs gap-1.5 cursor-pointer hover:opacity-80 transition-opacity">
            <Database className="w-3 h-3" /> IPFS Live
          </a>
          <button onClick={goPatron}
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
            Browse Research
          </button>
          <button onClick={goScientist}
            className="text-sm font-medium bg-orange-500 text-white px-4 py-1.5 rounded-full hover:bg-orange-600 transition-colors">
            Publish Intent
          </button>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="relative max-w-6xl mx-auto px-6 pt-16 pb-12 text-center">
        <div className="absolute top-10 left-10 w-72 h-72 bg-orange-500/5 rounded-full blur-3xl animate-float pointer-events-none" />
        <div className="absolute top-32 right-10 w-64 h-64 bg-emerald-400/5 rounded-full blur-3xl animate-float pointer-events-none" style={{ animationDelay: "2s" }} />

        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-500/20 bg-emerald-50 mb-6">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shield-pulse" />
          <span className="text-xs font-medium text-emerald-600 tracking-wide uppercase">ERC-8004 AI-Verified Research Funding</span>
        </div>

        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-5">
          <span className="text-gray-900">From</span>{" "}
          <span className="bg-gradient-to-r from-orange-500 to-orange-400 bg-clip-text text-transparent">Proof</span>{" "}
          <span className="text-gray-900">to</span>{" "}
          <span className="bg-gradient-to-r from-orange-400 to-orange-500 bg-clip-text text-transparent">Capital</span>
        </h1>

        <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto mb-3 leading-relaxed">
          Milestone-based open science funding infrastructure<br />powered by AI Agents on Protocol Labs stack.
        </p>
        <p className="text-sm text-gray-500 max-w-xl mx-auto mb-12">
          Scientists publish research intents → AI agents verify milestones →
          EIP-8183 escrow releases capital → x402 micropayments for data access.
        </p>

        {/* ── Role cards ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl mx-auto mb-16">
          {/* Scientist */}
          <button onClick={goScientist}
            className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-8 text-left transition-all duration-500 hover:scale-[1.02] hover:border-orange-300 aura-shadow">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-orange-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="w-14 h-14 rounded-xl bg-emerald-50 flex items-center justify-center mb-5 group-hover:bg-emerald-100 transition-colors">
              <FlaskConical className="w-7 h-7 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">I&apos;m a Scientist</h2>
            <p className="text-sm text-gray-600 leading-relaxed mb-5">
              Publish your research intent, set milestones, submit proof pinned to IPFS,
              and receive EIP-8183 escrowed patronage for your breakthrough work.
            </p>
            <div className="space-y-1.5 mb-5">
              <div className="flex items-center gap-2 text-xs text-gray-500"><Atom className="w-3.5 h-3.5 text-emerald-500" /><span>Publish Intent → pinned to IPFS via Storacha</span></div>
              <div className="flex items-center gap-2 text-xs text-gray-500"><ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /><span>ERC-8004 AI Agent verifies milestones on-chain</span></div>
              <div className="flex items-center gap-2 text-xs text-gray-500"><TrendingUp className="w-3.5 h-3.5 text-emerald-500" /><span>EIP-8183 Escrow releases capital automatically</span></div>
            </div>
            <div className="flex items-center gap-2 text-orange-500 text-sm font-medium">
              <span>Start Publishing</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Patron */}
          <button onClick={goPatron}
            className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-8 text-left transition-all duration-500 hover:scale-[1.02] hover:border-orange-300 aura-shadow">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-orange-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="w-14 h-14 rounded-xl bg-orange-50 flex items-center justify-center mb-5 group-hover:bg-orange-100 transition-colors">
              <Gem className="w-7 h-7 text-orange-500" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">I&apos;m a Patron</h2>
            <p className="text-sm text-gray-600 leading-relaxed mb-5">
              Browse ERC-8004 verified research intents, fund promising science via
              EIP-8183 escrow, and access premium data through x402 micropayments.
            </p>
            <div className="space-y-1.5 mb-5">
              <div className="flex items-center gap-2 text-xs text-gray-500"><Zap className="w-3.5 h-3.5 text-orange-500" /><span>Browse ERC-8004 verified research intents</span></div>
              <div className="flex items-center gap-2 text-xs text-gray-500"><Lock className="w-3.5 h-3.5 text-orange-500" /><span>EIP-8183 Escrow-protected patronage</span></div>
              <div className="flex items-center gap-2 text-xs text-gray-500"><Globe className="w-3.5 h-3.5 text-orange-500" /><span>x402 micropayments for premium data access</span></div>
            </div>
            <div className="flex items-center gap-2 text-orange-500 text-sm font-medium">
              <span>Explore Market</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </div>

        {/* ── Protocol Stack ───────────────────────────────────────────────── */}
        <div className="max-w-4xl mx-auto mb-10">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-5">Protocol Labs Stack</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {PROTOCOL_STACK.map(({ label, desc, color, icon: Icon }) => (
              <div key={label}
                className={`rounded-xl border bg-white p-4 text-left aura-shadow transition-all hover:scale-105
                  ${color === 'emerald' ? 'border-emerald-200 hover:border-emerald-300' :
                    color === 'orange'  ? 'border-orange-200 hover:border-orange-300' :
                    color === 'purple'  ? 'border-purple-200 hover:border-purple-300' :
                                          'border-blue-200 hover:border-blue-300'}`}>
                <Icon className={`w-5 h-5 mb-2
                  ${color === 'emerald' ? 'text-emerald-500' :
                    color === 'orange'  ? 'text-orange-500' :
                    color === 'purple'  ? 'text-purple-500' :
                                          'text-blue-500'}`} />
                <p className="text-xs font-bold text-gray-900">{label}</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-tight">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Footer badges ────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-gray-400">
          {["ERC-8004 Identity Registry", "ERC-8183 Escrow", "IPFS · Storacha", "x402 Micropayments", "Open Science"].map((t, i) => (
            <span key={t} className="flex items-center gap-1.5">
              {i === 0 && <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />}
              {t}
              {i < 4 && <span className="w-px h-3 bg-gray-200 ml-2" />}
            </span>
          ))}
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 py-14">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest text-center mb-8">
          Citizen Flow
        </p>
        <div className="flex flex-col md:flex-row items-start gap-2">
          {[
            { step: "01", title: "Upload to IPFS", desc: "Scientist uploads research data & agent.json manifest. Storacha pins to IPFS with content-addressed CID.", color: "emerald" },
            { step: "02", title: "Trigger ERC-8004 Agent", desc: "AI agent registered as ERC-721 NFT evaluates proof. Reputation Registry updated on Filecoin EVM.", color: "orange" },
            { step: "03", title: "ERC-8183 Job Verified", desc: "Modular evaluator attests milestone. Escrow releases USDC to scientist trustlessly.", color: "purple" },
            { step: "04", title: "x402 Data Access", desc: "Patrons pay USDC via HTTP 402 challenge to access premium frontier science tools.", color: "blue" },
          ].map(({ step, title, desc, color }, i, arr) => (
            <div key={step} className="flex md:flex-col items-start md:items-center gap-3 md:gap-2 flex-1">
              <div className={`relative flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm
                ${color === 'emerald' ? 'bg-emerald-50 text-emerald-600' :
                  color === 'orange'  ? 'bg-orange-50 text-orange-600' :
                  color === 'purple'  ? 'bg-purple-50 text-purple-600' :
                                        'bg-blue-50 text-blue-600'}`}>
                {step}
              </div>
              {i < arr.length - 1 && (
                <ChevronRight className="hidden md:block w-4 h-4 text-gray-300 mt-3 absolute" style={{ marginLeft: "calc(25% - 8px)" }} />
              )}
              <div className="md:text-center">
                <p className="font-semibold text-sm text-gray-900 mb-1">{title}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
