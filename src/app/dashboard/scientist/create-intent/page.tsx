"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store";
import { ArrowLeft, Database, Loader2, CheckCircle2, Plus, Trash2 } from "lucide-react";
import IPFSUploader from "@/components/IPFSUploader";
import type { IPFSUploadResult, IntentAsset, Milestone, ResearchTag } from "@/types";
import { mockIPFSResult } from "@/lib/protocol";

const TAGS: ResearchTag[] = ["#Longevity", "#AI-Bio", "#Neuroscience", "#Genomics", "#Quantum", "#Climate", "#Tier-1", "#Tier-2", "#DeSci"];

export default function CreateIntent() {
  const router = useRouter();
  const { currentUser, addIntent } = useAppStore();
  const profile = currentUser.profile;

  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [createdIntent, setCreatedIntent] = useState<IntentAsset | null>(null);
  const [ipfsCid, setIpfsCid] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "", ticker: "", hypothesis: "", fundingGoal: "100000",
    tags: [] as ResearchTag[],
    evidenceLinks: [""],
  });

  const [milestones, setMilestones] = useState([
    { label: "M1", sublabel: "Phase 1", objective: "", deliverables: "", estTime: "3 months", releaseAmount: "33000" },
    { label: "M2", sublabel: "Phase 2", objective: "", deliverables: "", estTime: "6 months", releaseAmount: "34000" },
    { label: "M3", sublabel: "Phase 3", objective: "", deliverables: "", estTime: "12 months", releaseAmount: "33000" },
  ]);

  const toggleTag = (tag: ResearchTag) =>
    setForm((f) => ({
      ...f,
      tags: f.tags.includes(tag) ? f.tags.filter((t) => t !== tag) : [...f.tags, tag],
    }));

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // Build intent JSON
      const intentJson = { ...form, milestones, scientistId: profile?.id ?? "demo", createdAt: Date.now() };

      // Pin intent JSON to IPFS
      let cid = ipfsCid;
      if (!cid) {
        const ipfsForm = new FormData();
        ipfsForm.append("json", JSON.stringify(intentJson, null, 2));
        ipfsForm.append("filename", `${form.ticker.replace("$", "")}-intent.json`);
        const ipfsRes = await fetch("/api/ipfs", { method: "POST", body: ipfsForm });
        const ipfsData: IPFSUploadResult & { cid: string } = await ipfsRes.json();
        cid = ipfsData.cid;
      }

      // Build intent asset
      const intent: IntentAsset = {
        id: `intent_${Date.now()}`,
        scientistId: profile?.id ?? "sci_demo",
        title: form.title,
        ticker: form.ticker.startsWith("$") ? form.ticker : `$${form.ticker}`,
        coreHypothesis: form.hypothesis,
        evidenceLinks: form.evidenceLinks.filter(Boolean),
        fundingGoalUSDC: parseInt(form.fundingGoal),
        escrowedAmountUSDC: 0,
        status: "published",
        aiScore: Math.floor(70 + Math.random() * 28),
        tags: form.tags,
        patrons: [],
        supporterCount: 0,
        boostScore: 0,
        ipfsCid: cid ?? undefined,
        agentId: profile?.agentNftId,
        agentReputation: profile?.reputationScore,
        agentManifestCid: profile?.agentManifestCid,
        registrationTxHash: `0x${Math.random().toString(16).slice(2, 18)}${"0".repeat(46)}`,
        createdAt: Date.now(),
        milestones: milestones.map((ms, i) => ({
          id: `ms_new_${Date.now()}_${i}`,
          intentId: `intent_${Date.now()}`,
          order: (i + 1) as 1 | 2 | 3,
          label: ms.label as "M1" | "M2" | "M3",
          sublabel: ms.sublabel,
          estTime: ms.estTime,
          objective: ms.objective,
          deliverables: ms.deliverables,
          verificationCriteria: "AI verification via ERC-8004 agent",
          releaseAmountUSDC: parseInt(ms.releaseAmount),
          status: i === 0 ? "in_progress" : "locked",
          ipfsCid: mockIPFSResult(`ms_${i}`, ms.objective).cid,
          agentId: profile?.agentNftId ?? "ERC8004-NEW",
          agentReputation: profile?.reputationScore ?? 85,
        } as Milestone)),
      };

      addIntent(intent);
      setCreatedIntent(intent);
      setDone(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (done && createdIntent) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-8 max-w-md w-full aura-shadow text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          </div>
          <h2 className="font-bold text-xl text-gray-900 mb-2">Intent Published!</h2>
          <p className="text-sm text-gray-500 mb-6">
            {createdIntent.ticker} is live and pinned to IPFS via Storacha.
          </p>
          {createdIntent.ipfsCid && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3 mb-6 text-left">
              <p className="text-xs text-emerald-600 font-medium mb-1">IPFS Content ID</p>
              <a href={`https://w3s.link/ipfs/${createdIntent.ipfsCid}`}
                target="_blank" rel="noopener noreferrer"
                className="text-xs font-mono text-emerald-700 hover:underline break-all">
                {createdIntent.ipfsCid}
              </a>
            </div>
          )}
          <div className="flex gap-3">
            <button onClick={() => router.push(`/intent/${createdIntent.id}`)}
              className="flex-1 py-2.5 bg-orange-500 text-white text-sm font-semibold rounded-xl hover:bg-orange-600 transition-colors">
              View Intent
            </button>
            <button onClick={() => router.push("/market")}
              className="flex-1 py-2.5 border border-gray-200 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors">
              Browse Market
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-3">
          <button onClick={() => router.push("/dashboard/scientist")} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-4 h-4 text-gray-500" />
          </button>
          <div>
            <h1 className="font-bold text-gray-900">Publish Research Intent</h1>
            <p className="text-xs text-gray-400">Intent JSON will be pinned to IPFS via Storacha</p>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-6 space-y-5">
        {/* Basic Info */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 aura-shadow">
          <h2 className="font-semibold text-gray-900 mb-4">Research Intent</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Title</label>
                <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-orange-300 transition-colors"
                  placeholder="Research intent title" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Ticker Symbol</label>
                <input value={form.ticker} onChange={(e) => setForm((f) => ({ ...f, ticker: e.target.value }))}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-orange-300 font-mono transition-colors"
                  placeholder="$GENE-02" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Core Hypothesis</label>
              <textarea value={form.hypothesis} onChange={(e) => setForm((f) => ({ ...f, hypothesis: e.target.value }))}
                rows={4}
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-orange-300 resize-none transition-colors"
                placeholder="Describe your research hypothesis, approach, and expected outcomes…" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Funding Goal (USDC)</label>
              <input type="number" value={form.fundingGoal} onChange={(e) => setForm((f) => ({ ...f, fundingGoal: e.target.value }))}
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-orange-300 transition-colors" />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">Research Tags</label>
              <div className="flex flex-wrap gap-2">
                {TAGS.map((t) => (
                  <button key={t} type="button" onClick={() => toggleTag(t)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors
                      ${form.tags.includes(t) ? "bg-orange-500 text-white border-orange-500" : "bg-white text-gray-500 border-gray-200 hover:border-orange-300"}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Evidence Links */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">Evidence Links</label>
              <div className="space-y-2">
                {form.evidenceLinks.map((link, i) => (
                  <div key={i} className="flex gap-2">
                    <input value={link}
                      onChange={(e) => {
                        const links = [...form.evidenceLinks];
                        links[i] = e.target.value;
                        setForm((f) => ({ ...f, evidenceLinks: links }));
                      }}
                      className="flex-1 px-3.5 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-orange-300 transition-colors"
                      placeholder="https://github.com/yourlab/repo" />
                    {form.evidenceLinks.length > 1 && (
                      <button onClick={() => setForm((f) => ({ ...f, evidenceLinks: f.evidenceLinks.filter((_, j) => j !== i) }))}
                        className="p-2 text-gray-300 hover:text-red-400 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button onClick={() => setForm((f) => ({ ...f, evidenceLinks: [...f.evidenceLinks, ""] }))}
                  className="flex items-center gap-1 text-xs text-orange-500 hover:underline">
                  <Plus className="w-3 h-3" /> Add link
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Milestones */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 aura-shadow">
          <h2 className="font-semibold text-gray-900 mb-4">Milestones</h2>
          <div className="space-y-4">
            {milestones.map((ms, i) => (
              <div key={i} className="rounded-xl border border-gray-100 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-bold text-orange-500 px-2 py-0.5 bg-orange-50 rounded-full">{ms.label}</span>
                  <input value={ms.sublabel}
                    onChange={(e) => { const m = [...milestones]; m[i].sublabel = e.target.value; setMilestones(m); }}
                    className="flex-1 px-2.5 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-orange-300"
                    placeholder="Phase name" />
                  <input value={ms.estTime}
                    onChange={(e) => { const m = [...milestones]; m[i].estTime = e.target.value; setMilestones(m); }}
                    className="w-28 px-2.5 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-orange-300"
                    placeholder="3 months" />
                  <input type="number" value={ms.releaseAmount}
                    onChange={(e) => { const m = [...milestones]; m[i].releaseAmount = e.target.value; setMilestones(m); }}
                    className="w-28 px-2.5 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-orange-300"
                    placeholder="USDC amount" />
                </div>
                <div className="space-y-2">
                  <input value={ms.objective}
                    onChange={(e) => { const m = [...milestones]; m[i].objective = e.target.value; setMilestones(m); }}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-orange-300"
                    placeholder="Milestone objective" />
                  <input value={ms.deliverables}
                    onChange={(e) => { const m = [...milestones]; m[i].deliverables = e.target.value; setMilestones(m); }}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-orange-300"
                    placeholder="Deliverables (what will be published/released)" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Optional IPFS pre-upload */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 aura-shadow">
          <h2 className="font-semibold text-gray-900 mb-2">Optional: Pre-upload Research Artifact</h2>
          <p className="text-xs text-gray-400 mb-4">
            Pin any supporting file to IPFS before submitting. The intent JSON is pinned automatically.
          </p>
          <IPFSUploader onUploaded={(r: IPFSUploadResult) => setIpfsCid(r.cid)} />
        </div>

        {/* Submit */}
        <button onClick={handleSubmit} disabled={submitting || !form.title || !form.ticker || !form.hypothesis}
          className="w-full py-3.5 bg-orange-500 text-white font-semibold rounded-2xl hover:bg-orange-600 transition-colors disabled:opacity-40 flex items-center justify-center gap-2 aura-shadow-lg">
          {submitting ? (
            <><Loader2 className="w-5 h-5 animate-spin" />Pinning to IPFS &amp; Publishing…</>
          ) : (
            <><Database className="w-5 h-5" />Publish Intent (IPFS + ERC-8004)</>
          )}
        </button>
      </div>
    </div>
  );
}
