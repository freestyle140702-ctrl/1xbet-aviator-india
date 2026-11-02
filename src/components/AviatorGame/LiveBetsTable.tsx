import React, { useState, useEffect } from 'react';
import { GamePhase } from './GameCanvas.tsx';
import { Users, User as UserIcon } from 'lucide-react';

interface SimulatedPlayer {
  id: string;
  name: string;
  avatarSeed: string;
  betAmount: number;
  cashoutTarget: number;
  cashedOut: boolean;
  cashedOutMultiplier?: number;
  winAmount?: number;
}

interface LiveBetsTableProps {
  phase: GamePhase;
  currentMultiplier: number;
  userActiveBets: {
    panelId: number;
    amount: number;
    cashedOut: boolean;
    multiplier?: number;
    winAmount?: number;
  }[];
  userName?: string;
}

const BOT_NAMES = [
  'Rahul_S', 'Aman99', 'Priya_G', 'Vikas_R', 'SkyRider',
  'Deepak_K', 'Ananya_B', 'Rohit_X', 'Rohan_P', 'Kavita_M',
  'Sameer_J', 'Arjun_V', 'Suresh_D', 'Megha_T', 'Sunny_7',
  'Aditya_9', 'Neha_Sharma', 'Karan_Jet', 'Vijay_Pro', 'Pooja_R'
];

export const LiveBetsTable: React.FC<LiveBetsTableProps> = ({
  phase,
  currentMultiplier,
  userActiveBets,
  userName = 'You',
}) => {
  const [players, setPlayers] = useState<SimulatedPlayer[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'my'>('all');

  // Generate simulated lobby players at start of each round
  useEffect(() => {
    if (phase === 'countdown') {
      const count = 12 + Math.floor(Math.random() * 8);
      const shuffled = [...BOT_NAMES].sort(() => 0.5 - Math.random()).slice(0, count);
      const newPlayers: SimulatedPlayer[] = shuffled.map((name, i) => {
        const betAmounts = [10, 20, 50, 100, 200, 500, 1000, 2000];
        const betAmount = betAmounts[Math.floor(Math.random() * betAmounts.length)];
        // Targets between 1.1x and 8.0x
        const cashoutTarget = Math.round((1.1 + Math.random() * 5.5) * 100) / 100;
        return {
          id: `bot-${i}-${Date.now()}`,
          name,
          avatarSeed: name.slice(0, 2).toUpperCase(),
          betAmount,
          cashoutTarget,
          cashedOut: false,
        };
      });
      setPlayers(newPlayers);
    }
  }, [phase]);

  // Handle simulated cashouts as multiplier rises
  useEffect(() => {
    if (phase === 'in_flight') {
      setPlayers((prev) =>
        prev.map((player) => {
          if (!player.cashedOut && currentMultiplier >= player.cashoutTarget) {
            return {
              ...player,
              cashedOut: true,
              cashedOutMultiplier: player.cashoutTarget,
              winAmount: Math.round(player.betAmount * player.cashoutTarget * 100) / 100,
            };
          }
          return player;
        })
      );
    }
  }, [phase, currentMultiplier]);

  const totalBetsVolume =
    players.reduce((sum, p) => sum + p.betAmount, 0) +
    userActiveBets.reduce((sum, b) => sum + b.amount, 0);

  const totalCashedOutCount =
    players.filter((p) => p.cashedOut).length +
    userActiveBets.filter((b) => b.cashedOut).length;

  return (
    <div className="bg-[#0e1017] border border-zinc-800/80 rounded-xl overflow-hidden flex flex-col h-[480px]">
      {/* Lobby Header */}
      <div className="px-3 py-2.5 bg-[#090a0f] border-b border-zinc-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-rose-500" />
          <span className="text-xs font-bold text-white tracking-wide uppercase">Live Lobby</span>
          <span className="text-[10px] text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded font-mono">
            {players.length + userActiveBets.length} Bets
          </span>
        </div>

        {/* Tab switch */}
        <div className="flex items-center bg-zinc-900 p-0.5 rounded-lg border border-zinc-800 text-[11px]">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-2.5 py-0.5 rounded font-medium transition ${
              activeTab === 'all' ? 'bg-zinc-800 text-white shadow-xs' : 'text-zinc-400 hover:text-white'
            }`}
          >
            All Bets
          </button>
          <button
            onClick={() => setActiveTab('my')}
            className={`px-2.5 py-0.5 rounded font-medium transition ${
              activeTab === 'my' ? 'bg-zinc-800 text-white shadow-xs' : 'text-zinc-400 hover:text-white'
            }`}
          >
            My Bets ({userActiveBets.length})
          </button>
        </div>
      </div>

      {/* Stats summary bar */}
      <div className="grid grid-cols-2 px-3 py-1.5 bg-[#0b0c13] border-b border-zinc-800/40 text-[11px] text-zinc-400">
        <div>Total Pool: <span className="font-mono text-white font-semibold">₹{totalBetsVolume}</span></div>
        <div className="text-right">Cashed Out: <span className="font-mono text-emerald-400 font-semibold">{totalCashedOutCount}</span></div>
      </div>

      {/* Column Headers */}
      <div className="grid grid-cols-12 px-3 py-1.5 bg-zinc-950/60 text-[10px] text-zinc-400 font-semibold uppercase tracking-wider border-b border-zinc-800/40">
        <div className="col-span-5">Player</div>
        <div className="col-span-3 text-right">Bet</div>
        <div className="col-span-2 text-right">Mult</div>
        <div className="col-span-2 text-right">Cash Out</div>
      </div>

      {/* Bets Rows List */}
      <div className="flex-1 overflow-y-auto divide-y divide-zinc-800/40 font-mono text-xs">
        {/* User's Active Bets rendered at the very top */}
        {userActiveBets.map((bet) => (
          <div
            key={`user-${bet.panelId}`}
            className="grid grid-cols-12 px-3 py-2 items-center bg-rose-950/30 border-l-2 border-rose-500 animate-fadeIn"
          >
            <div className="col-span-5 flex items-center gap-1.5 truncate">
              <span className="w-5 h-5 rounded-full bg-rose-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                ★
              </span>
              <span className="text-rose-200 font-semibold truncate text-[11px]">{userName} (Bet {bet.panelId})</span>
            </div>
            <div className="col-span-3 text-right text-white font-semibold">₹{bet.amount}</div>
            <div className="col-span-2 text-right">
              {bet.cashedOut ? (
                <span className="text-emerald-400 font-bold">{bet.multiplier?.toFixed(2)}x</span>
              ) : phase === 'in_flight' ? (
                <span className="text-amber-400 font-bold animate-pulse">{currentMultiplier.toFixed(2)}x</span>
              ) : (
                <span className="text-zinc-500">-</span>
              )}
            </div>
            <div className="col-span-2 text-right font-bold">
              {bet.cashedOut ? (
                <span className="text-emerald-400">+₹{bet.winAmount?.toFixed(2)}</span>
              ) : (
                <span className="text-zinc-500">-</span>
              )}
            </div>
          </div>
        ))}

        {/* Other Simulated Community Players */}
        {activeTab === 'all' &&
          players.map((p) => (
            <div
              key={p.id}
              className={`grid grid-cols-12 px-3 py-1.5 items-center transition ${
                p.cashedOut ? 'bg-emerald-950/15' : 'hover:bg-zinc-800/20'
              }`}
            >
              <div className="col-span-5 flex items-center gap-1.5 truncate">
                <span className="w-5 h-5 rounded-full bg-zinc-800 text-zinc-300 text-[9px] font-bold flex items-center justify-center shrink-0">
                  {p.avatarSeed}
                </span>
                <span className="text-zinc-300 truncate text-[11px] font-sans">{p.name}</span>
              </div>
              <div className="col-span-3 text-right text-zinc-300">₹{p.betAmount}</div>
              <div className="col-span-2 text-right">
                {p.cashedOut ? (
                  <span className="text-emerald-400 font-bold">{p.cashedOutMultiplier?.toFixed(2)}x</span>
                ) : (
                  <span className="text-zinc-600">-</span>
                )}
              </div>
              <div className="col-span-2 text-right">
                {p.cashedOut ? (
                  <span className="text-emerald-400 font-semibold text-[11px]">₹{p.winAmount?.toFixed(0)}</span>
                ) : (
                  <span className="text-zinc-600">-</span>
                )}
              </div>
            </div>
          ))}

        {activeTab === 'my' && userActiveBets.length === 0 && (
          <div className="p-8 text-center text-zinc-500 text-xs">
            <UserIcon className="w-6 h-6 mx-auto mb-2 text-zinc-600" />
            No active bets for this round. Place a bet using the controls!
          </div>
        )}
      </div>
    </div>
  );
};
