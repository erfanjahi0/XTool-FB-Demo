// POST /api/upload-image
// Body: multipart/form-data { token, adaId, image: <file> }
// Returns: { hash }
// Uses native fetch + FormData (both built into Node 24)

const { send, preflight } = require('./_fb');
const FB_API = 'https://graph.facebook.com/v21.0';

// Disable Vercel's body parser so we can read the raw stream
module.exports = async function handler(req, res) {
  if (preflight(req, res)) return;
  if (req.method !== 'POST') return send(res, 405, { error: { message: 'POST only' } });

  try {
    const buf = await rawBody(req);
    const ct  = req.headers['content-type'] || '';
    const bnd = (ct.match(/boundary=([^\s;]+)/) || [])[1];
    if (!bnd) return send(res, 400, { error: { message: 'Missing multipart boundary' } });

    const { fields, files } = parseMultipart(buf, bnd);
    const { token, adaId } = fields;
    const file = files['image'];

    if (!token || !adaId || !file)
      return send(res, 400, { error: { message: 'token, adaId, and image are required' } });

    const safeName = file.filename.replace(/\s+/g, '_');

    // Use native FormData + Blob (Node 24 built-ins)
    const fd   = new FormData();
    const blob = new Blob([file.data], { type: file.contentType });
    fd.append(safeName, blob, safeName);

    const u = new URL(`${FB_API}/${adaId}/adimages/`);
    u.searchParams.set('access_token', token);
    u.searchParams.set('fields', 'url');

    const r = await fetch(u.toString(), { method: 'POST', body: fd });
    const d = await r.json();

    if (d.error) return send(res, 400, { error: d.error });

    const img = d.images?.[safeName];
    if (!img?.hash)
      return send(res, 400, { error: { code: 0, message: 'No hash returned — check filename.', type: 'ClientError' } });

    send(res, 200, { hash: img.hash });
  } catch (e) {
    send(res, 500, { error: { message: e.message, stack: e.stack } });
  }
};

module.exports.config = { api: { bodyParser: false } };

function rawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function parseMultipart(buffer, boundary) {
  const fields = {};
  const files  = {};
  const bndBuf = Buffer.from(`--${boundary}`);
  const parts  = [];

  let start = 0;
  while (start < buffer.length) {
    const idx = buffer.indexOf(bndBuf, start);
    if (idx === -1) break;
    const cs  = idx + bndBuf.length;
    const nxt = buffer.indexOf(bndBuf, cs);
    const end = nxt === -1 ? buffer.length : nxt;
    const part = buffer.slice(cs, end);
    if (part.length > 4) parts.push(part);
    start = end;
  }

  for (const part of parts) {
    const sep = part.indexOf('\r\n\r\n');
    if (sep === -1) continue;
    const hdr  = part.slice(2, sep).toString();
    const body = part.slice(sep + 4, part.length - 2);
    const nm   = (hdr.match(/name="([^"]+)"/)     || [])[1];
    const fn   = (hdr.match(/filename="([^"]+)"/) || [])[1];
    const ct   = (hdr.match(/Content-Type:\s*([^\r\n]+)/i) || [])[1];
    if (!nm) continue;
    if (fn) {
      files[nm] = { filename: fn, contentType: ct?.trim() || 'application/octet-stream', data: body };
    } else {
      fields[nm] = body.toString();
    }
  }
  return { fields, files };
}
