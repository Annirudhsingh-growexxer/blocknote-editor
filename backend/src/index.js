require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');


const authRouter = require('./routes/auth');
const { documentsRouter, shareRouter } = require('./routes/document');
const blocksRouter = require('./routes/block');

// Fail fast if JWT_SECRET is missing or obviously too weak — otherwise the
// server boots successfully and every auth request 500s at runtime instead.
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error(
    'FATAL: JWT_SECRET is missing or shorter than 32 characters. ' +
    'Set a strong secret (see .env.example) before starting the server.'
  );
  process.exit(1);
}

const app = express();

// `trust proxy: true` accepts every X-Forwarded-For hop, which lets a caller
// spoof their IP and bypass express-rate-limit. Default to trusting a single
// proxy; allow operators to override via the TRUST_PROXY env var (e.g. "2"
// for two hops, or a CIDR like "loopback, 10.0.0.0/8").
const trustProxyRaw = process.env.TRUST_PROXY;
let trustProxy = 1;
if (trustProxyRaw !== undefined) {
  const asNumber = Number(trustProxyRaw);
  trustProxy = Number.isFinite(asNumber) ? asNumber : trustProxyRaw;
}
app.set('trust proxy', trustProxy);

// Allow multiple local dev origins and any origins provided via FRONTEND_URL (comma-separated).
const defaultLocalOrigins = ['http://localhost:5173', 'http://localhost:5174','https://blocknote-editor-peach.vercel.app'];
const envOrigins = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',').map(s => s.trim()) : [];
const allowedOrigins = [...new Set([...envOrigins, ...defaultLocalOrigins])];

const corsOptions = {
  origin: function (origin, callback) {
    // allow requests with no origin (e.g., server-to-server, curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) return callback(null, true);
    return callback(new Error('CORS policy: Origin not allowed'));
  },
  credentials: true, // Need to allow cookies for refresh tokens
};

app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 requests per `window` (here, per 15 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: { error: 'Too many requests, please try again after 15 minutes' }
});

app.use('/api/auth', authLimiter, authRouter);

app.use('/api/documents', documentsRouter);
app.use('/api/share', shareRouter);
app.use('/api/blocks', blocksRouter);

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
