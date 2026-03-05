const fetch = require('node-fetch');

module.exports = async (req, res) => {
  // 1. CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    // 2. Robust Body Parsing
    let requestBody = req.body;
    
    // Vercel usually parses JSON automatically, but let's be safe
    if (typeof req.body === 'string') {
       try { requestBody = JSON.parse(req.body); } catch (e) { return res.status(400).json({ error: 'Invalid JSON' }); }
    }
    
    if (!requestBody) return res.status(400).json({ error: 'Empty body' });

    const { path, method, params, body } = requestBody;

    if (!path) return res.status(400).json({ error: 'Missing path' });

    // 3. Construct URL (Using v21.0 as requested)
    const url = new URL(`https://graph.facebook.com/v21.0/${path}`);
    
    if (params) {
      Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
    }

    // 4. Prepare Options
    const fetchOptions = { 
      method: method || 'GET', 
      headers: {
        'User-Agent': 'PostBridge-Agent/1.0' // Helps with some Graph API routing
      }
    };
    
    if (body) {
      fetchOptions.headers['Content-Type'] = 'application/json';
      fetchOptions.body = JSON.stringify(body);
    }

    // 5. Execute
    const fbRes = await fetch(url.toString(), fetchOptions);
    const data = await fbRes.json();

    return res.status(200).json(data);

  } catch (err) {
    console.error('Proxy Crash:', err);
    return res.status(500).json({ error: { message: err.message, type: 'ProxyCrash' } });
  }
};
