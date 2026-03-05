/**
 * Vercel serverless proxy for Facebook Graph API
 * Called as: /api/proxy?e=BASE64_ENCODED_FB_ENDPOINT&t=TOKEN&...extra_params
 * Using base64 for the endpoint avoids ALL slash/routing issues in Vercel
 */
const https = require('https');

module.exports = async function (req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  // Parse query string manually to avoid Vercel quirks
  const qs = req.url.includes('?') ? req.url.split('?')[1] : '';
  const qp = new URLSearchParams(qs);

  const encoded = qp.get('e'); // base64-encoded FB path e.g. /me/accounts
  const token   = qp.get('t'); // access token

  if (!encoded || !token) {
    return res.status(400).json({ error: { message: 'Missing e or t param' } });
  }

  let fbPath;
  try { fbPath = Buffer.from(encoded, 'base64').toString('utf8'); }
  catch { return res.status(400).json({ error: { message: 'Invalid base64 in e param' } }); }

  // Build FB params - forward everything except e and t
  const fbParams = new URLSearchParams();
  fbParams.set('access_token', token);
  for (const [k, v] of qp.entries()) {
    if (k === 'e' || k === 't' || k === 'access_token') continue;
    fbParams.set(k, v);
  }

  const fullPath = '/v21.0' + fbPath + '?' + fbParams.toString();

  try {
    // Read body for POST
    let body = Buffer.alloc(0);
    let ct = '';
    if (req.method === 'POST') {
      ct = req.headers['content-type'] || '';
      body = await new Promise((ok, fail) => {
        const parts = [];
        req.on('data', c => parts.push(c));
        req.on('end', () => ok(Buffer.concat(parts)));
        req.on('error', fail);
      });
    }

    // Call Facebook
    const fb = await new Promise((ok, fail) => {
      const opts = {
        hostname: 'graph.facebook.com',
        path: fullPath,
        method: req.method,
        headers: (req.method === 'POST' && body.length)
          ? { 'Content-Type': ct, 'Content-Length': body.length }
          : {}
      };
      const r = https.request(opts, response => {
        const parts = [];
        response.on('data', c => parts.push(c));
        response.on('end', () => {
          const text = Buffer.concat(parts).toString();
          try { ok({ status: response.statusCode, json: JSON.parse(text) }); }
          catch { ok({ status: response.statusCode, json: { error: { message: text.slice(0, 400) } } }); }
        });
      });
      r.on('error', fail);
      if (body.length) r.write(body);
      r.end();
    });

    return res.status(fb.status).json(fb.json);

  } catch (err) {
    return res.status(500).json({ error: { message: String(err.message) } });
  }
};
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
