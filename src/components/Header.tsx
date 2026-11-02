import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { Plane, Volume2, VolumeX, Shield, User as UserIcon, LogOut, ArrowDownToLine, Wallet } from 'lucide-react';
import { sound } from '../utils/audio.ts';

interface HeaderProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onOpenAuth: (mode: 'login' | 'register') => void;
}

export const Header: React.FC<HeaderProps> = ({ currentTab, setCurrentTab, onOpenAuth }) => {
  const { user, logout, isAdmin } = useAuth();
  const [isMuted, setIsMuted] = useState<boolean>(sound.getMuted());
  const [profileDropdownOpen, setProfileDropdownOpen] = useState<boolean>(false);

  const toggleSound = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#090a0f]/95 backdrop-blur-md border-b border-red-950/40 select-none">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between gap-2">
        {/* Logo and Brand */}
        <div
          onClick={() => setCurrentTab('home')}
          className="flex items-center gap-2 sm:gap-2.5 cursor-pointer active:scale-95 transition"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gradient-to-br from-red-600 via-rose-600 to-red-800 flex items-center justify-center shadow-[0_0_15px_rgba(225,29,72,0.4)]">
            <Plane className="w-4 h-4 sm:w-5 sm:h-5 text-white transform -rotate-45" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-sm sm:text-base tracking-wider text-white font-['Outfit']">
                AVIATOR<span className="text-rose-500">AERO</span>
              </span>
            </div>
            <span className="text-[9px] text-zinc-400 font-medium tracking-widest uppercase hidden sm:block">
              Flight Multiplier Platform
            </span>
          </div>
        </div>

        {/* Center / Navigation Links for Desktop */}
        <nav className="hidden md:flex items-center gap-1">
          {[
            { id: 'home', label: 'Home' },
            { id: 'game', label: 'Play Aviator' },
            { id: 'deposit', label: 'Deposit' },
            { id: 'withdraw', label: 'Withdraw' },
            { id: 'history', label: 'History' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                currentTab === item.id
                  ? 'bg-rose-950/40 text-rose-400 border border-rose-800/40'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/40'
              }`}
            >
              {item.label}
            </button>
          ))}
          <button
            onClick={() => setCurrentTab('admin')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 ${
              currentTab === 'admin'
                ? 'bg-amber-950/50 text-amber-300 border border-amber-700/60 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                : 'text-amber-400 hover:text-amber-300 hover:bg-amber-950/30 border border-amber-900/40'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            <span>Admin Panel</span>
          </button>
        </nav>

        {/* Right Section: Balance, Audio, Profile / Auth */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Audio Mute Toggle */}
          <button
            onClick={toggleSound}
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            className="p-1.5 sm:p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Current Balance & Quick Deposit */}
          <div className="flex items-center bg-[#0d0f16] border border-zinc-800/90 rounded-lg p-0.5 sm:p-1">
            <div className="px-2 py-0.5 flex flex-col items-end">
              <span className="text-[9px] text-zinc-400 uppercase font-semibold leading-none">Balance</span>
              <span className="text-xs sm:text-sm font-black font-mono text-emerald-400 leading-tight">
                ₹{(user?.balance ?? 0).toFixed(2)}
              </span>
            </div>

            <button
              onClick={() => setCurrentTab('deposit')}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-2 sm:px-2.5 py-1 rounded text-[11px] sm:text-xs font-bold flex items-center gap-1 shadow-[0_0_10px_rgba(16,185,129,0.3)] transition active:scale-95 cursor-pointer ml-1"
            >
              <ArrowDownToLine className="w-3 h-3" />
              <span className="hidden sm:inline">Deposit</span>
            </button>
          </div>

          {/* User Account / Profile Button */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-1.5 p-1 sm:p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition cursor-pointer"
              >
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-md bg-rose-950 border border-rose-700/60 text-rose-300 font-bold text-xs flex items-center justify-center">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-xs font-semibold text-zinc-200 hidden md:block max-w-[90px] truncate">
                  {user.name}
                </span>
              </button>

              {/* Profile Dropdown */}
              {profileDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-52 bg-[#12141c] border border-zinc-800 rounded-xl shadow-2xl py-1.5 z-50 text-xs animate-fadeIn"
                  onClick={() => setProfileDropdownOpen(false)}
                >
                  <div className="px-3 py-2 border-b border-zinc-800">
                    <p className="font-semibold text-white truncate">{user.name}</p>
                    <p className="text-[11px] text-zinc-400 truncate">{user.email}</p>
                    <div className="mt-1 flex items-center gap-1">
                      <span className="text-[10px] text-zinc-400 uppercase font-mono">Role:</span>
                      <span className={`text-[10px] font-bold uppercase ${isAdmin ? 'text-amber-400' : 'text-zinc-300'}`}>
                        {user.role}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => setCurrentTab('profile')}
                    className="w-full text-left px-3 py-2 text-zinc-300 hover:text-white hover:bg-zinc-800/60 flex items-center gap-2"
                  >
                    <UserIcon className="w-3.5 h-3.5 text-zinc-400" />
                    My Profile & Settings
                  </button>

                  <button
                    onClick={() => setCurrentTab('withdraw')}
                    className="w-full text-left px-3 py-2 text-zinc-300 hover:text-white hover:bg-zinc-800/60 flex items-center gap-2"
                  >
                    <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                    Withdraw Funds
                  </button>

                  {isAdmin && (
                    <button
                      onClick={() => setCurrentTab('admin')}
                      className="w-full text-left px-3 py-2 text-amber-400 hover:text-amber-300 hover:bg-amber-950/40 flex items-center gap-2"
                    >
                      <Shield className="w-3.5 h-3.5" />
                      Admin Control Panel
                    </button>
                  )}

                  <div className="border-t border-zinc-800 my-1"></div>

                  <button
                    onClick={logout}
                    className="w-full text-left px-3 py-2 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 flex items-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onOpenAuth('login')}
                className="px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:text-white transition"
              >
                Log In
              </button>
              <button
                onClick={() => onOpenAuth('register')}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg shadow-sm transition active:scale-95"
              >
                Sign Up
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
