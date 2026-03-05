// POST /api/publish
// Body JSON: { pageToken, pageId, creativeId }
// Returns: Facebook feed response
const { send, preflight, fbPost } = require('./_fb');

module.exports = async function handler(req, res) {
  if (preflight(req, res)) return;
  if (req.method !== 'POST') return send(res, 405, { error: { message: 'POST only' } });

  const { pageToken, pageId, creativeId } = req.body || {};

  if (!pageToken || !pageId || !creativeId)
    return send(res, 400, { error: { message: 'pageToken, pageId, and creativeId are required' } });

  try {
    const data = await fbPost(
      `${pageId}/feed`,
      { access_token: pageToken },
      { creative: { creative_id: creativeId } }
    );

    if (data.error) return send(res, 400, { error: data.error });
    send(res, 200, data);
  } catch (e) {
    send(res, 500, { error: { message: e.message } });
  }
};
