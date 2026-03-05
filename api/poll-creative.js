// GET /api/poll-creative?token=&creativeId=
// Returns: { storyId, attempts } or error after 12 tries
//
// Note: Vercel serverless functions time out at 10 s (hobby) / 60 s (pro).
// We do a single poll attempt per call; the frontend retries up to 12 times
// with 2.5 s gaps between calls (total ≤ 30 s well within limits).
const { send, preflight, fbGet } = require('./_fb');

module.exports = async function handler(req, res) {
  if (preflight(req, res)) return;

  const { token, creativeId } = req.query;
  if (!token || !creativeId)
    return send(res, 400, { error: { message: 'token and creativeId are required' } });

  try {
    const data = await fbGet(creativeId, {
      access_token: token,
      fields: 'effective_object_story_id',
    });

    if (data.error) return send(res, 400, { error: data.error });

    // Return storyId (may be null if not ready yet — frontend will retry)
    send(res, 200, { storyId: data.effective_object_story_id || null });
  } catch (e) {
    send(res, 500, { error: { message: e.message } });
  }
};
