import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import { User, DepositRequest, WithdrawalRequest, DashboardStats, AuditLog, ProductItem } from '../types/index.ts';
import {
  LayoutDashboard,
  Users,
  FileText,
  CreditCard,
  Sliders,
  Settings,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  RefreshCw,
  PlusCircle,
  AlertTriangle,
  QrCode,
  Shield,
  Package,
  Tag,
  Trash2,
  Edit3,
  Plus,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { user, isAdmin, showToast, refreshConfig, login } = useAuth();

  const [activeSection, setActiveSection] = useState<
    'dashboard' | 'users' | 'content' | 'payments' | 'game' | 'settings' | 'security'
  >('dashboard');

  // Stats
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loadingStats, setLoadingStats] = useState<boolean>(false);

  // Admin Login States
  const [adminUsername, setAdminUsername] = useState<string>('admin');
  const [adminPasscode, setAdminPasscode] = useState<string>('');
  const [adminLoginError, setAdminLoginError] = useState<string>('');
  const [isAdminLoggingIn, setIsAdminLoggingIn] = useState<boolean>(false);

  // Users Section
  const [usersList, setUsersList] = useState<User[]>([]);
  const [userSearch, setUserSearch] = useState<string>('');
  const [userStatusFilter, setUserStatusFilter] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<number>(100);
  const [adjustAction, setAdjustAction] = useState<'add' | 'subtract' | 'set'>('add');
  const [adjustReason, setAdjustReason] = useState<string>('Administrative credit/debit');

  // Products & Content Section
  const [productsList, setProductsList] = useState<ProductItem[]>([]);
  const [productModalOpen, setProductModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [productForm, setProductForm] = useState({
    title: '',
    description: '',
    price: 100,
    credits: 100,
    bonusText: '',
    category: 'credits',
  });

  // Payments Section
  const [depositsList, setDepositsList] = useState<DepositRequest[]>([]);
  const [withdrawalsList, setWithdrawalsList] = useState<WithdrawalRequest[]>([]);
  const [paymentSubTab, setPaymentSubTab] = useState<'deposits' | 'withdrawals'>('deposits');
  const [rejectReasonPrompt, setRejectReasonPrompt] = useState<string>('');
  const [payoutRefInput, setPayoutRefInput] = useState<string>('');

  // Content Section
  const [announcementText, setAnnouncementText] = useState<string>('');
  const [showAnnouncement, setShowAnnouncement] = useState<boolean>(true);
  const [gameInstructionText, setGameInstructionText] = useState<string>('');
  const [supportHandle, setSupportHandle] = useState<string>('');
  const [maintenanceMode, setMaintenanceMode] = useState<boolean>(false);

  // Game Settings Section
  const [houseEdge, setHouseEdge] = useState<number>(3.5);
  const [animSpeed, setAnimSpeed] = useState<number>(1.0);
  const [roundInterval, setRoundInterval] = useState<number>(6);

  // Website Settings Section
  const [upiId, setUpiId] = useState<string>('');
  const [upiName, setUpiName] = useState<string>('');
  const [minDeposit, setMinDeposit] = useState<number>(100);
  const [maxDeposit, setMaxDeposit] = useState<number>(50000);
  const [minWithdrawal, setMinWithdrawal] = useState<number>(100);
  const [maxWithdrawal, setMaxWithdrawal] = useState<number>(25000);
  const [customQrUrl, setCustomQrUrl] = useState<string>('');

  // Audit Logs Section
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditSearch, setAuditSearch] = useState<string>('');

  const loadStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const data = await api.admin.getStats();
      setStats(data);
    } catch (err: any) {
      showToast(err.message || 'Failed to load stats', 'error');
    } finally {
      setLoadingStats(false);
    }
  }, [showToast]);

  const loadUsers = useCallback(async () => {
    try {
      const res = await api.admin.getUsers({ search: userSearch, status: userStatusFilter });
      setUsersList(res.users);
    } catch (err: any) {
      showToast(err.message || 'Failed to load users', 'error');
    }
  }, [userSearch, userStatusFilter, showToast]);

  const loadTransactions = useCallback(async () => {
    try {
      const [depRes, wthRes] = await Promise.all([
        api.admin.getDeposits(),
        api.admin.getWithdrawals(),
      ]);
      setDepositsList(depRes.deposits);
      setWithdrawalsList(wthRes.withdrawals);
    } catch (err: any) {
      showToast(err.message || 'Failed to load transactions', 'error');
    }
  }, [showToast]);

  const loadContent = useCallback(async () => {
    try {
      const res = await api.admin.getContent();
      setAnnouncementText(res.announcementText);
      setShowAnnouncement(res.showAnnouncement);
      setGameInstructionText(res.gameInstructionText);
      setSupportHandle(res.supportHandle);
      setMaintenanceMode(res.maintenanceMode);
    } catch {
      // Ignore
    }
  }, []);

  const loadGameSettings = useCallback(async () => {
    try {
      const res = await api.admin.getGameSettings();
      setHouseEdge(res.houseEdgePercent);
      setAnimSpeed(res.animationSpeedMultiplier);
      setRoundInterval(res.autoRoundIntervalSec);
    } catch {
      // Ignore
    }
  }, []);

  const loadWebsiteSettings = useCallback(async () => {
    try {
      const res = await api.admin.getSettings();
      const s = res.settings;
      setUpiId(s.upiId);
      setUpiName(s.upiName);
      setMinDeposit(s.minDeposit);
      setMaxDeposit(s.maxDeposit);
      setMinWithdrawal(s.minWithdrawal);
      setMaxWithdrawal(s.maxWithdrawal);
      setCustomQrUrl(s.customQrUrl || '');
    } catch {
      // Ignore
    }
  }, []);

  const loadProducts = useCallback(async () => {
    try {
      const res = await api.admin.getProducts();
      setProductsList(res.products);
    } catch {
      // Ignore
    }
  }, []);

  const loadAuditLogs = useCallback(async () => {
    try {
      const res = await api.admin.getAuditLogs(auditSearch);
      setAuditLogs(res.logs);
    } catch {
      // Ignore
    }
  }, [auditSearch]);

  // Initial load
  useEffect(() => {
    if (isAdmin) {
      loadStats();
      loadUsers();
      loadTransactions();
      loadContent();
      loadProducts();
      loadGameSettings();
      loadWebsiteSettings();
      loadAuditLogs();
    }
  }, [isAdmin, loadStats, loadUsers, loadTransactions, loadContent, loadProducts, loadGameSettings, loadWebsiteSettings, loadAuditLogs]);

  const handleAdminLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminLoginError('');
    if (!adminUsername || !adminPasscode) {
      setAdminLoginError('Username and passcode are required.');
      return;
    }

    setIsAdminLoggingIn(true);
    try {
      await login(adminUsername.trim(), adminPasscode);
      showToast('Welcome, Administrator! Authenticated successfully.', 'success');
      setAdminPasscode('');
    } catch (err: any) {
      setAdminLoginError(err.message || 'Invalid administrator credentials.');
    } finally {
      setIsAdminLoggingIn(false);
    }
  };

  const handleOpenNewProduct = () => {
    setEditingProduct(null);
    setProductForm({
      title: '',
      description: '',
      price: 100,
      credits: 100,
      bonusText: '',
      category: 'credits',
    });
    setProductModalOpen(true);
  };

  const handleOpenEditProduct = (prod: ProductItem) => {
    setEditingProduct(prod);
    setProductForm({
      title: prod.title,
      description: prod.description || '',
      price: prod.price,
      credits: prod.credits,
      bonusText: prod.bonusText || '',
      category: prod.category || 'credits',
    });
    setProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        const res = await api.admin.updateProduct(editingProduct.id, productForm);
        showToast(res.message, 'success');
      } else {
        const res = await api.admin.createProduct(productForm);
        showToast(res.message, 'success');
      }
      setProductModalOpen(false);
      setEditingProduct(null);
      await loadProducts();
    } catch (err: any) {
      showToast(err.message || 'Failed to save product.', 'error');
    }
  };

  const handleDeleteProduct = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete product "${title}"?`)) return;
    try {
      const res = await api.admin.deleteProduct(id);
      showToast(res.message, 'success');
      await loadProducts();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete product.', 'error');
    }
  };

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto py-12 px-4 select-none">
        <div className="bg-[#0f111a] border border-red-950/70 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-600 via-red-600 to-amber-700 flex items-center justify-center text-white shadow-[0_0_20px_rgba(225,29,72,0.4)]">
              <Shield className="w-7 h-7" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white font-['Outfit'] tracking-wide">
              ADMINISTRATOR LOGIN
            </h2>
            <p className="text-xs text-zinc-400 max-w-xs">
              Secure administrative access control. Sign in with administrative credentials.
            </p>
          </div>

          {user && user.role !== 'admin' && (
            <div className="p-3 bg-red-950/60 border border-red-800/60 rounded-xl text-xs text-rose-300 flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>
                Access Denied: Currently authenticated as regular user ({user.email}). Regular users are not permitted to access admin controls.
              </span>
            </div>
          )}

          {adminLoginError && (
            <div className="p-3 bg-red-950/60 border border-red-800/60 rounded-xl text-xs text-rose-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{adminLoginError}</span>
            </div>
          )}

          <form onSubmit={handleAdminLoginSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
                Username
              </label>
              <input
                type="text"
                value={adminUsername}
                onChange={(e) => setAdminUsername(e.target.value)}
                placeholder="Enter admin username"
                className="w-full bg-[#090a0f] border border-zinc-800 focus:border-rose-500 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none transition"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
                Passcode
              </label>
              <input
                type="password"
                value={adminPasscode}
                onChange={(e) => setAdminPasscode(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-[#090a0f] border border-zinc-800 focus:border-rose-500 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none transition"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isAdminLoggingIn}
              className="w-full py-2.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold rounded-xl shadow-[0_0_18px_rgba(225,29,72,0.4)] border border-rose-500/50 transition active:scale-95 disabled:opacity-50 cursor-pointer text-xs uppercase tracking-wider"
            >
              {isAdminLoggingIn ? 'Authenticating...' : 'Sign In to Admin Panel'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Action Handlers
  const handleDepositAction = async (id: string, action: 'verify' | 'reject') => {
    const reason = action === 'reject' ? prompt('Enter reason for deposit rejection:') || 'Invalid UTR reference' : undefined;
    if (action === 'reject' && !reason) return;

    try {
      const res = await api.admin.actionDeposit(id, action, reason);
      showToast(res.message, 'success');
      await loadTransactions();
      await loadStats();
    } catch (err: any) {
      showToast(err.message || 'Action failed', 'error');
    }
  };

  const handleWithdrawalAction = async (id: string, action: 'approve' | 'reject') => {
    let transactionRef = '';
    let reason = '';

    if (action === 'approve') {
      transactionRef = prompt('Enter bank payout transaction reference / IMPS URN:') || 'IMPS-' + Date.now();
    } else {
      reason = prompt('Enter reason for withdrawal rejection (funds will be refunded to user):') || 'Rejected by administration';
      if (!reason) return;
    }

    try {
      const res = await api.admin.actionWithdrawal(id, action, transactionRef, reason);
      showToast(res.message, 'success');
      await loadTransactions();
      await loadStats();
    } catch (err: any) {
      showToast(err.message || 'Action failed', 'error');
    }
  };

  const handleUserStatusChange = async (userId: string, newStatus: string) => {
    const reason = prompt(`Enter reason for marking user as ${newStatus}:`) || 'Administrator intervention';
    try {
      const res = await api.admin.updateUserStatus(userId, newStatus, reason);
      showToast(res.message, 'success');
      await loadUsers();
    } catch (err: any) {
      showToast(err.message || 'Status update failed', 'error');
    }
  };

  const handleAdjustBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      const res = await api.admin.adjustUserBalance(selectedUser.id, {
        amount: adjustAmount,
        action: adjustAction,
        reason: adjustReason,
      });
      showToast(res.message, 'success');
      setSelectedUser(null);
      await loadUsers();
      await loadStats();
    } catch (err: any) {
      showToast(err.message || 'Balance adjustment failed', 'error');
    }
  };

  const handleSaveContent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.admin.updateContent({
        announcementText,
        showAnnouncement,
        gameInstructionText,
        supportHandle,
        maintenanceMode,
      });
      showToast(res.message, 'success');
      await refreshConfig();
    } catch (err: any) {
      showToast(err.message || 'Failed to update content', 'error');
    }
  };

  const handleSaveGameSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.admin.updateGameSettings({
        houseEdgePercent: houseEdge,
        animationSpeedMultiplier: animSpeed,
        autoRoundIntervalSec: roundInterval,
      });
      showToast(res.message, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update game parameters', 'error');
    }
  };

  const handleSaveWebsiteSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.admin.updateSettings({
        upiId,
        upiName,
        minDeposit,
        maxDeposit,
        minWithdrawal,
        maxWithdrawal,
        customQrUrl,
      });
      showToast(res.message, 'success');
      await refreshConfig();
    } catch (err: any) {
      showToast(err.message || 'Failed to save website settings', 'error');
    }
  };

  const adminNav = [
    { id: 'dashboard', label: '1. Dashboard', icon: LayoutDashboard },
    { id: 'users', label: '2. User Management', icon: Users },
    { id: 'content', label: '3. Content Management', icon: FileText },
    { id: 'payments', label: '4. Payment & Transactions', icon: CreditCard },
    { id: 'game', label: '5. Game Settings', icon: Sliders },
    { id: 'settings', label: '6. Website Settings', icon: Settings },
    { id: 'security', label: '7. Security & Audit Logs', icon: ShieldAlert },
  ];

  return (
    <div className="space-y-6 pb-16 select-none max-w-7xl mx-auto">
      {/* Top Banner Header */}
      <div className="bg-[#0f111a] border border-red-950/60 rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-600 to-rose-700 flex items-center justify-center text-white shadow-lg">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white font-['Outfit']">ADMINISTRATOR CONTROL PANEL</h1>
            <p className="text-xs text-zinc-400">Authenticated as {user?.email} · Full Administrative Authority</p>
          </div>
        </div>

        <button
          onClick={() => {
            loadStats();
            loadTransactions();
            loadUsers();
            showToast('Refreshed administrative data.', 'info');
          }}
          className="px-3 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh All Data</span>
        </button>
      </div>

      {/* Main Tab Navigation Bar */}
      <div className="flex items-center gap-1 bg-[#0a0b10] p-1 rounded-xl border border-zinc-800/80 overflow-x-auto text-xs font-semibold">
        {adminNav.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSection === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id as any)}
              className={`px-3.5 py-2 rounded-lg transition whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                isActive
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/40'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 1. DASHBOARD OVERVIEW */}
      {activeSection === 'dashboard' && stats && (
        <div className="space-y-6 animate-fadeIn">
          {/* KPI Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#0f111a] border border-zinc-800 rounded-xl p-4">
              <span className="text-[11px] text-zinc-400 uppercase font-semibold">Total Registered Users</span>
              <div className="text-2xl sm:text-3xl font-black font-mono text-white mt-1">{stats.usersCount}</div>
              <span className="text-[10px] text-emerald-400 mt-1 block">Active Sessions: {stats.activeSessions}</span>
            </div>

            <div className="bg-[#0f111a] border border-zinc-800 rounded-xl p-4">
              <span className="text-[11px] text-zinc-400 uppercase font-semibold">Pending Deposits</span>
              <div className="text-2xl sm:text-3xl font-black font-mono text-amber-400 mt-1">
                {stats.pendingDepositsCount}
              </div>
              <span className="text-[10px] text-zinc-400 mt-1 block">Verified: {stats.verifiedDepositsCount}</span>
            </div>

            <div className="bg-[#0f111a] border border-zinc-800 rounded-xl p-4">
              <span className="text-[11px] text-zinc-400 uppercase font-semibold">Pending Withdrawals</span>
              <div className="text-2xl sm:text-3xl font-black font-mono text-rose-400 mt-1">
                {stats.pendingWithdrawalsCount}
              </div>
              <span className="text-[10px] text-zinc-400 mt-1 block">Processed: {stats.successfulWithdrawalsCount}</span>
            </div>

            <div className="bg-[#0f111a] border border-zinc-800 rounded-xl p-4">
              <span className="text-[11px] text-zinc-400 uppercase font-semibold">Total Rounds Played</span>
              <div className="text-2xl sm:text-3xl font-black font-mono text-teal-400 mt-1">
                {stats.totalRoundsPlayed}
              </div>
              <span className="text-[10px] text-zinc-400 mt-1 block">Total Bets: {stats.totalBetsPlaced}</span>
            </div>
          </div>

          {/* Quick Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#0f111a] border border-zinc-800 rounded-xl p-5 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center justify-between">
                <span>Pending Financial Actions</span>
                <span className="text-xs text-amber-400 font-mono">
                  {stats.pendingDepositsCount + stats.pendingWithdrawalsCount} Total
                </span>
              </h3>
              <p className="text-xs text-zinc-400">
                You have {stats.pendingDepositsCount} deposit receipts awaiting UTR verification and{' '}
                {stats.pendingWithdrawalsCount} payout requests awaiting disbursement.
              </p>
              <button
                onClick={() => setActiveSection('payments')}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg text-xs transition cursor-pointer"
              >
                Go to Payment Verification Queue →
              </button>
            </div>

            <div className="bg-[#0f111a] border border-zinc-800 rounded-xl p-5 space-y-3">
              <h3 className="text-sm font-bold text-white">Recent System Audit Trail</h3>
              <div className="space-y-1.5 text-xs font-mono">
                {stats.recentAuditLogs.map((log) => (
                  <div key={log.id} className="p-2 bg-[#090a0f] rounded border border-zinc-800 truncate text-[11px]">
                    <span className="text-rose-400 font-bold">[{log.action}]</span>{' '}
                    <span className="text-zinc-300">{log.actorEmail}</span>: {log.details}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. USER MANAGEMENT */}
      {activeSection === 'users' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Search & Filters */}
          <div className="bg-[#0f111a] border border-zinc-800 rounded-xl p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by name, email, phone..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full bg-[#090a0f] border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={userStatusFilter}
                onChange={(e) => setUserStatusFilter(e.target.value)}
                className="bg-[#090a0f] border border-zinc-800 text-xs text-zinc-300 rounded-lg px-3 py-2 focus:outline-none"
              >
                <option value="">All Account Statuses</option>
                <option value="active">Active</option>
                <option value="restricted">Restricted</option>
                <option value="suspended">Suspended</option>
              </select>

              <button
                onClick={loadUsers}
                className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Apply Filter
              </button>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-[#0f111a] border border-zinc-800 rounded-xl p-5 overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400 uppercase text-[10px]">
                  <th className="py-2.5 px-3">User</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Balance</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Created</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50 font-sans">
                {usersList.map((u) => (
                  <tr key={u.id} className="hover:bg-zinc-800/30">
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-white">{u.name}</div>
                      <div className="text-[11px] text-zinc-400 font-mono">{u.email}</div>
                    </td>
                    <td className="py-2.5 px-3 uppercase text-[10px] font-bold">
                      <span className={u.role === 'admin' ? 'text-amber-400' : 'text-zinc-400'}>{u.role}</span>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-emerald-400">
                      ₹{u.balance.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          u.status === 'active'
                            ? 'bg-emerald-950/60 text-emerald-400'
                            : u.status === 'restricted'
                            ? 'bg-amber-950/60 text-amber-400'
                            : 'bg-rose-950/60 text-rose-400'
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-zinc-400 text-xs">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-2.5 px-3 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => setSelectedUser(u)}
                        className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-[11px] font-semibold cursor-pointer"
                      >
                        Adjust Balance
                      </button>
                      <button
                        onClick={() =>
                          handleUserStatusChange(
                            u.id,
                            u.status === 'active' ? 'restricted' : u.status === 'restricted' ? 'suspended' : 'active'
                          )
                        }
                        className="px-2 py-1 bg-red-950/60 hover:bg-red-900/60 border border-red-800/50 text-rose-300 rounded text-[11px] font-semibold cursor-pointer"
                      >
                        Toggle Status
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Adjust Balance Modal */}
          {selectedUser && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <form
                onSubmit={handleAdjustBalance}
                className="bg-[#12141c] border border-zinc-800 rounded-xl p-5 max-w-md w-full space-y-4 shadow-2xl"
              >
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                  <h3 className="text-sm font-bold text-white">Adjust Virtual Balance</h3>
                  <button
                    type="button"
                    onClick={() => setSelectedUser(null)}
                    className="text-zinc-500 hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                <div className="text-xs text-zinc-300">
                  Target Account: <strong>{selectedUser.name}</strong> ({selectedUser.email})<br />
                  Current Balance: <strong className="text-emerald-400 font-mono">₹{selectedUser.balance.toFixed(2)}</strong>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-400 block">Action Type</label>
                  <select
                    value={adjustAction}
                    onChange={(e) => setAdjustAction(e.target.value as any)}
                    className="w-full bg-[#090a0f] border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white"
                  >
                    <option value="add">Add Funds (+)</option>
                    <option value="subtract">Deduct Funds (-)</option>
                    <option value="set">Set Exact Amount (=)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-400 block">Amount (₹)</label>
                  <input
                    type="number"
                    min="1"
                    max="1000000"
                    value={adjustAmount}
                    onChange={(e) => setAdjustAmount(Math.max(1, parseInt(e.target.value) || 0))}
                    className="w-full bg-[#090a0f] border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-white"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-400 block">Audit Reason Note</label>
                  <input
                    type="text"
                    value={adjustReason}
                    onChange={(e) => setAdjustReason(e.target.value)}
                    placeholder="e.g. Test credit, promotional bonus, adjustment"
                    className="w-full bg-[#090a0f] border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white"
                    required
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedUser(null)}
                    className="w-1/2 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="w-1/2 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold shadow-sm"
                  >
                    Confirm Adjustment
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* 3. CONTENT MANAGEMENT */}
      {activeSection === 'content' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Section 1: Website Text & Announcements */}
          <form onSubmit={handleSaveContent} className="bg-[#0f111a] border border-zinc-800 rounded-xl p-5 sm:p-6 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-rose-500" />
              <span>Website Content & Announcements</span>
            </h2>

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
                Website Announcement Banner
              </label>
              <input
                type="text"
                value={announcementText}
                onChange={(e) => setAnnouncementText(e.target.value)}
                placeholder="e.g. Welcome to Aviator Aero! 24/7 UPI deposits available."
                className="w-full bg-[#090a0f] border border-zinc-800 focus:border-rose-500 rounded-xl px-4 py-2.5 text-xs text-white"
              />
              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={showAnnouncement}
                  onChange={(e) => setShowAnnouncement(e.target.checked)}
                  className="accent-rose-500 w-4 h-4 rounded cursor-pointer"
                />
                <span className="text-xs text-zinc-400">Display announcement banner across website</span>
              </label>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
                Game Instructions & Rules Text
              </label>
              <textarea
                rows={3}
                value={gameInstructionText}
                onChange={(e) => setGameInstructionText(e.target.value)}
                className="w-full bg-[#090a0f] border border-zinc-800 focus:border-rose-500 rounded-xl p-3 text-xs text-white"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
                Official Telegram / WhatsApp Support Handle
              </label>
              <input
                type="text"
                value={supportHandle}
                onChange={(e) => setSupportHandle(e.target.value)}
                placeholder="@AviatorSupportOfficial"
                className="w-full bg-[#090a0f] border border-zinc-800 focus:border-rose-500 rounded-xl px-4 py-2 text-xs text-white"
              />
            </div>

            <button
              type="submit"
              className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition active:scale-95 cursor-pointer shadow-sm"
            >
              Save Text & Announcement Changes
            </button>
          </form>

          {/* Section 2: Products & Prices Management */}
          <div className="bg-[#0f111a] border border-zinc-800 rounded-xl p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Package className="w-4 h-4 text-amber-500" />
                  <span>Products & Pricing Management</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Add, edit, and delete deposit credit packages, VIP tiers, and prices.
                </p>
              </div>

              <button
                type="button"
                onClick={handleOpenNewProduct}
                className="px-3 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-sm self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Product</span>
              </button>
            </div>

            {/* Products Table */}
            {productsList.length === 0 ? (
              <p className="text-xs text-zinc-500 py-4 text-center">No products configured yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-zinc-800 text-zinc-400 uppercase text-[10px]">
                      <th className="py-2.5 px-3">Product Title</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3">Price (₹)</th>
                      <th className="py-2.5 px-3">Credits</th>
                      <th className="py-2.5 px-3">Bonus Tag</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/50 font-sans">
                    {productsList.map((prod) => (
                      <tr key={prod.id} className="hover:bg-zinc-800/30">
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-white">{prod.title}</div>
                          <div className="text-[11px] text-zinc-400 font-sans truncate max-w-xs">{prod.description}</div>
                        </td>
                        <td className="py-2.5 px-3 uppercase text-[10px] font-bold text-zinc-400">
                          {prod.category}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-white whitespace-nowrap">
                          ₹{prod.price.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-emerald-400 whitespace-nowrap">
                          ₹{prod.credits.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          {prod.bonusText ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-950/60 text-amber-300 border border-amber-800/40">
                              {prod.bonusText}
                            </span>
                          ) : (
                            <span className="text-zinc-500 text-xs">-</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right space-x-2 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleOpenEditProduct(prod)}
                            className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-xs font-semibold cursor-pointer inline-flex items-center gap-1"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(prod.id, prod.title)}
                            className="px-2.5 py-1 bg-red-950/80 hover:bg-red-900 border border-red-800/50 text-rose-300 rounded text-xs font-semibold cursor-pointer inline-flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Delete</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Add / Edit Product Modal */}
          {productModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
              <form
                onSubmit={handleSaveProduct}
                className="bg-[#12141c] border border-zinc-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl"
              >
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Package className="w-4 h-4 text-amber-500" />
                    <span>{editingProduct ? 'Edit Product & Price' : 'Add New Product'}</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setProductModalOpen(false)}
                    className="text-zinc-500 hover:text-white p-1 rounded-lg"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
                    Product Title
                  </label>
                  <input
                    type="text"
                    value={productForm.title}
                    onChange={(e) => setProductForm({ ...productForm, title: e.target.value })}
                    placeholder="e.g. Aviator Ace Credits"
                    className="w-full bg-[#090a0f] border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
                    Description
                  </label>
                  <input
                    type="text"
                    value={productForm.description}
                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                    placeholder="e.g. High altitude bonus credits"
                    className="w-full bg-[#090a0f] border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
                      Price (₹)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={productForm.price}
                      onChange={(e) => setProductForm({ ...productForm, price: Math.max(1, parseInt(e.target.value) || 0) })}
                      className="w-full bg-[#090a0f] border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
                      Credits Awarded (₹)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={productForm.credits}
                      onChange={(e) => setProductForm({ ...productForm, credits: Math.max(1, parseInt(e.target.value) || 0) })}
                      className="w-full bg-[#090a0f] border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
                      Bonus Tag (Optional)
                    </label>
                    <input
                      type="text"
                      value={productForm.bonusText}
                      onChange={(e) => setProductForm({ ...productForm, bonusText: e.target.value })}
                      placeholder="+15% Bonus"
                      className="w-full bg-[#090a0f] border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
                      Category
                    </label>
                    <select
                      value={productForm.category}
                      onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                      className="w-full bg-[#090a0f] border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                    >
                      <option value="credits">Credits</option>
                      <option value="vip">VIP Tier</option>
                      <option value="promotional">Promotional</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setProductModalOpen(false)}
                    className="w-1/2 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="w-1/2 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold shadow-sm"
                  >
                    {editingProduct ? 'Update Product' : 'Add Product'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* 4. PAYMENT & TRANSACTIONS MANAGEMENT */}
      {activeSection === 'payments' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Subtab: Deposits vs Withdrawals */}
          <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
            <button
              onClick={() => setPaymentSubTab('deposits')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                paymentSubTab === 'deposits'
                  ? 'bg-rose-950/70 border border-rose-700/60 text-rose-300'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Deposits Queue ({depositsList.filter((d) => d.status === 'pending').length} Pending / {depositsList.length} Total)
            </button>
            <button
              onClick={() => setPaymentSubTab('withdrawals')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                paymentSubTab === 'withdrawals'
                  ? 'bg-rose-950/70 border border-rose-700/60 text-rose-300'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Withdrawals Queue ({withdrawalsList.filter((w) => w.status === 'pending').length} Pending / {withdrawalsList.length} Total)
            </button>
          </div>

          {/* DEPOSITS TABLE */}
          {paymentSubTab === 'deposits' && (
            <div className="bg-[#0f111a] border border-zinc-800 rounded-xl p-5 overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-400 uppercase text-[10px]">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">User</th>
                    <th className="py-2.5 px-3">Amount</th>
                    <th className="py-2.5 px-3">12-Digit UTR</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Verification Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50 font-sans">
                  {depositsList.map((dep) => (
                    <tr key={dep.id} className="hover:bg-zinc-800/30">
                      <td className="py-2.5 px-3 text-zinc-400 whitespace-nowrap">
                        {new Date(dep.createdAt).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-white">{dep.userName}</div>
                        <div className="text-[11px] text-zinc-400 font-mono">{dep.userEmail}</div>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-emerald-400 whitespace-nowrap">
                        ₹{dep.amount.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-zinc-200 select-all font-bold">
                        {dep.utrNumber}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            dep.status === 'verified'
                              ? 'bg-emerald-950/60 text-emerald-400'
                              : dep.status === 'rejected'
                              ? 'bg-rose-950/60 text-rose-400'
                              : 'bg-amber-950/60 text-amber-400'
                          }`}
                        >
                          {dep.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right space-x-2 whitespace-nowrap">
                        {dep.status === 'pending' ? (
                          <>
                            <button
                              onClick={() => handleDepositAction(dep.id, 'verify')}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold shadow-xs cursor-pointer"
                            >
                              Approve & Credit
                            </button>
                            <button
                              onClick={() => handleDepositAction(dep.id, 'reject')}
                              className="px-2.5 py-1 bg-red-950 hover:bg-red-900 border border-red-700/60 text-rose-300 rounded text-xs font-bold cursor-pointer"
                            >
                              Reject
                            </button>
                          </>
                        ) : (
                          <span className="text-zinc-500 text-xs italic">
                            {dep.status === 'verified' ? `Verified by ${dep.verifiedBy}` : dep.rejectionReason}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* WITHDRAWALS TABLE */}
          {paymentSubTab === 'withdrawals' && (
            <div className="bg-[#0f111a] border border-zinc-800 rounded-xl p-5 overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-400 uppercase text-[10px]">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">User</th>
                    <th className="py-2.5 px-3">Amount</th>
                    <th className="py-2.5 px-3">Payout Details</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Process Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50 font-sans">
                  {withdrawalsList.map((wth) => (
                    <tr key={wth.id} className="hover:bg-zinc-800/30">
                      <td className="py-2.5 px-3 text-zinc-400 whitespace-nowrap">
                        {new Date(wth.createdAt).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-white">{wth.userName}</div>
                        <div className="text-[11px] text-zinc-400 font-mono">{wth.userEmail}</div>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-rose-400 whitespace-nowrap">
                        ₹{wth.amount.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-zinc-200 text-xs">
                        {wth.payoutMethod === 'upi' ? (
                          <span>UPI: {wth.payoutDetails.upiId}</span>
                        ) : (
                          <div>
                            <div>{wth.payoutDetails.accountHolderName}</div>
                            <div className="text-zinc-400">
                              A/C: {wth.payoutDetails.accountNumber} · {wth.payoutDetails.ifscCode}
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            wth.status === 'successful'
                              ? 'bg-emerald-950/60 text-emerald-400'
                              : wth.status === 'rejected'
                              ? 'bg-rose-950/60 text-rose-400'
                              : 'bg-amber-950/60 text-amber-400'
                          }`}
                        >
                          {wth.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right space-x-2 whitespace-nowrap">
                        {wth.status === 'pending' ? (
                          <>
                            <button
                              onClick={() => handleWithdrawalAction(wth.id, 'approve')}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold shadow-xs cursor-pointer"
                            >
                              Approve Payout
                            </button>
                            <button
                              onClick={() => handleWithdrawalAction(wth.id, 'reject')}
                              className="px-2.5 py-1 bg-red-950 hover:bg-red-900 border border-red-700/60 text-rose-300 rounded text-xs font-bold cursor-pointer"
                            >
                              Reject & Refund
                            </button>
                          </>
                        ) : (
                          <span className="text-zinc-500 text-xs italic">
                            {wth.status === 'successful' ? `Ref: ${wth.transactionRef}` : wth.rejectionReason}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 5. GAME SETTINGS */}
      {activeSection === 'game' && (
        <form onSubmit={handleSaveGameSettings} className="bg-[#0f111a] border border-zinc-800 rounded-xl p-6 space-y-5 animate-fadeIn">
          <h2 className="text-base font-bold text-white">Aviator Multiplier Engine Parameters</h2>
          <p className="text-xs text-zinc-400">
            Control the mathematical curve behavior, crash volatility, and intermission interval for simulated rounds.
          </p>

          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center justify-between">
              <span>Simulation House Edge (%)</span>
              <span className="font-mono text-rose-400 font-bold">{houseEdge}%</span>
            </label>
            <input
              type="range"
              min="1.0"
              max="15.0"
              step="0.5"
              value={houseEdge}
              onChange={(e) => setHouseEdge(parseFloat(e.target.value))}
              className="w-full accent-rose-500"
            />
            <span className="text-[11px] text-zinc-500">Standard casino crash benchmark: ~3.0% - 4.0%</span>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center justify-between">
              <span>Flight Animation Acceleration Speed</span>
              <span className="font-mono text-amber-400 font-bold">{animSpeed}x</span>
            </label>
            <input
              type="range"
              min="0.5"
              max="2.5"
              step="0.1"
              value={animSpeed}
              onChange={(e) => setAnimSpeed(parseFloat(e.target.value))}
              className="w-full accent-amber-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center justify-between">
              <span>Next Round Intermission Countdown (Seconds)</span>
              <span className="font-mono text-teal-400 font-bold">{roundInterval}s</span>
            </label>
            <input
              type="range"
              min="4"
              max="15"
              step="1"
              value={roundInterval}
              onChange={(e) => setRoundInterval(parseInt(e.target.value))}
              className="w-full accent-teal-500"
            />
          </div>

          <button
            type="submit"
            className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition active:scale-95 cursor-pointer"
          >
            Apply Game Parameters
          </button>
        </form>
      )}

      {/* 6. WEBSITE SETTINGS */}
      {activeSection === 'settings' && (
        <form onSubmit={handleSaveWebsiteSettings} className="bg-[#0f111a] border border-zinc-800 rounded-xl p-6 space-y-5 animate-fadeIn">
          <h2 className="text-base font-bold text-white">Website & Financial Gateway Settings</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
                Official Payee UPI ID
              </label>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="aviator.official@upi"
                className="w-full bg-[#090a0f] border border-zinc-800 focus:border-rose-500 rounded-xl px-4 py-2.5 text-xs font-mono text-white"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
                Official Payee Display Name
              </label>
              <input
                type="text"
                value={upiName}
                onChange={(e) => setUpiName(e.target.value)}
                placeholder="Aviator Aero Platform"
                className="w-full bg-[#090a0f] border border-zinc-800 focus:border-rose-500 rounded-xl px-4 py-2.5 text-xs text-white"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
              Custom QR Code Image URL (Optional)
            </label>
            <input
              type="text"
              value={customQrUrl}
              onChange={(e) => setCustomQrUrl(e.target.value)}
              placeholder="https://.../my_custom_qr.png (Leave blank to use crisp auto-generated UPI QR code)"
              className="w-full bg-[#090a0f] border border-zinc-800 focus:border-rose-500 rounded-xl px-4 py-2 text-xs font-mono text-white"
            />
            <span className="text-[11px] text-zinc-500">
              When left blank, the website automatically renders the official crisp UPI QR code for {upiId}.
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-zinc-400 uppercase block">Min Deposit (₹)</label>
              <input
                type="number"
                value={minDeposit}
                onChange={(e) => setMinDeposit(parseInt(e.target.value) || 100)}
                className="w-full bg-[#090a0f] border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-zinc-400 uppercase block">Max Deposit (₹)</label>
              <input
                type="number"
                value={maxDeposit}
                onChange={(e) => setMaxDeposit(parseInt(e.target.value) || 50000)}
                className="w-full bg-[#090a0f] border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-zinc-400 uppercase block">Min Withdrawal (₹)</label>
              <input
                type="number"
                value={minWithdrawal}
                onChange={(e) => setMinWithdrawal(parseInt(e.target.value) || 100)}
                className="w-full bg-[#090a0f] border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-zinc-400 uppercase block">Max Withdrawal (₹)</label>
              <input
                type="number"
                value={maxWithdrawal}
                onChange={(e) => setMaxWithdrawal(parseInt(e.target.value) || 25000)}
                className="w-full bg-[#090a0f] border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-white"
              />
            </div>
          </div>

          <button
            type="submit"
            className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition active:scale-95 cursor-pointer"
          >
            Save Gateway Settings
          </button>
        </form>
      )}

      {/* 7. SECURITY & AUDIT LOGS */}
      {activeSection === 'security' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="bg-[#0f111a] border border-zinc-800 rounded-xl p-4 flex items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search audit trail..."
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                className="w-full bg-[#090a0f] border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none"
              />
            </div>

            <button
              onClick={loadAuditLogs}
              className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
            >
              Filter Logs
            </button>
          </div>

          <div className="bg-[#0f111a] border border-zinc-800 rounded-xl p-5 overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400 uppercase text-[10px]">
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Actor</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Target</th>
                  <th className="py-2.5 px-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-zinc-800/30">
                    <td className="py-2 px-3 text-zinc-500 whitespace-nowrap text-[11px]">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-2 px-3 text-white whitespace-nowrap">
                      {log.actorEmail}
                    </td>
                    <td className="py-2 px-3 font-bold text-rose-400 whitespace-nowrap">
                      {log.action}
                    </td>
                    <td className="py-2 px-3 text-zinc-300 whitespace-nowrap">
                      {log.target || '-'}
                    </td>
                    <td className="py-2 px-3 text-zinc-400 text-xs font-sans">
                      {log.details || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
