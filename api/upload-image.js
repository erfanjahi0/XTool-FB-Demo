// POST /api/upload-image
// Body: multipart/form-data  { token, adaId, image: <file> }
// Returns: { hash }
//
// Vercel doesn't parse multipart bodies by default, so we stream
// the raw buffer ourselves using the built-in request stream.

const fetch      = require('node-fetch');
const FormData   = require('form-data');
const { send, preflight, CORS } = require('./_fb');

// Tell Vercel NOT to parse the body — we need the raw stream
export const config = { api: { bodyParser: false } };

const FB_API = 'https://graph.facebook.com/v21.0';

/** Read entire request body as a Buffer */
function rawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

/** Parse multipart body manually (simple single-file parser) */
function parseMultipart(buffer, boundary) {
  const fields  = {};
  const files   = {};
  const bndBuf  = Buffer.from(`--${boundary}`);
  const parts   = [];

  let start = 0;
  while (start < buffer.length) {
    const bndIdx = buffer.indexOf(bndBuf, start);
    if (bndIdx === -1) break;
    const contentStart = bndIdx + bndBuf.length;
    const nextBnd = buffer.indexOf(bndBuf, contentStart);
    const partEnd = nextBnd === -1 ? buffer.length : nextBnd;
    const part = buffer.slice(contentStart, partEnd);
    if (part.length > 4) parts.push(part);
    start = partEnd;
  }

  for (const part of parts) {
    // Headers end at first \r\n\r\n
    const sepIdx = part.indexOf('\r\n\r\n');
    if (sepIdx === -1) continue;
    const headerStr = part.slice(2, sepIdx).toString();   // skip leading \r\n
    const body      = part.slice(sepIdx + 4, part.length - 2); // trim trailing \r\n

    const nameMatch     = headerStr.match(/name="([^"]+)"/);
    const fileNameMatch = headerStr.match(/filename="([^"]+)"/);
    const ctMatch       = headerStr.match(/Content-Type:\s*([^\r\n]+)/i);

    if (!nameMatch) continue;
    const fieldName = nameMatch[1];

    if (fileNameMatch) {
      files[fieldName] = {
        filename:    fileNameMatch[1],
        contentType: ctMatch ? ctMatch[1].trim() : 'application/octet-stream',
        data:        body,
      };
    } else {
      fields[fieldName] = body.toString();
    }
  }
  return { fields, files };
}

module.exports = async function handler(req, res) {
  if (preflight(req, res)) return;
  if (req.method !== 'POST') return send(res, 405, { error: { message: 'POST only' } });

  try {
    const buf      = await rawBody(req);
    const ct       = req.headers['content-type'] || '';
    const bndMatch = ct.match(/boundary=([^\s;]+)/);
    if (!bndMatch) return send(res, 400, { error: { message: 'Missing multipart boundary' } });

    const { fields, files } = parseMultipart(buf, bndMatch[1]);
    const { token, adaId }  = fields;
    const file = files['image'];

    if (!token || !adaId || !file)
      return send(res, 400, { error: { message: 'token, adaId, and image are required' } });

    const safeName = file.filename.replace(/\s+/g, '_');
    const fd       = new FormData();
    fd.append(safeName, file.data, { filename: safeName, contentType: file.contentType });

    const u = new URL(`${FB_API}/${adaId}/adimages/`);
    u.searchParams.set('access_token', token);
    u.searchParams.set('fields', 'url');

    const r = await fetch(u.toString(), { method: 'POST', body: fd });
    const d = await r.json();

    if (d.error) return send(res, 400, { error: d.error });

    const img = d.images?.[safeName];
    if (!img?.hash)
      return send(res, 400, { error: { code: 0, message: 'No hash returned — check filename characters.', type: 'ClientError' } });

    send(res, 200, { hash: img.hash });
  } catch (e) {
    send(res, 500, { error: { message: e.message } });
  }
};
