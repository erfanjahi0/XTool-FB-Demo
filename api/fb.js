const https = require('https');

const FB_BASE = 'graph.facebook.com';

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const { path, token, ...rest } = req.query;
  if (!path || !token) {
    return res.status(400).json({ error: { message: 'Missing path or token' } });
  }

  const params = new URLSearchParams();
  params.set('access_token', token);
  for (const [k, v] of Object.entries(rest)) {
    if (k === 'access_token') continue;
    if (k === 'fields') {
      const cleaned = String(v).split(',').filter(f => f.trim() !== 'access_token').join(',');
      if (cleaned) params.set('fields', cleaned);
    } else {
      params.set(k, String(v));
    }
  }

  const fbPath = `/v21.0${decodeURIComponent(path)}?${params.toString()}`;

  try {
    let reqBody = null;
    let reqContentType = '';
    if (req.method === 'POST') {
      reqContentType = req.headers['content-type'] || '';
      reqBody = await new Promise((resolve, reject) => {
        const chunks = [];
        req.on('data', c => chunks.push(c));
        req.on('end', () => resolve(Buffer.concat(chunks)));
        req.on('error', reject);
      });
    }

    const fbData = await new Promise((resolve, reject) => {
      const options = {
        hostname: FB_BASE,
        path: fbPath,
        method: req.method,
        headers: req.method === 'POST'
          ? { 'Content-Type': reqContentType, 'Content-Length': Buffer.byteLength(reqBody) }
          : {}
      };

      const fbReq = https.request(options, fbRes => {
        const chunks = [];
        fbRes.on('data', c => chunks.push(c));
        fbRes.on('end', () => {
          const text = Buffer.concat(chunks).toString();
          try {
            resolve({ status: fbRes.statusCode, body: JSON.parse(text) });
          } catch {
            resolve({ status: fbRes.statusCode, body: { error: { message: 'FB returned non-JSON: ' + text.slice(0, 200) } } });
          }
        });
      });

      fbReq.on('error', reject);
      if (req.method === 'POST' && reqBody && reqBody.length > 0) fbReq.write(reqBody);
      fbReq.end();
    });

    return res.status(fbData.status).json(fbData.body);

  } catch (err) {
    return res.status(500).json({ error: { message: err.message || 'Proxy error' } });
  }
};
