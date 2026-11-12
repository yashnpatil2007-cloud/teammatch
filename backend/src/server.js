const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const { initStore, storeMode } = require('./data/store');

dotenv.config();

if (process.env.NODE_ENV === 'production') {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.includes('change_in_prod')) {
    console.warn('⚠️  SECURITY WARNING: Using default or placeholder JWT_SECRET in production. Set a random secret in production environment!');
  }
}

const app = express();

app.set('trust proxy', 1);

const defaultDevOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'];
const configuredOrigins = (process.env.FRONTEND_URL || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const allowedOrigins = configuredOrigins.length > 0
  ? configuredOrigins
  : (process.env.NODE_ENV === 'production' ? ['https://teammatch-app.netlify.app', 'https://teammatch.netlify.app'] : defaultDevOrigins);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      const isAllowed = allowedOrigins.includes(origin) || (process.env.NODE_ENV !== 'production' && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin));
      if (isAllowed) return callback(null, true);
      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
  })
);
app.use(['/uploads/certificates', '/uploads/resumes'], (req, res) => {
  return res.status(401).json({ message: 'Authentication required to access private documents' });
});
app.use('/uploads', express.static(require('path').join(__dirname, '../uploads')));
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
app.use('/api/assessments', require('./routes/assessment'));
app.use('/api/stats', require('./routes/stats'));
app.use('/api/submissions', require('./routes/submission'));
app.use('/api/notifications', require('./routes/notification'));
app.use('/api/dev', require('./routes/dev'));

app.get('/api/health', (req, res) => {
  const mongoError = connectDB.state && connectDB.state.error;
  const isProd = process.env.NODE_ENV === 'production';
  const mode = storeMode();
  const storageProv = require('./services/storageService').storageService;

  const isDegraded = isProd && (mode !== 'mongo' || !storageProv.isPersistent());

  res.json({
    status: isDegraded ? 'degraded' : 'ok',
    time: new Date().toISOString(),
    service: 'TeamMatch API v1',
    environment: process.env.NODE_ENV || 'development',
    datastore: mode,
    mongoConnected: require('mongoose').connection.readyState === 1,
    storage: {
      provider: storageProv.getProviderName(),
      persistent: storageProv.isPersistent(),
    },
    ...(mode === 'file' && isProd
      ? { productionWarning: 'Running in file fallback mode in production. MongoDB Atlas required for persistent container restarts.' }
      : {}),
    ...(mode === 'file' && mongoError
      ? { datastoreError: mongoError.replace(/\/\/[^@]*@/g, '//***@') }
      : {}),
  });
});
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
