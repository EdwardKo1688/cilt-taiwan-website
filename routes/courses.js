const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  const db = req.app.locals.db;
  const { page = 1, limit = 10, type, keyword, start_date, end_date } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let where = 'WHERE c.is_published = 1';
  const params = [];

  if (type) {
    where += ' AND c.type = ?';
    params.push(type);
  }
  if (keyword) {
    where += ' AND (c.title LIKE ? OR c.description LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`);
  }
  if (start_date) {
    where += ' AND c.start_date >= ?';
    params.push(start_date);
  }
  if (end_date) {
    where += ' AND c.start_date <= ?';
    params.push(end_date);
  }

  const total = db.prepare(`SELECT COUNT(*) as count FROM courses c ${where}`).get(...params).count;
  const data = db.prepare(`
    SELECT c.*, cl.name_zh as cert_level_name
    FROM courses c
    LEFT JOIN cert_levels cl ON c.cert_level_id = cl.id
    ${where}
    ORDER BY c.start_date ASC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(limit), offset);

  res.json({
    data,
    total,
    page: parseInt(page),
    totalPages: Math.ceil(total / parseInt(limit))
  });
});

router.get('/:id', (req, res) => {
  const db = req.app.locals.db;
  const item = db.prepare(`
    SELECT c.*, cl.name_zh as cert_level_name, cl.name_en as cert_level_name_en
    FROM courses c
    LEFT JOIN cert_levels cl ON c.cert_level_id = cl.id
    WHERE c.id = ? AND c.is_published = 1
  `).get(req.params.id);
  if (!item) return res.status(404).json({ error: '找不到此課程' });
  res.json(item);
});

module.exports = router;
