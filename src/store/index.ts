import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  UserRole, ScientistProfile, IntentAsset, Milestone,
  Patron, ActivityLog, IPFSUploadResult
} from '@/types';
import { MOCK_SCIENTISTS, MOCK_INTENTS, MOCK_ACTIVITY_LOGS } from '@/lib/mock-data';
import { updateReputation, releaseEscrow, createEscrowJob } from '@/lib/protocol';

function ts() { return Date.now(); }
function logId() { return `log_${ts()}_${Math.random().toString(36).slice(2, 6)}`; }

interface AppState {
  currentUser: { role: UserRole; profile?: ScientistProfile; auraCredits: number };
  intents: IntentAsset[];
  scientists: ScientistProfile[];
  activityLogs: ActivityLog[];
  lastIPFSUpload: IPFSUploadResult | null;
  // Actions
  setUserRole: (role: UserRole) => void;
  setScientistProfile: (profile: ScientistProfile) => void;
  addIntent: (intent: IntentAsset) => void;
  updateIntent: (id: string, updates: Partial<IntentAsset>) => void;
  updateMilestone: (intentId: string, milestoneId: string, updates: Partial<Milestone>) => void;
  addPatronage: (intentId: string, patron: Patron) => void;
  submitProof: (intentId: string, milestoneId: string, ipfsCid?: string) => void;
  verifyMilestone: (intentId: string, milestoneId: string) => void;
  addLog: (log: Omit<ActivityLog, 'id' | 'timestamp'>) => void;
  boostIntent: (intentId: string, amount: number) => void;
  setLastIPFSUpload: (result: IPFSUploadResult) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentUser: { role: 'guest', auraCredits: 1000 },
      intents: MOCK_INTENTS,
      scientists: MOCK_SCIENTISTS,
      activityLogs: MOCK_ACTIVITY_LOGS,
      lastIPFSUpload: null,

      setUserRole: (role) => set((s) => ({ currentUser: { ...s.currentUser, role } })),

      setScientistProfile: (profile) => set((s) => {
        const exists = s.scientists.find(sc => sc.id === profile.id);
        return {
          currentUser: { ...s.currentUser, profile },
          scientists: exists
            ? s.scientists.map(sc => sc.id === profile.id ? profile : sc)
            : [...s.scientists, profile],
        };
      }),

      addIntent: (intent) => set((s) => ({
        intents: [intent, ...s.intents],
        activityLogs: [{
          id: logId(), timestamp: ts(), type: 'intent_published',
          message: `🧬 ${intent.ticker} published. Intent JSON pinned to IPFS via Storacha.`,
          ticker: intent.ticker, intentId: intent.id, ipfsCid: intent.ipfsCid,
        }, ...s.activityLogs],
      })),

      updateIntent: (id, updates) => set((s) => ({
        intents: s.intents.map(i => i.id === id ? { ...i, ...updates } : i),
      })),

      updateMilestone: (intentId, milestoneId, updates) => {
        if (updates.status === 'proof_submitted') {
          get().submitProof(intentId, milestoneId);
        } else if (updates.status === 'ai_verified') {
          get().verifyMilestone(intentId, milestoneId);
        } else {
          set((s) => ({
            intents: s.intents.map(i => {
              if (i.id !== intentId) return i;
              return { ...i, milestones: i.milestones.map(m => m.id === milestoneId ? { ...m, ...updates } : m) };
            }),
          }));
        }
      },

      submitProof: (intentId, milestoneId, ipfsCid) => set((s) => {
        const intent = s.intents.find(i => i.id === intentId);
        const milestone = intent?.milestones.find(m => m.id === milestoneId);
        const scientist = intent ? s.scientists.find(sc => sc.id === intent.scientistId) : undefined;
        if (!intent || !milestone) return s;
        const newLogs: ActivityLog[] = [];
        if (ipfsCid) {
          newLogs.push({ id: logId(), timestamp: ts(), type: 'ipfs_pinned', message: `📦 Proof artifact pinned to IPFS via Storacha`, ticker: intent.ticker, intentId: intent.id, ipfsCid });
        }
        newLogs.push({ id: logId(), timestamp: ts(), type: 'proof_submitted', message: `📄 ${scientist?.fullName ?? 'Scientist'} submitted proof for ${intent.ticker} ${milestone.label}`, ticker: intent.ticker, intentId: intent.id });
        return {
          intents: s.intents.map(i => {
            if (i.id !== intentId) return i;
            return {
              ...i, milestones: i.milestones.map(m =>
                m.id === milestoneId ? { ...m, status: 'proof_submitted' as const, ipfsCid: ipfsCid ?? m.ipfsCid } : m
              )
            };
          }),
          activityLogs: [...newLogs, ...s.activityLogs],
        };
      }),

      verifyMilestone: (intentId, milestoneId) => set((s) => {
        const intent = s.intents.find(i => i.id === intentId);
        const milestone = intent?.milestones.find(m => m.id === milestoneId);
        if (!intent || !milestone) return s;
        const msIndex = intent.milestones.findIndex(m => m.id === milestoneId);
        const repTx = updateReputation(intent.agentId ?? 'unknown', 5);
        const escrowJob = createEscrowJob(
          intentId, milestoneId, milestone.releaseAmountUSDC,
          'Protocol', intent.scientistId, intent.agentId ?? 'ERC8004-0',
        );
        const releasedJob = releaseEscrow(escrowJob);
        return {
          intents: s.intents.map(i => {
            if (i.id !== intentId) return i;
            return {
              ...i,
              milestones: i.milestones.map((m, idx) => {
                if (m.id === milestoneId) return {
                  ...m, status: 'ai_verified' as const,
                  verificationTxHash: repTx,
                  escrowTxHash: releasedJob.releaseTx,
                  releaseTimestamp: Date.now(),
                };
                if (idx === msIndex + 1 && m.status === 'locked') return { ...m, status: 'in_progress' as const };
                return m;
              }),
            };
          }),
          activityLogs: [
            {
              id: logId(), timestamp: ts(), type: 'escrow_released' as const,
              message: `🔓 EIP-8183 Escrow released: ${milestone.releaseAmountUSDC.toLocaleString()} USDC → Scientist`,
              ticker: intent.ticker, intentId: intent.id, txHash: releasedJob.releaseTx,
            },
            {
              id: logId(), timestamp: ts(), type: 'ai_verified' as const,
              message: `🛡️ ${intent.agentId ?? 'ERC-8004 Agent'} verified ${intent.ticker} ${milestone.label}. Reputation updated on-chain.`,
              ticker: intent.ticker, intentId: intent.id, txHash: repTx,
            },
            ...s.activityLogs,
          ],
        };
      }),

      addPatronage: (intentId, patron) => set((s) => {
        const intent = s.intents.find(i => i.id === intentId);
        if (!intent) return s;
        return {
          intents: s.intents.map(i => {
            if (i.id !== intentId) return i;
            return {
              ...i,
              escrowedAmountUSDC: i.escrowedAmountUSDC + patron.amountUSDC,
              patrons: [...(i.patrons ?? []), patron],
              supporterCount: (i.supporterCount ?? 0) + 1,
            };
          }),
          activityLogs: [{
            id: logId(), timestamp: ts(), type: 'patronage' as const,
            message: `💰 ${patron.name} funded ${patron.amountUSDC.toLocaleString()} USDC to ${intent.ticker} (EIP-8183 Escrow)`,
            ticker: intent.ticker, intentId: intent.id, txHash: patron.escrowTxHash,
          }, ...s.activityLogs],
        };
      }),

      addLog: (log) => set((s) => ({
        activityLogs: [{ ...log, id: logId(), timestamp: ts() }, ...s.activityLogs],
      })),

      boostIntent: (intentId, amount) => set((s) => {
        const intent = s.intents.find(i => i.id === intentId);
        if (!intent || s.currentUser.auraCredits < amount) return s;
        return {
          currentUser: { ...s.currentUser, auraCredits: s.currentUser.auraCredits - amount },
          intents: s.intents.map(i => i.id !== intentId ? i : { ...i, boostScore: (i.boostScore ?? 0) + amount }),
          activityLogs: [{
            id: logId(), timestamp: ts(), type: 'intent_published' as const,
            message: `🔥 +${amount} Aura boost to ${intent.ticker}`,
            ticker: intent.ticker, intentId: intent.id,
          }, ...s.activityLogs],
        };
      }),

      setLastIPFSUpload: (result) => set({ lastIPFSUpload: result }),
    }),
    {
      name: 'aurasci-pl-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentUser: state.currentUser,
        intents: state.intents,
        scientists: state.scientists,
        activityLogs: state.activityLogs,
      }),
    }
  )
);
