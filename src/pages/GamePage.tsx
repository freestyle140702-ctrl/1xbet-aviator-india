import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import { GameRound } from '../types/index.ts';
import { GameCanvas, GamePhase } from '../components/AviatorGame/GameCanvas.tsx';
import { BetControl } from '../components/AviatorGame/BetControl.tsx';
import { HistoryBar } from '../components/AviatorGame/HistoryBar.tsx';
import { LiveBetsTable } from '../components/AviatorGame/LiveBetsTable.tsx';
import { sound } from '../utils/audio.ts';
import confetti from 'canvas-confetti';
import { ArrowDownToLine, Info, RefreshCw } from 'lucide-react';

interface ActiveBetState {
  betId: string;
  amount: number;
  cashedOut: boolean;
  multiplier?: number;
  winAmount?: number;
}

interface GamePageProps {
  setCurrentTab: (tab: string) => void;
  onOpenAuth: (mode: 'login' | 'register') => void;
}

export const GamePage: React.FC<GamePageProps> = ({ setCurrentTab, onOpenAuth }) => {
  const { user, refreshUser, showToast } = useAuth();

  const [history, setHistory] = useState<GameRound[]>([]);
  const [phase, setPhase] = useState<GamePhase>('countdown');
  const [currentMultiplier, setCurrentMultiplier] = useState<number>(1.0);
  const [countdownRemaining, setCountdownRemaining] = useState<number>(5.0);
  const [crashMultiplier, setCrashMultiplier] = useState<number>(2.0);

  // Active bets for Panel 1 and Panel 2
  const [betPanel1, setBetPanel1] = useState<ActiveBetState | null>(null);
  const [betPanel2, setBetPanel2] = useState<ActiveBetState | null>(null);

  const currentRoundIdRef = useRef<string>('');
  const roundNumberRef = useRef<number>(1001);
  const flightStartTimeRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);
  const targetCrashMultRef = useRef<number>(2.0);
  const isTransitioningRef = useRef<boolean>(false);

  // Fetch initial history
  const loadHistory = useCallback(async () => {
    try {
      const res = await api.game.getHistory();
      setHistory(res.rounds);
    } catch (err) {
      console.warn('Could not load history:', err);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Round lifecycle orchestrator
  const startNewRound = useCallback(async () => {
    if (isTransitioningRef.current) return;
    isTransitioningRef.current = true;

    try {
      let nextRound: { roundId: string; roundNumber: number; crashMultiplier: number; clientSeed: string };
      try {
        nextRound = await api.game.getNextRound();
      } catch (err) {
        console.warn('Network issue fetching next round, using local failover round:', err);
        const fallbackMult = Math.round((1.08 + Math.random() * 3.2) * 100) / 100;
        nextRound = {
          roundId: 'local-' + Date.now(),
          roundNumber: (roundNumberRef.current || 1000) + 1,
          crashMultiplier: fallbackMult,
          clientSeed: 'seed-' + Date.now(),
        };
      }

      currentRoundIdRef.current = nextRound.roundId;
      roundNumberRef.current = nextRound.roundNumber;
      targetCrashMultRef.current = nextRound.crashMultiplier;
      setCrashMultiplier(nextRound.crashMultiplier);

      // Start Countdown
      setPhase('countdown');
      setCurrentMultiplier(1.0);

      // Clear previous cashed out records for next round
      setBetPanel1((prev) => (prev?.cashedOut ? null : prev));
      setBetPanel2((prev) => (prev?.cashedOut ? null : prev));

      let remaining = 5.0;
      setCountdownRemaining(remaining);

      const countdownInterval = setInterval(() => {
        remaining -= 0.1;
        if (remaining <= 0) {
          clearInterval(countdownInterval);
          setCountdownRemaining(0);
          launchFlight();
        } else {
          setCountdownRemaining(Math.max(0, Math.round(remaining * 10) / 10));
        }
      }, 100);
    } catch (err) {
      console.warn('Recovered from round orchestration issue:', err);
      setTimeout(startNewRound, 2000);
    } finally {
      isTransitioningRef.current = false;
    }
  }, []);

  // Launch Flight Sequence
  const launchFlight = () => {
    setPhase('in_flight');
    flightStartTimeRef.current = performance.now();
    sound.startFlightSound();

    const targetMult =
      typeof targetCrashMultRef.current === 'number' && Number.isFinite(targetCrashMultRef.current) && targetCrashMultRef.current >= 1.0
        ? targetCrashMultRef.current
        : 2.0;

    const tick = (now: number) => {
      const elapsedSeconds = Math.max(0, (now - flightStartTimeRef.current) / 1000);
      // Exponential growth curve: climbs from 1.00x upward
      // Speed factor adjusted so a 2.0x takes ~4 seconds, 10x takes ~11 seconds
      const mult = 1.0 + Math.pow(elapsedSeconds * 0.42, 1.48);
      const rounded = Number.isFinite(mult) ? Math.max(1.0, Math.round(mult * 100) / 100) : 1.0;

      sound.updateFlightPitch(rounded);

      if (rounded >= targetMult) {
        // Crash Event
        handleCrash(targetMult);
      } else {
        setCurrentMultiplier(rounded);
        animFrameRef.current = requestAnimationFrame(tick);
      }
    };

    animFrameRef.current = requestAnimationFrame(tick);
  };

  // Handle Plane Crash
  const handleCrash = async (finalMult: number) => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }

    sound.playCrash();
    setPhase('crashed');
    setCurrentMultiplier(finalMult);

    // Settle uncashed bets as loss
    if (betPanel1 && !betPanel1.cashedOut) {
      api.game.settleLoss({ betId: betPanel1.betId }).catch(() => {});
      setBetPanel1(null);
    }
    if (betPanel2 && !betPanel2.cashedOut) {
      api.game.settleLoss({ betId: betPanel2.betId }).catch(() => {});
      setBetPanel2(null);
    }

    // Refresh user balance and history
    await refreshUser();
    await loadHistory();

    // Rest on crash screen for 3.5 seconds then start new countdown
    setTimeout(() => {
      startNewRound();
    }, 3500);
  };

  // Start initial round on mount
  useEffect(() => {
    startNewRound();
    return () => {
      sound.stopFlightSound();
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [startNewRound]);

  // Place Bet Handler
  const handlePlaceBet = async (panelId: number, amount: number): Promise<boolean> => {
    if (!user) {
      onOpenAuth('login');
      return false;
    }

    if (user.balance < amount) {
      showToast('Insufficient balance. Please deposit funds to continue.', 'error');
      return false;
    }

    try {
      const res = await api.game.placeBet({
        roundId: currentRoundIdRef.current,
        amount,
      });

      const newBet: ActiveBetState = {
        betId: res.betId,
        amount,
        cashedOut: false,
      };

      if (panelId === 1) {
        setBetPanel1(newBet);
      } else {
        setBetPanel2(newBet);
      }

      await refreshUser();
      showToast(`Bet of ₹${amount} placed on Round #${roundNumberRef.current}!`, 'success');
      return true;
    } catch (err: any) {
      showToast(err.message || 'Failed to place bet', 'error');
      return false;
    }
  };

  // Cash Out Handler
  const handleCashOut = async (panelId: number, mult: number): Promise<boolean> => {
    const active = panelId === 1 ? betPanel1 : betPanel2;
    if (!active || active.cashedOut) return false;

    try {
      const res = await api.game.cashOut({
        betId: active.betId,
        multiplier: mult,
      });

      sound.playCashOut();
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#ef4444', '#f59e0b', '#10b981'],
      });

      const updatedBet: ActiveBetState = {
        ...active,
        cashedOut: true,
        multiplier: res.multiplier,
        winAmount: res.winAmount,
      };

      if (panelId === 1) {
        setBetPanel1(updatedBet);
      } else {
        setBetPanel2(updatedBet);
      }

      await refreshUser();
      showToast(`Cashed out at ${res.multiplier.toFixed(2)}x! +₹${res.winAmount.toFixed(2)}`, 'success');
      return true;
    } catch (err: any) {
      showToast(err.message || 'Failed to cash out', 'error');
      return false;
    }
  };

  // Cancel Bet during countdown
  const handleCancelBet = (panelId: number) => {
    // If during countdown before flight, cancel client-side representation
    if (phase === 'countdown') {
      if (panelId === 1) setBetPanel1(null);
      if (panelId === 2) setBetPanel2(null);
      showToast('Bet cancelled.', 'info');
    }
  };

  // Aggregate user's active bets for live table
  const userActiveBetsList = [
    ...(betPanel1 ? [{ panelId: 1, ...betPanel1 }] : []),
    ...(betPanel2 ? [{ panelId: 2, ...betPanel2 }] : []),
  ];

  return (
    <div className="space-y-3 pb-12 select-none">
      {/* Top History Multiplier Bar */}
      <HistoryBar rounds={history} />

      {/* Main Responsive Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
        {/* Left / Main Flight Arena & Dual Bet Panels */}
        <div className="lg:col-span-8 space-y-3">
          {/* Canvas Viewport */}
          <GameCanvas
            phase={phase}
            multiplier={currentMultiplier}
            countdownRemaining={countdownRemaining}
            crashMultiplier={crashMultiplier}
          />

          {/* Dual Bet Panels */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <BetControl
              panelId={1}
              phase={phase}
              currentMultiplier={currentMultiplier}
              userBalance={user?.balance ?? 0}
              onPlaceBet={handlePlaceBet}
              onCashOut={handleCashOut}
              onCancelBet={handleCancelBet}
              activeBet={betPanel1}
            />

            <BetControl
              panelId={2}
              phase={phase}
              currentMultiplier={currentMultiplier}
              userBalance={user?.balance ?? 0}
              onPlaceBet={handlePlaceBet}
              onCashOut={handleCashOut}
              onCancelBet={handleCancelBet}
              activeBet={betPanel2}
            />
          </div>

          {/* Quick Balance Warning / Deposit Shortcut */}
          {(user?.balance ?? 0) <= 0 && (
            <div className="bg-red-950/40 border border-red-900/40 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-zinc-300">
                <Info className="w-4 h-4 text-rose-400 shrink-0" />
                <span>Your virtual balance is ₹0.00. Make a deposit via UPI QR to place bets.</span>
              </div>
              <button
                onClick={() => setCurrentTab('deposit')}
                className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold rounded-lg flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
              >
                <ArrowDownToLine className="w-3.5 h-3.5" />
                Deposit via QR Code
              </button>
            </div>
          )}
        </div>

        {/* Right / Live Multiplayer Lobby */}
        <div className="lg:col-span-4">
          <LiveBetsTable
            phase={phase}
            currentMultiplier={currentMultiplier}
            userActiveBets={userActiveBetsList}
            userName={user?.name || 'You'}
          />
        </div>
      </div>
    </div>
  );
};
