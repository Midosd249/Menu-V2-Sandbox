const ALLOWED_KINDS = new Set(['service', 'website', 'visibility']);
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function parseBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch (_) { return {}; }
  }
  return {};
}

export default async function notifyOwner(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }

  const origin = req.headers.origin || '';
  const trustedOrigins = (process.env.MENU_PUBLIC_ORIGIN || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  if (origin && trustedOrigins.length && !trustedOrigins.includes(origin)) {
    return res.status(403).json({ ok: false, error: 'origin_not_allowed' });
  }

  const body = parseBody(req);
  const kind = String(body.kind || '');
  const id = String(body.id || '');
  if (!ALLOWED_KINDS.has(kind) || !UUID_PATTERN.test(id)) {
    return res.status(400).json({ ok: false, error: 'invalid_notification_reference' });
  }

  // The destination is server-side only. Never receive or construct a webhook URL from browser input.
  const endpoint = process.env.OWNER_NOTIFICATION_WEBHOOK_URL;
  if (!endpoint) {
    // Queueing is intentionally delegated to the database/owner dashboard when no managed webhook is configured.
    return res.status(202).json({ ok: true, dispatched: false, reason: 'notification_channel_not_configured' });
  }

  let webhookUrl;
  try {
    webhookUrl = new URL(endpoint);
  } catch (_) {
    console.error('OWNER_NOTIFICATION_WEBHOOK_URL is not a valid URL');
    return res.status(500).json({ ok: false, error: 'notification_channel_misconfigured' });
  }
  if (webhookUrl.protocol !== 'https:') {
    console.error('OWNER_NOTIFICATION_WEBHOOK_URL must use HTTPS');
    return res.status(500).json({ ok: false, error: 'notification_channel_misconfigured' });
  }

  const payload = {
    event: 'menu.request.created',
    kind,
    id,
    occurred_at: new Date().toISOString()
  };
  const headers = { 'Content-Type': 'application/json' };
  if (process.env.OWNER_NOTIFICATION_WEBHOOK_TOKEN) {
    headers.Authorization = `Bearer ${process.env.OWNER_NOTIFICATION_WEBHOOK_TOKEN}`;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(7000)
    });
    if (!response.ok) {
      console.error('Owner notification webhook rejected request', { status: response.status, kind, id });
      return res.status(502).json({ ok: false, error: 'notification_delivery_failed' });
    }
    return res.status(202).json({ ok: true, dispatched: true });
  } catch (error) {
    console.error('Owner notification webhook request failed', { message: error.message, kind, id });
    return res.status(502).json({ ok: false, error: 'notification_delivery_failed' });
  }
}
