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
    try {
      const cookieResult = await window.FBExtension.getFbCookies();
      if (!cookieResult.success) throw new Error(cookieResult.error || 'Failed to get cookies');
      
      this.cookieString = cookieResult.cookieString;
      this.userId = cookieResult.userId;
      await this.fetchCsrfTokens();
      this.initialized = true;
      return { success: true, userId: this.userId };
    } catch (error) {
      throw new Error('Initialization failed: ' + error.message);
    }
  }

  async fetchCsrfTokens() {
    try {
      const csrfResult = await window.FBExtension.getCsrfToken(this.cookieString);
      if (csrfResult.success && csrfResult.fbDtsg) {
        this.fbDtsg = csrfResult.fbDtsg;
        this.lsdToken = csrfResult.lsdToken || '';
        return;
      }
      // Manual fallback
      const res = await fetch('https://www.facebook.com/', { headers: { 'Cookie': this.cookieString } });
      const html = await res.text();
      const dtsgMatch = html.match(/"DTSGInitData"[^}]*"token":"([^"]+)"/);
      if (dtsgMatch) this.fbDtsg = dtsgMatch[1];
      const lsdMatch = html.match(/"LSD"[^}]*"token":"([^"]+)"/);
      if (lsdMatch) this.lsdToken = lsdMatch[1];
      if (!this.fbDtsg) throw new Error('Could not find fb_dtsg');
    } catch (e) {
      throw new Error('CSRF Token fetch failed: ' + e.message);
    }
  }

  async rawFetch(url, method = 'GET', body = null, headers = {}) {
    const options = { method, headers: { 'Cookie': this.cookieString, ...headers }, credentials: 'omit' };
    if (body) options.body = body;
    return fetch(url, options);
  }

  async graphGet(endpoint, params = {}) {
    const url = new URL(`${this.graphBaseUrl}/${endpoint}`);
    Object.keys(params).forEach(k => url.searchParams.append(k, params[k]));
    const res = await this.rawFetch(url.toString());
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    return data;
  }

  async graphPost(endpoint, params = {}, token = null) {
    const form = new URLSearchParams();
    Object.keys(params).forEach(k => form.append(k, typeof params[k] === 'object' ? JSON.stringify(params[k]) : params[k]));
    if (token) form.append('access_token', token);
    const res = await this.rawFetch(`${this.graphBaseUrl}/${endpoint}`, 'POST', form, { 'Content-Type': 'application/x-www-form-urlencoded' });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    return data;
  }

  async getMyPages() {
    const data = await this.graphGet('me/accounts', { fields: 'id,name,access_token', limit: 100 });
    return data.data || [];
  }

  // CORRECTED: No status filter
  async getAdAccounts() {
    const data = await this.graphGet('me/adaccounts', { fields: 'id,name,account_status', limit: 100 });
    return data.data || [];
  }

  async uploadVideoWithToken(file, pageId, token, onProgress) {
    const size = file.size;
    onProgress?.('Starting upload...', 5);
    
    // Phase 1
    const start = await this.graphPost(`${pageId}/videos`, { upload_phase: 'start', file_size: size }, token);
    const sessionId = start.upload_session_id;
    const videoId = start.video_id;
    
    // Phase 2
    const chunkSize = 25 * 1024 * 1024;
    let offset = 0;
    let chunkNum = 0;
    
    while (offset < size) {
      const chunk = file.slice(offset, offset + chunkSize);
      const fd = new FormData();
      fd.append('upload_phase', 'transfer');
      fd.append('upload_session_id', sessionId);
      fd.append('start_offset', offset);
      fd.append('video_file_chunk', chunk);
      fd.append('access_token', token);
      
      const res = await fetch(`https://graph-video.facebook.com/${this.graphVersion}/${pageId}/videos`, { method: 'POST', body: fd, headers: { 'Cookie': this.cookieString } });
      const result = await res.json();
      if (result.error) throw new Error(result.error.message);
      
      offset = parseInt(result.start_offset);
      chunkNum++;
      onProgress?.(`Uploading chunk ${chunkNum}...`, 5 + Math.floor((offset / size) * 80));
      await Utils.humanDelay(100, 200);
    }
    
    // Phase 3
    onProgress?.('Finalizing...', 95);
    await this.graphPost(`${pageId}/videos`, { upload_phase: 'finish', upload_session_id: sessionId }, token);
    onProgress?.('Done.', 100);
    return videoId;
  }

  async createVideoCarousel(pageId, token, files, message, onProgress) {
    const ids = [];
    for (let i = 0; i < files.length; i++) {
      onProgress?.(`Video ${i + 1}/${files.length}`, (i / files.length) * 90);
      ids.push(await this.uploadVideoWithToken(files[i], pageId, token, (t, p) => onProgress?.(t, (i / files.length) * 90 + (p / files.length))));
      await Utils.humanDelay(300, 600);
    }
    onProgress?.('Creating post...', 95);
    const res = await this.graphPost(`${pageId}/feed`, { message, child_attachments: ids.map(id => ({ media_fbid: id })), multi_share_end_card: false, multi_share_optimized: false }, token);
    return { success: true, postId: res.id, postUrl: `https://facebook.com/${res.id}` };
  }

  async createSwipeUpPost(pageId, token, file, link, cta, message, onProgress) {
    const vid = await this.uploadVideoWithToken(file, pageId, token, (t, p) => onProgress?.(t, p * 0.9));
    onProgress?.('Creating post...', 95);
    const res = await this.graphPost(`${pageId}/feed`, { message, object_attachment: vid, call_to_action: { type: cta, value: { link, link_format: 'VIDEO_MOBILE_SWIPE_UP' } } }, token);
    return { success: true, postId: res.id, postUrl: `https://facebook.com/${res.id}` };
  }

  async createTwoCardCarousel(pageId, token, v1, v2, message, l1, l2, onProgress) {
    onProgress?.('Video 1...', 0);
    const id1 = await this.uploadVideoWithToken(v1, pageId, token, (t, p) => onProgress?.(t, p * 0.45));
    onProgress?.('Video 2...', 50);
    const id2 = await this.uploadVideoWithToken(v2, pageId, token, (t, p) => onProgress?.(t, 45 + p * 0.45));
    onProgress?.('Creating post...', 95);
    const res = await this.graphPost(`${pageId}/feed`, { message, child_attachments: [{ media_fbid: id1, link: l1 }, { media_fbid: id2, link: l2 }], multi_share_end_card: false, multi_share_optimized: false }, token);
    return { success: true, postId: res.id, postUrl: `https://facebook.com/${res.id}` };
  }

  async generateOneCardV2(adId, pageId, token, img, link, headline, desc, count, message, onProgress) {
    onProgress?.('Uploading image...', 10);
    const fd = new FormData();
    fd.append('filename', img);
    fd.append('access_token', token);
    let res = await fetch(`${this.graphBaseUrl}/act_${adId}/adimages`, { method: 'POST', body: fd, headers: { 'Cookie': this.cookieString } });
    let data = await res.json();
    if (data.error) throw new Error(data.error.message);
    const hash = Object.values(data.images)[0].hash;

    onProgress?.('Creating creative...', 50);
    const creative = await this.graphPost(`act_${adId}/adcreatives`, { name: `OneCard ${Date.now()}`, object_story_spec: { page_id: pageId, link_data: { link, name: headline, description: desc, image_hash: hash, child_attachments: [{ link, name: headline, description: desc, image_hash: hash }], multi_share_end_card: false, fake_album_count: parseInt(count) } } }, token);

    onProgress?.('Fetching post...', 80);
    res = await fetch(`${this.graphBaseUrl}/${creative.id}?fields=object_story_id&access_token=${token}`, { headers: { 'Cookie': this.cookieString } });
    const post = await res.json();
    
    onProgress?.('Done!', 100);
    return { success: true, postId: post.object_story_id, postUrl: `https://facebook.com/${post.object_story_id}` };
  }
}

window.FacebookAPI = FacebookAPI;
window.FB_API = new FacebookAPI();
