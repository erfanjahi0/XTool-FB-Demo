// GET /api/verify?pageToken=&storyId=
// Returns: Facebook story object
const { send, preflight, fbGet } = require('./_fb');

module.exports = async function handler(req, res) {
  if (preflight(req, res)) return;

  const { pageToken, storyId } = req.query;
  if (!pageToken || !storyId)
    return send(res, 400, { error: { message: 'pageToken and storyId are required' } });

  try {
    const data = await fbGet(storyId, {
      access_token: pageToken,
      fields: 'effective_object_story_id',
    });

    if (data.error) return send(res, 400, { error: data.error });
    send(res, 200, data);
  } catch (e) {
    send(res, 500, { error: { message: e.message } });
  }
};
