import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { initDatabase, getDb } from './server/db.js';
import { authRouter } from './server/routes/auth.js';
import { gameRouter } from './server/routes/game.js';
import { transactionRouter } from './server/routes/transactions.js';
import { adminRouter } from './server/routes/admin.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === 'production';
const PORT = parseInt(process.env.PORT || '3000', 10);

async function startServer() {
  // Initialize persistent database
  initDatabase();

  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // Permissive CORS for iframe and preview environments
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }
    next();
  });

  // Public Configuration Endpoint
  app.get('/api/config/public', (req, res) => {
    const db = getDb();
    const {
      upiId,
      upiName,
      minDeposit,
      maxDeposit,
      minWithdrawal,
      maxWithdrawal,
      announcementText,
      showAnnouncement,
      gameInstructionText,
      supportHandle,
      customQrUrl,
      maintenanceMode,
    } = db.settings;

    res.json({
      upiId,
      upiName,
      minDeposit,
      maxDeposit,
      minWithdrawal,
      maxWithdrawal,
      announcementText,
      showAnnouncement,
      gameInstructionText,
      supportHandle,
      customQrUrl,
      maintenanceMode,
    });
  });

  // Mount API routers
  app.use('/api/auth', authRouter);
  app.use('/api/game', gameRouter);
  app.use('/api/transactions', transactionRouter);
  app.use('/api/admin', adminRouter);

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  if (!isProduction) {
    // Development mode with Vite middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port: PORT,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production mode - serve compiled assets from dist
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.resolve(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Aviator Aero Server] Server listening on http://0.0.0.0:${PORT} (${isProduction ? 'production' : 'development'})`);
  });
}

startServer().catch((err) => {
  console.error('[Aviator Aero Server] Failed to start:', err);
  process.exit(1);
});
