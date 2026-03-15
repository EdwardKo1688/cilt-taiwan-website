const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  const db = req.app.locals.db;
  const data = db.prepare('SELECT * FROM cert_levels ORDER BY level_number').all();
  // Parse JSON fields
  const parsed = data.map(item => ({
    ...item,
    requirements: JSON.parse(item.requirements || '[]'),
    subjects: JSON.parse(item.subjects || '[]')
  }));
  res.json(parsed);
});

router.get('/:level', (req, res) => {
  const db = req.app.locals.db;
  const item = db.prepare('SELECT * FROM cert_levels WHERE level_number = ?').get(req.params.level);
  if (!item) return res.status(404).json({ error: '找不到此認證等級' });
  item.requirements = JSON.parse(item.requirements || '[]');
  item.subjects = JSON.parse(item.subjects || '[]');
  res.json(item);
});

module.exports = router;
