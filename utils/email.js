const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  } else {
    // Dev mode: log emails to console
    transporter = {
      sendMail: async (options) => {
        console.log('=== DEV EMAIL ===');
        console.log('To:', options.to);
        console.log('Subject:', options.subject);
        console.log('Body:', options.html || options.text);
        console.log('=================');
        return { messageId: 'dev-' + Date.now() };
      }
    };
  }
  return transporter;
}

async function sendVerificationEmail(email, name, token) {
  const url = `${process.env.SITE_URL}/api/auth/verify-email?token=${token}`;
  await getTransporter().sendMail({
    from: process.env.MAIL_FROM,
    to: email,
    subject: `[${process.env.SITE_NAME}] 請驗證您的Email`,
    html: `
      <div style="max-width:600px;margin:0 auto;font-family:'Noto Sans TC',sans-serif;">
        <h2 style="color:#0a1628;">歡迎加入 ${process.env.SITE_NAME}</h2>
        <p>親愛的 ${name}，</p>
        <p>感謝您註冊成為會員，請點擊下方按鈕驗證您的Email：</p>
        <a href="${url}" style="display:inline-block;padding:12px 32px;background:#00d4aa;color:#0a1628;text-decoration:none;border-radius:8px;font-weight:600;">驗證Email</a>
        <p style="margin-top:20px;color:#94a3b8;font-size:14px;">此連結有效期限為24小時。若您未註冊此帳號，請忽略此信。</p>
      </div>
    `
  });
}

async function sendPasswordResetEmail(email, name, token) {
  const url = `${process.env.SITE_URL}/forgot-password.html?token=${token}`;
  await getTransporter().sendMail({
    from: process.env.MAIL_FROM,
    to: email,
    subject: `[${process.env.SITE_NAME}] 密碼重設`,
    html: `
      <div style="max-width:600px;margin:0 auto;font-family:'Noto Sans TC',sans-serif;">
        <h2 style="color:#0a1628;">密碼重設</h2>
        <p>親愛的 ${name}，</p>
        <p>我們收到您的密碼重設請求，請點擊下方按鈕重設密碼：</p>
        <a href="${url}" style="display:inline-block;padding:12px 32px;background:#00d4aa;color:#0a1628;text-decoration:none;border-radius:8px;font-weight:600;">重設密碼</a>
        <p style="margin-top:20px;color:#94a3b8;font-size:14px;">此連結有效期限為1小時。若您未要求重設密碼，請忽略此信。</p>
      </div>
    `
  });
}

async function sendContactNotification(contact) {
  await getTransporter().sendMail({
    from: process.env.MAIL_FROM,
    to: process.env.SMTP_USER || 'admin@cilt.org.tw',
    subject: `[${process.env.SITE_NAME}] 新聯絡表單：${contact.category}`,
    html: `
      <div style="max-width:600px;margin:0 auto;font-family:'Noto Sans TC',sans-serif;">
        <h2 style="color:#0a1628;">新聯絡表單通知</h2>
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:8px;border-bottom:1px solid #e2e8f0;font-weight:600;">姓名</td><td style="padding:8px;border-bottom:1px solid #e2e8f0;">${contact.name}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #e2e8f0;font-weight:600;">Email</td><td style="padding:8px;border-bottom:1px solid #e2e8f0;">${contact.email}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #e2e8f0;font-weight:600;">電話</td><td style="padding:8px;border-bottom:1px solid #e2e8f0;">${contact.phone || '-'}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #e2e8f0;font-weight:600;">公司</td><td style="padding:8px;border-bottom:1px solid #e2e8f0;">${contact.company || '-'}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #e2e8f0;font-weight:600;">類別</td><td style="padding:8px;border-bottom:1px solid #e2e8f0;">${contact.category}</td></tr>
          <tr><td style="padding:8px;font-weight:600;" colspan="2">留言內容</td></tr>
          <tr><td style="padding:8px;" colspan="2">${contact.message}</td></tr>
        </table>
      </div>
    `
  });
}

async function sendRegistrationConfirmation(email, name, courseName) {
  await getTransporter().sendMail({
    from: process.env.MAIL_FROM,
    to: email,
    subject: `[${process.env.SITE_NAME}] 報名確認：${courseName}`,
    html: `
      <div style="max-width:600px;margin:0 auto;font-family:'Noto Sans TC',sans-serif;">
        <h2 style="color:#0a1628;">報名確認</h2>
        <p>親愛的 ${name}，</p>
        <p>您已成功報名以下課程：</p>
        <p style="font-size:18px;font-weight:600;color:#00d4aa;">${courseName}</p>
        <p>請至會員中心查看報名詳情與繳費資訊。</p>
        <a href="${process.env.SITE_URL}/member/my-courses.html" style="display:inline-block;padding:12px 32px;background:#00d4aa;color:#0a1628;text-decoration:none;border-radius:8px;font-weight:600;">查看我的報名</a>
      </div>
    `
  });
}

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendContactNotification,
  sendRegistrationConfirmation
};
