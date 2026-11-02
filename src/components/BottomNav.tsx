import React from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { Home, Plane, ArrowDownToLine, Clock, User, Shield } from 'lucide-react';

interface BottomNavProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, setCurrentTab }) => {
  const { isAdmin } = useAuth();

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'game', label: 'Game', icon: Plane, highlight: true },
    { id: 'deposit', label: 'Deposit', icon: ArrowDownToLine },
    { id: 'history', label: 'History', icon: Clock },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'admin', label: 'Admin', icon: Shield },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#090a0f]/95 backdrop-blur-lg border-t border-red-950/40 px-2 py-1 select-none">
      <div className="grid grid-cols-6 gap-1 max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`flex flex-col items-center justify-center py-1.5 rounded-lg transition active:scale-95 ${
                isActive
                  ? 'text-rose-500 font-bold'
                  : 'text-zinc-400 hover:text-zinc-200 font-medium'
              }`}
            >
              <div
                className={`p-1 rounded-md transition ${
                  item.highlight && isActive
                    ? 'bg-rose-600 text-white shadow-[0_0_12px_rgba(225,29,72,0.6)]'
                    : isActive
                    ? 'bg-rose-950/60 text-rose-400'
                    : 'text-zinc-400'
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
