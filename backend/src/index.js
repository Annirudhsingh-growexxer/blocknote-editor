require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');


const authRouter = require('./routes/auth');
const { documentsRouter, shareRouter } = require('./routes/document');
const blocksRouter = require('./routes/block');

const app = express();

// Allow multiple local dev origins and any origins provided via FRONTEND_URL (comma-separated).
const defaultLocalOrigins = ['http://localhost:5173', 'http://localhost:5174'];
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
