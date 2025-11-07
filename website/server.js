require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { fetch } = require('undici');

const app = express();

const PORT = process.env.PORT || 3000;
const ORIGIN = process.env.ORIGIN || `http://localhost:${PORT}`;
const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

// Basic env validation
if (!BOT_TOKEN || !CHAT_ID) {
  console.warn('Warning: BOT_TOKEN or CHAT_ID not set. /api/lead will fail until provided.');
}

// CORS: allow single ORIGIN or comma-separated list. Use '*' to allow all (not recommended for prod).
const allowedOrigins = ORIGIN.split(',').map(s => s.trim());
app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true); // same-origin or curl
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET','POST'],
  credentials: false
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function validateLead(body) {
  const errors = [];
  const { name, phone, username, company, message } = body;
  if (!name || name.trim().length < 2) errors.push('Ism kamida 2 belgi bo‘lishi kerak.');
  if (!phone || !(/^\+?[0-9\s()-]{6,}$/.test(phone))) errors.push('Telefon raqamini to‘g‘ri kiriting.');
  if (!username || !(/^@?[A-Za-z0-9_]{5,}$/.test(username))) errors.push('@username to‘g‘ri kiriting.');
  if (company && company.trim().length > 0 && company.trim().length < 2) errors.push('Kompaniya nomi kamida 2 belgi.');
  if (!message || message.trim().length < 5) errors.push('Xabar kamida 5 belgi bo‘lishi kerak.');
  return errors;
}

app.post('/api/lead', async (req, res) => {
  try {
    const errors = validateLead(req.body);
    if (errors.length) {
      return res.status(400).json({ ok: false, errors });
    }
    if (!BOT_TOKEN || !CHAT_ID) {
  return res.status(500).json({ ok: false, errors: ['Server sozlanmagan: BOT_TOKEN/CHAT_ID yo‘q'] });
    }

  const { name, phone, username, company, message } = req.body;
  const usernameDisplay = String(username).startsWith('@') ? username : `@${username}`;
    const now = new Date();
    const datetime = now.toLocaleString('en-GB', { hour12: false });
  const text = `<b>New Lead — Sarvar Umarov</b>\n👤 Name: ${escapeHtml(name)}\n📞 Phone: ${escapeHtml(phone)}\n💬 Telegram: ${escapeHtml(usernameDisplay)}\n🏢 Company: ${escapeHtml(company)}\n📝 Message: ${escapeHtml(message)}\n🕒 ${datetime}`;

    const telegramUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    const tgResp = await fetch(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: CHAT_ID, text, parse_mode: 'HTML' })
    });
    const tgData = await tgResp.json();

    if (!tgData.ok) {
  console.error('Telegram API error:', tgData);
  return res.status(502).json({ ok: false, errors: ['Telegram’ga yuborishda xatolik.'] });
    }

    return res.json({ ok: true });
  } catch (err) {
  console.error('Lead handling error', err);
  return res.status(500).json({ ok: false, errors: ['Kutilmagan server xatosi'] });
  }
});

// Fallback to index.html for root
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
