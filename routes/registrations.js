const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { sendRegistrationConfirmation } = require('../utils/email');

// Get my registrations
router.get('/my', authenticateToken, (req, res) => {
  const db = req.app.locals.db;
  const data = db.prepare(`
    SELECT r.*, c.title as course_title, c.start_date, c.end_date, c.location, c.fee, c.type,
           p.status as payment_status_detail, p.transaction_id, p.paid_at
    FROM registrations r
    JOIN courses c ON r.course_id = c.id
    LEFT JOIN payments p ON p.registration_id = r.id AND p.status = 'paid'
    WHERE r.member_id = ?
    ORDER BY r.created_at DESC
  `).all(req.user.id);
  res.json({ data });
});

// Create registration
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { course_id } = req.body;
    const db = req.app.locals.db;

    const course = db.prepare('SELECT * FROM courses WHERE id = ? AND is_published = 1 AND status = "open"').get(course_id);
    if (!course) {
      return res.status(404).json({ error: '課程不存在或已關閉報名' });
    }

    if (course.max_seats && course.enrolled_count >= course.max_seats) {
      return res.status(400).json({ error: '此課程已額滿' });
    }

    const existing = db.prepare('SELECT id FROM registrations WHERE member_id = ? AND course_id = ?').get(req.user.id, course_id);
    if (existing) {
      return res.status(400).json({ error: '您已報名此課程' });
    }

    const result = db.prepare(
      'INSERT INTO registrations (member_id, course_id) VALUES (?, ?)'
    ).run(req.user.id, course_id);

    db.prepare('UPDATE courses SET enrolled_count = enrolled_count + 1 WHERE id = ?').run(course_id);

    const member = db.prepare('SELECT name, email FROM members WHERE id = ?').get(req.user.id);
    await sendRegistrationConfirmation(member.email, member.name, course.title);

    res.json({
      registration_id: result.lastInsertRowid,
      course: { title: course.title, fee: course.fee },
      message: '報名成功'
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: '報名失敗，請稍後再試' });
  }
});

// Cancel registration
router.put('/:id/cancel', authenticateToken, (req, res) => {
  const db = req.app.locals.db;
  const reg = db.prepare('SELECT * FROM registrations WHERE id = ? AND member_id = ?').get(req.params.id, req.user.id);

  if (!reg) {
    return res.status(404).json({ error: '找不到此報名紀錄' });
  }
  if (reg.payment_status === 'paid') {
    return res.status(400).json({ error: '已繳費的報名無法直接取消，請聯繫客服' });
  }

  db.prepare('UPDATE registrations SET status = "cancelled", updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(reg.id);
  db.prepare('UPDATE courses SET enrolled_count = MAX(0, enrolled_count - 1) WHERE id = ?').run(reg.course_id);

  res.json({ message: '已取消報名' });
});

module.exports = router;
