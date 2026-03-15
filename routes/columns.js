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
    where += ' AND (author_name LIKE ? OR author_company LIKE ? OR content LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
  }

  const total = db.prepare(`SELECT COUNT(*) as count FROM columns_articles ${where}`).get(...params).count;
  const data = db.prepare(
    `SELECT id, author_name, author_title, author_company, cilt_level, year, summary, category, image_url, created_at
     FROM columns_articles ${where} ORDER BY year DESC, created_at DESC LIMIT ? OFFSET ?`
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
  const item = db.prepare('SELECT * FROM columns_articles WHERE id = ? AND is_published = 1').get(req.params.id);
  if (!item) return res.status(404).json({ error: '找不到此文章' });
  res.json(item);
});

module.exports = router;
