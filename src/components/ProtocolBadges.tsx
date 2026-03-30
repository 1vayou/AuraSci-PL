"use client";

import { Database, Cpu, Lock, Zap, ExternalLink, CheckCircle2 } from "lucide-react";
import { NETWORK } from "@/lib/protocol";

interface Props {
  ipfsCid?: string;
  agentId?: string;
  agentReputation?: number;
  txHash?: string;
  escrowTxHash?: string;
  registrationTxHash?: string;
  size?: "sm" | "md";
}

function TxLink({ hash, label }: { hash: string; label: string }) {
  const short = `${hash.slice(0, 8)}...${hash.slice(-4)}`;
  return (
    <a
      href={`${NETWORK.explorer}${hash}`}
      target="_blank" rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-orange-500 transition-colors font-mono"
      title={hash}
    >
      {label}: {short} <ExternalLink className="w-2.5 h-2.5" />
    </a>
  );
}

export default function ProtocolBadges({
  ipfsCid, agentId, agentReputation, txHash, escrowTxHash, registrationTxHash, size = "md",
}: Props) {
  const isSmall = size === "sm";

  return (
    <div className={`flex flex-wrap gap-1.5 ${isSmall ? "text-xs" : ""}`}>
      {/* IPFS Badge */}
      {ipfsCid && (
        <a
          href={`https://w3s.link/ipfs/${ipfsCid}`}
          target="_blank" rel="noopener noreferrer"
          className="badge-ipfs hover:opacity-80 transition-opacity cursor-pointer"
          title={ipfsCid}
        >
          <Database className="w-3 h-3" />
          IPFS {ipfsCid.slice(0, 8)}…
          <ExternalLink className="w-2.5 h-2.5 ml-0.5 opacity-60" />
        </a>
      )}

      {/* ERC-8004 Badge */}
      {agentId && (
        <div className="badge-erc8004">
          <Cpu className="w-3 h-3" />
          {agentId}
          {agentReputation !== undefined && (
            <span className="ml-1 text-orange-400">★{agentReputation}</span>
          )}
        </div>
      )}

      {/* ERC-8183 Escrow Badge */}
      {escrowTxHash && (
        <div className="badge-erc8183">
          <Lock className="w-3 h-3" />
          EIP-8183 Escrow
          <CheckCircle2 className="w-3 h-3 ml-0.5 text-purple-400" />
        </div>
      )}

      {/* x402 Badge */}
      <div className="badge-x402">
        <Zap className="w-3 h-3" />
        x402
      </div>

      {/* Tx hashes */}
      {registrationTxHash && !isSmall && (
        <TxLink hash={registrationTxHash} label="RegTx" />
      )}
      {txHash && !isSmall && (
        <TxLink hash={txHash} label="Tx" />
      )}
    </div>
  );
}
