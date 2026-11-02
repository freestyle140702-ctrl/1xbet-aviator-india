export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: 'user' | 'admin';
  balance: number;
  status: 'active' | 'restricted' | 'suspended';
  createdAt: string;
  lastLoginAt?: string;
}

export interface DepositRequest {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  amount: number;
  utrNumber: string;
  upiId: string;
  status: 'pending' | 'verified' | 'rejected';
  rejectionReason?: string;
  createdAt: string;
  verifiedAt?: string;
  verifiedBy?: string;
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  amount: number;
  payoutMethod: 'upi' | 'bank';
  payoutDetails: {
    upiId?: string;
    accountNumber?: string;
    ifscCode?: string;
    accountHolderName?: string;
    bankName?: string;
  };
  status: 'pending' | 'successful' | 'rejected';
  rejectionReason?: string;
  transactionRef?: string;
  createdAt: string;
  processedAt?: string;
  processedBy?: string;
}

export interface GameRound {
  id: string;
  roundNumber: number;
  crashMultiplier: number;
  serverSeed: string;
  clientSeed?: string;
  createdAt: string;
}

export interface UserBetRecord {
  id: string;
  userId: string;
  userEmail: string;
  roundId: string;
  roundNumber: number;
  betAmount: number;
  cashedOutMultiplier?: number;
  winAmount?: number;
  status: 'won' | 'lost' | 'active';
  createdAt: string;
}

export interface AuditLog {
  id: string;
  actorId: string;
  actorEmail: string;
  actorRole: string;
  action: string;
  target?: string;
  details?: string;
  ip?: string;
  createdAt: string;
}

export interface PublicConfig {
  upiId: string;
  upiName: string;
  minDeposit: number;
  maxDeposit: number;
  minWithdrawal: number;
  maxWithdrawal: number;
  announcementText: string;
  showAnnouncement: boolean;
  gameInstructionText: string;
  supportHandle: string;
  customQrUrl?: string;
  maintenanceMode: boolean;
}

export interface DashboardStats {
  usersCount: number;
  activeSessions: number;
  totalRoundsPlayed: number;
  totalBetsPlaced: number;
  pendingDepositsCount: number;
  verifiedDepositsCount: number;
  totalDepositedAmount: number;
  pendingWithdrawalsCount: number;
  successfulWithdrawalsCount: number;
  totalWithdrawnAmount: number;
  recentAuditLogs: AuditLog[];
}

export interface ProductItem {
  id: string;
  title: string;
  description: string;
  price: number;
  credits: number;
  bonusText?: string;
  category: string;
  createdAt: string;
}
