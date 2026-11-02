import { User, DepositRequest, WithdrawalRequest, GameRound, UserBetRecord, PublicConfig, DashboardStats, AuditLog, ProductItem } from '../types/index.ts';

const TOKEN_KEY = 'aviator_session_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken() {
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
}

async function request<T>(endpoint: string, options: RequestInit = {}, retries = 2): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});

  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  try {
    const response = await fetch(endpoint, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMsg = data?.error || `Request failed with status ${response.status}`;
      throw new Error(errorMsg);
    }

    return data as T;
  } catch (err: any) {
    if (retries > 0 && (err.name === 'TypeError' || err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError'))) {
      await new Promise(r => setTimeout(r, 450));
      return request<T>(endpoint, options, retries - 1);
    }
    throw err;
  }
}

export const api = {
  // Public Configuration
  getPublicConfig: () => request<PublicConfig>('/api/config/public'),

  // Authentication & User
  auth: {
    register: (payload: { email: string; password: string; name: string; phone?: string }) =>
      request<{ message: string; token: string; user: User }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),

    login: (payload: { email: string; password: string }) =>
      request<{ message: string; token: string; user: User }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),

    logout: () =>
      request<{ message: string }>('/api/auth/logout', {
        method: 'POST',
      }),

    getMe: () => request<{ user: User }>('/api/auth/me'),

    forgotPassword: (email: string) =>
      request<{ message: string; resetKey?: string }>('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      }),

    resetPassword: (payload: { email: string; resetKey: string; newPassword: string }) =>
      request<{ message: string }>('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),

    updateProfile: (payload: { name?: string; phone?: string }) =>
      request<{ message: string; user: User }>('/api/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(payload),
      }),

    changePassword: (payload: { currentPassword: string; newPassword: string }) =>
      request<{ message: string }>('/api/auth/change-password', {
        method: 'PUT',
        body: JSON.stringify(payload),
      }),
  },

  // Game Engine
  game: {
    getHistory: () => request<{ rounds: GameRound[] }>('/api/game/history'),
    getNextRound: () =>
      request<{ roundId: string; roundNumber: number; crashMultiplier: number; clientSeed: string }>(
        '/api/game/next-round',
        { method: 'POST' }
      ),
    placeBet: (payload: { roundId: string; amount: number }) =>
      request<{ message: string; betId: string; remainingBalance: number }>('/api/game/place-bet', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    cashOut: (payload: { betId: string; multiplier: number }) =>
      request<{ message: string; winAmount: number; multiplier: number; newBalance: number }>('/api/game/cash-out', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    settleLoss: (payload: { betId: string }) =>
      request<{ message: string; newBalance: number }>('/api/game/settle-loss', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    getMyBets: () =>
      request<{
        bets: UserBetRecord[];
        stats: { totalBets: number; wonBets: number; winRate: number; totalWagered: number; totalWon: number };
      }>('/api/game/my-bets'),
  },

  // Financial & Transactions
  transactions: {
    getHistory: () =>
      request<{ deposits: DepositRequest[]; withdrawals: WithdrawalRequest[] }>('/api/transactions/history'),

    submitDeposit: (payload: { amount: number; utrNumber: string }) =>
      request<{ message: string; deposit: DepositRequest }>('/api/transactions/deposit', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),

    submitWithdrawal: (payload: {
      amount: number;
      payoutMethod: 'upi' | 'bank';
      upiId?: string;
      accountNumber?: string;
      ifscCode?: string;
      accountHolderName?: string;
      bankName?: string;
    }) =>
      request<{ message: string; withdrawal: WithdrawalRequest; updatedBalance: number }>(
        '/api/transactions/withdraw',
        {
          method: 'POST',
          body: JSON.stringify(payload),
        }
      ),
  },

  // Administrator Controls
  admin: {
    getStats: () => request<DashboardStats>('/api/admin/stats'),

    getUsers: (params?: { search?: string; status?: string }) => {
      const q = new URLSearchParams();
      if (params?.search) q.set('search', params.search);
      if (params?.status) q.set('status', params.status);
      return request<{ users: User[] }>(`/api/admin/users?${q.toString()}`);
    },

    updateUserStatus: (id: string, status: string, reason?: string) =>
      request<{ message: string; user: User }>(`/api/admin/users/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status, reason }),
      }),

    adjustUserBalance: (id: string, payload: { amount: number; action: 'add' | 'subtract' | 'set'; reason?: string }) =>
      request<{ message: string; user: { id: string; email: string; balance: number } }>(
        `/api/admin/users/${id}/balance`,
        {
          method: 'PUT',
          body: JSON.stringify(payload),
        }
      ),

    getContent: () =>
      request<{
        announcementText: string;
        showAnnouncement: boolean;
        gameInstructionText: string;
        supportHandle: string;
        maintenanceMode: boolean;
      }>('/api/admin/content'),

    updateContent: (payload: any) =>
      request<{ message: string }>('/api/admin/content', {
        method: 'PUT',
        body: JSON.stringify(payload),
      }),

    getProducts: () => request<{ products: ProductItem[] }>('/api/admin/products'),

    createProduct: (payload: { title: string; description?: string; price: number; credits?: number; bonusText?: string; category?: string }) =>
      request<{ message: string; product: ProductItem }>('/api/admin/products', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),

    updateProduct: (id: string, payload: Partial<ProductItem>) =>
      request<{ message: string; product: ProductItem }>(`/api/admin/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      }),

    deleteProduct: (id: string) =>
      request<{ message: string }>(`/api/admin/products/${id}`, {
        method: 'DELETE',
      }),

    getDeposits: () => request<{ deposits: DepositRequest[] }>('/api/admin/transactions/deposits'),

    actionDeposit: (id: string, action: 'verify' | 'reject', reason?: string) =>
      request<{ message: string; deposit: DepositRequest }>(`/api/admin/transactions/deposits/${id}/action`, {
        method: 'PUT',
        body: JSON.stringify({ action, reason }),
      }),

    getWithdrawals: () => request<{ withdrawals: WithdrawalRequest[] }>('/api/admin/transactions/withdrawals'),

    actionWithdrawal: (id: string, action: 'approve' | 'reject', transactionRef?: string, reason?: string) =>
      request<{ message: string; withdrawal: WithdrawalRequest }>(`/api/admin/transactions/withdrawals/${id}/action`, {
        method: 'PUT',
        body: JSON.stringify({ action, transactionRef, reason }),
      }),

    getGameSettings: () =>
      request<{ houseEdgePercent: number; animationSpeedMultiplier: number; autoRoundIntervalSec: number }>(
        '/api/admin/game-settings'
      ),

    updateGameSettings: (payload: any) =>
      request<{ message: string }>('/api/admin/game-settings', {
        method: 'PUT',
        body: JSON.stringify(payload),
      }),

    getSettings: () => request<{ settings: any }>('/api/admin/settings'),

    updateSettings: (payload: any) =>
      request<{ message: string; settings: any }>('/api/admin/settings', {
        method: 'PUT',
        body: JSON.stringify(payload),
      }),

    getAuditLogs: (search?: string) => {
      const q = new URLSearchParams();
      if (search) q.set('search', search);
      return request<{ logs: AuditLog[] }>(`/api/admin/audit-logs?${q.toString()}`);
    },
  },
};
