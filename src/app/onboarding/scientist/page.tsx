"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store";
import { FlaskConical, Loader2, CheckCircle2, Database, Cpu, ArrowRight } from "lucide-react";
import IPFSUploader from "@/components/IPFSUploader";
import { buildAgentManifest } from "@/lib/protocol";
import type { IPFSUploadResult, ScientistProfile } from "@/types";

export default function ScientistOnboarding() {
  const router = useRouter();
  const setScientistProfile = useAppStore((s) => s.setScientistProfile);
  const addLog = useAppStore((s) => s.addLog);

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [agentResult, setAgentResult] = useState<{ tokenId: string; registrationTx: string } | null>(null);
  const [manifestCid, setManifestCid] = useState<string | null>(null);

  const [form, setForm] = useState({
    fullName: "", email: "", handle: "", affiliation: "", bio: "",
  });

  const handleField = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  // Step 2: Upload agent manifest to IPFS and register ERC-8004 agent
  const handleRegister = async () => {
    setLoading(true);
    try {
      const manifest = buildAgentManifest({
        id: `sci_${Date.now()}`,
        fullName: form.fullName,
        affiliation: form.affiliation,
        tags: ["#DeSci"],
      });

      // 1. Pin agent.json to IPFS
      const ipfsForm = new FormData();
      ipfsForm.append("json", JSON.stringify(manifest, null, 2));
      ipfsForm.append("filename", "agent.json");
      const ipfsRes = await fetch("/api/ipfs", { method: "POST", body: ipfsForm });
      const ipfsData: IPFSUploadResult = await ipfsRes.json();
      setManifestCid(ipfsData.cid);

      // 2. Register ERC-8004 agent
      const agentRes = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "register",
          scientistId: `sci_${Date.now()}`,
          manifestCid: ipfsData.cid,
          fullName: form.fullName,
          affiliation: form.affiliation,
        }),
      });
      const agentData = await agentRes.json();
      setAgentResult(agentData.agent);

      const profile: ScientistProfile = {
        id: `sci_${Date.now()}`,
        ...form,
        status: "approved",
        agentNftId: agentData.agent?.tokenId,
        agentManifestCid: ipfsData.cid,
        reputationScore: agentData.agent?.reputationScore ?? 85,
      };
      setScientistProfile(profile);

      addLog({
        type: "agent_registered",
        message: `🤖 ERC-8004 Agent registered for ${form.fullName}. Manifest pinned to IPFS.`,
        txHash: agentData.agent?.registrationTx,
        ipfsCid: ipfsData.cid,
      });

      setStep(3);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors
                ${step >= s ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-400"}`}>
                {step > s ? <CheckCircle2 className="w-4 h-4" /> : s}
              </div>
              {s < 3 && <div className={`flex-1 h-0.5 rounded-full transition-colors ${step > s ? "bg-orange-400" : "bg-gray-100"}`} />}
            </div>
          ))}
        </div>

        {/* Step 1 – Profile */}
        {step === 1 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-7 aura-shadow">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <FlaskConical className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h1 className="font-bold text-gray-900">Create Scientist Profile</h1>
                <p className="text-xs text-gray-400">Step 1 of 3 · Profile information</p>
              </div>
            </div>
            <div className="space-y-4">
              {(["fullName", "affiliation", "handle", "email"] as const).map((field) => (
                <div key={field}>
                  <label className="block text-xs font-medium text-gray-500 mb-1 capitalize">
                    {field === "fullName" ? "Full Name" : field === "affiliation" ? "Institution" : field === "handle" ? "Handle (@)" : "Email"}
                  </label>
                  <input
                    value={form[field]} onChange={handleField(field)}
                    placeholder={field === "handle" ? "@your_handle" : ""}
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-orange-300 focus:ring-1 focus:ring-orange-100 transition-colors"
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Research Bio</label>
                <textarea
                  value={form.bio} onChange={handleField("bio")} rows={3}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-orange-300 resize-none transition-colors"
                  placeholder="Your research focus, methods, and goals…"
                />
              </div>
            </div>
            <button
              onClick={() => setStep(2)}
              disabled={!form.fullName || !form.email || !form.affiliation}
              className="mt-6 w-full py-3 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-40 flex items-center justify-center gap-2">
              Next: Register AI Agent <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step 2 – Agent Registration */}
        {step === 2 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-7 aura-shadow">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                <Cpu className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <h1 className="font-bold text-gray-900">Register ERC-8004 AI Agent</h1>
                <p className="text-xs text-gray-400">Step 2 of 3 · IPFS + On-chain registration</p>
              </div>
            </div>
            <div className="space-y-4 mb-6">
              <div className="rounded-xl bg-orange-50 border border-orange-100 p-4 text-sm text-orange-700 leading-relaxed">
                <p className="font-medium mb-2">What happens next:</p>
                <ol className="space-y-1 text-xs list-decimal list-inside text-orange-600">
                  <li>Your <code className="bg-orange-100 px-1 rounded">agent.json</code> manifest is pinned to IPFS via Storacha</li>
                  <li>An ERC-8004 NFT is minted in the Identity Registry (Filecoin EVM)</li>
                  <li>Your reputation score initialises in the Reputation Registry</li>
                </ol>
              </div>
              <div className="rounded-xl border border-gray-100 p-4 space-y-2 text-xs">
                <div className="flex justify-between"><span className="text-gray-400">Name</span><span className="font-medium">{form.fullName}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Institution</span><span className="font-medium">{form.affiliation}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Network</span><span className="font-medium text-emerald-600">Filecoin Calibration</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Standard</span><span className="font-medium">ERC-8004 Identity + Reputation Registry</span></div>
              </div>
            </div>
            <button onClick={handleRegister} disabled={loading}
              className="w-full py-3 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Pinning to IPFS & Registering…</>
              ) : (
                <><Database className="w-4 h-4" />Register Agent (IPFS + ERC-8004)</>
              )}
            </button>
          </div>
        )}

        {/* Step 3 – Done */}
        {step === 3 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-7 aura-shadow text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>
            <h2 className="font-bold text-xl text-gray-900 mb-2">Agent Registered!</h2>
            <p className="text-sm text-gray-500 mb-6">
              Your ERC-8004 AI agent is live. Manifest pinned to IPFS via Storacha.
            </p>
            {agentResult && (
              <div className="rounded-xl bg-gray-50 p-4 text-left space-y-2 mb-6">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Token ID</span>
                  <span className="font-bold text-orange-500">{agentResult.tokenId}</span>
                </div>
                {manifestCid && (
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">IPFS Manifest</span>
                    <a href={`https://w3s.link/ipfs/${manifestCid}`} target="_blank" rel="noopener noreferrer"
                      className="font-mono text-emerald-600 hover:underline">
                      {manifestCid.slice(0, 18)}…
                    </a>
                  </div>
                )}
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Registration Tx</span>
                  <span className="font-mono text-gray-500">{agentResult.registrationTx.slice(0, 18)}…</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Network</span>
                  <span className="text-emerald-600">Filecoin Calibration</span>
                </div>
              </div>
            )}
            <button onClick={() => router.push("/dashboard/scientist")}
              className="w-full py-3 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 transition-colors">
              Go to Scientist Dashboard →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
