const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(authenticateToken, requireAdmin);

// === Dashboard Stats ===
router.get('/stats', (req, res) => {
  const db = req.app.locals.db;
  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

  const totalMembers = db.prepare('SELECT COUNT(*) as c FROM members WHERE role = "member"').get().c;
  const newMembers = db.prepare('SELECT COUNT(*) as c FROM members WHERE role = "member" AND created_at >= ?').get(monthStart).c;
  const totalRegistrations = db.prepare('SELECT COUNT(*) as c FROM registrations').get().c;
  const monthRegistrations = db.prepare('SELECT COUNT(*) as c FROM registrations WHERE created_at >= ?').get(monthStart).c;
  const totalRevenue = db.prepare('SELECT COALESCE(SUM(amount), 0) as s FROM payments WHERE status = "paid"').get().s;
  const monthRevenue = db.prepare('SELECT COALESCE(SUM(amount), 0) as s FROM payments WHERE status = "paid" AND paid_at >= ?').get(monthStart).s;
  const unreadContacts = db.prepare('SELECT COUNT(*) as c FROM contacts WHERE is_read = 0').get().c;
  const pendingRegistrations = db.prepare('SELECT COUNT(*) as c FROM registrations WHERE status = "pending"').get().c;

  res.json({
    totalMembers, newMembers,
    totalRegistrations, monthRegistrations,
    totalRevenue, monthRevenue,
    unreadContacts, pendingRegistrations
  });
});

// === Dashboard Recent Activity ===
router.get('/dashboard', (req, res) => {
  try {
    const db = req.app.locals.db;

    // Recent registrations (last 5)
    const recentRegistrations = db.prepare(`
      SELECT r.id, r.status, r.payment_status, r.created_at,
             m.name as member_name, c.title as course_title
      FROM registrations r
      JOIN members m ON r.member_id = m.id
      JOIN courses c ON r.course_id = c.id
      ORDER BY r.created_at DESC LIMIT 5
    `).all();

    // Recent contacts (unread first, last 5)
    const recentContacts = db.prepare(`
      SELECT id, name, email, category, message, is_read, created_at
      FROM contacts ORDER BY is_read ASC, created_at DESC LIMIT 5
    `).all();

    // Upcoming courses (next 5)
    const upcomingCourses = db.prepare(`
      SELECT id, title, type, start_date, max_seats, enrolled_count
      FROM courses WHERE is_published = 1 AND start_date >= date('now')
      ORDER BY start_date ASC LIMIT 5
    `).all();

    // Member level distribution
    const levelDistribution = db.prepare(`
      SELECT cilt_level, COUNT(*) as count FROM members
      WHERE role = 'member' GROUP BY cilt_level ORDER BY cilt_level
    `).all();

    // Monthly registration trend (last 6 months)
    const monthlyTrend = db.prepare(`
      SELECT strftime('%Y-%m', created_at) as month, COUNT(*) as count
      FROM registrations
      WHERE created_at >= date('now', '-6 months')
      GROUP BY strftime('%Y-%m', created_at)
      ORDER BY month ASC
    `).all();

    res.json({ recentRegistrations, recentContacts, upcomingCourses, levelDistribution, monthlyTrend });
  } catch (err) {
    console.error('Dashboard error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// === Members Management ===
router.get('/members', (req, res) => {
  const db = req.app.locals.db;
  const { page = 1, limit = 20, keyword, role, status, cilt_level } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let where = 'WHERE 1=1';
  const params = [];

  if (keyword) {
    where += ' AND (name LIKE ? OR email LIKE ? OR company LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
  }
  if (role) { where += ' AND role = ?'; params.push(role); }
  if (status) { where += ' AND status = ?'; params.push(status); }
  if (cilt_level !== undefined && cilt_level !== '') { where += ' AND cilt_level = ?'; params.push(parseInt(cilt_level)); }

  const total = db.prepare(`SELECT COUNT(*) as c FROM members ${where}`).get(...params).c;
  const data = db.prepare(
    `SELECT id, email, name, phone, company, title, cilt_level, role, status, email_verified, created_at
     FROM members ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`
  ).all(...params, parseInt(limit), offset);

  res.json({ data, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
});

router.put('/members/:id', (req, res) => {
  const { name, phone, company, title, role, cilt_level, status } = req.body;
  const db = req.app.locals.db;

  db.prepare(
    `UPDATE members SET name = COALESCE(?, name), phone = COALESCE(?, phone),
     company = COALESCE(?, company), title = COALESCE(?, title),
     role = COALESCE(?, role), cilt_level = COALESCE(?, cilt_level),
     status = COALESCE(?, status), updated_at = CURRENT_TIMESTAMP WHERE id = ?`
  ).run(name, phone, company, title, role, cilt_level, status, req.params.id);

  const member = db.prepare('SELECT id, email, name, phone, company, title, cilt_level, role, status FROM members WHERE id = ?').get(req.params.id);
  res.json(member);
});

router.get('/members/export', (req, res) => {
  const db = req.app.locals.db;
  const members = db.prepare(
    'SELECT id, email, name, phone, company, title, cilt_level, role, status, created_at FROM members ORDER BY created_at DESC'
  ).all();

  let csv = 'ID,Email,姓名,電話,公司,職稱,CILT等級,角色,狀態,建立時間\n';
  members.forEach(m => {
    csv += `${m.id},"${m.email}","${m.name}","${m.phone || ''}","${m.company || ''}","${m.title || ''}",${m.cilt_level},${m.role},${m.status},"${m.created_at}"\n`;
  });

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename=members.csv');
  res.send('\uFEFF' + csv); // BOM for Excel
});

// === News Management ===
router.get('/news', (req, res) => {
  const db = req.app.locals.db;
  const { page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const total = db.prepare('SELECT COUNT(*) as c FROM news').get().c;
  const data = db.prepare('SELECT * FROM news ORDER BY created_at DESC LIMIT ? OFFSET ?').all(parseInt(limit), offset);
  res.json({ data, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
});

router.post('/news', (req, res) => {
  const { title, category, content, summary, image_url } = req.body;
  const db = req.app.locals.db;
  const result = db.prepare(
    'INSERT INTO news (title, category, content, summary, image_url, author_id) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(title, category, content, summary || null, image_url || null, req.user.id);
  const item = db.prepare('SELECT * FROM news WHERE id = ?').get(result.lastInsertRowid);
  res.json(item);
});

router.put('/news/:id', (req, res) => {
  const { title, category, content, summary, image_url, is_published } = req.body;
  const db = req.app.locals.db;
  db.prepare(
    `UPDATE news SET title = COALESCE(?, title), category = COALESCE(?, category),
     content = COALESCE(?, content), summary = COALESCE(?, summary),
     image_url = COALESCE(?, image_url), is_published = COALESCE(?, is_published),
     updated_at = CURRENT_TIMESTAMP WHERE id = ?`
  ).run(title, category, content, summary, image_url, is_published, req.params.id);
  const item = db.prepare('SELECT * FROM news WHERE id = ?').get(req.params.id);
  res.json(item);
});

router.delete('/news/:id', (req, res) => {
  const db = req.app.locals.db;
  db.prepare('UPDATE news SET is_published = 0 WHERE id = ?').run(req.params.id);
  res.json({ message: '已下架' });
});

// === Activities Management ===
router.get('/activities', (req, res) => {
  const db = req.app.locals.db;
  const { page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const total = db.prepare('SELECT COUNT(*) as c FROM activities').get().c;
  const data = db.prepare('SELECT * FROM activities ORDER BY created_at DESC LIMIT ? OFFSET ?').all(parseInt(limit), offset);
  res.json({ data, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
});

router.post('/activities', (req, res) => {
  const { title, category, description, content, image_url, event_date, event_end_date, location } = req.body;
  const db = req.app.locals.db;
  const result = db.prepare(
    'INSERT INTO activities (title, category, description, content, image_url, event_date, event_end_date, location) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(title, category, description, content || null, image_url || null, event_date || null, event_end_date || null, location || null);
  const item = db.prepare('SELECT * FROM activities WHERE id = ?').get(result.lastInsertRowid);
  res.json(item);
});

router.put('/activities/:id', (req, res) => {
  const { title, category, description, content, image_url, event_date, event_end_date, location, is_published } = req.body;
  const db = req.app.locals.db;
  db.prepare(
    `UPDATE activities SET title = COALESCE(?, title), category = COALESCE(?, category),
     description = COALESCE(?, description), content = COALESCE(?, content),
     image_url = COALESCE(?, image_url), event_date = COALESCE(?, event_date),
     event_end_date = COALESCE(?, event_end_date), location = COALESCE(?, location),
     is_published = COALESCE(?, is_published), updated_at = CURRENT_TIMESTAMP WHERE id = ?`
  ).run(title, category, description, content, image_url, event_date, event_end_date, location, is_published, req.params.id);
  const item = db.prepare('SELECT * FROM activities WHERE id = ?').get(req.params.id);
  res.json(item);
});

router.delete('/activities/:id', (req, res) => {
  const db = req.app.locals.db;
  db.prepare('UPDATE activities SET is_published = 0 WHERE id = ?').run(req.params.id);
  res.json({ message: '已下架' });
});

// === Downloads Management ===
router.post('/downloads', upload.single('file'), (req, res) => {
  const { title, category, description, members_only } = req.body;
  const db = req.app.locals.db;

  if (!req.file) {
    return res.status(400).json({ error: '請上傳檔案' });
  }

  const result = db.prepare(
    'INSERT INTO downloads (title, category, description, file_path, file_name, file_size, members_only) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(title, category, description || null, `/uploads/${req.file.filename}`, req.file.originalname, req.file.size, members_only ? 1 : 0);
  const item = db.prepare('SELECT * FROM downloads WHERE id = ?').get(result.lastInsertRowid);
  res.json(item);
});

router.delete('/downloads/:id', (req, res) => {
  const db = req.app.locals.db;
  db.prepare('UPDATE downloads SET is_published = 0 WHERE id = ?').run(req.params.id);
  res.json({ message: '已下架' });
});

// === Columns Management ===
router.post('/columns', (req, res) => {
  const { author_name, author_title, author_company, cilt_level, year, content, summary, category } = req.body;
  const db = req.app.locals.db;
  const result = db.prepare(
    'INSERT INTO columns_articles (author_name, author_title, author_company, cilt_level, year, content, summary, category) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(author_name, author_title, author_company, cilt_level, year, content, summary || null, category || 'enterprise');
  const item = db.prepare('SELECT * FROM columns_articles WHERE id = ?').get(result.lastInsertRowid);
  res.json(item);
});

router.delete('/columns/:id', (req, res) => {
  const db = req.app.locals.db;
  db.prepare('UPDATE columns_articles SET is_published = 0 WHERE id = ?').run(req.params.id);
  res.json({ message: '已下架' });
});

// === Registrations Management ===
router.get('/registrations', (req, res) => {
  const db = req.app.locals.db;
  const { page = 1, limit = 20, status, payment_status, course_id } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let where = 'WHERE 1=1';
  const params = [];
  if (status) { where += ' AND r.status = ?'; params.push(status); }
  if (payment_status) { where += ' AND r.payment_status = ?'; params.push(payment_status); }
  if (course_id) { where += ' AND r.course_id = ?'; params.push(course_id); }

  const total = db.prepare(`SELECT COUNT(*) as c FROM registrations r ${where}`).get(...params).c;
  const data = db.prepare(`
    SELECT r.*, m.name as member_name, m.email as member_email, c.title as course_title, c.fee
    FROM registrations r
    JOIN members m ON r.member_id = m.id
    JOIN courses c ON r.course_id = c.id
    ${where} ORDER BY r.created_at DESC LIMIT ? OFFSET ?
  `).all(...params, parseInt(limit), offset);

  res.json({ data, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
});

router.put('/registrations/:id', (req, res) => {
  const { status, payment_status } = req.body;
  const db = req.app.locals.db;
  if (status) db.prepare('UPDATE registrations SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, req.params.id);
  if (payment_status) db.prepare('UPDATE registrations SET payment_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(payment_status, req.params.id);
  const item = db.prepare('SELECT * FROM registrations WHERE id = ?').get(req.params.id);
  res.json(item);
});

// === Payments Management ===
router.get('/payments', (req, res) => {
  const db = req.app.locals.db;
  const { page = 1, limit = 20, status, start_date, end_date } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let where = 'WHERE 1=1';
  const params = [];
  if (status) { where += ' AND p.status = ?'; params.push(status); }
  if (start_date) { where += ' AND p.created_at >= ?'; params.push(start_date); }
  if (end_date) { where += ' AND p.created_at <= ?'; params.push(end_date); }

  const total = db.prepare(`SELECT COUNT(*) as c FROM payments p ${where}`).get(...params).c;
  const summary = db.prepare(`SELECT COALESCE(SUM(amount), 0) as total_amount, COUNT(*) as paid_count FROM payments p ${where} AND p.status = 'paid'`).get(...params);
  const data = db.prepare(`
    SELECT p.*, m.name as member_name, m.email as member_email, c.title as course_title
    FROM payments p
    JOIN members m ON p.member_id = m.id
    LEFT JOIN registrations r ON p.registration_id = r.id
    LEFT JOIN courses c ON r.course_id = c.id
    ${where} ORDER BY p.created_at DESC LIMIT ? OFFSET ?
  `).all(...params, parseInt(limit), offset);

  res.json({ data, total, summary, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
});

// === Contacts Management ===
router.get('/contacts', (req, res) => {
  const db = req.app.locals.db;
  const { page = 1, limit = 20, is_read, category } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let where = 'WHERE 1=1';
  const params = [];
  if (is_read !== undefined) { where += ' AND is_read = ?'; params.push(parseInt(is_read)); }
  if (category) { where += ' AND category = ?'; params.push(category); }

  const total = db.prepare(`SELECT COUNT(*) as c FROM contacts ${where}`).get(...params).c;
  const data = db.prepare(`SELECT * FROM contacts ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...params, parseInt(limit), offset);
  res.json({ data, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
});

router.put('/contacts/:id/read', (req, res) => {
  const db = req.app.locals.db;
  db.prepare('UPDATE contacts SET is_read = 1 WHERE id = ?').run(req.params.id);
  res.json({ message: '已標記為已讀' });
});

// === Courses Management ===
router.get('/courses', (req, res) => {
  const db = req.app.locals.db;
  const { page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const total = db.prepare('SELECT COUNT(*) as c FROM courses').get().c;
  const data = db.prepare('SELECT * FROM courses ORDER BY created_at DESC LIMIT ? OFFSET ?').all(parseInt(limit), offset);
  res.json({ data, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
});

router.post('/courses', (req, res) => {
  const { title, type, description, content, start_date, end_date, location, fee, max_seats, cert_level_id } = req.body;
  const db = req.app.locals.db;
  const result = db.prepare(
    'INSERT INTO courses (title, type, description, content, start_date, end_date, location, fee, max_seats, cert_level_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(title, type, description, content || null, start_date, end_date || null, location || null, fee || 0, max_seats || null, cert_level_id || null);
  const item = db.prepare('SELECT * FROM courses WHERE id = ?').get(result.lastInsertRowid);
  res.json(item);
});

router.put('/courses/:id', (req, res) => {
  const { title, type, description, content, start_date, end_date, location, fee, max_seats, status, is_published } = req.body;
  const db = req.app.locals.db;
  db.prepare(
    `UPDATE courses SET title = COALESCE(?, title), type = COALESCE(?, type),
     description = COALESCE(?, description), content = COALESCE(?, content),
     start_date = COALESCE(?, start_date), end_date = COALESCE(?, end_date),
     location = COALESCE(?, location), fee = COALESCE(?, fee),
     max_seats = COALESCE(?, max_seats), status = COALESCE(?, status),
     is_published = COALESCE(?, is_published), updated_at = CURRENT_TIMESTAMP WHERE id = ?`
  ).run(title, type, description, content, start_date, end_date, location, fee, max_seats, status, is_published, req.params.id);
  const item = db.prepare('SELECT * FROM courses WHERE id = ?').get(req.params.id);
  res.json(item);
});

// === File Upload ===
router.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: '請上傳檔案' });
  res.json({ url: `/uploads/${req.file.filename}`, filename: req.file.originalname, size: req.file.size });
});

module.exports = router;
