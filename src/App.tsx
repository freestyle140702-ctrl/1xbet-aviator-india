/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Header } from './components/Header.tsx';
import { BottomNav } from './components/BottomNav.tsx';
import { HomePage } from './pages/HomePage.tsx';
import { GamePage } from './pages/GamePage.tsx';
import { DepositPage } from './pages/DepositPage.tsx';
import { WithdrawalPage } from './pages/WithdrawalPage.tsx';
import { ProfilePage } from './pages/ProfilePage.tsx';
import { AdminDashboard } from './pages/AdminDashboard.tsx';
import { AuthModal } from './pages/AuthPages.tsx';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

function MainApp() {
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register' | null>(null);
  const { toast, hideToast } = useAuth();

  const handleOpenAuth = (mode: 'login' | 'register') => {
    setAuthModalMode(mode);
  };

  const handleCloseAuth = () => {
    setAuthModalMode(null);
  };

  return (
    <div className="min-h-screen bg-[#07080d] text-zinc-100 flex flex-col font-sans selection:bg-rose-600 selection:text-white">
      {/* Top Header */}
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenAuth={handleOpenAuth}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 pt-4 pb-20 md:pb-8">
        {currentTab === 'home' && (
          <HomePage
            setCurrentTab={setCurrentTab}
            onOpenAuth={handleOpenAuth}
          />
        )}

        {currentTab === 'game' && (
          <GamePage
            setCurrentTab={setCurrentTab}
            onOpenAuth={handleOpenAuth}
          />
        )}

        {(currentTab === 'deposit' || currentTab === 'checkout') && <DepositPage />}

        {currentTab === 'withdraw' && <WithdrawalPage />}

        {currentTab === 'history' && (
          <ProfilePage
            setCurrentTab={setCurrentTab}
            onOpenAuth={handleOpenAuth}
          />
        )}

        {currentTab === 'profile' && (
          <ProfilePage
            setCurrentTab={setCurrentTab}
            onOpenAuth={handleOpenAuth}
          />
        )}

        {currentTab === 'admin' && <AdminDashboard />}
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNav
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
      />

      {/* Auth Modal (Login / Register / Forgot Password) */}
      {authModalMode && (
        <AuthModal
          initialMode={authModalMode}
          onClose={handleCloseAuth}
        />
      )}

      {/* Global Floating Toast Alert */}
      {toast && (
        <div className="fixed bottom-16 md:bottom-6 right-4 z-50 max-w-sm w-full bg-[#141622] border border-zinc-700/80 rounded-xl p-3.5 shadow-2xl flex items-start gap-3 animate-fadeIn">
          {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />}
          {toast.type === 'error' && <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />}
          {toast.type === 'info' && <Info className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />}

          <div className="flex-1 text-xs text-zinc-200 font-medium leading-relaxed">
            {toast.message}
          </div>

          <button
            onClick={hideToast}
            className="text-zinc-400 hover:text-white p-0.5 rounded cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
