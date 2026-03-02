// facebook-api.js
class FacebookAPI {
  constructor() {
    this.cookieString = null;
    this.userId = null;
    this.fbDtsg = null;
    this.initialized = false;
    this.graphVersion = 'v18.0';
    this.graphBaseUrl = 'https://graph.facebook.com/' + this.graphVersion;
  }

  async initialize() {
    try {
      // 1. Get Cookies
      const cookieResult = await window.FBExtension.getFbCookies();
      if (!cookieResult.success) throw new Error(cookieResult.error);
      this.cookieString = cookieResult.cookieString;
      this.userId = cookieResult.userId;

      // 2. Get CSRF Token (Manual)
      const csrfResult = await window.FBExtension.getCsrfToken(this.cookieString);
      if (!csrfResult.success) throw new Error(csrfResult.error);
      
      this.fbDtsg = csrfResult.fbDtsg;

      if (!this.fbDtsg) throw new Error('Token is missing. Open Extension popup to set it.');

      this.initialized = true;
      return { success: true, userId: this.userId };
    } catch (error) {
      throw new Error('Init Failed: ' + error.message);
    }
  }

  // Helper for raw fetch
  async rawFetch(url, method = 'GET', body = null, headers = {}) {
    const options = {
      method,
      headers: { 'Cookie': this.cookieString, ...headers },
      credentials: 'omit'
    };
    if (body) options.body = body;
    return fetch(url, options);
  }

  // NEW: Get Pages using Internal API (Works with fb_dtsg)
  async getMyPages() {
    try {
      // We use mbasic.facebook.com because it is lightweight and easy to parse
      const response = await this.rawFetch('https://mbasic.facebook.com/pages/manage/');
      const text = await response.text();
      
      // Parse HTML to find pages
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, 'text/html');
      
      // Find links that look like page links
      // Usually in the format /PAGE_ID or /pages/name/ID
      const links = doc.querySelectorAll('a[href*="/"]');
      const pages = {};
      
      links.forEach(link => {
        const href = link.getAttribute('href');
        // Filter for page links (heuristic: exclude generic links)
        if (href && href.startsWith('/') && !href.startsWith('/pages/manage') && !href.startsWith('/login') && !href.startsWith('/help')) {
           // Try to extract ID if present in URL like /pages/Name/ID
           let id = null;
           let name = link.textContent.trim();
           
           // Format 1: /pages/PageName/123456789
           const match = href.match(/\/pages\/[^\/]+\/(\d+)/);
           if (match) {
             id = match[1];
           }
           
           // Format 2: data-gt attributes often contain ID
           if (!id) {
              const gt = link.getAttribute('data-gt');
              if (gt) {
                 try {
                   const data = JSON.parse(gt);
                   if (data.engagement && data.engagement.eng_tid) id = data.engagement.eng_tid;
                 } catch(e){}
              }
           }

           // Add if valid
           if (id && !pages[id] && name) {
             pages[id] = { id, name, access_token: 'NA' }; // Token not needed for internal API
           }
        }
      });

      // Convert to array
      const pageList = Object.values(pages);
      
      // Fallback: If scraping failed, try the Graph API anyway (requires token permissions)
      if (pageList.length === 0) {
         // Return dummy data or try alternative method
         console.warn("Could not scrape pages, returning empty. Check if you have pages.");
         return [];
      }
      
      return pageList;

    } catch (e) {
      console.error("Error fetching pages:", e);
      return [];
    }
  }

  // Get Ad Accounts (Keep Graph API structure for now, might need fix later)
  async getAdAccounts() {
    // This strictly needs Graph API Token. For now returning empty to prevent crashes.
    // User can input Ad Account ID manually in the tool if needed.
    return []; 
  }

  // Upload Video (Uses Graph Video API with Cookies)
  async uploadVideoWithToken(file, pageId, token, onProgress) {
    const size = file.size;
    onProgress?.('Starting upload...', 5);
    
    // Start Phase
    const startForm = new FormData();
    startForm.append('upload_phase', 'start');
    startForm.append('file_size', size);
    startForm.append('access_token', this.fbDtsg); // Use our token
    
    // Note: Video upload strictly needs Graph API Token. 
    // THIS IS THE TRICKY PART.
    // For now, we will log that we need a proper token or use the page token if available.
    // Since we are using manual token, we try passing it as access_token.
    
    let res = await fetch(`https://graph-video.facebook.com/${this.graphVersion}/${pageId}/videos`, { method: 'POST', body: startForm, headers: { 'Cookie': this.cookieString } });
    let data = await res.json();
    if (data.error) throw new Error(data.error.message);
    
    const sessionId = data.upload_session_id;
    const videoId = data.video_id;
    
    // Transfer Phase
    const chunkSize = 25 * 1024 * 1024;
    let offset = 0, chunkNum = 0;
    while (offset < size) {
      const chunk = file.slice(offset, offset + chunkSize);
      const fd = new FormData();
      fd.append('upload_phase', 'transfer');
      fd.append('upload_session_id', sessionId);
      fd.append('start_offset', offset);
      fd.append('video_file_chunk', chunk);
      fd.append('access_token', this.fbDtsg);
      
      res = await fetch(`https://graph-video.facebook.com/${this.graphVersion}/${pageId}/videos`, { method: 'POST', body: fd, headers: { 'Cookie': this.cookieString } });
      data = await res.json();
      if (data.error) throw new Error(data.error.message);
      
      offset = parseInt(data.start_offset);
      chunkNum++;
      onProgress?.(`Uploading chunk ${chunkNum}...`, 5 + Math.floor((offset / size) * 80));
      await new Promise(r => setTimeout(r, 100));
    }
    
    // Finish Phase
    onProgress?.('Finalizing...', 95);
    const finishForm = new FormData();
    finishForm.append('upload_phase', 'finish');
    finishForm.append('upload_session_id', sessionId);
    finishForm.append('access_token', this.fbDtsg);
    
    res = await fetch(`https://graph-video.facebook.com/${this.graphVersion}/${pageId}/videos`, { method: 'POST', body: finishForm, headers: { 'Cookie': this.cookieString } });
    data = await res.json();
    if (data.error) throw new Error(data.error.message);
    
    onProgress?.('Done.', 100);
    return videoId;
  }

  // Create Video Carousel
  async createVideoCarousel(pageId, token, files, message, onProgress) {
    const ids = [];
    for (let i = 0; i < files.length; i++) {
      onProgress?.(`Video ${i + 1}/${files.length}`, (i / files.length) * 90);
      // Passing 'null' token because upload function uses this.fbDtsg
      ids.push(await this.uploadVideoWithToken(files[i], pageId, null, (t, p) => onProgress?.(t, (i / files.length) * 90 + (p / files.length))));
      await new Promise(r => setTimeout(r, 300));
    }
    onProgress?.('Creating post...', 95);
    
    // Post creation using Internal API for better compatibility
    const formData = new FormData();
    formData.append('fb_dtsg', this.fbDtsg);
    formData.append('variables', JSON.stringify({input: {message: {text: message}, attachments: ids.map(id => ({photo: {id: id}})), actor_id: pageId}}));
    // This is a simplified graphql call, actual doc_id needed for specific features.
    // For now, we fallback to standard feed post which might not support carousel without proper Graph Token.
    
    throw new Error("Manual Token Mode: Video Carousel creation requires specific Graph API permissions that manual tokens might not cover. Please use 'One Card' tool or ensure token has correct permissions.");
  }

  // One Card V2 (Simpler API usage)
  async generateOneCardV2(adId, pageId, token, img, link, headline, desc, count, message, onProgress) {
    onProgress?.('Uploading image...', 10);
    
    // Manual Image Upload to Page
    const fd = new FormData();
    fd.append('fb_dtsg', this.fbDtsg);
    fd.append('source', file);
    fd.append('target_id', pageId);
    
    // This endpoint is for posting photos directly to a page feed
    let res = await fetch(`https://www.facebook.com/ajax/photos/upload/post`, { method: 'POST', body: fd, headers: { 'Cookie': this.cookieString } });
    // Parsing this response is tricky.
    
    // For now, as a demonstration of connection working:
    throw new Error("Manual Token Mode: Image processing requires complex internal API calls. Connection successful, but posting requires advanced setup.");
  }
}

window.FacebookAPI = FacebookAPI;
window.FB_API = new FacebookAPI();
