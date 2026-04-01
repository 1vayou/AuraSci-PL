"use client";

import { useAppStore } from "@/store";
import { Database, ShieldCheck, Coins, FileText, Zap, Bot, Unlock, Flame } from "lucide-react";
import type { ActivityType } from "@/types";
import { isRealCid } from "@/components/ProtocolBadges";

const ICONS: Record<ActivityType, React.ReactNode> = {
  patronage:         <Coins className="w-3.5 h-3.5 text-orange-500" />,
  proof_submitted:   <FileText className="w-3.5 h-3.5 text-blue-500" />,
  ai_verified:       <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />,
  intent_published:  <Flame className="w-3.5 h-3.5 text-orange-400" />,
  milestone_unlocked:<Unlock className="w-3.5 h-3.5 text-purple-500" />,
  ipfs_pinned:       <Database className="w-3.5 h-3.5 text-emerald-400" />,
  agent_registered:  <Bot className="w-3.5 h-3.5 text-orange-500" />,
  escrow_released:   <Unlock className="w-3.5 h-3.5 text-purple-600" />,
  x402_payment:      <Zap className="w-3.5 h-3.5 text-blue-500" />,
};

function timeAgo(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60)   return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function ActivityFeed({ limit = 12 }: { limit?: number }) {
  const logs = useAppStore((s) => s.activityLogs).slice(0, limit);

  return (
    <div className="space-y-2">
      {logs.map((log) => (
        <div key={log.id}
          className="flex items-start gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors group">
          <div className="mt-0.5 w-6 h-6 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0 group-hover:border-gray-200 transition-colors">
            {ICONS[log.type]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-700 leading-relaxed">{log.message}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-gray-400">{timeAgo(log.timestamp)}</span>
              {log.ipfsCid && (
                isRealCid(log.ipfsCid) ? (
                  <a href={`https://w3s.link/ipfs/${log.ipfsCid}`}
                    target="_blank" rel="noopener noreferrer"
                    className="text-xs text-emerald-500 hover:underline font-mono">
                    {log.ipfsCid.slice(0, 12)}…
                  </a>
                ) : (
                  <span className="text-xs text-emerald-500 font-mono">
                    {log.ipfsCid.slice(0, 12)}…
                  </span>
                )
              )}
              {log.txHash && (
                <span className="text-xs text-gray-300 font-mono">{log.txHash.slice(0, 10)}…</span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
