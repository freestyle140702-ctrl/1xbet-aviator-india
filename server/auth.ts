import { Request, Response, NextFunction } from 'express';
import crypto from 'node:crypto';
import { getDb, saveDatabase, User, AuditLog } from './db.js';

export interface AuthenticatedRequest extends Request {
  user?: User;
  token?: string;
}

export function createSessionToken(userId: string): string {
  const db = getDb();
  const token = crypto.randomBytes(32).toString('hex');
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

  db.sessions[token] = {
    userId,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };
  saveDatabase();
  return token;
}

export function revokeSessionToken(token: string) {
  const db = getDb();
  if (db.sessions[token]) {
    delete db.sessions[token];
    saveDatabase();
  }
}

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. No Bearer token provided.' });
  }

  const token = authHeader.substring(7).trim();
  const db = getDb();
  const session = db.sessions[token];

  if (!session) {
    return res.status(401).json({ error: 'Session expired or invalid. Please log in again.' });
  }

  if (new Date(session.expiresAt) < new Date()) {
    delete db.sessions[token];
    saveDatabase();
    return res.status(401).json({ error: 'Session expired. Please log in again.' });
  }

  const user = db.users.find(u => u.id === session.userId);
  if (!user) {
    return res.status(401).json({ error: 'User account not found.' });
  }

  if (user.status === 'suspended') {
    return res.status(403).json({ error: 'This account has been suspended by administration.' });
  }

  req.user = user;
  req.token = token;
  next();
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
  }
  next();
}

export function recordAuditLog(
  actor: { id: string; email: string; role: string },
  action: string,
  target?: string,
  details?: string,
  req?: Request
) {
  const db = getDb();
  const log: AuditLog = {
    id: 'audit-' + crypto.randomUUID(),
    actorId: actor.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    action,
    target,
    details,
    ip: req ? (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress : undefined,
    createdAt: new Date().toISOString(),
  };
  db.auditLogs.unshift(log);
  // Keep audit logs capped at 1000
  if (db.auditLogs.length > 1000) {
    db.auditLogs.length = 1000;
  }
  saveDatabase();
}
