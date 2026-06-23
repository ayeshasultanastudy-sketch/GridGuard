// server.js
// Main entry point. Starts Express, connects to MySQL, mounts all routes.

require('dotenv').config();

const express  = require('express');
const cors     = require('cors');
const path     = require('path');
const { initDB } = require('./db');

const { router: authRouter } = require('./routes/auth');
const scenariosRouter        = require('./routes/scenarios');
const billRouter             = require('./routes/bill');

const app  = express();

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({ origin: '*', methods: ['GET','POST','DELETE','OPTIONS'], allowedHeaders: ['Content-Type','Authorization'] }));
app.use(express.json());

// Serve the frontend from the /frontend folder
app.use(express.static(path.join(__dirname, '../frontend')));

// ── API routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',      authRouter);
app.use('/api/scenarios', scenariosRouter);
app.use('/api/bill',      billRouter);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'GridGuard API is running' });
});

// ── Catch-all: serve index.html for any non-API path ──────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// ── Start (Vercel Serverless Optimization) ────────────────────────────────────
// Run the database initialization immediately for serverless execution
initDB().catch(err => console.error("Database initialization failed:", err));

// Export the app instance for Vercel instead of calling app.listen()
module.exports = app;
