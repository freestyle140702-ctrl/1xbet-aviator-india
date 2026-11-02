import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import { UserBetRecord, DepositRequest, WithdrawalRequest } from '../types/index.ts';
import { User as UserIcon, Shield, Wallet, Clock, Lock, CheckCircle2, AlertTriangle, LogOut, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';

interface ProfilePageProps {
  setCurrentTab: (tab: string) => void;
  onOpenAuth: (mode: 'login' | 'register') => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ setCurrentTab, onOpenAuth }) => {
  const { user, logout, refreshUser, showToast, isAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState<'overview' | 'bets' | 'transactions' | 'security'>('overview');
  const [bets, setBets] = useState<UserBetRecord[]>([]);
  const [stats, setStats] = useState<{ totalBets: number; wonBets: number; winRate: number; totalWagered: number; totalWon: number }>({
    totalBets: 0,
    wonBets: 0,
    winRate: 0,
    totalWagered: 0,
    totalWon: 0,
  });

  const [deposits, setDeposits] = useState<DepositRequest[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);

  // Edit profile form
  const [name, setName] = useState<string>(user?.name || '');
  const [phone, setPhone] = useState<string>(user?.phone || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState<boolean>(false);

  // Change password form
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmNewPassword, setConfirmNewPassword] = useState<string>('');
  const [passwordMsg, setPasswordMsg] = useState<{ text: string; error?: boolean } | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setPhone(user.phone || '');

      // Load user bets and stats
      api.game.getMyBets().then((res) => {
        setBets(res.bets);
        setStats(res.stats);
      }).catch(() => {});

      // Load user transaction history
      api.transactions.getHistory().then((res) => {
        setDeposits(res.deposits);
        setWithdrawals(res.withdrawals);
      }).catch(() => {});
    }
  }, [user]);

  if (!user) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-500 mx-auto flex items-center justify-center">
          <UserIcon className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white">Sign In to View Profile</h2>
        <p className="text-xs text-zinc-400">
          Create an account or log in to track your balance, flight history, and manage deposits.
        </p>
        <div className="flex justify-center gap-3 pt-2">
          <button
            onClick={() => onOpenAuth('login')}
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition active:scale-95 cursor-pointer"
          >
            Log In
          </button>
          <button
            onClick={() => onOpenAuth('register')}
            className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold rounded-xl text-xs transition active:scale-95 cursor-pointer"
          >
            Create Account
          </button>
        </div>
      </div>
    );
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    try {
      await api.auth.updateProfile({ name, phone });
      await refreshUser();
      showToast('Profile updated successfully.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update profile.', 'error');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (newPassword !== confirmNewPassword) {
      setPasswordMsg({ text: 'New passwords do not match.', error: true });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMsg({ text: 'Password must be at least 6 characters.', error: true });
      return;
    }

    try {
      const res = await api.auth.changePassword({ currentPassword, newPassword });
      setPasswordMsg({ text: res.message });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      showToast('Password changed successfully.', 'success');
    } catch (err: any) {
      setPasswordMsg({ text: err.message || 'Failed to change password.', error: true });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 select-none">
      {/* Profile Overview Card */}
      <div className="bg-[#0f111a] border border-red-950/40 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-600 to-red-800 flex items-center justify-center text-white font-black text-2xl shadow-[0_0_20px_rgba(225,29,72,0.4)]">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white font-['Outfit']">{user.name}</h1>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                  isAdmin ? 'bg-amber-950/70 text-amber-400 border border-amber-800/40' : 'bg-zinc-800 text-zinc-300'
                }`}>
                  {user.role}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">{user.email}</p>
              <p className="text-[11px] text-zinc-500 mt-1">
                Member since {new Date(user.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-[#090a0f] border border-zinc-800 rounded-xl p-3 text-right">
              <span className="text-[10px] text-zinc-500 uppercase font-semibold block">Virtual Balance</span>
              <span className="text-xl font-mono font-black text-emerald-400">
                ₹{user.balance.toFixed(2)}
              </span>
            </div>

            <button
              onClick={logout}
              title="Logout"
              className="p-3 bg-red-950/30 hover:bg-red-950/60 border border-red-900/40 text-rose-400 rounded-xl transition cursor-pointer"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action quick links */}
        <div className="mt-6 pt-4 border-t border-zinc-800/80 flex flex-wrap gap-2">
          <button
            onClick={() => setCurrentTab('deposit')}
            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
          >
            <ArrowDownToLine className="w-3.5 h-3.5" />
            Deposit via QR
          </button>
          <button
            onClick={() => setCurrentTab('withdraw')}
            className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-lg text-xs font-bold flex items-center gap-1.5 active:scale-95 cursor-pointer"
          >
            <ArrowUpFromLine className="w-3.5 h-3.5 text-rose-400" />
            Withdraw Balance
          </button>
          {isAdmin && (
            <button
              onClick={() => setCurrentTab('admin')}
              className="px-4 py-2 bg-amber-950/40 hover:bg-amber-950/70 border border-amber-800/40 text-amber-400 rounded-lg text-xs font-bold flex items-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <Shield className="w-3.5 h-3.5" />
              Open Admin Dashboard
            </button>
          )}
        </div>
      </div>

      {/* Profile Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-2 overflow-x-auto text-xs font-semibold">
        {[
          { id: 'overview', label: 'Game Stats' },
          { id: 'bets', label: `Flight History (${bets.length})` },
          { id: 'transactions', label: 'Transactions' },
          { id: 'security', label: 'Security & Settings' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-xl transition whitespace-nowrap cursor-pointer ${
              activeTab === tab.id
                ? 'bg-rose-950/60 text-rose-400 border border-rose-800/50'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: OVERVIEW (Stats) */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-[#0f111a] border border-zinc-800 rounded-xl p-4">
              <span className="text-[11px] text-zinc-400 uppercase font-semibold">Total Bets</span>
              <div className="text-2xl font-black font-mono text-white mt-1">{stats.totalBets}</div>
            </div>

            <div className="bg-[#0f111a] border border-zinc-800 rounded-xl p-4">
              <span className="text-[11px] text-zinc-400 uppercase font-semibold">Win Rate</span>
              <div className="text-2xl font-black font-mono text-emerald-400 mt-1">{stats.winRate}%</div>
            </div>

            <div className="bg-[#0f111a] border border-zinc-800 rounded-xl p-4">
              <span className="text-[11px] text-zinc-400 uppercase font-semibold">Total Wagered</span>
              <div className="text-2xl font-black font-mono text-zinc-300 mt-1">₹{stats.totalWagered}</div>
            </div>

            <div className="bg-[#0f111a] border border-zinc-800 rounded-xl p-4">
              <span className="text-[11px] text-zinc-400 uppercase font-semibold">Total Won</span>
              <div className="text-2xl font-black font-mono text-amber-400 mt-1">₹{stats.totalWon}</div>
            </div>
          </div>

          {/* Quick instructions reminder */}
          <div className="bg-[#0f111a] border border-zinc-800 rounded-xl p-5 space-y-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-rose-400" />
              <span>Simulated Gaming Notice</span>
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Your flight statistics reflect simulated rounds generated via provably fair server seeds.
              Deposit approvals and withdrawal reviews are conducted transparently through official administrative records.
            </p>
          </div>
        </div>
      )}

      {/* Tab: BETS (Flight History) */}
      {activeTab === 'bets' && (
        <div className="bg-[#0f111a] border border-zinc-800 rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-bold text-white">Recent Rounds Played</h3>
          {bets.length === 0 ? (
            <div className="py-8 text-center text-zinc-500 text-xs">
              No simulated bets placed yet. Visit the Aviator flight room to start playing!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-400 uppercase text-[10px]">
                    <th className="py-2.5 px-3">Round #</th>
                    <th className="py-2.5 px-3">Bet Amount</th>
                    <th className="py-2.5 px-3">Cashed Out</th>
                    <th className="py-2.5 px-3">Win Amount</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50 font-sans">
                  {bets.map((b) => (
                    <tr key={b.id} className="hover:bg-zinc-800/30">
                      <td className="py-2 px-3 font-mono font-bold text-zinc-300">#{b.roundNumber}</td>
                      <td className="py-2 px-3 font-mono text-white">₹{b.betAmount}</td>
                      <td className="py-2 px-3 font-mono">
                        {b.cashedOutMultiplier ? `${b.cashedOutMultiplier.toFixed(2)}x` : '-'}
                      </td>
                      <td className="py-2 px-3 font-mono font-bold text-emerald-400">
                        {b.winAmount ? `+₹${b.winAmount.toFixed(2)}` : '₹0.00'}
                      </td>
                      <td className="py-2 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          b.status === 'won' ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40' : 'bg-red-950/60 text-rose-400 border border-red-800/40'
                        }`}>
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab: TRANSACTIONS */}
      {activeTab === 'transactions' && (
        <div className="space-y-5">
          {/* Deposits list */}
          <div className="bg-[#0f111a] border border-zinc-800 rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center justify-between">
              <span>Deposits ({deposits.length})</span>
              <button
                onClick={() => setCurrentTab('deposit')}
                className="text-xs text-rose-400 hover:text-white"
              >
                + New Deposit
              </button>
            </h3>
            {deposits.length === 0 ? (
              <p className="text-xs text-zinc-500 py-3">No deposit requests recorded.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-zinc-800 text-zinc-400 uppercase text-[10px]">
                      <th className="py-2 px-3">Date</th>
                      <th className="py-2 px-3">Amount</th>
                      <th className="py-2 px-3">UTR Reference</th>
                      <th className="py-2 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/50">
                    {deposits.map((dep) => (
                      <tr key={dep.id}>
                        <td className="py-2 px-3 text-zinc-400">{new Date(dep.createdAt).toLocaleDateString()}</td>
                        <td className="py-2 px-3 font-bold text-white">₹{dep.amount}</td>
                        <td className="py-2 px-3 text-zinc-300">{dep.utrNumber}</td>
                        <td className="py-2 px-3">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                            dep.status === 'verified'
                              ? 'text-emerald-400 bg-emerald-950/60'
                              : dep.status === 'rejected'
                              ? 'text-rose-400 bg-rose-950/60'
                              : 'text-amber-400 bg-amber-950/60'
                          }`}>
                            {dep.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Withdrawals list */}
          <div className="bg-[#0f111a] border border-zinc-800 rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center justify-between">
              <span>Withdrawals ({withdrawals.length})</span>
              <button
                onClick={() => setCurrentTab('withdraw')}
                className="text-xs text-emerald-400 hover:text-white"
              >
                + New Withdrawal
              </button>
            </h3>
            {withdrawals.length === 0 ? (
              <p className="text-xs text-zinc-500 py-3">No withdrawal requests recorded.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-zinc-800 text-zinc-400 uppercase text-[10px]">
                      <th className="py-2 px-3">Date</th>
                      <th className="py-2 px-3">Amount</th>
                      <th className="py-2 px-3">Method</th>
                      <th className="py-2 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/50">
                    {withdrawals.map((wth) => (
                      <tr key={wth.id}>
                        <td className="py-2 px-3 text-zinc-400">{new Date(wth.createdAt).toLocaleDateString()}</td>
                        <td className="py-2 px-3 font-bold text-white">₹{wth.amount}</td>
                        <td className="py-2 px-3 uppercase text-zinc-300">{wth.payoutMethod}</td>
                        <td className="py-2 px-3">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                            wth.status === 'successful'
                              ? 'text-emerald-400 bg-emerald-950/60'
                              : wth.status === 'rejected'
                              ? 'text-rose-400 bg-rose-950/60'
                              : 'text-amber-400 bg-amber-950/60'
                          }`}>
                            {wth.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: SECURITY & SETTINGS */}
      {activeTab === 'security' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Edit Profile */}
          <form onSubmit={handleUpdateProfile} className="bg-[#0f111a] border border-zinc-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white">Update Account Details</h3>
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-400 block">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#090a0f] border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-400 block">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-[#090a0f] border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            <button
              type="submit"
              disabled={isUpdatingProfile}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-bold transition active:scale-95 cursor-pointer"
            >
              {isUpdatingProfile ? 'Saving...' : 'Save Profile'}
            </button>
          </form>

          {/* Change Password */}
          <form onSubmit={handleChangePassword} className="bg-[#0f111a] border border-zinc-800 rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-white">Change Account Password</h3>

            {passwordMsg && (
              <div className={`p-2 rounded-lg text-xs ${passwordMsg.error ? 'bg-red-950/60 text-rose-300' : 'bg-emerald-950/60 text-emerald-300'}`}>
                {passwordMsg.text}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-400 block">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full bg-[#090a0f] border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-400 block">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-[#090a0f] border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-400 block">Confirm New Password</label>
              <input
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                className="w-full bg-[#090a0f] border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                required
              />
            </div>

            <button
              type="submit"
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition active:scale-95 cursor-pointer"
            >
              Update Password
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
