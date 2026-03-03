/* ============================================================
   FB Ad Organic Publisher — app.js
   All Facebook API logic. No backend. No extension.
   credentials:"include" handles auth invisibly.
   ============================================================ */

class FacebookAPI {
  constructor() {
    this.userId = null;
    this.fbDtsg = null;
    this.lsd = null;
    this.userToken = null;
    this.pages = [];
    this.adAccounts = [];
    this.initialized = false;
  }

  // ── AUTH ──────────────────────────────────────────────────

  async initViaSession() {
    await this.fetchCsrfTokens();
    await this.fetchUserAccessToken();
    await this.loadPages();
    this.initialized = true;
    return await this.getMe();
  }

  async initViaToken(token) {
    this.userToken = token;
    await this.fetchCsrfTokens();
    await this.loadPages();
    this.initialized = true;
    return await this.getMe();
  }

  async fetchCsrfTokens() {
    const res = await fetch("https://www.facebook.com/", {
      credentials: "include",
      headers: { "Accept": "text/html" }
    });
    const html = await res.text();

    const dtsgMatch =
      html.match(/"DTSGInitData"[^}]*"token":"([^"]+)"/) ||
      html.match(/name="fb_dtsg"\s+value="([^"]+)"/) ||
      html.match(/"fb_dtsg","([^"]{10,50})"/);

    const lsdMatch =
      html.match(/"LSD"[^}]*"token":"([^"]+)"/) ||
      html.match(/\["LSD",\[\],\{"token":"([^"]+)"/);

    if (!dtsgMatch) throw new Error("Could not extract fb_dtsg. Make sure you are logged into Facebook in this browser.");
    this.fbDtsg = dtsgMatch[1];
    this.lsd = lsdMatch ? lsdMatch[1] : "AVp2LbEb";
  }

  async fetchUserAccessToken() {
    const res = await fetch(
      "https://www.facebook.com/connect/get_token?" +
      new URLSearchParams({
        client_id: "209913376082502",
        redirect_uri: "https://www.facebook.com/connect/login_success.html",
        response_type: "token",
        scope: "ads_read,pages_read_engagement,pages_manage_posts,pages_show_list"
      }),
      { credentials: "include", redirect: "follow" }
    );
    const url = res.url;
    const match = url.match(/access_token=([^&]+)/);
    if (match) {
      this.userToken = decodeURIComponent(match[1]);
      return;
    }
    // fallback: try to get token from internal endpoint
    const body = await res.text();
    const tokenMatch = body.match(/"access_token":"([^"]+)"/);
    if (tokenMatch) {
      this.userToken = tokenMatch[1];
    } else {
      throw new Error("Could not obtain user access token. You may need to use the manual token option.");
    }
  }

  async getMe() {
    const data = await this.graphGet("me", { fields: "id,name,picture.width(80).height(80)" });
    this.userId = data.id;
    return data;
  }

  // ── GRAPH API HELPERS ─────────────────────────────────────

  async graphGet(path, params = {}) {
    const url = new URL(`https://graph.facebook.com/v19.0/${path}`);
    url.searchParams.set("access_token", this.userToken);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    const res = await fetch(url.toString(), { credentials: "include" });
    const data = await res.json();
    if (data.error) throw new Error(`Facebook API Error ${data.error.code}: ${data.error.message}`);
    return data;
  }

  async graphPost(path, params = {}) {
    const url = `https://graph.facebook.com/v19.0/${path}`;
    const body = new URLSearchParams({ access_token: this.userToken, ...params });
    const res = await fetch(url, {
      method: "POST",
      credentials: "include",
      body
    });
    const data = await res.json();
    if (data.error) throw new Error(`Facebook API Error ${data.error.code}: ${data.error.message}`);
    return data;
  }

  async internalGraphQL(docId, variables) {
    const body = new URLSearchParams({
      doc_id: docId,
      variables: JSON.stringify(variables),
      fb_dtsg: this.fbDtsg,
      lsd: this.lsd,
      server_timestamps: "true"
    });
    const res = await fetch("https://www.facebook.com/api/graphql/", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body
    });
    const data = await res.json();
    if (data.errors) throw new Error(data.errors[0].message);
    return data;
  }

  // ── PAGES & ACCOUNTS ──────────────────────────────────────

  async loadPages() {
    const data = await this.graphGet("me/accounts", {
      fields: "id,name,access_token,picture.width(40).height(40),category"
    });
    this.pages = data.data || [];
    return this.pages;
  }

  async loadAdAccounts() {
    const data = await this.graphGet("me/adaccounts", {
      fields: "id,name,account_status,currency"
    });
    this.adAccounts = data.data || [];
    return this.adAccounts;
  }

  getPageToken(pageId) {
    const page = this.pages.find(p => p.id === pageId);
    if (!page) throw new Error("Page not found or no access token available.");
    return page.access_token;
  }

  // ── FETCH CREATIVE ────────────────────────────────────────

  async fetchCreativeById(creativeId) {
    // Direct creative fetch
    const data = await this.graphGet(creativeId, {
      fields: [
        "id", "name", "status", "object_type",
        "object_story_spec", "asset_feed_spec",
        "image_url", "image_hash", "image_crops",
        "video_id", "thumbnail_url",
        "body", "title", "link_url",
        "call_to_action_type",
        "effective_object_story_id"
      ].join(",")
    });
    return this.normalizeCreative(data);
  }

  async fetchCreativeByAdId(adId) {
    const data = await this.graphGet(adId, {
      fields: "id,name,status,creative{id,name,object_type,object_story_spec,asset_feed_spec,image_url,image_hash,thumbnail_url,body,title,link_url,call_to_action_type,effective_object_story_id,video_id}"
    });
    if (!data.creative) throw new Error("This Ad has no creative attached, or you don't have permission to read it.");
    return this.normalizeCreative(data.creative);
  }

  normalizeCreative(raw) {
    const spec = raw.object_story_spec || {};
    const linkData = spec.link_data || {};
    const videoData = spec.video_data || {};
    const photoData = spec.photo_data || {};
    const templateData = spec.template_data || {};

    // Determine type
    let type = "unknown";
    if (spec.video_data) type = "video";
    else if (spec.link_data) {
      if (linkData.child_attachments && linkData.child_attachments.length > 0) {
        type = "carousel";
      } else {
        type = "link";
      }
    } else if (spec.photo_data) type = "photo";
    else if (spec.template_data) type = "collection";
    else if (raw.asset_feed_spec) type = "dynamic";
    else if (raw.object_type === "INSTANT_EXPERIENCE") type = "instant_experience";

    const normalized = {
      id: raw.id,
      name: raw.name || "Untitled Creative",
      type,
      rawType: raw.object_type,
      pageId: spec.page_id,
      // common fields
      message: linkData.message || videoData.message || photoData.caption || "",
      // link
      link: linkData.link || videoData.call_to_action?.value?.link || "",
      displayUrl: linkData.caption || "",
      headline: linkData.name || videoData.title || "",
      description: linkData.description || videoData.message || "",
      ctaType: linkData.call_to_action?.type || videoData.call_to_action?.type || raw.call_to_action_type || "",
      // image
      imageUrl: linkData.picture || raw.image_url || "",
      imageHash: linkData.image_hash || raw.image_hash || "",
      // video
      videoId: videoData.video_id || raw.video_id || "",
      thumbnailUrl: videoData.image_url || raw.thumbnail_url || "",
      // carousel cards
      cards: (linkData.child_attachments || []).map(c => ({
        link: c.link || "",
        headline: c.name || "",
        description: c.description || "",
        imageUrl: c.picture || "",
        imageHash: c.image_hash || "",
        videoId: c.video_id || "",
        ctaType: c.call_to_action?.type || "",
        displayUrl: c.caption || ""
      })),
      // collection
      collectionItems: templateData.child_attachments || [],
      // raw for debugging
      _raw: raw
    };

    return normalized;
  }

  // ── POST ORGANICALLY ──────────────────────────────────────

  async postCreativeOrganically(pageId, creative, onProgress) {
    const pageToken = this.getPageToken(pageId);
    const progress = onProgress || (() => {});

    switch (creative.type) {
      case "link":
        return await this.postLinkCreative(pageId, pageToken, creative, progress);
      case "carousel":
        return await this.postCarouselCreative(pageId, pageToken, creative, progress);
      case "video":
        return await this.postVideoCreative(pageId, pageToken, creative, progress);
      case "photo":
        return await this.postPhotoCreative(pageId, pageToken, creative, progress);
      default:
        throw new Error(`Creative type "${creative.type}" cannot be posted organically.`);
    }
  }

  async postLinkCreative(pageId, pageToken, creative, progress) {
    progress("Posting link creative...", 30);
    const params = {
      access_token: pageToken,
      message: creative.message || "",
      link: creative.link,
      published: "true"
    };
    if (creative.headline) params.name = creative.headline;
    if (creative.description) params.description = creative.description;
    if (creative.displayUrl) params.caption = creative.displayUrl;
    if (creative.imageHash) params.picture = creative.imageUrl;
    if (creative.ctaType) {
      params.call_to_action = JSON.stringify({
        type: creative.ctaType,
        value: { link: creative.link }
      });
    }

    progress("Publishing to page...", 70);
    const res = await fetch(`https://graph.facebook.com/v19.0/${pageId}/feed`, {
      method: "POST",
      credentials: "include",
      body: new URLSearchParams(params)
    });
    const data = await res.json();
    if (data.error) throw new Error(`${data.error.code}: ${data.error.message}`);
    progress("Done!", 100);
    return this.buildPostUrl(data.id);
  }

  async postCarouselCreative(pageId, pageToken, creative, progress) {
    progress("Building carousel...", 20);

    const childAttachments = creative.cards.map(card => {
      const att = {
        link: card.link || creative.link || "https://facebook.com",
        name: card.headline || "",
        description: card.description || "",
        picture: card.imageUrl || ""
      };
      if (card.ctaType) {
        att.call_to_action = JSON.stringify({ type: card.ctaType, value: { link: card.link } });
      }
      if (card.displayUrl) att.caption = card.displayUrl;
      return att;
    });

    progress("Publishing carousel...", 60);

    const params = {
      access_token: pageToken,
      message: creative.message || "",
      link: creative.link || creative.cards[0]?.link || "https://facebook.com",
      child_attachments: JSON.stringify(childAttachments),
      multi_share_end_card: "false",
      multi_share_optimized: "false",
      published: "true"
    };
    if (creative.ctaType) {
      params.call_to_action = JSON.stringify({
        type: creative.ctaType,
        value: { link: creative.link }
      });
    }

    const res = await fetch(`https://graph.facebook.com/v19.0/${pageId}/feed`, {
      method: "POST",
      credentials: "include",
      body: new URLSearchParams(params)
    });
    const data = await res.json();
    if (data.error) throw new Error(`${data.error.code}: ${data.error.message}`);
    progress("Done!", 100);
    return this.buildPostUrl(data.id);
  }

  async postVideoCreative(pageId, pageToken, creative, progress) {
    progress("Preparing video post...", 30);
    const params = {
      access_token: pageToken,
      published: "true"
    };
    if (creative.message) params.message = creative.message;
    if (creative.videoId) params.video_id = creative.videoId;
    if (creative.headline) params.title = creative.headline;
    if (creative.ctaType && creative.link) {
      params.call_to_action = JSON.stringify({
        type: creative.ctaType,
        value: { link: creative.link }
      });
    }
    progress("Publishing video...", 70);
    const res = await fetch(`https://graph.facebook.com/v19.0/${pageId}/feed`, {
      method: "POST",
      credentials: "include",
      body: new URLSearchParams(params)
    });
    const data = await res.json();
    if (data.error) throw new Error(`${data.error.code}: ${data.error.message}`);
    progress("Done!", 100);
    return this.buildPostUrl(data.id);
  }

  async postPhotoCreative(pageId, pageToken, creative, progress) {
    progress("Publishing photo post...", 50);
    const params = {
      access_token: pageToken,
      url: creative.imageUrl,
      caption: creative.message || "",
      published: "true"
    };
    const res = await fetch(`https://graph.facebook.com/v19.0/${pageId}/photos`, {
      method: "POST",
      credentials: "include",
      body: new URLSearchParams(params)
    });
    const data = await res.json();
    if (data.error) throw new Error(`${data.error.code}: ${data.error.message}`);
    progress("Done!", 100);
    return `https://www.facebook.com/photo?fbid=${data.id}`;
  }

  buildPostUrl(id) {
    if (!id) return "https://www.facebook.com";
    const parts = id.split("_");
    if (parts.length === 2) return `https://www.facebook.com/${parts[0]}/posts/${parts[1]}`;
    return `https://www.facebook.com/${id}`;
  }
}

// ── GLOBAL INSTANCE ───────────────────────────────────────
const FB_API = new FacebookAPI();
