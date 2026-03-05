// /api/accounts?token=EAAB...
// Returns: { pages: [...], adaccounts: [...] }
const { send, preflight, fbGet } = require('./_fb');

module.exports = async function handler(req, res) {
  if (preflight(req, res)) return;

  const { token } = req.query;
  if (!token) return send(res, 400, { error: { message: 'token is required' } });

  try {
    const [pagesData, acctData] = await Promise.all([
      fbGet('me/accounts', {
        access_token: token,
        fields: 'access_token,id,name,picture,is_published',
        limit: '100',
      }),
      fbGet('me/adaccounts', {
        access_token: token,
        fields: 'account_status,account_id',
      }),
    ]);

    if (pagesData.error) return send(res, 400, { error: pagesData.error });
    if (acctData.error)  return send(res, 400, { error: acctData.error });

    send(res, 200, {
      pages:      pagesData.data || [],
      adaccounts: acctData.data  || [],
    });
  } catch (e) {
    send(res, 500, { error: { message: e.message } });
  }
};
