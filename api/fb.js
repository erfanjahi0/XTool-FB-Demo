// api/fb.js
// No 'require' needed! Node 18 has 'fetch' built-in.

module.exports = async (req, res) => {
  // 1. Allow requests from your frontend
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 2. Handle preflight checks
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // 3. Parse the body safely
    // Vercel usually parses JSON automatically, but let's be safe.
    let body = req.body;
    
    // If body is a string (raw), parse it
    if (typeof req.body === 'string') {
        try { body = JSON.parse(req.body); } catch (e) { /* ignore */ }
    }
    
    const { path, method, params, body: fbBody } = body;

    if (!path) {
      return res.status(400).json({ error: 'Missing API path' });
    }

    // 4. Construct URL
    const url = new URL(`https://graph.facebook.com/v21.0/${path}`);
    if (params) {
      Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
    }

    // 5. Prepare Fetch
    const fetchOptions = { method: method || 'GET', headers: {} };
    
    if (fbBody) {
      fetchOptions.headers['Content-Type'] = 'application/json';
      fetchOptions.body = JSON.stringify(fbBody);
    }

    // 6. Call Facebook
    const fbRes = await fetch(url.toString(), fetchOptions);
    const data = await fbRes.json();

    // 7. Return response
    res.status(200).json(data);

  } catch (error) {
    console.error('Proxy Error:', error);
    res.status(500).json({ error: { message: error.message, type: 'ProxyError' } });
  }
};
