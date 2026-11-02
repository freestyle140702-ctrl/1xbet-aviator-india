import { Router } from 'express';
import { getDb, saveDatabase, User } from '../db.js';
import { authenticate, requireAdmin, recordAuditLog, AuthenticatedRequest } from '../auth.js';

export const adminRouter = Router();

// Protect all admin endpoints
adminRouter.use(authenticate);
adminRouter.use(requireAdmin);

// 1. Dashboard Overview Stats
adminRouter.get('/stats', (req: AuthenticatedRequest, res) => {
  const db = getDb();

  const totalUsers = db.users.filter(u => u.role !== 'admin').length;
  const activeSessions = Object.keys(db.sessions).length;
  const totalRoundsPlayed = db.gameRounds.length;
  const totalBetsPlaced = db.userBets.length;

  const pendingDeposits = db.deposits.filter(d => d.status === 'pending');
  const verifiedDeposits = db.deposits.filter(d => d.status === 'verified');
  const totalDepositedAmount = verifiedDeposits.reduce((acc, d) => acc + d.amount, 0);

  const pendingWithdrawals = db.withdrawals.filter(w => w.status === 'pending');
  const successfulWithdrawals = db.withdrawals.filter(w => w.status === 'successful');
  const totalWithdrawnAmount = successfulWithdrawals.reduce((acc, w) => acc + w.amount, 0);

  return res.json({
    usersCount: totalUsers,
    activeSessions,
    totalRoundsPlayed,
    totalBetsPlaced,
    pendingDepositsCount: pendingDeposits.length,
    verifiedDepositsCount: verifiedDeposits.length,
    totalDepositedAmount: Math.round(totalDepositedAmount * 100) / 100,
    pendingWithdrawalsCount: pendingWithdrawals.length,
    successfulWithdrawalsCount: successfulWithdrawals.length,
    totalWithdrawnAmount: Math.round(totalWithdrawnAmount * 100) / 100,
    recentAuditLogs: db.auditLogs.slice(0, 5),
  });
});

// 2. User Management
// List all users with search and filter
adminRouter.get('/users', (req: AuthenticatedRequest, res) => {
  const db = getDb();
  const search = String(req.query.search || '').toLowerCase().trim();
  const statusFilter = String(req.query.status || '');

  let filtered = db.users.map(u => ({
    id: u.id,
    email: u.email,
    name: u.name,
    phone: u.phone,
    role: u.role,
    balance: u.balance,
    status: u.status,
    createdAt: u.createdAt,
    lastLoginAt: u.lastLoginAt,
  }));

  if (search) {
    filtered = filtered.filter(u =>
      u.email.toLowerCase().includes(search) ||
      u.name.toLowerCase().includes(search) ||
      (u.phone && u.phone.includes(search))
    );
  }

  if (statusFilter && ['active', 'restricted', 'suspended'].includes(statusFilter)) {
    filtered = filtered.filter(u => u.status === statusFilter);
  }

  return res.json({ users: filtered });
});

// Update user account status (active / restricted / suspended)
adminRouter.put('/users/:id/status', (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { status, reason } = req.body;
  const db = getDb();

  if (!['active', 'restricted', 'suspended'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status value. Choose active, restricted, or suspended.' });
  }

  const user = db.users.find(u => u.id === id);
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  if (user.role === 'admin' && user.id === req.user!.id) {
    return res.status(400).json({ error: 'You cannot restrict your own administrator account.' });
  }

  const oldStatus = user.status;
  user.status = status;
  saveDatabase();

  recordAuditLog(
    { id: req.user!.id, email: req.user!.email, role: req.user!.role },
    'USER_STATUS_UPDATED',
    user.email,
    `Status changed from ${oldStatus} to ${status}. Reason: ${reason || 'Administrative action'}`,
    req
  );

  return res.json({ message: `User status changed to ${status}.`, user });
});

// Adjust user virtual balance with audit reason
adminRouter.put('/users/:id/balance', (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { amount, action, reason } = req.body;
  const db = getDb();

  const numAmount = Number(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    return res.status(400).json({ error: 'Please specify a valid positive amount.' });
  }

  if (!['add', 'subtract', 'set'].includes(action)) {
    return res.status(400).json({ error: 'Invalid action. Choose add, subtract, or set.' });
  }

  const user = db.users.find(u => u.id === id);
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  const oldBalance = user.balance;
  if (action === 'add') {
    user.balance = Math.round((user.balance + numAmount) * 100) / 100;
  } else if (action === 'subtract') {
    user.balance = Math.max(0, Math.round((user.balance - numAmount) * 100) / 100);
  } else if (action === 'set') {
    user.balance = Math.max(0, Math.round(numAmount * 100) / 100);
  }

  saveDatabase();

  recordAuditLog(
    { id: req.user!.id, email: req.user!.email, role: req.user!.role },
    'USER_BALANCE_ADJUSTED',
    user.email,
    `Admin balance adjustment (${action} ₹${numAmount}). Previous: ₹${oldBalance}, New: ₹${user.balance}. Note: ${reason || 'Admin credit/debit'}`,
    req
  );

  return res.json({
    message: `User balance updated to ₹${user.balance}.`,
    user: {
      id: user.id,
      email: user.email,
      balance: user.balance,
    },
  });
});

// 3. Content Management
adminRouter.get('/content', (req: AuthenticatedRequest, res) => {
  const db = getDb();
  return res.json({
    announcementText: db.settings.announcementText,
    showAnnouncement: db.settings.showAnnouncement,
    gameInstructionText: db.settings.gameInstructionText,
    supportHandle: db.settings.supportHandle,
    maintenanceMode: db.settings.maintenanceMode,
  });
});

adminRouter.put('/content', (req: AuthenticatedRequest, res) => {
  const { announcementText, showAnnouncement, gameInstructionText, supportHandle, maintenanceMode } = req.body;
  const db = getDb();

  if (announcementText !== undefined) db.settings.announcementText = String(announcementText).trim();
  if (showAnnouncement !== undefined) db.settings.showAnnouncement = Boolean(showAnnouncement);
  if (gameInstructionText !== undefined) db.settings.gameInstructionText = String(gameInstructionText).trim();
  if (supportHandle !== undefined) db.settings.supportHandle = String(supportHandle).trim();
  if (maintenanceMode !== undefined) db.settings.maintenanceMode = Boolean(maintenanceMode);

  saveDatabase();

  recordAuditLog(
    { id: req.user!.id, email: req.user!.email, role: req.user!.role },
    'CONTENT_UPDATED',
    'Site Content & Announcements',
    'Updated announcement and game instruction texts',
    req
  );

  return res.json({ message: 'Website content updated successfully.', content: db.settings });
});

// 4. Payment and Transactions Management
// Get all deposits
adminRouter.get('/transactions/deposits', (req: AuthenticatedRequest, res) => {
  const db = getDb();
  return res.json({ deposits: db.deposits });
});

// Action on deposit (verify or reject)
adminRouter.put('/transactions/deposits/:id/action', (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { action, reason } = req.body;
  const db = getDb();

  const deposit = db.deposits.find(d => d.id === id);
  if (!deposit) {
    return res.status(404).json({ error: 'Deposit record not found.' });
  }

  if (deposit.status !== 'pending') {
    return res.status(400).json({ error: `Deposit has already been ${deposit.status}.` });
  }

  if (action === 'verify') {
    deposit.status = 'verified';
    deposit.verifiedAt = new Date().toISOString();
    deposit.verifiedBy = req.user!.email;

    // Credit balance to the user
    const user = db.users.find(u => u.id === deposit.userId);
    if (user) {
      user.balance = Math.round((user.balance + deposit.amount) * 100) / 100;
    }

    saveDatabase();

    recordAuditLog(
      { id: req.user!.id, email: req.user!.email, role: req.user!.role },
      'DEPOSIT_VERIFIED',
      deposit.id,
      `Deposit of ₹${deposit.amount} (UTR: ${deposit.utrNumber}) verified for ${deposit.userEmail}. Balance credited.`,
      req
    );

    return res.json({ message: `Deposit of ₹${deposit.amount} verified and credited to user balance.`, deposit });
  } else if (action === 'reject') {
    deposit.status = 'rejected';
    deposit.rejectionReason = reason || 'Invalid or unverifiable transaction reference.';
    deposit.verifiedAt = new Date().toISOString();
    deposit.verifiedBy = req.user!.email;

    saveDatabase();

    recordAuditLog(
      { id: req.user!.id, email: req.user!.email, role: req.user!.role },
      'DEPOSIT_REJECTED',
      deposit.id,
      `Deposit of ₹${deposit.amount} (UTR: ${deposit.utrNumber}) rejected. Reason: ${deposit.rejectionReason}`,
      req
    );

    return res.json({ message: 'Deposit has been marked as rejected.', deposit });
  } else {
    return res.status(400).json({ error: 'Invalid action. Choose verify or reject.' });
  }
});

// Get all withdrawals
adminRouter.get('/transactions/withdrawals', (req: AuthenticatedRequest, res) => {
  const db = getDb();
  return res.json({ withdrawals: db.withdrawals });
});

// Action on withdrawal (approve or reject)
adminRouter.put('/transactions/withdrawals/:id/action', (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { action, transactionRef, reason } = req.body;
  const db = getDb();

  const withdrawal = db.withdrawals.find(w => w.id === id);
  if (!withdrawal) {
    return res.status(404).json({ error: 'Withdrawal request not found.' });
  }

  if (withdrawal.status !== 'pending') {
    return res.status(400).json({ error: `Withdrawal has already been processed (${withdrawal.status}).` });
  }

  if (action === 'approve') {
    withdrawal.status = 'successful';
    withdrawal.processedAt = new Date().toISOString();
    withdrawal.processedBy = req.user!.email;
    if (transactionRef) {
      withdrawal.transactionRef = String(transactionRef).trim();
    }

    saveDatabase();

    recordAuditLog(
      { id: req.user!.id, email: req.user!.email, role: req.user!.role },
      'WITHDRAWAL_APPROVED',
      withdrawal.id,
      `Withdrawal of ₹${withdrawal.amount} approved for ${withdrawal.userEmail}. Payout ref: ${withdrawal.transactionRef}`,
      req
    );

    return res.json({ message: `Withdrawal of ₹${withdrawal.amount} marked as successful.`, withdrawal });
  } else if (action === 'reject') {
    withdrawal.status = 'rejected';
    withdrawal.rejectionReason = reason || 'Declined by administration.';
    withdrawal.processedAt = new Date().toISOString();
    withdrawal.processedBy = req.user!.email;

    // Refund reserved balance back to user
    const user = db.users.find(u => u.id === withdrawal.userId);
    if (user) {
      user.balance = Math.round((user.balance + withdrawal.amount) * 100) / 100;
    }

    saveDatabase();

    recordAuditLog(
      { id: req.user!.id, email: req.user!.email, role: req.user!.role },
      'WITHDRAWAL_REJECTED',
      withdrawal.id,
      `Withdrawal of ₹${withdrawal.amount} rejected. Refunded ₹${withdrawal.amount} to user balance. Reason: ${withdrawal.rejectionReason}`,
      req
    );

    return res.json({ message: 'Withdrawal rejected and balance refunded to user.', withdrawal });
  } else {
    return res.status(400).json({ error: 'Invalid action. Choose approve or reject.' });
  }
});

// 5. Game Settings
adminRouter.get('/game-settings', (req: AuthenticatedRequest, res) => {
  const db = getDb();
  return res.json({
    houseEdgePercent: db.settings.houseEdgePercent,
    animationSpeedMultiplier: db.settings.animationSpeedMultiplier,
    autoRoundIntervalSec: db.settings.autoRoundIntervalSec,
  });
});

adminRouter.put('/game-settings', (req: AuthenticatedRequest, res) => {
  const { houseEdgePercent, animationSpeedMultiplier, autoRoundIntervalSec } = req.body;
  const db = getDb();

  if (houseEdgePercent !== undefined) {
    const val = Number(houseEdgePercent);
    if (val >= 1 && val <= 25) db.settings.houseEdgePercent = val;
  }
  if (animationSpeedMultiplier !== undefined) {
    const val = Number(animationSpeedMultiplier);
    if (val >= 0.5 && val <= 3.0) db.settings.animationSpeedMultiplier = val;
  }
  if (autoRoundIntervalSec !== undefined) {
    const val = Number(autoRoundIntervalSec);
    if (val >= 3 && val <= 30) db.settings.autoRoundIntervalSec = val;
  }

  saveDatabase();

  recordAuditLog(
    { id: req.user!.id, email: req.user!.email, role: req.user!.role },
    'GAME_SETTINGS_UPDATED',
    'Game Engine Parameters',
    `House Edge: ${db.settings.houseEdgePercent}%, Speed: ${db.settings.animationSpeedMultiplier}x, Countdown: ${db.settings.autoRoundIntervalSec}s`,
    req
  );

  return res.json({ message: 'Game settings updated.', settings: db.settings });
});

// 6. Website Settings
adminRouter.get('/settings', (req: AuthenticatedRequest, res) => {
  const db = getDb();
  return res.json({ settings: db.settings });
});

adminRouter.put('/settings', (req: AuthenticatedRequest, res) => {
  const { upiId, upiName, minDeposit, maxDeposit, minWithdrawal, maxWithdrawal, customQrUrl, supportHandle } = req.body;
  const db = getDb();

  if (upiId) db.settings.upiId = String(upiId).trim();
  if (upiName) db.settings.upiName = String(upiName).trim();
  if (minDeposit) db.settings.minDeposit = Math.max(1, Number(minDeposit));
  if (maxDeposit) db.settings.maxDeposit = Math.max(db.settings.minDeposit, Number(maxDeposit));
  if (minWithdrawal) db.settings.minWithdrawal = Math.max(1, Number(minWithdrawal));
  if (maxWithdrawal) db.settings.maxWithdrawal = Math.max(db.settings.minWithdrawal, Number(maxWithdrawal));
  if (customQrUrl !== undefined) db.settings.customQrUrl = String(customQrUrl).trim();
  if (supportHandle !== undefined) db.settings.supportHandle = String(supportHandle).trim();

  saveDatabase();

  recordAuditLog(
    { id: req.user!.id, email: req.user!.email, role: req.user!.role },
    'WEBSITE_SETTINGS_UPDATED',
    'UPI & Financial Limits',
    `UPI ID set to ${db.settings.upiId}, Min Dep: ₹${db.settings.minDeposit}, Min Wth: ₹${db.settings.minWithdrawal}`,
    req
  );

  return res.json({ message: 'Website settings saved.', settings: db.settings });
});

// 7. Security and Audit Logs
adminRouter.get('/audit-logs', (req: AuthenticatedRequest, res) => {
  const db = getDb();
  const search = String(req.query.search || '').toLowerCase().trim();

  let logs = db.auditLogs;
  if (search) {
    logs = logs.filter(l =>
      l.action.toLowerCase().includes(search) ||
      l.actorEmail.toLowerCase().includes(search) ||
      (l.details && l.details.toLowerCase().includes(search))
    );
  }

  return res.json({ logs });
});

// Products & Pricing Management (Content Management)
adminRouter.get('/products', (req: AuthenticatedRequest, res) => {
  const db = getDb();
  return res.json({ products: db.products || [] });
});

adminRouter.post('/products', (req: AuthenticatedRequest, res) => {
  const db = getDb();
  const { title, description, price, credits, bonusText, category } = req.body;

  if (!title || price === undefined) {
    return res.status(400).json({ error: 'Product title and price are required.' });
  }

  if (!db.products) db.products = [];

  const newProduct = {
    id: 'prod-' + crypto.randomUUID(),
    title: String(title).trim(),
    description: String(description || '').trim(),
    price: Math.max(1, Number(price)),
    credits: Math.max(1, Number(credits || price)),
    bonusText: bonusText ? String(bonusText).trim() : undefined,
    category: String(category || 'credits').trim(),
    createdAt: new Date().toISOString(),
  };

  db.products.push(newProduct);
  saveDatabase();

  recordAuditLog(
    { id: req.user!.id, email: req.user!.email, role: req.user!.role },
    'PRODUCT_CREATED',
    newProduct.id,
    `Added product "${newProduct.title}" priced at ₹${newProduct.price}`,
    req
  );

  return res.status(201).json({ message: 'Product added successfully.', product: newProduct });
});

adminRouter.put('/products/:id', (req: AuthenticatedRequest, res) => {
  const db = getDb();
  const { id } = req.params;
  const { title, description, price, credits, bonusText, category } = req.body;

  if (!db.products) db.products = [];
  const product = db.products.find(p => p.id === id);
  if (!product) {
    return res.status(404).json({ error: 'Product not found.' });
  }

  if (title) product.title = String(title).trim();
  if (description !== undefined) product.description = String(description).trim();
  if (price !== undefined) product.price = Math.max(1, Number(price));
  if (credits !== undefined) product.credits = Math.max(1, Number(credits));
  if (bonusText !== undefined) product.bonusText = String(bonusText).trim();
  if (category) product.category = String(category).trim();

  saveDatabase();

  recordAuditLog(
    { id: req.user!.id, email: req.user!.email, role: req.user!.role },
    'PRODUCT_UPDATED',
    product.id,
    `Updated product "${product.title}" price to ₹${product.price}`,
    req
  );

  return res.json({ message: 'Product updated successfully.', product });
});

adminRouter.delete('/products/:id', (req: AuthenticatedRequest, res) => {
  const db = getDb();
  const { id } = req.params;

  if (!db.products) db.products = [];
  const index = db.products.findIndex(p => p.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Product not found.' });
  }

  const removed = db.products.splice(index, 1)[0];
  saveDatabase();

  recordAuditLog(
    { id: req.user!.id, email: req.user!.email, role: req.user!.role },
    'PRODUCT_DELETED',
    id,
    `Deleted product "${removed.title}"`,
    req
  );

  return res.json({ message: 'Product deleted successfully.' });
});
