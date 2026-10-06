/**
 * OPTIMAN — приём заявки и отправка менеджеру в Telegram.
 * Vercel serverless: POST /api/order. Локально вызывается из server.js.
 * Токен и чат — только из окружения: TG_BOT_TOKEN, TG_CHAT_ID.
 */

// Держать в синхроне с CONFIG.tiers в index.html (ключи — белый список наборов).
const TIERS = {
  start:   { name: 'Старт',     packs: 1, days: 10, price: 18990, freeShip: false },
  legion:  { name: 'Легион',    packs: 3, days: 30, price: 49990, freeShip: true },
  emperor: { name: 'Император', packs: 6, days: 60, price: 99990, freeShip: true },
};
const PAYMENTS = { kaspi: 'Kaspi', cod: 'При получении' };
const MIN_FILL_MS = 3000;

const money = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' ₸';
const clean = (v, max) => String(v == null ? '' : v).replace(/[\u0000-\u001F\u007F]/g, ' ').trim().slice(0, max);

function orderNumber(now = new Date()) {
  const kz = new Date(now.getTime() + 5 * 3600 * 1000); // UTC+5
  const dd = String(kz.getUTCDate()).padStart(2, '0');
  const mm = String(kz.getUTCMonth() + 1).padStart(2, '0');
  const rnd = String(Math.floor(1000 + Math.random() * 9000));
  return `OP-${dd}${mm}-${rnd}`;
}

function validate(body) {
  const errors = {};
  const name = clean(body.name, 80);
  if (name.length < 2 || name.length > 60) errors.name = 'Укажите имя от 2 до 60 символов';

  const digits = String(body.phone || '').replace(/\D/g, '');
  if (!/^77\d{9}$/.test(digits)) errors.phone = 'Номер в формате +7 7XX XXX XX XX';

  const tier = String(body.tier || '');
  if (!Object.prototype.hasOwnProperty.call(TIERS, tier)) errors.tier = 'Выберите набор';

  const payment = String(body.payment || '');
  if (!Object.prototype.hasOwnProperty.call(PAYMENTS, payment)) errors.payment = 'Выберите способ оплаты';

  const city = clean(body.city, 60);
  if (city.length < 2) errors.city = 'Укажите город';

  return { errors, data: { name, digits, tier, payment, city } };
}

function buildMessage(num, d, meta) {
  const t = TIERS[d.tier];
  const phone = `+${d.digits[0]} ${d.digits.slice(1, 4)} ${d.digits.slice(4, 7)} ${d.digits.slice(7, 9)} ${d.digits.slice(9)}`;
  const lines = [
    `Новая заявка ${num}`,
    '',
    `Имя: ${d.name}`,
    `Телефон: ${phone}`,
    `Город: ${d.city}`,
    `Набор: «${t.name}» — ${t.packs} уп., ${t.days} дней`,
    `Сумма: ${money(t.price)}${t.freeShip ? ' (доставка бесплатно)' : ' + доставка по тарифу'}`,
    `Оплата: ${PAYMENTS[d.payment]}`,
  ];
  const utm = meta.utm && typeof meta.utm === 'object' ? meta.utm : {};
  const utmLines = Object.keys(utm)
    .filter((k) => /^utm_[a-z_]{1,20}$/.test(k))
    .slice(0, 8)
    .map((k) => `${k}: ${clean(utm[k], 120)}`);
  lines.push('', utmLines.length ? 'UTM:' : 'UTM: —', ...utmLines);
  lines.push(`Referrer: ${clean(meta.referrer, 300) || '—'}`);
  lines.push(`Страница: ${clean(meta.page, 300) || '—'}`);
  return lines.join('\n');
}

/**
 * Чистая логика: возвращает { status, body }. fetchImpl и env передаются для тестов.
 */
async function processOrder(body, env = process.env, fetchImpl = fetch) {
  if (!body || typeof body !== 'object') return { status: 400, body: { ok: false, error: 'bad_request' } };

  // Защита от ботов: honeypot и время заполнения.
  if (clean(body.website, 200)) return { status: 400, body: { ok: false, error: 'rejected' } };
  const elapsed = Number(body.elapsed);
  if (!Number.isFinite(elapsed) || elapsed < MIN_FILL_MS) return { status: 400, body: { ok: false, error: 'too_fast' } };

  const { errors, data } = validate(body);
  if (Object.keys(errors).length) return { status: 422, body: { ok: false, error: 'validation', fields: errors } };

  const token = env.TG_BOT_TOKEN, chat = env.TG_CHAT_ID;
  if (!token || !chat) return { status: 500, body: { ok: false, error: 'not_configured' } };

  const num = orderNumber();
  const text = buildMessage(num, data, body);
  const base = (env.TG_API_BASE || 'https://api.telegram.org').replace(/\/$/, '');

  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    const r = await fetchImpl(`${base}/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chat, text, disable_web_page_preview: true }),
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    const j = await r.json().catch(() => null);
    if (j && j.ok === true) return { status: 200, body: { ok: true, order: num } };
    return { status: 502, body: { ok: false, error: 'telegram' } };
  } catch (e) {
    return { status: 502, body: { ok: false, error: 'telegram_unreachable' } };
  }
}

async function readJson(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') { try { return JSON.parse(req.body); } catch { return null; } }
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', (c) => { raw += c; if (raw.length > 20000) req.destroy(); });
    req.on('end', () => { try { resolve(JSON.parse(raw)); } catch { resolve(null); } });
    req.on('error', () => resolve(null));
  });
}

async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Allow', 'POST');
    return res.end(JSON.stringify({ ok: false, error: 'method_not_allowed' }));
  }
  const body = await readJson(req);
  const out = await processOrder(body);
  res.statusCode = out.status;
  res.end(JSON.stringify(out.body));
}

module.exports = handler;
module.exports.processOrder = processOrder;
module.exports.TIERS = TIERS;
