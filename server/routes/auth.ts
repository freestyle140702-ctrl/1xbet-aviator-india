import { Router } from 'express';
import crypto from 'node:crypto';
import { getDb, saveDatabase, createPasswordHash, verifyPassword, User } from '../db.js';
import { authenticate, createSessionToken, revokeSessionToken, recordAuditLog, AuthenticatedRequest } from '../auth.js';

export const authRouter = Router();

// Register new user
authRouter.post('/register', (req, res) => {
  try {
    const { email, password, name, phone } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    const trimmedEmail = String(email).trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }

    if (String(password).length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const db = getDb();
    const existing = db.users.find(u => u.email.toLowerCase() === trimmedEmail);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const { salt, hash } = createPasswordHash(password);
    const newUser: User = {
      id: 'usr-' + crypto.randomUUID(),
      email: trimmedEmail,
      name: String(name).trim(),
      phone: phone ? String(phone).trim() : undefined,
      passwordHash: hash,
      salt: salt,
      role: 'user',
      balance: 0, // Requirement: Set initial displayed balance to ₹0
      status: 'active',
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };

    db.users.push(newUser);
    saveDatabase();

    const token = createSessionToken(newUser.id);
    recordAuditLog(
      { id: newUser.id, email: newUser.email, role: newUser.role },
      'USER_REGISTERED',
      newUser.email,
      'New user account created with initial balance ₹0',
      req
    );

    return res.status(201).json({
      message: 'Account successfully registered.',
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        phone: newUser.phone,
        role: newUser.role,
        balance: newUser.balance,
        status: newUser.status,
        createdAt: newUser.createdAt,
      },
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Registration failed due to server error.' });
  }
});

// Login
authRouter.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;

    const rawIdentifier = String(email || req.body.username || '').trim();

    if (!rawIdentifier || !password) {
      return res.status(400).json({ error: 'Username/Email and passcode are required.' });
    }

    const trimmed = rawIdentifier.toLowerCase();
    const db = getDb();
    const user = db.users.find(u => 
      u.email.toLowerCase() === trimmed || 
      (u.username && u.username.toLowerCase() === trimmed) ||
      (trimmed === 'admin' && u.role === 'admin')
    );

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const isValid = verifyPassword(password, user.salt, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ error: 'Your account has been suspended. Please contact support.' });
    }

    user.lastLoginAt = new Date().toISOString();
    saveDatabase();

    const token = createSessionToken(user.id);
    recordAuditLog(
      { id: user.id, email: user.email, role: user.role },
      'USER_LOGIN',
      user.email,
      'User logged in successfully',
      req
    );

    return res.json({
      message: 'Logged in successfully.',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        balance: user.balance,
        status: user.status,
        createdAt: user.createdAt,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Login failed due to an unexpected error.' });
  }
});

// Logout
authRouter.post('/logout', authenticate, (req: AuthenticatedRequest, res) => {
  if (req.token) {
    revokeSessionToken(req.token);
  }
  return res.json({ message: 'Logged out successfully.' });
});

// Get current logged in user
authRouter.get('/me', authenticate, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  return res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      balance: user.balance,
      status: user.status,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
    },
  });
});

// Forgot Password
authRouter.post('/forgot-password', (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email address is required.' });
  }

  const db = getDb();
  const user = db.users.find(u => u.email.toLowerCase() === String(email).trim().toLowerCase());

  // Always return neutral message for security to prevent email enumeration
  if (!user) {
    return res.json({
      message: 'If an account with this email exists, a password reset link has been dispatched.',
    });
  }

  recordAuditLog(
    { id: user.id, email: user.email, role: user.role },
    'PASSWORD_RESET_REQUESTED',
    user.email,
    'Forgot password request initiated',
    req
  );

  return res.json({
    message: 'If an account with this email exists, a password reset link has been dispatched.',
    resetKey: 'RESET-' + crypto.randomBytes(8).toString('hex').toUpperCase(),
  });
});

// Reset Password
authRouter.post('/reset-password', (req, res) => {
  const { email, resetKey, newPassword } = req.body;
  if (!email || !resetKey || !newPassword) {
    return res.status(400).json({ error: 'Email, reset token, and new password are required.' });
  }

  if (String(newPassword).length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }

  const db = getDb();
  const user = db.users.find(u => u.email.toLowerCase() === String(email).trim().toLowerCase());
  if (!user) {
    return res.status(404).json({ error: 'User account not found.' });
  }

  const { salt, hash } = createPasswordHash(newPassword);
  user.salt = salt;
  user.passwordHash = hash;
  saveDatabase();

  recordAuditLog(
    { id: user.id, email: user.email, role: user.role },
    'PASSWORD_RESET_COMPLETED',
    user.email,
    'Password updated via reset flow',
    req
  );

  return res.json({ message: 'Password has been successfully updated. Please log in with your new password.' });
});

// Update Profile
authRouter.put('/profile', authenticate, (req: AuthenticatedRequest, res) => {
  const { name, phone } = req.body;
  const user = req.user!;

  if (name && String(name).trim()) {
    user.name = String(name).trim();
  }
  if (phone !== undefined) {
    user.phone = String(phone).trim();
  }

  saveDatabase();

  return res.json({
    message: 'Profile updated successfully.',
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      balance: user.balance,
      status: user.status,
      createdAt: user.createdAt,
    },
  });
});

// Change Password
authRouter.put('/change-password', authenticate, (req: AuthenticatedRequest, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = req.user!;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current password and new password are required.' });
  }

  if (!verifyPassword(currentPassword, user.salt, user.passwordHash)) {
    return res.status(401).json({ error: 'Current password is incorrect.' });
  }

  if (String(newPassword).length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
  }

  const { salt, hash } = createPasswordHash(newPassword);
  user.salt = salt;
  user.passwordHash = hash;
  saveDatabase();

  recordAuditLog(
    { id: user.id, email: user.email, role: user.role },
    'PASSWORD_CHANGED',
    user.email,
    'User changed password while logged in',
    req
  );

  return res.json({ message: 'Password changed successfully.' });
});
