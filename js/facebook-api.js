// facebook-api.js
class FacebookAPI {
  constructor() {
    this.cookieString = null;
    this.userId = null;
    this.fbDtsg = null;
    this.lsdToken = null;
    this.initialized = false;
    this.graphVersion = 'v18.0';
    this.graphBaseUrl = 'https://graph.facebook.com/' + this.graphVersion;
  }

  async initialize() {
    console.log('1. Starting Initialize...');
    try {
      // 1. Get Cookies
      console.log('2. Requesting Cookies...');
      const cookieResult = await window.FBExtension.getFbCookies();
      
      if (!cookieResult.success) {
        throw new Error(cookieResult.error || 'Failed to get cookies');
      }
      
      this.cookieString = cookieResult.cookieString;
      this.userId = cookieResult.userId;
      console.log('3. Cookies received for User:', this.userId);

      // 2. Get CSRF Token
      console.log('4. Requesting CSRF Token...');
      const csrfResult = await window.FBExtension.getCsrfToken(this.cookieString);
      
      if (!csrfResult.success) {
        throw new Error(csrfResult.error || 'Failed to get CSRF token');
      }
      
      this.fbDtsg = csrfResult.fbDtsg;
      this.lsdToken = csrfResult.lsdToken || '';
      console.log('5. Token received:', this.fbDtsg ? 'YES' : 'NO');

      if (!this.fbDtsg) {
        throw new Error('Could not find fb_dtsg token. Are you logged into Facebook?');
      }

      this.initialized = true;
      console.log('6. Initialize Success!');
      return { success: true, userId: this.userId };

    } catch (error) {
      console.error('INITIALIZE FAILED:', error);
      throw new Error('Init Failed: ' + error.message);
    }
  }

  // ... (Keep the rest of the methods: rawFetch, graphGet, etc. same as previous) ...
  // Just copy the methods from the previous full script, they are fine.
  // I will omit them here for brevity but ensure you have them in your file.
  
  async rawFetch(url, method = 'GET', body = null, headers = {}) {
    const options = { method, headers: { 'Cookie': this.cookieString, ...headers }, credentials: 'omit' };
    if (body) options.body = body;
    return fetch(url, options);
  }
  async graphGet(endpoint, params = {}) { /* Same as before */ }
  async graphPost(endpoint, params = {}, token = null) { /* Same as before */ }
  async getMyPages() { /* Same as before */ }
  async getAdAccounts() { /* Same as before */ }
  async uploadVideoWithToken(file, pageId, token, onProgress) { /* Same as before */ }
  async createVideoCarousel(pageId, token, files, message, onProgress) { /* Same as before */ }
  async createSwipeUpPost(pageId, token, file, link, cta, message, onProgress) { /* Same as before */ }
  async createTwoCardCarousel(pageId, token, v1, v2, message, l1, l2, onProgress) { /* Same as before */ }
  async generateOneCardV2(adId, pageId, token, img, link, headline, desc, count, message, onProgress) { /* Same as before */ }
}

window.FacebookAPI = FacebookAPI;
window.FB_API = new FacebookAPI();
