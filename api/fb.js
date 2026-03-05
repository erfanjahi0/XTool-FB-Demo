/**
 * /api/fb.js  — Vercel Serverless Proxy for Facebook Graph API
 *
 * Browser calls: /api/fb?path=/me/accounts&token=EAAB...&fields=id,name
 * This runs server-side → no CORS issues.
 */

const FB_BASE = 'https://graph.facebook.com/v21.0';

export const config = { api: { bodyParser: false } };

function rawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const { path, token, ...fbParams } = req.query;

  if (!path || !token) {
    res.status(400).json({ error: { message: 'Missing path or token', code: 400 } });
    return;
  }

  // Build Facebook URL
  const fbUrl = new URL(`${FB_BASE}${path}`);

  // Add token as standard access_token param (server-side, so FB accepts it)
  fbUrl.searchParams.set('access_token', token);

  // Forward all other params, but:
  // 1. Never forward a second access_token
  // 2. Strip "access_token" if it appears as a field name inside fields=
  for (const [k, v] of Object.entries(fbParams)) {
    if (k === 'access_token') continue;
    if (k === 'fields') {
      const cleaned = v.split(',').filter(f => f.trim() !== 'access_token').join(',');
      if (cleaned) fbUrl.searchParams.set('fields', cleaned);
    } else {
      fbUrl.searchParams.set(k, v);
    }
  }

  try {
    let fbRes;

    if (req.method === 'GET') {
      fbRes = await fetch(fbUrl.toString());

    } else if (req.method === 'POST') {
      const body = await rawBody(req);
      const contentType = req.headers['content-type'] || 'application/octet-stream';
      fbRes = await fetch(fbUrl.toString(), {
        method: 'POST',
        headers: { 'Content-Type': contentType },
        body,
      });

    } else {
      res.status(405).json({ error: { message: 'Method not allowed' } });
      return;
    }

    // Parse response safely
    const text = await fbRes.text();
    let data;
    try { data = JSON.parse(text); }
    catch { data = { raw: text }; }

    res.status(fbRes.status).json(data);

  } catch (err) {
    res.status(500).json({ error: { message: err.message || 'Proxy fetch error', code: 500 } });
  }
}
