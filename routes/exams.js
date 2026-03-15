const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  const db = req.app.locals.db;
  const data = db.prepare(`
    SELECT e.*, cl.level_number, cl.name_zh, cl.name_en, cl.exam_format
    FROM exams e
    JOIN cert_levels cl ON e.cert_level_id = cl.id
    ORDER BY e.exam_date ASC
  `).all();

  const parsed = data.map(item => ({
    ...item,
    subjects: JSON.parse(item.subjects || '[]')
  }));
  res.json({ data: parsed });
});

router.get('/:id', (req, res) => {
  const db = req.app.locals.db;
  const item = db.prepare(`
    SELECT e.*, cl.level_number, cl.name_zh, cl.name_en, cl.exam_format
    FROM exams e
    JOIN cert_levels cl ON e.cert_level_id = cl.id
    WHERE e.id = ?
  `).get(req.params.id);
  if (!item) return res.status(404).json({ error: '找不到此考試' });
  item.subjects = JSON.parse(item.subjects || '[]');
  res.json(item);
});

module.exports = router;
