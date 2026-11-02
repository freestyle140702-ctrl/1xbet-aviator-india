import React from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { Plane, ArrowDownToLine, Wallet, ShieldCheck, Zap, Award, HelpCircle, ChevronRight } from 'lucide-react';

interface HomePageProps {
  setCurrentTab: (tab: string) => void;
  onOpenAuth: (mode: 'login' | 'register') => void;
}

export const HomePage: React.FC<HomePageProps> = ({ setCurrentTab, onOpenAuth }) => {
  const { user, config } = useAuth();

  return (
    <div className="space-y-6 sm:space-y-8 pb-10">
      {/* Announcement Banner */}
      {config?.showAnnouncement && config.announcementText && (
        <div className="bg-gradient-to-r from-red-950/70 via-rose-950/50 to-red-950/70 border border-red-900/40 rounded-xl p-3 flex items-center justify-between gap-3 text-xs shadow-md">
          <div className="flex items-center gap-2 text-rose-200">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping shrink-0" />
            <span className="font-semibold">{config.announcementText}</span>
          </div>
          <button
            onClick={() => setCurrentTab('deposit')}
            className="text-rose-400 hover:text-white font-bold shrink-0 underline decoration-rose-500/50 cursor-pointer"
          >
            Deposit Details →
          </button>
        </div>
      )}

      {/* Hero Showcase Section */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#131522] via-[#0e1017] to-[#08090d] border border-red-950/50 p-6 sm:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-rose-600/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-red-600/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Hero Column */}
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/60 border border-red-700/40 text-rose-400 text-xs font-semibold">
              <Zap className="w-3.5 h-3.5 text-rose-400" />
              <span>Next-Gen Flight Multiplier Simulation</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white font-['Outfit'] tracking-tight leading-tight">
              FLY HIGH & CASH OUT BEFORE THE <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 via-red-500 to-amber-500">CRASH</span>
            </h1>

            <p className="text-sm sm:text-base text-zinc-300 leading-relaxed max-w-xl">
              Experience the adrenaline of real-time flight multipliers. Watch the aerodynamic lucky plane soar,
              time your cash out with precision, and climb the simulated leaderboards.
            </p>

            {/* CTA Buttons */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={() => setCurrentTab('game')}
                className="px-6 py-3.5 bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 hover:from-rose-500 hover:to-red-600 text-white font-black text-sm rounded-xl shadow-[0_0_25px_rgba(225,29,72,0.5)] border border-rose-500/50 transition active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                <Plane className="w-4 h-4 transform -rotate-45" />
                <span>LAUNCH AVIATOR FLIGHT</span>
              </button>

              <button
                onClick={() => setCurrentTab('deposit')}
                className="px-5 py-3.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 font-bold text-sm rounded-xl transition active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                <ArrowDownToLine className="w-4 h-4 text-emerald-400" />
                <span>Deposit via QR Code</span>
              </button>
            </div>

            {/* Quick stats counter */}
            <div className="pt-4 grid grid-cols-3 gap-4 border-t border-zinc-800/80 text-xs">
              <div>
                <span className="text-zinc-500 block">Initial Balance</span>
                <span className="text-emerald-400 font-bold font-mono text-base">₹0.00</span>
              </div>
              <div>
                <span className="text-zinc-500 block">Max Multiplier</span>
                <span className="text-amber-400 font-bold font-mono text-base">100.00x</span>
              </div>
              <div>
                <span className="text-zinc-500 block">Round Interval</span>
                <span className="text-rose-400 font-bold font-mono text-base">~6.0s</span>
              </div>
            </div>
          </div>

          {/* Right Hero Column: Cockpit Preview Card */}
          <div className="lg:col-span-5">
            <div className="bg-[#0b0c13] border border-red-950/60 rounded-xl p-4 shadow-xl relative overflow-hidden group">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80 mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Flight Cockpit</span>
                </div>
                <span className="text-[11px] font-mono text-rose-400 font-bold">ROUND #1084</span>
              </div>

              {/* Graphical mini radar */}
              <div className="h-44 bg-[#07080d] rounded-lg border border-zinc-800 relative flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(239,68,68,0.15)_0%,transparent_70%)]" />
                <div className="text-center z-10 space-y-1">
                  <div className="text-4xl font-black font-mono text-white tracking-tight">4.82x</div>
                  <div className="text-[11px] font-bold text-rose-400 uppercase tracking-widest">
                    Lucky Plane Soaring
                  </div>
                </div>
                <div className="absolute bottom-4 right-6 text-rose-500 transform -rotate-12 animate-bounce">
                  <Plane className="w-9 h-9 fill-rose-500 text-rose-300" />
                </div>
              </div>

              {/* Action row in card */}
              <div className="mt-4 flex items-center justify-between gap-2">
                <div className="text-xs">
                  <span className="text-zinc-400 block text-[10px]">Your Current Balance</span>
                  <span className="font-mono font-bold text-white">₹{(user?.balance ?? 0).toFixed(2)}</span>
                </div>
                <button
                  onClick={() => setCurrentTab('game')}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  Enter Cockpit <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How To Play Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white font-['Outfit']">How To Play Aviator</h2>
            <p className="text-xs sm:text-sm text-zinc-400">Three simple steps to pilot your flight simulation</p>
          </div>
          <HelpCircle className="w-5 h-5 text-zinc-500" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#0f111a] border border-zinc-800/80 rounded-xl p-5 space-y-2 relative overflow-hidden">
            <div className="w-9 h-9 rounded-lg bg-rose-950/80 border border-rose-700/60 text-rose-400 font-black text-sm flex items-center justify-center">
              01
            </div>
            <h3 className="font-bold text-white text-base">Place Your Virtual Bet</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Choose your desired virtual bet amount before the lucky plane takes off. You can even place two simultaneous bets for advanced dual strategies.
            </p>
          </div>

          <div className="bg-[#0f111a] border border-zinc-800/80 rounded-xl p-5 space-y-2 relative overflow-hidden">
            <div className="w-9 h-9 rounded-lg bg-amber-950/80 border border-amber-700/60 text-amber-400 font-black text-sm flex items-center justify-center">
              02
            </div>
            <h3 className="font-bold text-white text-base">Watch Multiplier Climb</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              As the airplane ascends into the atmosphere, the flight multiplier starts at 1.00x and accelerates smoothly towards higher rewards.
            </p>
          </div>

          <div className="bg-[#0f111a] border border-zinc-800/80 rounded-xl p-5 space-y-2 relative overflow-hidden">
            <div className="w-9 h-9 rounded-lg bg-emerald-950/80 border border-emerald-700/60 text-emerald-400 font-black text-sm flex items-center justify-center">
              03
            </div>
            <h3 className="font-bold text-white text-base">Cash Out Before Crash</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Hit the glowing Cash Out button before the plane flies away! Your virtual winnings are immediately credited to your account balance.
            </p>
          </div>
        </div>
      </section>

      {/* Platform Features Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0b0c13] border border-zinc-800 p-4 rounded-xl flex items-start gap-3">
          <div className="p-2.5 rounded-lg bg-rose-950/60 text-rose-400 shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-white text-sm">Real-Time Simulation</h4>
            <p className="text-xs text-zinc-400 mt-0.5">Smooth 60FPS canvas graphics with live aerodynamic physics.</p>
          </div>
        </div>

        <div className="bg-[#0b0c13] border border-zinc-800 p-4 rounded-xl flex items-start gap-3">
          <div className="p-2.5 rounded-lg bg-teal-950/60 text-teal-400 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-white text-sm">Provably Fair Algorithm</h4>
            <p className="text-xs text-zinc-400 mt-0.5">Every round multiplier is derived from SHA-256 cryptographic seeds.</p>
          </div>
        </div>

        <div className="bg-[#0b0c13] border border-zinc-800 p-4 rounded-xl flex items-start gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-950/60 text-emerald-400 shrink-0">
            <ArrowDownToLine className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-white text-sm">UPI QR Code Deposits</h4>
            <p className="text-xs text-zinc-400 mt-0.5">Instant scan via PhonePe, GPay, Paytm with 12-digit UTR tracking.</p>
          </div>
        </div>

        <div className="bg-[#0b0c13] border border-zinc-800 p-4 rounded-xl flex items-start gap-3">
          <div className="p-2.5 rounded-lg bg-amber-950/60 text-amber-400 shrink-0">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-white text-sm">Account Control & Payouts</h4>
            <p className="text-xs text-zinc-400 mt-0.5">Track all balances and request secure payouts directly to UPI/Bank.</p>
          </div>
        </div>
      </section>

      {/* Virtual Simulation Disclaimer Notice */}
      <footer className="pt-6 border-t border-zinc-800/80 text-center space-y-2">
        <p className="text-xs text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          <strong>Aviator Aero Platform Notice:</strong> This platform is designed for interactive virtual flight multiplier simulation and entertainment. Initial displayed balance is set strictly to ₹0. All game rounds and virtual balances are simulated.
        </p>
        <p className="text-[11px] text-zinc-500">
          © {new Date().getFullYear()} Aviator Aero Platform. All rights reserved.
        </p>
      </footer>
    </div>
  );
};
