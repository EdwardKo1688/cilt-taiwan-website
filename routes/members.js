const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

// Update profile
router.put('/profile', authenticateToken, (req, res) => {
  const { name, phone, company, title } = req.body;
  const db = req.app.locals.db;

  if (!name) {
    return res.status(400).json({ error: '姓名為必填' });
  }

  db.prepare(
    'UPDATE members SET name = ?, phone = ?, company = ?, title = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
  ).run(name, phone || null, company || null, title || null, req.user.id);

  const member = db.prepare(
    'SELECT id, email, name, phone, company, title, cilt_level, role, avatar_url, created_at FROM members WHERE id = ?'
  ).get(req.user.id);

  res.json(member);
});

// Get my certification info
router.get('/my-certs', authenticateToken, (req, res) => {
  const db = req.app.locals.db;
  const member = db.prepare('SELECT cilt_level FROM members WHERE id = ?').get(req.user.id);
  const certLevels = db.prepare('SELECT * FROM cert_levels ORDER BY level_number').all();

  const parsed = certLevels.map(item => ({
    ...item,
    requirements: JSON.parse(item.requirements || '[]'),
    subjects: JSON.parse(item.subjects || '[]'),
    achieved: item.level_number <= member.cilt_level
  }));

  res.json({
    current_level: member.cilt_level,
    levels: parsed
  });
});

module.exports = router;
