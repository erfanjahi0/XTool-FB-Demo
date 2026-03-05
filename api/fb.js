// api/fb.js
export default async function handler(req, res) {
  // 1. Security: Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 2. Parse the request from the frontend
  const { path, method, params, body } = req.body;

  if (!path) {
    return res.status(400).json({ error: 'Missing API path' });
  }

  try {
    // 3. Construct the Facebook URL
    const url = new URL(`https://graph.facebook.com/v21.0/${path}`);
    
    // Add params (like access_token) to URL
    if (params) {
      Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
    }

    // 4. Prepare fetch options
    const fetchOptions = { method: method || 'GET' };
    
    if (body) {
      // If we are uploading an image (FormData came through as object), we need to handle it
      // Note: For simplicity in this fix, we assume image upload sends a hash or URL.
      // If uploading raw files, you'd need 'form-data' parsing, but let's stick to JSON payloads for now.
      fetchOptions.headers = { 'Content-Type': 'application/json' };
      fetchOptions.body = JSON.stringify(body);
    }

    // 5. Call Facebook
    const fbRes = await fetch(url.toString(), fetchOptions);
    const data = await fbRes.json();

    // 6. Return Facebook's response to the browser
    res.status(200).json(data);

  } catch (error) {
    console.error('Proxy Error:', error);
    res.status(500).json({ error: { message: error.message, type: 'ProxyError' } });
  }
}
