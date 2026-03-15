const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  const db = req.app.locals.db;
  const { page = 1, limit = 9, category, keyword, start_date, end_date } = req.query;
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
  if (start_date) {
    where += ' AND event_date >= ?';
    params.push(start_date);
  }
  if (end_date) {
    where += ' AND event_date <= ?';
    params.push(end_date);
  }

  const total = db.prepare(`SELECT COUNT(*) as count FROM activities ${where}`).get(...params).count;
  const data = db.prepare(
    `SELECT id, title, category, description, image_url, event_date, location FROM activities ${where} ORDER BY event_date DESC LIMIT ? OFFSET ?`
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
  const item = db.prepare('SELECT * FROM activities WHERE id = ? AND is_published = 1').get(req.params.id);
  if (!item) return res.status(404).json({ error: '找不到此活動' });
  res.json(item);
});

module.exports = router;
