const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { authenticateToken } = require('../middleware/auth');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/email');

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, phone, company, title } = req.body;
    const db = req.app.locals.db;

    if (!email || !password || !name) {
      return res.status(400).json({ error: '請填寫必填欄位（Email、密碼、姓名）' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: '密碼至少需要8個字元' });
    }

    const existing = db.prepare('SELECT id FROM members WHERE email = ?').get(email);
    if (existing) {
      return res.status(400).json({ error: '此Email已被註冊' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const result = db.prepare(
      'INSERT INTO members (email, password_hash, name, phone, company, title) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(email, passwordHash, name, phone || null, company || null, title || null);

    // Create verification token
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    db.prepare(
      'INSERT INTO email_verifications (member_id, token, expires_at) VALUES (?, ?, ?)'
    ).run(result.lastInsertRowid, token, expiresAt);

    await sendVerificationEmail(email, name, token);

    res.json({ message: '註冊成功，請至信箱驗證Email' });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: '註冊失敗，請稍後再試' });
  }
});

// Verify email
router.get('/verify-email', (req, res) => {
  const { token } = req.query;
  const db = req.app.locals.db;

  const verification = db.prepare(
    'SELECT * FROM email_verifications WHERE token = ? AND used = 0 AND expires_at > datetime("now")'
  ).get(token);

  if (!verification) {
    return res.redirect('/login.html?error=invalid_token');
  }

  db.prepare('UPDATE members SET email_verified = 1 WHERE id = ?').run(verification.member_id);
  db.prepare('UPDATE email_verifications SET used = 1 WHERE id = ?').run(verification.id);

  res.redirect('/login.html?verified=1');
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const db = req.app.locals.db;

    if (!email || !password) {
      return res.status(400).json({ error: '請輸入Email和密碼' });
    }

    const member = db.prepare('SELECT * FROM members WHERE email = ?').get(email);
    if (!member) {
      return res.status(401).json({ error: 'Email或密碼錯誤' });
    }

    if (member.status === 'inactive') {
      return res.status(401).json({ error: '此帳號已被停用' });
    }

    const valid = await bcrypt.compare(password, member.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Email或密碼錯誤' });
    }

    if (!member.email_verified) {
      return res.status(401).json({ error: '請先至信箱驗證Email' });
    }

    const token = jwt.sign(
      { id: member.id, email: member.email, name: member.name, role: member.role, cilt_level: member.cilt_level },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      token,
      member: {
        id: member.id,
        email: member.email,
        name: member.name,
        phone: member.phone,
        company: member.company,
        title: member.title,
        cilt_level: member.cilt_level,
        role: member.role
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: '登入失敗，請稍後再試' });
  }
});

// Get current user
router.get('/me', authenticateToken, (req, res) => {
  const db = req.app.locals.db;
  const member = db.prepare(
    'SELECT id, email, name, phone, company, title, cilt_level, role, avatar_url, created_at FROM members WHERE id = ?'
  ).get(req.user.id);

  if (!member) {
    return res.status(404).json({ error: '找不到使用者' });
  }
  res.json(member);
});

// Forgot password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const db = req.app.locals.db;

    const member = db.prepare('SELECT id, name, email FROM members WHERE email = ?').get(email);
    if (!member) {
      // Don't reveal whether email exists
      return res.json({ message: '如果此Email已註冊，重設連結已寄出' });
    }

    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    db.prepare(
      'INSERT INTO password_resets (member_id, token, expires_at) VALUES (?, ?, ?)'
    ).run(member.id, token, expiresAt);

    await sendPasswordResetEmail(member.email, member.name, token);
    res.json({ message: '如果此Email已註冊，重設連結已寄出' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: '操作失敗，請稍後再試' });
  }
});

// Reset password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    const db = req.app.locals.db;

    if (!password || password.length < 8) {
      return res.status(400).json({ error: '密碼至少需要8個字元' });
    }

    const reset = db.prepare(
      'SELECT * FROM password_resets WHERE token = ? AND used = 0 AND expires_at > datetime("now")'
    ).get(token);

    if (!reset) {
      return res.status(400).json({ error: '重設連結無效或已過期' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    db.prepare('UPDATE members SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(passwordHash, reset.member_id);
    db.prepare('UPDATE password_resets SET used = 1 WHERE id = ?').run(reset.id);

    res.json({ message: '密碼已重設，請重新登入' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: '操作失敗，請稍後再試' });
  }
});

// Change password
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    const db = req.app.locals.db;

    if (!new_password || new_password.length < 8) {
      return res.status(400).json({ error: '新密碼至少需要8個字元' });
    }

    const member = db.prepare('SELECT password_hash FROM members WHERE id = ?').get(req.user.id);
    const valid = await bcrypt.compare(current_password, member.password_hash);
    if (!valid) {
      return res.status(400).json({ error: '目前密碼錯誤' });
    }

    const passwordHash = await bcrypt.hash(new_password, 12);
    db.prepare('UPDATE members SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(passwordHash, req.user.id);

    res.json({ message: '密碼已更新' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: '操作失敗，請稍後再試' });
  }
});

module.exports = router;
