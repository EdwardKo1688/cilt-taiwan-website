const crypto = require('crypto');

function generateTradeNo() {
  const now = new Date();
  const dateStr = now.toISOString().replace(/[-T:\.Z]/g, '').slice(0, 14);
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `CILT${dateStr}${rand}`.substring(0, 20);
}

function generateCheckMacValue(params) {
  const hashKey = process.env.ECPAY_HASH_KEY;
  const hashIV = process.env.ECPAY_HASH_IV;

  // Sort by key
  const sorted = Object.keys(params).sort().reduce((acc, key) => {
    acc[key] = params[key];
    return acc;
  }, {});

  // Build query string
  let raw = `HashKey=${hashKey}`;
  for (const [key, value] of Object.entries(sorted)) {
    raw += `&${key}=${value}`;
  }
  raw += `&HashIV=${hashIV}`;

  // URL encode and lowercase
  let encoded = encodeURIComponent(raw).toLowerCase();

  // Replace special characters per ECPay spec
  encoded = encoded.replace(/%2d/g, '-')
    .replace(/%5f/g, '_')
    .replace(/%2e/g, '.')
    .replace(/%21/g, '!')
    .replace(/%2a/g, '*')
    .replace(/%28/g, '(')
    .replace(/%29/g, ')')
    .replace(/%20/g, '+');

  // SHA256 hash
  const hash = crypto.createHash('sha256').update(encoded).digest('hex').toUpperCase();
  return hash;
}

function createPaymentForm(order) {
  const merchantId = process.env.ECPAY_MERCHANT_ID;
  const tradeNo = generateTradeNo();
  const now = new Date();
  const tradeDate = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

  const params = {
    MerchantID: merchantId,
    MerchantTradeNo: tradeNo,
    MerchantTradeDate: tradeDate,
    PaymentType: 'aio',
    TotalAmount: String(order.amount),
    TradeDesc: encodeURIComponent('CILT台灣分會線上繳費'),
    ItemName: order.itemName,
    ReturnURL: process.env.ECPAY_RETURN_URL,
    ClientBackURL: process.env.ECPAY_CLIENT_BACK_URL,
    ChoosePayment: 'ALL',
    EncryptType: '1',
    CustomField1: String(order.registrationId || ''),
    CustomField2: String(order.memberId || '')
  };

  params.CheckMacValue = generateCheckMacValue(params);

  // Build auto-submit form
  const isTest = process.env.NODE_ENV !== 'production';
  const actionUrl = isTest
    ? 'https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5'
    : 'https://payment.ecpay.com.tw/Cashier/AioCheckOut/V5';

  let formHtml = `<form id="ecpay-form" method="POST" action="${actionUrl}">`;
  for (const [key, value] of Object.entries(params)) {
    formHtml += `<input type="hidden" name="${key}" value="${value}">`;
  }
  formHtml += '</form><script>document.getElementById("ecpay-form").submit();</script>';

  return { formHtml, tradeNo };
}

function verifyCallback(params) {
  const checkMacValue = params.CheckMacValue;
  const filtered = { ...params };
  delete filtered.CheckMacValue;

  const computed = generateCheckMacValue(filtered);
  return computed === checkMacValue;
}

module.exports = { createPaymentForm, verifyCallback, generateTradeNo };
