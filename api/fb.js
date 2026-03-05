const fetch = require('node-fetch');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    // FIX: Ensure body is an object. Vercel sometimes sends strings.
    let requestBody = req.body;
    if (typeof req.body === 'string') {
      try { requestBody = JSON.parse(req.body); } catch (e) { return res.status(400).json({ error: 'Invalid JSON sent to proxy' }); }
    }
    
    // Safety check if body is empty
    if (!requestBody) return res.status(400).json({ error: 'Empty request body' });

    const { path, method, params, body } = requestBody;

    if (!path) return res.status(400).json({ error: 'Missing "path"' });

    // Use v19.0 hardcoded here just to be safe, or use the path provided
    const url = new URL(`https://graph.facebook.com/v19.0/${path}`);
    
    if (params) Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

    const fetchOptions = { method: method || 'GET', headers: {} };
    
    if (body) {
      fetchOptions.headers['Content-Type'] = 'application/json';
      fetchOptions.body = JSON.stringify(body);
    }

    const fbRes = await fetch(url.toString(), fetchOptions);
    const data = await fbRes.json();

    return res.status(200).json(data);

  } catch (err) {
    console.error('Proxy Crash:', err);
    return res.status(500).json({ error: { message: err.message, type: 'ProxyCrash' } });
  }
};
