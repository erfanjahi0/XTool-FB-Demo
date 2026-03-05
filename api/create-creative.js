// POST /api/create-creative
// Body JSON: { token, adaId, pageId, hash, caption, headline, link, dispUrl, cta }
// Returns: { creativeId, storyId }
const { send, preflight, fbPost } = require('./_fb');

module.exports = async function handler(req, res) {
  if (preflight(req, res)) return;
  if (req.method !== 'POST') return send(res, 405, { error: { message: 'POST only' } });

  const { token, adaId, pageId, hash, caption, headline, link, dispUrl, cta } = req.body || {};

  if (!token || !adaId || !pageId || !hash || !link)
    return send(res, 400, { error: { message: 'token, adaId, pageId, hash, and link are required' } });

  try {
    const ld = { link, image_hash: hash };
    if (caption)           ld.message          = caption;
    if (headline)          ld.name             = headline;
    if (dispUrl)           ld.caption          = dispUrl;
    if (cta && cta !== 'NONE') ld.call_to_action = { type: cta };

    const body = {
      name: `OB_${Date.now()}`,
      object_story_spec: { page_id: pageId, link_data: ld },
    };

    const data = await fbPost(
      `${adaId}/adcreatives`,
      { access_token: token, fields: 'effective_object_story_id' },
      body
    );

    if (data.error) return send(res, 400, { error: data.error });
    if (!data.id)   return send(res, 400, { error: { code: 0, message: 'Creative created but no ID returned.', type: 'ClientError' } });

    send(res, 200, { creativeId: data.id, storyId: data.effective_object_story_id || null });
  } catch (e) {
    send(res, 500, { error: { message: e.message } });
  }
};
