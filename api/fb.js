// api/fb.js
const fetch = require('node-fetch');

module.exports = async (req, res) => {
  // 1. Set CORS headers to allow your frontend to talk to this function
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 2. Handle browser "preflight" checks
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 3. Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // 4. Parse incoming data
    const { path, method, params, body } = req.body;

    if (!path) {
      return res.status(400).json({ error: 'Missing API path' });
    }

    // 5. Build Facebook URL
    const url = new URL(`https://graph.facebook.com/v21.0/${path}`);
    if (params) {
      Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
    }

    // 6. Forward request to Facebook
    const fetchOptions = { method: method || 'GET', headers: {} };
    
    if (body) {
      fetchOptions.headers['Content-Type'] = 'application/json';
      fetchOptions.body = JSON.stringify(body);
    }

    const fbRes = await fetch(url.toString(), fetchOptions);
    const data = await fbRes.json();

    // 7. Return Facebook response
    res.status(200).json(data);

  } catch (error) {
    console.error('Proxy Error:', error);
    res.status(500).json({ error: { message: error.message, type: 'ProxyError' } });
  }
};
