import { Router } from 'express';
import crypto from 'node:crypto';
import { getDb, saveDatabase, DepositRequest, WithdrawalRequest } from '../db.js';
import { authenticate, recordAuditLog, AuthenticatedRequest } from '../auth.js';

export const transactionRouter = Router();

// Get current user's transaction history (deposits + withdrawals)
transactionRouter.get('/history', authenticate, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const db = getDb();

  const userDeposits = db.deposits
    .filter(d => d.userId === user.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const userWithdrawals = db.withdrawals
    .filter(w => w.userId === user.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return res.json({
    deposits: userDeposits,
    withdrawals: userWithdrawals,
  });
});

// Submit a deposit request with 12-digit UTR transaction reference
transactionRouter.post('/deposit', authenticate, (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const { amount, utrNumber } = req.body;
    const db = getDb();

    const numAmount = Number(amount);
    if (!numAmount || isNaN(numAmount) || numAmount < db.settings.minDeposit) {
      return res.status(400).json({
        error: `Deposit amount must be at least ₹${db.settings.minDeposit}.`,
      });
    }

    if (numAmount > db.settings.maxDeposit) {
      return res.status(400).json({
        error: `Deposit amount cannot exceed ₹${db.settings.maxDeposit}.`,
      });
    }

    const cleanUtr = String(utrNumber || '').trim();
    if (!cleanUtr || cleanUtr.length < 8) {
      return res.status(400).json({
        error: 'Please enter a valid 12-digit UPI Transaction Reference (UTR) number from your banking/UPI app.',
      });
    }

    // Duplicate transaction check (prevent reuse of same UTR)
    const duplicate = db.deposits.find(
      d => d.utrNumber.toLowerCase() === cleanUtr.toLowerCase()
    );

    if (duplicate) {
      return res.status(409).json({
        error: `This Transaction Reference (UTR: ${cleanUtr}) has already been submitted on ${new Date(duplicate.createdAt).toLocaleString()}. Duplicate requests are prohibited.`,
      });
    }

    const newDeposit: DepositRequest = {
      id: 'dep-' + crypto.randomUUID(),
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      amount: Math.round(numAmount * 100) / 100,
      utrNumber: cleanUtr,
      upiId: db.settings.upiId,
      status: 'pending', // Strictly PENDING until admin verification
      createdAt: new Date().toISOString(),
    };

    db.deposits.unshift(newDeposit);
    saveDatabase();

    recordAuditLog(
      { id: user.id, email: user.email, role: user.role },
      'DEPOSIT_SUBMITTED',
      newDeposit.id,
      `Deposit request of ₹${newDeposit.amount} submitted with UTR ${cleanUtr}. Status: PENDING`,
      req
    );

    return res.status(201).json({
      message: 'Deposit request recorded. Status: PENDING verification by administrator.',
      deposit: newDeposit,
    });
  } catch (error: any) {
    console.error('Deposit submission error:', error);
    return res.status(500).json({ error: 'Failed to process deposit request.' });
  }
});

// Submit a withdrawal request
transactionRouter.post('/withdraw', authenticate, (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const { amount, payoutMethod, upiId, accountNumber, ifscCode, accountHolderName, bankName } = req.body;
    const db = getDb();

    // Check user account status
    if (user.status !== 'active') {
      return res.status(403).json({ error: 'Your account is restricted from requesting withdrawals.' });
    }

    const numAmount = Number(amount);
    if (!numAmount || isNaN(numAmount) || numAmount < db.settings.minWithdrawal) {
      return res.status(400).json({
        error: `Minimum withdrawal amount is ₹${db.settings.minWithdrawal}.`,
      });
    }

    if (numAmount > db.settings.maxWithdrawal) {
      return res.status(400).json({
        error: `Maximum withdrawal per request is ₹${db.settings.maxWithdrawal}.`,
      });
    }

    // Verify user has sufficient balance
    if (user.balance < numAmount) {
      return res.status(400).json({
        error: `Insufficient balance. Available balance is ₹${user.balance.toFixed(2)}, requested ₹${numAmount.toFixed(2)}.`,
      });
    }

    if (payoutMethod === 'upi') {
      if (!upiId || !String(upiId).includes('@')) {
        return res.status(400).json({ error: 'Please enter a valid UPI ID (e.g. yourname@oksbi).' });
      }
    } else if (payoutMethod === 'bank') {
      if (!accountNumber || !ifscCode || !accountHolderName) {
        return res.status(400).json({
          error: 'Please fill in Account Number, IFSC Code, and Account Holder Name for bank payout.',
        });
      }
      if (String(ifscCode).trim().length < 6) {
        return res.status(400).json({ error: 'Please enter a valid IFSC code.' });
      }
    } else {
      return res.status(400).json({ error: 'Invalid payout method selected.' });
    }

    // Deduct balance immediately to prevent double spending
    user.balance = Math.max(0, Math.round((user.balance - numAmount) * 100) / 100);

    const withdrawal: WithdrawalRequest = {
      id: 'wth-' + crypto.randomUUID(),
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      amount: Math.round(numAmount * 100) / 100,
      payoutMethod: payoutMethod as 'upi' | 'bank',
      payoutDetails: {
        upiId: upiId ? String(upiId).trim() : undefined,
        accountNumber: accountNumber ? String(accountNumber).trim() : undefined,
        ifscCode: ifscCode ? String(ifscCode).trim().toUpperCase() : undefined,
        accountHolderName: accountHolderName ? String(accountHolderName).trim() : undefined,
        bankName: bankName ? String(bankName).trim() : undefined,
      },
      status: 'pending',
      transactionRef: 'REF-' + Date.now().toString(36).toUpperCase() + '-' + crypto.randomBytes(3).toString('hex').toUpperCase(),
      createdAt: new Date().toISOString(),
    };

    db.withdrawals.unshift(withdrawal);
    saveDatabase();

    recordAuditLog(
      { id: user.id, email: user.email, role: user.role },
      'WITHDRAWAL_REQUESTED',
      withdrawal.id,
      `Withdrawal of ₹${withdrawal.amount} requested. Reserved from balance. New balance: ₹${user.balance}. Status: PENDING`,
      req
    );

    return res.status(201).json({
      message: 'Withdrawal request created successfully. Status: PENDING administrative review.',
      withdrawal,
      updatedBalance: user.balance,
    });
  } catch (error: any) {
    console.error('Withdrawal error:', error);
    return res.status(500).json({ error: 'Failed to process withdrawal request.' });
  }
});
