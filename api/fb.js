/**
 * api/fb.js — Facebook Graph API proxy
 * 
 * Called as: GET/POST /api/fb/me/accounts?token=EAAB...&fields=id,name
 * The FB path comes from the URL itself, not a query param.
 * This avoids Vercel mangling slashes in query strings.
 */
const https = require('https');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  // Extract the FB path from the request URL
  // e.g. /api/fb/me/accounts -> /me/accounts
  const urlObj = new URL(req.url, 'http://localhost');
  const fbPath = urlObj.pathname.replace(/^\/api\/fb/, '') || '/';
  const { token, ...rest } = Object.fromEntries(urlObj.searchParams);

  if (!token) {
    return res.status(400).json({ error: { message: 'Missing token' } });
  }

  // Build FB query string
  const params = new URLSearchParams();
  params.set('access_token', token);
  for (const [k, v] of Object.entries(rest)) {
    if (k === 'access_token') continue;
    if (k === 'fields') {
      const cleaned = v.split(',').filter(f => f.trim() !== 'access_token').join(',');
      if (cleaned) params.set('fields', cleaned);
    } else {
      params.set(k, v);
    }
  }

  const fullPath = `/v21.0${fbPath}?${params.toString()}`;

  try {
    let body = null;
    let contentType = '';

    if (req.method === 'POST') {
      contentType = req.headers['content-type'] || '';
      body = await new Promise((resolve, reject) => {
        const chunks = [];
        req.on('data', c => chunks.push(c));
        req.on('end', () => resolve(Buffer.concat(chunks)));
        req.on('error', reject);
      });
    }

    const result = await new Promise((resolve, reject) => {
      const options = {
        hostname: 'graph.facebook.com',
        path: fullPath,
        method: req.method,
        headers: (req.method === 'POST' && body)
          ? { 'Content-Type': contentType, 'Content-Length': body.length }
          : {}
      };

      const fbReq = https.request(options, fbRes => {
        const chunks = [];
        fbRes.on('data', c => chunks.push(c));
        fbRes.on('end', () => {
          const text = Buffer.concat(chunks).toString();
          try { resolve({ status: fbRes.statusCode, body: JSON.parse(text) }); }
          catch { resolve({ status: fbRes.statusCode, body: { error: { message: 'Non-JSON from FB: ' + text.slice(0, 300) } } }); }
        });
      });
      fbReq.on('error', reject);
      if (body && body.length > 0) fbReq.write(body);
      fbReq.end();
    });

    return res.status(result.status).json(result.body);

  } catch (err) {
    return res.status(500).json({ error: { message: err.message } });
  }
};
