const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const { initStore, storeMode } = require('./data/store');

dotenv.config();

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',').map((s) => s.trim()) : '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later' },
});

app.use('/api/auth', authLimiter, require('./routes/auth'));
app.use('/api/problems', require('./routes/problem'));
app.use('/api/teams', require('./routes/team'));
app.use('/api/users', require('./routes/user'));
app.use('/api/reviews', require('./routes/review'));
app.use('/api/quizzes', require('./routes/quiz'));
app.use('/api/stats', require('./routes/stats'));
app.use('/api/dev', require('./routes/dev'));

app.get('/api/health', (req, res) =>
  res.json({ status: 'ok', time: new Date().toISOString(), service: 'TeamMatch API v1', datastore: storeMode() })
);
app.get('/', (req, res) => res.json({ message: 'TeamMatch API — AI Powered Team Formation', health: '/api/health' }));

app.use((req, res) => res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` }));

app.use((err, req, res, _next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ message: err.message || 'Server Error' });
});

const PORT = process.env.PORT || 5000;

(async () => {
  await connectDB();
  await initStore();
  app.listen(PORT, () => console.log(`🚀 TeamMatch API running on http://localhost:${PORT}`));
})();
