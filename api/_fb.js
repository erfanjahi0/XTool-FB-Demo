// Shared helper — uses Node 24 native fetch (no node-fetch needed)
const FB_API = 'https://graph.facebook.com/v21.0';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function send(res, status, body) {
  res.status(status).set(CORS).json(body);
}

function preflight(req, res) {
  if (req.method === 'OPTIONS') {
    res.status(204).set(CORS).end();
    return true;
  }
  return false;
}

async function fbGet(path, params = {}) {
  const u = new URL(`${FB_API}/${path}`);
  Object.entries(params).forEach(([k, v]) => u.searchParams.set(k, v));
  const r = await fetch(u.toString());
  return r.json();
}

async function fbPost(path, params = {}, jsonBody = null, formBody = null) {
  const u = new URL(`${FB_API}/${path}`);
  Object.entries(params).forEach(([k, v]) => u.searchParams.set(k, v));
  const opts = { method: 'POST' };
  if (formBody) {
    opts.body = formBody;
  } else {
    opts.headers = { 'Content-Type': 'application/json' };
    opts.body = JSON.stringify(jsonBody);
  }
  const r = await fetch(u.toString(), opts);
  return r.json();
}

module.exports = { send, preflight, fbGet, fbPost, CORS };
