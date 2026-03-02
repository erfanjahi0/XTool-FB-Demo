// FB Advanced Posting Tools v2 — facebook-api.js

class FacebookAPI {
  constructor() {
    this.cookieString = null;
    this.userId       = null;
    this.fbDtsg       = null;
    this.lsdToken     = null;
    this.initialized  = false;
  }

  // ── INIT ──────────────────────────────────────────────────────────────
  async initialize() {
    if (!window.FBExtension) throw new Error("Extension bridge not loaded.");
    const data = await window.FBExtension.getFbCookies();
    if (!data || data.error) throw new Error(data?.error || "Extension not available.");
    if (!data.cookieString || !data.userId)
      throw new Error("Not logged into Facebook. Please log in at facebook.com and try again.");

    this.cookieString = data.cookieString;
    this.userId       = data.userId;
    await this.fetchCsrfTokens();
    this.initialized  = true;
    return { userId: this.userId };
  }

  async fetchCsrfTokens() {
    const html = await this.rawFetch("https://www.facebook.com/", "GET", null);
    let m = html.match(/"DTSGInitData"[^}]*"token":"([^"]+)"/)
         || html.match(/name="fb_dtsg" value="([^"]+)"/)
         || html.match(/"fb_dtsg","([^"]+)"/);
    if (!m) throw new Error("Could not extract CSRF token. Are you logged in to Facebook?");
    this.fbDtsg = m[1];
    const lsd = html.match(/"LSD",\[\],\{"token":"([^"]+)"\}/);
    if (lsd) this.lsdToken = lsd[1];
  }

  // ── RAW FETCH ─────────────────────────────────────────────────────────
  async rawFetch(url, method = "GET", body = null, extraHeaders = {}) {
    const headers = {
      "Cookie":     this.cookieString || "",
      "User-Agent": navigator.userAgent,
      ...extraHeaders
    };
    const opts = { method, headers };
    if (body) opts.body = body;
    const res  = await fetch(url, opts);
    const text = await res.text();
    if (!res.ok && res.status >= 400) {
      let errData = {};
      try { errData = JSON.parse(text); } catch {}
      const err = new Error(`HTTP ${res.status}: ${errData?.error?.message || res.statusText}`);
      err.response = errData;
      err.status   = res.status;
      throw err;
    }
    return text;
  }

  // ── GRAPH API (token-based) ───────────────────────────────────────────
  async graphAPI(endpoint, method = "GET", params = {}, accessToken = null) {
    const base = "https://graph.facebook.com/v18.0";
    const url  = new URL(`${base}${endpoint}`);
    if (accessToken) url.searchParams.set("access_token", accessToken);

    if (method === "GET") {
      for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
      const res  = await fetch(url.toString());
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      return data;
    }

    const form = new FormData();
    for (const [k, v] of Object.entries(params)) {
      if (v instanceof File || v instanceof Blob) form.append(k, v);
      else form.append(k, String(v));
    }
    const res  = await fetch(url.toString(), { method, body: form });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    return data;
  }

  // ── PAGES & AD ACCOUNTS ───────────────────────────────────────────────
  async getMyPages() {
    return this.graphAPI("/me/accounts", "GET", { fields: "id,name,access_token,fan_count,picture" });
  }

  async getAdAccounts() {
    // NOTE: No payment method required — just needs an active (status=1) Ad Account.
    // You can create an Ad Account at facebook.com/adsmanager without adding billing.
    const data = await this.graphAPI("/me/adaccounts", "GET", {
      fields: "id,name,account_status,currency"
    });
    const accounts = data?.data || [];
    // account_status 1 = ACTIVE, 2 = DISABLED, 3 = UNSETTLED, 7 = PENDING_REVIEW, 9 = IN_GRACE_PERIOD
    return accounts.filter(a => [1, 9].includes(a.account_status));
  }

  // ── VIDEO UPLOAD (resumable 3-phase) ─────────────────────────────────
  async uploadVideoWithToken(file, pageId, token, onProgress) {
    const fileSize = file.size;

    // Phase 1: Start
    if (onProgress) onProgress("Starting video upload…", 2);
    const startRes = await fetch(`https://graph.facebook.com/v18.0/${pageId}/videos`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ upload_phase: "start", file_size: fileSize, access_token: token })
    });
    const startData = await startRes.json();
    if (startData.error) throw new Error("Upload start failed: " + startData.error.message);

    const { upload_session_id, video_id } = startData;
    let currentStart = parseInt(startData.start_offset);
    let currentEnd   = parseInt(startData.end_offset);

    // Phase 2: Transfer chunks
    while (currentStart < fileSize) {
      const chunk = file.slice(currentStart, currentEnd);
      const form  = new FormData();
      form.append("upload_phase",      "transfer");
      form.append("upload_session_id", upload_session_id);
      form.append("start_offset",      currentStart);
      form.append("video_file_chunk",  chunk, file.name);
      form.append("access_token",      token);

      const pct = Math.round((currentStart / fileSize) * 85) + 5;
      if (onProgress) onProgress(`Uploading… ${formatFileSize(currentStart)} / ${formatFileSize(fileSize)}`, pct);

      const chunkRes  = await fetch(`https://graph.facebook.com/v18.0/${pageId}/videos`, { method: "POST", body: form });
      const chunkData = await chunkRes.json();
      if (chunkData.error) throw new Error("Chunk upload failed: " + chunkData.error.message);

      currentStart = parseInt(chunkData.start_offset);
      currentEnd   = parseInt(chunkData.end_offset);
      if (currentStart >= fileSize) break;
    }

    // Phase 3: Finish
    if (onProgress) onProgress("Finalizing upload…", 90);
    const finishRes = await fetch(`https://graph.facebook.com/v18.0/${pageId}/videos`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ upload_phase: "finish", upload_session_id, access_token: token })
    });
    const finishData = await finishRes.json();
    if (finishData.error) throw new Error("Upload finish failed: " + finishData.error.message);
    if (onProgress) onProgress("Video upload complete!", 95);
    return video_id;
  }

  // ── TOOL 1: VIDEO CAROUSEL (3–10) ────────────────────────────────────
  async createVideoCarousel(pageId, token, files, message, onProgress) {
    if (files.length < 3 || files.length > 10)
      throw new Error("Video carousel requires 3–10 videos.");

    const videoIds = [];
    for (let i = 0; i < files.length; i++) {
      if (onProgress) onProgress(`Uploading video ${i + 1} of ${files.length}…`, Math.round((i / files.length) * 75));
      videoIds.push(await this.uploadVideoWithToken(files[i], pageId, token, null));
      if (i < files.length - 1) await humanDelay(1200, 2400);
    }

    if (onProgress) onProgress("Creating carousel post…", 90);
    const res = await fetch(`https://graph.facebook.com/v18.0/${pageId}/feed`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        message,
        child_attachments:     JSON.stringify(videoIds.map(id => ({ media_fbid: id }))),
        multi_share_end_card:  "false",
        multi_share_optimized: "false",
        access_token:          token
      })
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    if (onProgress) onProgress("Done!", 100);
    return data;
  }

  // ── TOOL 2: SWIPE-UP ─────────────────────────────────────────────────
  async createSwipeUpPost(pageId, token, videoFile, linkUrl, ctaType, message, onProgress) {
    if (onProgress) onProgress("Uploading video…", 5);
    const videoId = await this.uploadVideoWithToken(videoFile, pageId, token, onProgress);
    if (onProgress) onProgress("Creating swipe-up post…", 92);

    const res = await fetch(`https://graph.facebook.com/v18.0/${pageId}/feed`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        message,
        object_attachment: videoId,
        call_to_action: JSON.stringify({ type: ctaType, value: { link: linkUrl, link_format: "VIDEO_MOBILE_SWIPE_UP" } }),
        access_token: token
      })
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    if (onProgress) onProgress("Done!", 100);
    return data;
  }

  // ── TOOL 3: 2-CARD CAROUSEL ──────────────────────────────────────────
  async createTwoCardCarousel(pageId, token, file1, file2, message, link1, link2, onProgress) {
    if (onProgress) onProgress("Uploading video 1 of 2…", 5);
    const vid1 = await this.uploadVideoWithToken(file1, pageId, token, null);
    await humanDelay(1000, 1800);
    if (onProgress) onProgress("Uploading video 2 of 2…", 50);
    const vid2 = await this.uploadVideoWithToken(file2, pageId, token, null);
    if (onProgress) onProgress("Creating 2-card carousel…", 92);

    const c1 = { media_fbid: vid1 }; if (link1) c1.link = link1;
    const c2 = { media_fbid: vid2 }; if (link2) c2.link = link2;

    const res = await fetch(`https://graph.facebook.com/v18.0/${pageId}/feed`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        message,
        child_attachments:     JSON.stringify([c1, c2]),
        multi_share_end_card:  "false",
        multi_share_optimized: "false",
        access_token:          token
      })
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    if (onProgress) onProgress("Done!", 100);
    return data;
  }

  // ── TOOL 4: ONE CARD V2 ──────────────────────────────────────────────
  // NOTE: No payment method needed on the Ad Account.
  // We only create an adcreative object (free) and publish it organically.
  async generateOneCardV2(adAccountId, pageId, token, imageFile, linkUrl, headline, desc, fakeCount, message, onProgress) {
    // Step 1: Upload image
    if (onProgress) onProgress("Uploading image to Ad Account…", 10);
    const imgForm = new FormData();
    imgForm.append("filename",     imageFile, imageFile.name);
    imgForm.append("access_token", token);

    const imgRes  = await fetch(`https://graph.facebook.com/v18.0/act_${adAccountId}/adimages`, {
      method: "POST", body: imgForm
    });
    const imgData = await imgRes.json();
    if (imgData.error) throw new Error("Image upload failed: " + imgData.error.message);

    const imageHash = Object.values(imgData.images || {})[0]?.hash;
    if (!imageHash) throw new Error("Could not extract image hash from upload response.");

    // Step 2: Create ad creative (no payment needed — just creating the object)
    if (onProgress) onProgress("Creating ad creative…", 40);
    const objectStorySpec = {
      page_id: pageId,
      link_data: {
        image_hash:  imageHash,
        link:        linkUrl,
        message:     message || "",
        name:        headline || "",
        description: desc || "",
        child_attachments: [{
          image_hash:  imageHash,
          link:        linkUrl,
          name:        headline || "",
          description: desc || ""
        }],
        multi_share_end_card: false,
        ...(fakeCount > 0 ? { fake_album_count: parseInt(fakeCount) } : {})
      }
    };

    const creativeRes = await fetch(`https://graph.facebook.com/v18.0/act_${adAccountId}/adcreatives`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        name:                `OneCardV2_${Date.now()}`,
        object_story_spec:   JSON.stringify(objectStorySpec),
        access_token:        token
      })
    });
    const creativeData = await creativeRes.json();
    if (creativeData.error) throw new Error("Ad creative failed: " + creativeData.error.message);

    // Step 3: Publish organically to Page feed
    if (onProgress) onProgress("Publishing to Page…", 80);
    const postRes = await fetch(`https://graph.facebook.com/v18.0/${pageId}/feed`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        message,
        creative:     JSON.stringify({ creative_id: creativeData.id }),
        published:    "true",
        access_token: token
      })
    });
    const postData = await postRes.json();
    if (postData.error) throw new Error("Page post failed: " + postData.error.message);
    if (onProgress) onProgress("Done!", 100);
    return postData;
  }
}

window.FB_API = new FacebookAPI();
