require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const Database = require('./db/sqlite-wrapper');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

async function startServer() {
  // Database - use /data for Render persistent disk, fallback to local
  const dbPath = process.env.DB_PATH || path.join(__dirname, 'db', 'database.sqlite');
  const db = new Database(dbPath);
  await db.init();
  db.pragma('foreign_keys = ON');

  // Initialize database
  const schema = fs.readFileSync(path.join(__dirname, 'db', 'schema.sql'), 'utf8');
  // Execute schema statements one by one (sql.js doesn't support multi-statement exec well)
  const statements = schema.split(';').filter(s => s.trim());
  for (const stmt of statements) {
    try { db.exec(stmt + ';'); } catch (e) { /* table already exists, ignore */ }
  }

  // Seed if empty
  const memberCount = db.prepare('SELECT COUNT(*) as count FROM members').get();
  if (memberCount.count === 0) {
    const seed = fs.readFileSync(path.join(__dirname, 'db', 'seed.sql'), 'utf8');
    const seedStatements = seed.split(';').filter(s => s.trim());
    for (const stmt of seedStatements) {
      try { db.exec(stmt + ';'); } catch (e) { console.error('Seed error:', e.message); }
    }
    console.log('Database seeded with initial data');
  }

  // Make db available to routes
  app.locals.db = db;

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Rate limiting
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: { error: '請求過於頻繁，請稍後再試' }
  });

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: '登入嘗試過於頻繁，請稍後再試' }
  });

  app.use('/api/', apiLimiter);
  app.use('/api/auth/login', authLimiter);
  app.use('/api/auth/register', authLimiter);

  // Static files
  app.use(express.static(path.join(__dirname, 'public')));
  app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

  // API Routes
  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/news', require('./routes/news'));
  app.use('/api/activities', require('./routes/activities'));
  app.use('/api/certifications', require('./routes/certifications'));
  app.use('/api/courses', require('./routes/courses'));
  app.use('/api/registrations', require('./routes/registrations'));
  app.use('/api/exams', require('./routes/exams'));
  app.use('/api/downloads', require('./routes/downloads'));
  app.use('/api/columns', require('./routes/columns'));
  app.use('/api/contact', require('./routes/contact'));
  app.use('/api/payments', require('./routes/payments'));
  app.use('/api/admin', require('./routes/admin'));
  app.use('/api/members', require('./routes/members'));

  // SPA fallback - serve index.html for non-API, non-file routes
  app.get('*', (req, res) => {
    const filePath = path.join(__dirname, 'public', req.path);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      return res.sendFile(filePath);
    }
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });

  // Error handler
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: '伺服器內部錯誤' });
  });

  app.listen(PORT, () => {
    console.log(`CILT Taiwan website running at http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
