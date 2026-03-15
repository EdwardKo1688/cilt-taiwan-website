const express = require('express');
const router = express.Router();
const { sendContactNotification } = require('../utils/email');

router.post('/', async (req, res) => {
  try {
    const { name, email, phone, company, category, message } = req.body;
    const db = req.app.locals.db;

    if (!name || !email || !category || !message) {
      return res.status(400).json({ error: '請填寫必填欄位' });
    }
    if (message.length > 500) {
      return res.status(400).json({ error: '留言內容不可超過500字' });
    }

    db.prepare(
      'INSERT INTO contacts (name, email, phone, company, category, message) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(name, email, phone || null, company || null, category, message);

    await sendContactNotification({ name, email, phone, company, category, message });

    res.json({ success: true, message: '已收到您的訊息，我們將盡快回覆' });
  } catch (err) {
    console.error('Contact error:', err);
    res.status(500).json({ error: '提交失敗，請稍後再試' });
  }
});

module.exports = router;
