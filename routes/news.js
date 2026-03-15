const express = require('express');
const router = express.Router();

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
    where += ' AND (title LIKE ? OR content LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`);
  }

  const total = db.prepare(`SELECT COUNT(*) as count FROM news ${where}`).get(...params).count;
  const data = db.prepare(
    `SELECT id, title, category, summary, image_url, created_at FROM news ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`
  ).all(...params, parseInt(limit), offset);

  res.json({
    data,
    total,
    page: parseInt(page),
    totalPages: Math.ceil(total / parseInt(limit))
  });
});

router.get('/:id', (req, res) => {
  const db = req.app.locals.db;
  const item = db.prepare('SELECT * FROM news WHERE id = ? AND is_published = 1').get(req.params.id);
  if (!item) return res.status(404).json({ error: '找不到此消息' });
  res.json(item);
});

module.exports = router;
