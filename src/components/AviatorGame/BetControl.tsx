import React, { useState, useEffect } from 'react';
import { GamePhase } from './GameCanvas.tsx';
import { Minus, Plus, Zap, CheckCircle2 } from 'lucide-react';
import { sound } from '../../utils/audio.ts';

interface BetControlProps {
  panelId: number;
  phase: GamePhase;
  currentMultiplier: number;
  userBalance: number;
  onPlaceBet: (panelId: number, amount: number) => Promise<boolean>;
  onCashOut: (panelId: number, multiplier: number) => Promise<boolean>;
  onCancelBet: (panelId: number) => void;
  activeBet: {
    betId: string;
    amount: number;
    cashedOut: boolean;
    winAmount?: number;
    multiplier?: number;
  } | null;
  disabled?: boolean;
}

export const BetControl: React.FC<BetControlProps> = ({
  panelId,
  phase,
  currentMultiplier,
  userBalance,
  onPlaceBet,
  onCashOut,
  onCancelBet,
  activeBet,
  disabled = false,
}) => {
  const [amount, setAmount] = useState<number>(10);
  const [tab, setTab] = useState<'bet' | 'auto'>('bet');
  const [autoCashOutEnabled, setAutoCashOutEnabled] = useState<boolean>(false);
  const [autoCashOutMultiplier, setAutoCashOutMultiplier] = useState<number>(2.0);
  const [autoBetEnabled, setAutoBetEnabled] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Auto cash out watcher
  useEffect(() => {
    if (
      phase === 'in_flight' &&
      activeBet &&
      !activeBet.cashedOut &&
      autoCashOutEnabled &&
      currentMultiplier >= autoCashOutMultiplier
    ) {
      handleCashOutClick();
    }
  }, [phase, currentMultiplier, activeBet, autoCashOutEnabled, autoCashOutMultiplier]);

  // Auto bet watcher during countdown
  useEffect(() => {
    if (phase === 'countdown' && autoBetEnabled && !activeBet && userBalance >= amount) {
      handleBetClick();
    }
  }, [phase, autoBetEnabled, activeBet, userBalance, amount]);

  const handleQuickAmount = (val: number) => {
    sound.playBetClick();
    setAmount(Math.max(1, Math.min(val, 50000)));
  };

  const handleStepAmount = (delta: number) => {
    sound.playBetClick();
    setAmount((prev) => Math.max(1, Math.min(prev + delta, 50000)));
  };

  const handleMultiply = (factor: number) => {
    sound.playBetClick();
    setAmount((prev) => Math.max(1, Math.min(Math.round(prev * factor), 50000)));
  };

  const handleBetClick = async () => {
    if (userBalance < amount) {
      return;
    }
    sound.playBetClick();
    setIsSubmitting(true);
    try {
      await onPlaceBet(panelId, amount);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCashOutClick = async () => {
    if (!activeBet || activeBet.cashedOut) return;
    setIsSubmitting(true);
    try {
      await onCashOut(panelId, currentMultiplier);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentPayout = activeBet ? Math.round(activeBet.amount * currentMultiplier * 100) / 100 : 0;

  return (
    <div className="bg-[#10121a] border border-zinc-800/80 rounded-xl p-3 flex flex-col justify-between shadow-lg relative overflow-hidden">
      {/* Top Header / Mode Switch */}
      <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-zinc-800/60">
        <div className="flex items-center gap-2">
          <span className="text-zinc-400 font-semibold text-xs tracking-wider uppercase">Bet {panelId}</span>
          {activeBet && !activeBet.cashedOut && (
            <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded font-mono border border-emerald-800/40">
              Active Bet: ₹{activeBet.amount}
            </span>
          )}
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center bg-[#090a0f] p-0.5 rounded-lg border border-zinc-800">
          <button
            onClick={() => setTab('bet')}
            className={`px-3 py-1 text-xs font-semibold rounded transition ${
              tab === 'bet' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Bet
          </button>
          <button
            onClick={() => setTab('auto')}
            className={`px-3 py-1 text-xs font-semibold rounded transition flex items-center gap-1 ${
              tab === 'auto' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Zap className="w-3 h-3 text-amber-400" />
            Auto
          </button>
        </div>
      </div>

      {/* Auto Settings Bar (visible in Auto tab) */}
      {tab === 'auto' && (
        <div className="grid grid-cols-2 gap-2 mb-2 p-2 bg-[#090a0f] rounded-lg border border-zinc-800/80 text-xs">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-zinc-400 text-[11px] font-medium">Auto Bet</span>
            <input
              type="checkbox"
              checked={autoBetEnabled}
              onChange={(e) => setAutoBetEnabled(e.target.checked)}
              className="accent-rose-500 w-3.5 h-3.5 cursor-pointer rounded"
            />
          </label>
          <div className="flex items-center justify-between gap-1">
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="checkbox"
                checked={autoCashOutEnabled}
                onChange={(e) => setAutoCashOutEnabled(e.target.checked)}
                className="accent-rose-500 w-3.5 h-3.5 cursor-pointer rounded"
              />
              <span className="text-zinc-400 text-[11px] font-medium">Auto Cash</span>
            </label>
            <input
              type="number"
              step="0.1"
              min="1.1"
              max="100"
              value={autoCashOutMultiplier}
              onChange={(e) => setAutoCashOutMultiplier(Math.max(1.1, parseFloat(e.target.value) || 2.0))}
              disabled={!autoCashOutEnabled}
              className="w-14 bg-zinc-900 border border-zinc-700 rounded px-1.5 py-0.5 text-right font-mono text-xs text-white disabled:opacity-40"
            />
          </div>
        </div>
      )}

      {/* Main Interactive Controls Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-stretch">
        {/* Left: Amount Input and Steppers */}
        <div className="sm:col-span-7 flex flex-col justify-between space-y-2">
          {/* Amount Stepper */}
          <div className="flex items-center bg-[#090a0f] border border-zinc-800 rounded-lg p-1">
            <button
              onClick={() => handleStepAmount(-10)}
              disabled={amount <= 1 || !!activeBet}
              className="w-9 h-9 rounded-md bg-zinc-800/80 hover:bg-zinc-700 text-white flex items-center justify-center transition active:scale-95 disabled:opacity-30 cursor-pointer"
            >
              <Minus className="w-4 h-4" />
            </button>

            <div className="flex-1 px-2 text-center">
              <div className="text-[10px] text-zinc-400 font-medium tracking-wide">Amount (₹)</div>
              <input
                type="number"
                min="1"
                max="50000"
                value={amount}
                disabled={!!activeBet}
                onChange={(e) => setAmount(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-transparent text-center font-bold font-mono text-base text-white focus:outline-none"
              />
            </div>

            <button
              onClick={() => handleStepAmount(10)}
              disabled={!!activeBet}
              className="w-9 h-9 rounded-md bg-zinc-800/80 hover:bg-zinc-700 text-white flex items-center justify-center transition active:scale-95 disabled:opacity-30 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Preset Amount Chips */}
          <div className="grid grid-cols-6 gap-1">
            {[10, 50, 100, 500].map((val) => (
              <button
                key={val}
                type="button"
                disabled={!!activeBet}
                onClick={() => handleQuickAmount(val)}
                className={`py-1 rounded text-[11px] font-mono font-semibold transition border ${
                  amount === val
                    ? 'bg-rose-950/60 border-rose-600/70 text-rose-300'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800'
                } disabled:opacity-30 cursor-pointer`}
              >
                ₹{val}
              </button>
            ))}
            <button
              type="button"
              disabled={!!activeBet}
              onClick={() => handleMultiply(2)}
              className="py-1 rounded text-[11px] font-mono font-semibold bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition disabled:opacity-30 cursor-pointer"
            >
              2X
            </button>
            <button
              type="button"
              disabled={!!activeBet}
              onClick={() => handleMultiply(0.5)}
              className="py-1 rounded text-[11px] font-mono font-semibold bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition disabled:opacity-30 cursor-pointer"
            >
              ½X
            </button>
          </div>
        </div>

        {/* Right: Primary Glowing Action Button */}
        <div className="sm:col-span-5 flex">
          {/* 1. If Cashed Out in this round */}
          {activeBet && activeBet.cashedOut ? (
            <div className="w-full min-h-[76px] rounded-xl bg-emerald-950/70 border border-emerald-600/60 p-2 flex flex-col items-center justify-center text-center animate-fadeIn">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 mb-0.5" />
              <div className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider">Cashed Out @ {activeBet.multiplier?.toFixed(2)}x</div>
              <div className="text-base font-black font-mono text-emerald-400">
                +₹{activeBet.winAmount?.toFixed(2)}
              </div>
            </div>
          ) : phase === 'in_flight' && activeBet && !activeBet.cashedOut ? (
            /* 2. In Flight & Bet Active -> CASH OUT BUTTON */
            <button
              onClick={handleCashOutClick}
              disabled={isSubmitting}
              className="w-full min-h-[76px] rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-black font-black p-2 flex flex-col items-center justify-center shadow-[0_0_25px_rgba(245,158,11,0.5)] active:scale-95 transition-all cursor-pointer animate-pulse"
            >
              <span className="text-xs tracking-wider uppercase opacity-90">Cash Out</span>
              <span className="text-xl font-mono font-black tracking-tight">₹{currentPayout.toFixed(2)}</span>
              <span className="text-[10px] font-bold tracking-widest bg-black/20 px-2 py-0.2 rounded mt-0.5">
                {currentMultiplier.toFixed(2)}x
              </span>
            </button>
          ) : phase === 'countdown' && activeBet ? (
            /* 3. In Countdown with Active Bet -> CANCEL BUTTON */
            <button
              onClick={() => onCancelBet(panelId)}
              className="w-full min-h-[76px] rounded-xl bg-red-950/80 hover:bg-red-900 border border-red-700/60 text-red-300 font-bold p-2 flex flex-col items-center justify-center transition active:scale-95 cursor-pointer"
            >
              <span className="text-xs uppercase tracking-wider">Cancel Bet</span>
              <span className="text-sm font-mono font-bold mt-1">₹{activeBet.amount}</span>
              <span className="text-[10px] text-zinc-400 mt-0.5">Waiting takeoff...</span>
            </button>
          ) : (
            /* 4. Ready to Bet -> BET BUTTON */
            <button
              onClick={handleBetClick}
              disabled={disabled || isSubmitting || userBalance < amount}
              className={`w-full min-h-[76px] rounded-xl font-bold p-2 flex flex-col items-center justify-center transition-all duration-150 active:scale-95 cursor-pointer ${
                userBalance < amount
                  ? 'bg-zinc-800 border border-zinc-700 text-zinc-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 hover:from-rose-500 hover:to-red-600 text-white shadow-[0_0_20px_rgba(225,29,72,0.45)] border border-rose-500/50'
              }`}
            >
              <span className="text-sm uppercase tracking-wider font-extrabold">
                {phase === 'in_flight' ? 'BET NEXT ROUND' : 'BET'}
              </span>
              <span className="text-lg font-mono font-black mt-0.5">₹{amount}</span>
              {userBalance < amount && (
                <span className="text-[10px] text-rose-400 font-medium mt-0.5">Deposit required</span>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
