const express = require('express');
const router = express.Router();
const { optionalAuth } = require('../middleware/auth');

router.get('/', (req, res) => {
  const db = req.app.locals.db;
  const { page = 1, limit = 10, category, keyword } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let where = 'WHERE is_published = 1';
  const params = [];

  if (category) {
    where += ' AND category = ?';
    params.push(category);
  }
  if (keyword) {
    where += ' AND (title LIKE ? OR description LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`);
  }

  const total = db.prepare(`SELECT COUNT(*) as count FROM downloads ${where}`).get(...params).count;
  const data = db.prepare(
    `SELECT id, title, category, description, file_name, file_size, download_count, members_only, created_at
     FROM downloads ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`
  ).all(...params, parseInt(limit), offset);

  // Get distinct categories
  const categories = db.prepare('SELECT DISTINCT category FROM downloads WHERE is_published = 1 ORDER BY category').all();

  res.json({
    data,
    categories: categories.map(c => c.category),
    total,
    page: parseInt(page),
    totalPages: Math.ceil(total / parseInt(limit))
  });
});

router.get('/:id/file', optionalAuth, (req, res) => {
  const db = req.app.locals.db;
  const item = db.prepare('SELECT * FROM downloads WHERE id = ? AND is_published = 1').get(req.params.id);

  if (!item) return res.status(404).json({ error: '找不到此檔案' });

  if (item.members_only && !req.user) {
    return res.status(401).json({ error: '此檔案僅限會員下載，請先登入' });
  }

  db.prepare('UPDATE downloads SET download_count = download_count + 1 WHERE id = ?').run(item.id);

  // In production, serve the actual file
  // For now, return a message since we don't have actual files
  res.json({ message: '檔案下載功能（實際部署時提供檔案）', file_name: item.file_name });
});

module.exports = router;
