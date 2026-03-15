const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { createPaymentForm, verifyCallback, generateTradeNo } = require('../utils/ecpay');

// Create payment
router.post('/create', authenticateToken, (req, res) => {
  try {
    const { registration_id } = req.body;
    const db = req.app.locals.db;

    const reg = db.prepare(`
      SELECT r.*, c.title, c.fee
      FROM registrations r
      JOIN courses c ON r.course_id = c.id
      WHERE r.id = ? AND r.member_id = ?
    `).get(registration_id, req.user.id);

    if (!reg) {
      return res.status(404).json({ error: '找不到此報名紀錄' });
    }
    if (reg.payment_status === 'paid') {
      return res.status(400).json({ error: '此報名已完成繳費' });
    }
    if (reg.status === 'cancelled') {
      return res.status(400).json({ error: '此報名已取消' });
    }

    const transactionId = generateTradeNo();

    // Create payment record
    db.prepare(
      'INSERT INTO payments (member_id, registration_id, amount, transaction_id) VALUES (?, ?, ?, ?)'
    ).run(req.user.id, registration_id, reg.fee, transactionId);

    const { formHtml, tradeNo } = createPaymentForm({
      amount: reg.fee,
      itemName: reg.title,
      registrationId: registration_id,
      memberId: req.user.id
    });

    // Update payment with ECPay trade no
    db.prepare('UPDATE payments SET ecpay_trade_no = ? WHERE transaction_id = ?').run(tradeNo, transactionId);

    res.json({ formHtml });
  } catch (err) {
    console.error('Payment create error:', err);
    res.status(500).json({ error: '建立付款失敗，請稍後再試' });
  }
});

// ECPay callback
router.post('/callback', express.urlencoded({ extended: true }), (req, res) => {
  try {
    const db = req.app.locals.db;
    const params = req.body;

    if (!verifyCallback(params)) {
      console.error('ECPay callback verification failed');
      return res.send('0|ErrorMessage');
    }

    const rtnCode = params.RtnCode;
    const tradeNo = params.MerchantTradeNo;
    const registrationId = params.CustomField1;

    if (rtnCode === '1') {
      // Payment successful
      db.prepare(
        'UPDATE payments SET status = "paid", method = ?, paid_at = CURRENT_TIMESTAMP WHERE ecpay_trade_no = ?'
      ).run(params.PaymentType, tradeNo);

      if (registrationId) {
        db.prepare(
          'UPDATE registrations SET payment_status = "paid", status = "confirmed", updated_at = CURRENT_TIMESTAMP WHERE id = ?'
        ).run(registrationId);
      }
    } else {
      db.prepare('UPDATE payments SET status = "failed" WHERE ecpay_trade_no = ?').run(tradeNo);
    }

    res.send('1|OK');
  } catch (err) {
    console.error('Payment callback error:', err);
    res.send('0|ErrorMessage');
  }
});

// Payment return page
router.get('/return', (req, res) => {
  res.redirect('/member/payments.html?result=success');
});

// My payments
router.get('/my', authenticateToken, (req, res) => {
  const db = req.app.locals.db;
  const data = db.prepare(`
    SELECT p.*, r.course_id, c.title as course_title
    FROM payments p
    LEFT JOIN registrations r ON p.registration_id = r.id
    LEFT JOIN courses c ON r.course_id = c.id
    WHERE p.member_id = ?
    ORDER BY p.created_at DESC
  `).all(req.user.id);
  res.json({ data });
});

module.exports = router;
