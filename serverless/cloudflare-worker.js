// Cloudflare Worker: Lead intake -> Telegram (Uzbek messages)
// Deploy on Workers (free). Set Secrets: BOT_TOKEN, CHAT_ID. Vars: ORIGIN (comma-separated allowed origins, domain only: e.g., https://username.github.io)

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function validate(body) {
  const errors = [];
  const { name, phone, username, company, message } = body || {};
  if (!name || String(name).trim().length < 2) errors.push("Ism kamida 2 belgi bo‘lishi kerak.");
  if (!phone || !/^\+?[0-9\s()-]{6,}$/.test(String(phone))) errors.push("Telefon raqamini to‘g‘ri kiriting.");
  if (!username || !/^@?[A-Za-z0-9_]{5,}$/.test(String(username))) errors.push("@username to‘g‘ri kiriting.");
  if (company && String(company).trim().length > 0 && String(company).trim().length < 2) errors.push("Kompaniya nomi kamida 2 belgi.");
  if (!message || String(message).trim().length < 5) errors.push("Xabar kamida 5 belgi bo‘lishi kerak.");
  return errors;
}

function getCorsHeaders(request, env) {
  const origin = request.headers.get('Origin');
  const allowed = (env.ORIGIN || '').split(',').map(s => s.trim()).filter(Boolean);
  const isAllowed = !origin || allowed.includes('*') || allowed.includes(origin);
  const headers = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'content-type',
  };
  if (isAllowed && origin) headers['Access-Control-Allow-Origin'] = origin;
  return headers;
}

async function handleLead(request, env) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: getCorsHeaders(request, env) });
  }
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ ok: false, errors: ['Method yo‘q'] }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...getCorsHeaders(request, env) },
    });
  }

  try {
    const body = await request.json();
    const errors = validate(body);
    if (errors.length) {
      return new Response(JSON.stringify({ ok: false, errors }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...getCorsHeaders(request, env) },
      });
    }

    const { name, phone, username, company, message } = body;
    const now = new Date();
    const datetime = now.toLocaleString('en-GB', { hour12: false });
    const usernameDisplay = String(username).startsWith('@') ? username : `@${username}`;

    const text = `<b>New Lead — Sarvar Umarov</b>\n` +
      `👤 Ism: ${escapeHtml(name)}\n` +
      `📞 Telefon: ${escapeHtml(phone)}\n` +
      `💬 Telegram: ${escapeHtml(usernameDisplay)}\n` +
      `🏢 Kompaniya: ${escapeHtml(company || '-') }\n` +
      `📝 Xabar: ${escapeHtml(message)}\n` +
      `🕒 ${datetime}`;

    const resp = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: env.CHAT_ID, text, parse_mode: 'HTML' })
    });
    const json = await resp.json();
    if (!json.ok) {
      return new Response(JSON.stringify({ ok: false, errors: ['Telegram’ga yuborishda xatolik.'] }), {
        status: 502,
        headers: { 'Content-Type': 'application/json', ...getCorsHeaders(request, env) },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json', ...getCorsHeaders(request, env) },
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, errors: ['Kutilmagan server xatosi'] }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...getCorsHeaders(request, env) },
    });
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/lead') {
      return handleLead(request, env);
    }
    return new Response('OK', { status: 200 });
  }
};
