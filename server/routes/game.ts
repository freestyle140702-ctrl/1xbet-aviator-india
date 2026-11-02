import { Router } from 'express';
import crypto from 'node:crypto';
import { getDb, saveDatabase, GameRound, UserBetRecord } from '../db.js';
import { authenticate, recordAuditLog, AuthenticatedRequest } from '../auth.js';

export const gameRouter = Router();

// Helper to generate a provably simulated crash multiplier based on server seed
export function generateSimulatedCrashMultiplier(houseEdge: number = 3.5): { multiplier: number; serverSeed: string; clientSeed: string } {
  const serverSeed = crypto.randomBytes(32).toString('hex');
  const clientSeed = crypto.randomBytes(16).toString('hex');
  const hash = crypto.createHmac('sha256', serverSeed).update(clientSeed).digest('hex');

  // Convert first 52 bits of hash to a number
  const hexSample = hash.slice(0, 13);
  const intVal = parseInt(hexSample, 16);
  const maxIntVal = Math.pow(2, 52);

  // Crash formula standard
  const r = intVal / maxIntVal;
  // House edge adjustment (e.g. 3.5%)
  const adjustedEdge = (100 - houseEdge) / 100;

  let multiplier = 1.0;
  if (r >= 0.03) { // 3% instant crash at 1.00x
    const rawMultiplier = Math.floor((100 * adjustedEdge) / (1 - r)) / 100;
    multiplier = Math.max(1.0, Math.min(rawMultiplier, 100.0));
  }

  // Format to 2 decimal places
  multiplier = Math.round(multiplier * 100) / 100;

  return { multiplier, serverSeed, clientSeed };
}

// Get recent multiplier rounds history
gameRouter.get('/history', (req, res) => {
  const db = getDb();
  const recent = db.gameRounds
    .slice(-25)
    .reverse()
    .map(r => ({
      id: r.id,
      roundNumber: r.roundNumber,
      crashMultiplier: r.crashMultiplier,
      serverSeed: r.serverSeed.slice(0, 8) + '...',
      createdAt: r.createdAt,
    }));
  return res.json({ rounds: recent });
});

// Get user game stats and bets
gameRouter.get('/my-bets', authenticate, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const db = getDb();
  const bets = db.userBets
    .filter(b => b.userId === user.id)
    .slice(-30)
    .reverse();

  const totalBets = bets.length;
  const wonBets = bets.filter(b => b.status === 'won').length;
  const totalWagered = bets.reduce((acc, b) => acc + b.betAmount, 0);
  const totalWon = bets.reduce((acc, b) => acc + (b.winAmount || 0), 0);

  return res.json({
    bets,
    stats: {
      totalBets,
      wonBets,
      winRate: totalBets > 0 ? Math.round((wonBets / totalBets) * 100) : 0,
      totalWagered: Math.round(totalWagered * 100) / 100,
      totalWon: Math.round(totalWon * 100) / 100,
    },
  });
});

// Prepare a new simulated round (supports both POST and GET for resilience)
gameRouter.all('/next-round', (req, res) => {
  const db = getDb();
  const nextRoundNumber = db.gameRounds.length > 0 
    ? Math.max(...db.gameRounds.map(r => r.roundNumber)) + 1 
    : 1001;

  const { multiplier, serverSeed, clientSeed } = generateSimulatedCrashMultiplier(db.settings.houseEdgePercent);

  const round: GameRound = {
    id: 'rnd-' + crypto.randomUUID(),
    roundNumber: nextRoundNumber,
    crashMultiplier: multiplier,
    serverSeed,
    clientSeed,
    createdAt: new Date().toISOString(),
  };

  db.gameRounds.push(round);
  // Keep last 150 rounds in storage
  if (db.gameRounds.length > 150) {
    db.gameRounds = db.gameRounds.slice(-150);
  }
  saveDatabase();

  return res.json({
    roundId: round.id,
    roundNumber: round.roundNumber,
    // Return masked seed until round completes
    clientSeed: round.clientSeed,
    // In simulated environment we supply crashMultiplier to client game coordinator
    crashMultiplier: round.crashMultiplier,
  });
});

// Place virtual bet on round
gameRouter.post('/place-bet', authenticate, (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const { roundId, amount } = req.body;
    const db = getDb();

    const numAmount = Number(amount);
    if (!numAmount || isNaN(numAmount) || numAmount < 1) {
      return res.status(400).json({ error: 'Bet amount must be at least ₹1.' });
    }

    if (user.balance < numAmount) {
      return res.status(400).json({
        error: `Insufficient virtual balance. Your balance is ₹${user.balance.toFixed(2)}. Please make a deposit or request test funds in the admin panel.`,
      });
    }

    const round = db.gameRounds.find(r => r.id === roundId);
    if (!round) {
      return res.status(404).json({ error: 'Specified round was not found.' });
    }

    // Deduct bet amount from server balance
    user.balance = Math.max(0, Math.round((user.balance - numAmount) * 100) / 100);

    const betRecord: UserBetRecord = {
      id: 'bet-' + crypto.randomUUID(),
      userId: user.id,
      userEmail: user.email,
      roundId: round.id,
      roundNumber: round.roundNumber,
      betAmount: numAmount,
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    db.userBets.push(betRecord);
    saveDatabase();

    return res.status(201).json({
      message: 'Simulated bet placed successfully.',
      betId: betRecord.id,
      remainingBalance: user.balance,
    });
  } catch (err: any) {
    console.error('Place bet error:', err);
    return res.status(500).json({ error: 'Failed to place bet.' });
  }
});

// Cash out virtual bet
gameRouter.post('/cash-out', authenticate, (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const { betId, multiplier } = req.body;
    const db = getDb();

    const bet = db.userBets.find(b => b.id === betId && b.userId === user.id);
    if (!bet) {
      return res.status(404).json({ error: 'Bet not found or already settled.' });
    }

    if (bet.status !== 'active') {
      return res.status(400).json({ error: 'Bet has already been cashed out or settled.' });
    }

    const round = db.gameRounds.find(r => r.id === bet.roundId);
    if (!round) {
      return res.status(404).json({ error: 'Round not found.' });
    }

    const numMultiplier = Number(multiplier);
    if (isNaN(numMultiplier) || numMultiplier < 1.0) {
      return res.status(400).json({ error: 'Invalid multiplier value.' });
    }

    // Multiplier cannot exceed round's crash multiplier (plus tiny rounding tolerance 0.05)
    if (numMultiplier > round.crashMultiplier + 0.05) {
      bet.status = 'lost';
      saveDatabase();
      return res.status(400).json({ error: 'Plane crashed before cash out could be verified.' });
    }

    const winAmount = Math.round((bet.betAmount * numMultiplier) * 100) / 100;
    bet.cashedOutMultiplier = numMultiplier;
    bet.winAmount = winAmount;
    bet.status = 'won';

    // Credit win to user virtual balance
    user.balance = Math.round((user.balance + winAmount) * 100) / 100;
    saveDatabase();

    return res.json({
      message: `Cashed out at ${numMultiplier.toFixed(2)}x! Won ₹${winAmount.toFixed(2)}`,
      winAmount,
      multiplier: numMultiplier,
      newBalance: user.balance,
    });
  } catch (err: any) {
    console.error('Cashout error:', err);
    return res.status(500).json({ error: 'Failed to cash out.' });
  }
});

// Settle lost bet (if plane flew away before user cashed out)
gameRouter.post('/settle-loss', authenticate, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const { betId } = req.body;
  const db = getDb();

  const bet = db.userBets.find(b => b.id === betId && b.userId === user.id);
  if (bet && bet.status === 'active') {
    bet.status = 'lost';
    bet.winAmount = 0;
    saveDatabase();
  }
  return res.json({ message: 'Bet settled as loss.', newBalance: user.balance });
});
