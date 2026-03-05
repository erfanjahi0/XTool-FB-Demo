/**
 * /api/fb.js  — Vercel Serverless Proxy for Facebook Graph API
 *
 * All browser requests go to /api/fb?path=...&token=...
 * This function runs server-side, so Facebook's CORS policy is irrelevant.
 *
 * Supports:
 *   GET  /api/fb?path=/me/accounts&fields=...&token=EAAB...
 *   POST /api/fb?path=/act_xxx/adimages/&token=EAAB...   (multipart FormData)
 *   POST /api/fb?path=/act_xxx/adcreatives&token=EAAB... (JSON body)
 *   POST /api/fb?path=/PAGE_ID/feed&token=EAAB...        (JSON body, page token)
 */

const FB_BASE = 'https://graph.facebook.com/v21.0';

export const config = { api: { bodyParser: false } };

// Read raw body as Buffer
function rawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  // Allow browser requests from any origin
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { path, token, ...queryParams } = req.query;

  if (!path || !token) {
    res.status(400).json({ error: { message: 'Missing path or token', code: 400 } });
    return;
  }

  // Build the upstream Facebook URL
  const fbUrl = new URL(`${FB_BASE}${path}`);
  fbUrl.searchParams.set('access_token', token);

  // Forward any extra query params (fields, method, __cppo, etc.)
  for (const [k, v] of Object.entries(queryParams)) {
    fbUrl.searchParams.set(k, v);
  }

  try {
    let fbRes;

    if (req.method === 'GET') {
      fbRes = await fetch(fbUrl.toString());

    } else if (req.method === 'POST') {
      const body = await rawBody(req);
      const contentType = req.headers['content-type'] || '';

      fbRes = await fetch(fbUrl.toString(), {
        method: 'POST',
        headers: { 'Content-Type': contentType },
        body,
      });
    } else {
      res.status(405).json({ error: { message: 'Method not allowed', code: 405 } });
      return;
    }

    const data = await fbRes.json();
    res.status(fbRes.status).json(data);

  } catch (err) {
    res.status(500).json({ error: { message: err.message || 'Proxy error', code: 500 } });
  }
}
