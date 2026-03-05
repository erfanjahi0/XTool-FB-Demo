// 1. Import fetch from the package we defined in package.json
const fetch = require('node-fetch');

module.exports = async (req, res) => {
  // 2. Allow your frontend to talk to this function
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 3. Handle "preflight" browser checks
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 4. Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 5. Global error catcher
  try {
    // Parse the incoming request
    // Vercel automatically parses JSON bodies into req.body
    const { path, method, params, body } = req.body;

    if (!path) {
      return res.status(400).json({ error: 'Missing "path" in request body' });
    }

    // Build the Facebook URL
    const url = new URL(`https://graph.facebook.com/v21.0/${path}`);
    
    // Add query parameters (like access_token)
    if (params) {
      Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
    }

    // Prepare options for the Facebook request
    const fetchOptions = { method: method || 'GET', headers: {} };

    if (body) {
      fetchOptions.headers['Content-Type'] = 'application/json';
      fetchOptions.body = JSON.stringify(body);
    }

    // 6. Call Facebook
    const fbRes = await fetch(url.toString(), fetchOptions);
    const data = await fbRes.json();

    // 7. Send Facebook's response back to your frontend
    return res.status(200).json(data);

  } catch (err) {
    // If anything crashes, send the error details to the frontend
    console.error('CRITICAL ERROR:', err);
    return res.status(500).json({ 
      error: { 
        message: err.message || 'Unknown Server Error', 
        type: 'ServerError',
        stack: err.stack // Remove this in production if you want
      } 
    });
  }
};
