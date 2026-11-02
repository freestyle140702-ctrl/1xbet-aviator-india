import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export interface User {
  id: string;
  email: string;
  username?: string;
  name: string;
  phone?: string;
  passwordHash: string;
  salt: string;
  role: 'user' | 'admin';
  balance: number; // in INR (₹)
  status: 'active' | 'restricted' | 'suspended';
  createdAt: string;
  lastLoginAt?: string;
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
  clientSeed: string;
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

export interface SiteSettings {
  upiId: string;
  upiName: string;
  minDeposit: number;
  maxDeposit: number;
  minWithdrawal: number;
  maxWithdrawal: number;
  announcementText: string;
  showAnnouncement: boolean;
  gameInstructionText: string;
  maintenanceMode: boolean;
  customQrUrl?: string;
  supportHandle: string;
  // Game simulated parameters
  houseEdgePercent: number;
  animationSpeedMultiplier: number;
  autoRoundIntervalSec: number;
}

export interface AppDatabase {
  users: User[];
  deposits: DepositRequest[];
  withdrawals: WithdrawalRequest[];
  gameRounds: GameRound[];
  userBets: UserBetRecord[];
  auditLogs: AuditLog[];
  settings: SiteSettings;
  products: ProductItem[];
  sessions: { [token: string]: { userId: string; createdAt: string; expiresAt: string } };
}

const DB_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'db.json');

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

export function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex');
}

export function createPasswordHash(password: string) {
  const salt = generateSalt();
  const hash = hashPassword(password, salt);
  return { salt, hash };
}

export function verifyPassword(password: string, salt: string, hash: string): boolean {
  return hashPassword(password, salt) === hash;
}

const initialSettings: SiteSettings = {
  upiId: '14dharmesh@fam',
  upiName: 'Dharmesh (FamPay UPI)',
  minDeposit: 100,
  maxDeposit: 50000,
  minWithdrawal: 100,
  maxWithdrawal: 25000,
  announcementText: 'Welcome to Aviator Aero! Virtual flight simulation. Verify deposits via 12-digit UTR in the Deposit section.',
  showAnnouncement: true,
  gameInstructionText: 'Aviator is a multiplier crash game. Place your virtual bet before takeoff. Watch the lucky plane soar as the multiplier climbs. Cash out before the plane flies away to secure your virtual win!',
  maintenanceMode: false,
  supportHandle: '@AviatorSupportBot',
  customQrUrl: '/images/attached_qr_code.jpg',
  houseEdgePercent: 3.5,
  animationSpeedMultiplier: 1.0,
  autoRoundIntervalSec: 6,
};

const initialProducts: ProductItem[] = [
  {
    id: 'prod-starter-100',
    title: 'Starter Flight Credits',
    description: 'Basic flight credits for new aviators',
    price: 100,
    credits: 100,
    bonusText: '+5% Welcome Bonus',
    category: 'credits',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-pro-500',
    title: 'Aviator Pro Pack',
    description: 'Popular pack for regular flyers',
    price: 500,
    credits: 550,
    bonusText: '+10% High Altitude Bonus',
    category: 'credits',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-vip-2000',
    title: 'High Roller VIP Pack',
    description: 'Maximum altitude package with VIP benefits',
    price: 2000,
    credits: 2400,
    bonusText: '+20% VIP Bonus',
    category: 'vip',
    createdAt: new Date().toISOString(),
  },
];

let db: AppDatabase = {
  users: [],
  deposits: [],
  withdrawals: [],
  gameRounds: [],
  userBets: [],
  auditLogs: [],
  settings: initialSettings,
  products: initialProducts,
  sessions: {},
};

export function initDatabase() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  if (fs.existsSync(DB_FILE)) {
    try {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const loaded = JSON.parse(raw);
      db = {
        ...db,
        ...loaded,
        settings: { ...initialSettings, ...(loaded.settings || {}) },
        products: loaded.products && loaded.products.length > 0 ? loaded.products : initialProducts,
      };
      console.log(`[Database] Loaded existing database with ${db.users.length} users and ${db.deposits.length} deposits.`);
    } catch (e) {
      console.error('[Database] Error loading db.json, using clean default', e);
    }
  }

  // Ensure default Admin user exists and has DHARMESH@2026 passcode configured
  const adminPasscode = 'DHARMESH@2026';
  const { salt, hash } = createPasswordHash(adminPasscode);

  let existingAdmin = db.users.find(u => u.role === 'admin' || u.email === 'admin@aviator.pro' || u.username === 'admin');
  if (!existingAdmin) {
    const adminUser: User = {
      id: 'admin-' + crypto.randomUUID(),
      username: 'admin',
      email: 'admin@aviator.pro',
      name: 'System Administrator',
      phone: '+91 9876543210',
      passwordHash: hash,
      salt: salt,
      role: 'admin',
      balance: 0,
      status: 'active',
      createdAt: new Date().toISOString(),
    };
    db.users.push(adminUser);
    console.log('[Database] Seeded administrator: username admin, passcode DHARMESH@2026');
  } else {
    existingAdmin.username = 'admin';
    existingAdmin.passwordHash = hash;
    existingAdmin.salt = salt;
    existingAdmin.role = 'admin';
    console.log('[Database] Configured administrator: username admin, passcode DHARMESH@2026');
  }

  // Ensure sample recent multiplier history exists if empty
  if (db.gameRounds.length === 0) {
    const sampleMultipliers = [1.25, 2.45, 1.12, 5.84, 1.77, 12.30, 1.08, 3.15, 1.94, 4.62, 1.40, 8.91, 1.03, 2.18, 6.75];
    sampleMultipliers.forEach((mult, index) => {
      db.gameRounds.push({
        id: 'round-init-' + index,
        roundNumber: 1000 + index,
        crashMultiplier: mult,
        serverSeed: crypto.randomBytes(16).toString('hex'),
        clientSeed: crypto.randomBytes(8).toString('hex'),
        createdAt: new Date(Date.now() - (sampleMultipliers.length - index) * 20000).toISOString(),
      });
    });
  }

  saveDatabase();
}

export function saveDatabase() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Database] Failed to save db.json:', err);
  }
}

export function getDb(): AppDatabase {
  return db;
}
