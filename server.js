require('dotenv').config();

const express = require('express');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const expressLayouts = require('express-ejs-layouts');
const path = require('path');

const { initDatabase } = require('./config/database');
const { requireAuth } = require('./middleware/auth');

// Routes
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const etudeRoutes = require('./routes/etude');
const checklistRoutes = require('./routes/checklist');
const assistantRoutes = require('./routes/assistant');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialiser la base de données
initDatabase();

// Sécurité avec Helmet (configuration adaptée pour EJS)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      imgSrc: ["'self'", "data:", "blob:"],
    },
  },
}));

// Rate limiting pour le login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 tentatives
  message: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Configuration EJS avec layouts
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layout');

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Sessions
app.use(session({
  store: new SQLiteStore({
    db: 'sessions.sqlite',
    dir: path.join(__dirname, 'data'),
  }),
  secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 heures par défaut
    sameSite: 'strict',
  },
}));

// Variables globales pour les templates
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.currentPath = req.path;
  next();
});

// Routes publiques
app.use('/login', loginLimiter);
app.use('/', authRoutes);

// Routes protégées
app.use('/dashboard', requireAuth, dashboardRoutes);
app.use('/etude', requireAuth, etudeRoutes);
app.use('/checklist', requireAuth, checklistRoutes);
app.use('/assistant', requireAuth, assistantRoutes);
app.use('/api', requireAuth);

// API routes
app.use('/api/checklist', requireAuth, require('./routes/api/checklist'));
app.use('/api/assistant', requireAuth, require('./routes/api/assistant'));
app.use('/api/search', requireAuth, require('./routes/api/search'));

// Redirection racine
app.get('/', (req, res) => {
  if (req.session.user) {
    res.redirect('/dashboard');
  } else {
    res.redirect('/login');
  }
});

// 404
app.use((req, res) => {
  res.status(404).render('error', {
    title: 'Page non trouvée',
    message: 'La page que vous recherchez n\'existe pas.',
    layout: false,
  });
});

// Gestion des erreurs
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', {
    title: 'Erreur serveur',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Une erreur est survenue.',
    layout: false,
  });
});

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   ISFEC B2B Pilot - Serveur démarré                      ║
║                                                           ║
║   URL: http://localhost:${PORT}                            ║
║   Environnement: ${process.env.NODE_ENV || 'development'}                        ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

module.exports = app;
