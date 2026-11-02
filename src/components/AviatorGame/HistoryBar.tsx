import React, { useState } from 'react';
import { GameRound } from '../../types/index.ts';
import { History, ShieldCheck, X } from 'lucide-react';

interface HistoryBarProps {
  rounds: GameRound[];
  onSelectRound?: (round: GameRound) => void;
}

export const HistoryBar: React.FC<HistoryBarProps> = ({ rounds }) => {
  const [selectedRound, setSelectedRound] = useState<GameRound | null>(null);

  const getMultiplierStyle = (multiplier: number) => {
    if (multiplier >= 10.0) {
      return 'text-amber-400 bg-amber-950/40 border-amber-500/40 hover:border-amber-400';
    } else if (multiplier >= 2.0) {
      return 'text-rose-400 bg-rose-950/40 border-rose-500/40 hover:border-rose-400';
    } else {
      return 'text-sky-400 bg-sky-950/40 border-sky-500/30 hover:border-sky-400';
    }
  };

  return (
    <div className="w-full bg-[#0a0b10] border-b border-red-950/40 px-2 py-1.5 flex items-center gap-2 select-none">
      <div className="flex items-center gap-1.5 text-zinc-400 text-xs font-semibold uppercase tracking-wider pl-1 pr-2 shrink-0 border-r border-zinc-800/80">
        <History className="w-3.5 h-3.5 text-rose-500" />
        <span className="hidden sm:inline">Rounds</span>
      </div>

      <div className="flex-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        {rounds.length === 0 ? (
          <span className="text-zinc-600 text-xs italic">Waiting for flight history...</span>
        ) : (
          rounds.map((round) => (
            <button
              key={round.id}
              onClick={() => setSelectedRound(round)}
              className={`shrink-0 px-2.5 py-0.5 rounded border text-xs font-mono font-bold tracking-tight transition-all duration-150 active:scale-95 cursor-pointer ${getMultiplierStyle(
                round.crashMultiplier
              )}`}
              title={`Round #${round.roundNumber}: ${round.crashMultiplier.toFixed(2)}x - Click to inspect seed`}
            >
              {round.crashMultiplier.toFixed(2)}x
            </button>
          ))
        )}
      </div>

      {/* Provably Simulated Seed Details Modal */}
      {selectedRound && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#12141c] border border-zinc-800 rounded-xl p-5 max-w-md w-full shadow-2xl relative">
            <button
              onClick={() => setSelectedRound(null)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800/60"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="w-6 h-6 text-rose-500" />
              <div>
                <h3 className="text-base font-bold text-white">Round #{selectedRound.roundNumber} Verification</h3>
                <p className="text-xs text-zinc-400">Cryptographically verifiable simulated outcome</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-[#0a0b10] border border-zinc-800 rounded-lg p-3">
                <span className="text-zinc-400 block mb-1">Crashed At Multiplier</span>
                <span
                  className={`text-2xl font-black font-mono ${
                    selectedRound.crashMultiplier >= 10
                      ? 'text-amber-400'
                      : selectedRound.crashMultiplier >= 2
                      ? 'text-rose-400'
                      : 'text-sky-400'
                  }`}
                >
                  {selectedRound.crashMultiplier.toFixed(2)}x
                </span>
              </div>

              <div>
                <label className="text-zinc-400 block mb-1 font-medium">Server Seed (SHA-256 Hash)</label>
                <div className="bg-zinc-950 font-mono text-[11px] text-zinc-300 p-2 rounded border border-zinc-800 break-all select-all">
                  {selectedRound.serverSeed}
                </div>
              </div>

              {selectedRound.clientSeed && (
                <div>
                  <label className="text-zinc-400 block mb-1 font-medium">Client Seed</label>
                  <div className="bg-zinc-950 font-mono text-[11px] text-zinc-300 p-2 rounded border border-zinc-800 break-all select-all">
                    {selectedRound.clientSeed}
                  </div>
                </div>
              )}

              <div className="text-[11px] text-zinc-500 pt-2 border-t border-zinc-800">
                Timestamp: {new Date(selectedRound.createdAt).toLocaleString()} · Algorithmic Fair Simulator
              </div>
            </div>

            <div className="mt-5">
              <button
                onClick={() => setSelectedRound(null)}
                className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-lg text-xs transition"
              >
                Close Verification
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
