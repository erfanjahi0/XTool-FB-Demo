<div align="center">

# 🚀 FB Advanced Tools
### Build Your Own Facebook Posting Tools — No Watermarks. No Subscriptions. No Payment Required.

<br/>

[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension%20MV3-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white)](https://developer.chrome.com/docs/extensions/)
[![JavaScript](https://img.shields.io/badge/JavaScript-Vanilla%20ES2022-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Facebook API](https://img.shields.io/badge/Facebook-Graph%20%2B%20GraphQL%20API-1877F2?style=for-the-badge&logo=facebook&logoColor=white)](https://developers.facebook.com/)
[![No Build Tools](https://img.shields.io/badge/Build%20Tools-None%20Required-brightgreen?style=for-the-badge)](#)
[![Version](https://img.shields.io/badge/Version-2.0%20Corrected-orange?style=for-the-badge)](#)

<br/>

> **Four advanced Facebook posting formats — hidden from the normal UI, unlocked through Facebook's internal API.**  
> Self-hosted. Zero dependencies. Cookie never leaves your browser. No payment ever needed.

<br/>

---

</div>

## 📋 Table of Contents

| # | Section |
|:-:|---------|
| 1 | [🎯 What This Builds](#-what-this-builds) |
| 2 | [💡 The Core Insight](#-the-core-insight) |
| 3 | [⚙️ How Facebook's Internal API Works](#️-how-facebooks-internal-api-works) |
| 4 | [🏗 Architecture & Tech Stack](#-architecture--tech-stack) |
| 5 | [📁 Project Structure](#-project-structure) |
| 6 | [🧩 Chrome Extension — Full Code](#-chrome-extension--full-code) |
| 7 | [🔑 Authentication — The Right Way](#-authentication--the-right-way) |
| 8 | [🎬 Tool 1 — Video Carousel Post](#-tool-1--video-carousel-post) |
| 9 | [👆 Tool 2 — Swipe Up Video Creator](#-tool-2--swipe-up-video-creator) |
| 10 | [📱 Tool 3 — 2-Card Video Carousel](#-tool-3--2-card-video-carousel) |
| 11 | [🃏 Tool 4 — Generate One Card V2](#-tool-4--generate-one-card-v2) |
| 12 | [🖥 Frontend UI Guide](#-frontend-ui-guide) |
| 13 | [🔒 Security](#-security) |
| 14 | [⚡ Rate Limiting & Anti-Ban](#-rate-limiting--anti-ban) |
| 15 | [🐛 Troubleshooting](#-troubleshooting) |
| 16 | [🚢 Deployment](#-deployment) |
| 17 | [🤖 AI Prompt — Build Everything from Scratch](#-ai-prompt--build-everything-from-scratch) |
| 18 | [📌 Quick Reference](#-quick-reference) |

---

## 🎯 What This Builds

Four tools that use **Facebook's internal API** to unlock posting formats the normal UI intentionally hides:

<div align="center">

| Tool | What It Does | Why FB Hides It |
|:----:|:-----------|:--------------|
| 🎬 **Video Carousel** | 2–10 videos in a swipeable carousel | Reserved for Ads in the UI |
| 👆 **Swipe Up Video** | Mobile video with swipe-up CTA link | Only available in Stories via UI |
| 📱 **2-Card Carousel** | Two-video carousel (bigger mobile cards) | 2-card format not exposed in UI |
| 🃏 **One Card V2** | Single image with fake album count | Uses Ad Creative system internally |

</div>

<br/>

### Why build this instead of using FewFeed?

```
FewFeed                              Your Own Tool
──────────────────────────────────   ──────────────────────────────────
❌ Watermark on every post       →   ✅ Zero watermarks, forever
❌ Paid subscription to remove   →   ✅ Free forever
❌ Your session sent to servers  →   ✅ Cookie never leaves your browser
❌ Dependent on their uptime     →   ✅ Runs on your machine
❌ No control over bugs/changes  →   ✅ You own the code
```

---

## 💡 The Core Insight

Facebook has two layers:

```
┌──────────────────────────────────────────────────────┐
│                LAYER 1: Facebook's UI                │
│          (what you see on facebook.com)              │
│  Intentionally LIMITED • Many features hidden/locked │
└──────────────────────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────┐
│            LAYER 2: Facebook's Internal API          │
│        (what the Facebook app itself calls)          │
│   FULL feature set • GraphQL-based • No restrictions │
└──────────────────────────────────────────────────────┘
```

When you're logged into Facebook, your browser holds session cookies. Any `fetch()` call made to `facebook.com` with `credentials: "include"` automatically sends those cookies — making the request indistinguishable from a normal browser action.

### How to discover any feature yourself

```
1. Open facebook.com → press F12 → Network tab → filter by "graphql"
2. Perform the action manually on Facebook
3. Find the POST request → Payload tab → copy doc_id and variables JSON
4. Automate that exact request
```

---

## ⚙️ How Facebook's Internal API Works

<details>
<summary><b>📖 Two API Systems — When to Use Which</b></summary>

<br/>

| | Public Graph API | Internal GraphQL |
|--|----------------|-----------------|
| **URL** | `graph.facebook.com/v18.0/` | `facebook.com/api/graphql/` |
| **Auth** | Page access token | Session cookies (`credentials: "include"`) + `fb_dtsg` |
| **Rate limits** | Strict developer limits | Same as normal browsing |
| **Features** | What Meta allows third-party devs | Everything the app can do |
| **Used for** | Video upload, page management | Special post formats |

This project uses **both**: Graph API for video uploads, internal GraphQL for special posting formats.

</details>

<details>
<summary><b>🍪 Session Cookies & fb_dtsg</b></summary>

<br/>

**Key cookies when logged in:**

| Cookie | Role | Importance |
|--------|------|:----------:|
| `c_user` | Your Facebook User ID | 🔴 Critical |
| `xs` | Session auth token | 🔴 Critical |
| `datr` | Browser fingerprint | 🟠 High |
| `fr` | Ad tracking | 🟡 Medium |

**The `fb_dtsg` CSRF token** — required on every POST to `/api/graphql/`:

```javascript
// Extracted from facebook.com HTML after fetching with credentials:"include"
const match =
  html.match(/"DTSGInitData"[^}]*"token":"([^"]+)"/) ||  // Primary
  html.match(/name="fb_dtsg"\s+value="([^"]+)"/)    ||  // Fallback 1
  html.match(/"fb_dtsg","([^"]{10,50})"/);               // Fallback 2
```

</details>

<details>
<summary><b>🚫 The Most Important Rule — Never Set Cookie Header Manually</b></summary>

<br/>

Browsers **forbid** JavaScript from setting the `Cookie` header in `fetch()` calls. It is a "forbidden header name". If you try, the browser silently ignores it.

```javascript
// ❌ WRONG — browser silently ignores this
fetch("https://www.facebook.com/api/graphql/", {
  headers: { "Cookie": "c_user=123; xs=abc..." }  // ← IGNORED
});

// ✅ CORRECT — browser sends existing FB cookies automatically
fetch("https://www.facebook.com/api/graphql/", {
  credentials: "include"  // ← Sends all facebook.com cookies invisibly
});
```

This is why the architecture works: the extension only needs to read `c_user` to get your user ID. All actual API calls use `credentials: "include"` and the browser handles authentication invisibly.

</details>

---

## 🏗 Architecture & Tech Stack

```
┌───────────────────────────────────────────────────────────────┐
│                         YOUR SYSTEM                           │
│                                                               │
│  Chrome Extension (Manifest V3)                               │
│  └── Reads c_user cookie → gives userId to website           │
│      (cookies never passed as text strings)                   │
│                                                               │
│  Website (Plain HTML + Vanilla JS)                            │
│  ├── All fetch() calls use credentials:"include"              │
│  ├── Browser sends FB session cookies automatically           │
│  └── No frameworks, no Node.js, no build step                 │
│                                                               │
│  Facebook APIs (Direct from Browser)                          │
│  ├── graph.facebook.com  →  video upload, page management     │
│  └── facebook.com/api/graphql/  →  special post formats       │
└───────────────────────────────────────────────────────────────┘
```

### Actual Requirements

```
✅ Chrome browser (logged into Facebook)
✅ A Facebook Page (for posting)
✅ Tool 4 only: Any ad account — free to create, no payment needed

❌ Node.js — NOT required
❌ npm — NOT required  
❌ A paid Ad Account — NOT required
❌ Payment method — NOT required
```

---

## 📁 Project Structure

```
fb-tools/
│
├── 📂 extension/
│   ├── manifest.json        ← Permissions: cookies + tabs only
│   ├── background.js        ← Reads c_user cookie, that's all it does
│   ├── content.js           ← Relays messages from website to background
│   └── icon.png             ← Any 128×128 image
│
└── 📂 website/
    ├── index.html           ← Homepage with 4 tool cards
    ├── 📂 tools/
    │   ├── video-carousel.html
    │   ├── swipe-up.html
    │   ├── two-card.html
    │   └── one-card-v2.html
    ├── 📂 js/
    │   ├── facebook-api.js       ← FacebookAPI class (core of everything)
    │   ├── extension-bridge.js   ← FBToolsExtension class
    │   └── utils.js              ← Helpers, validators, UI shortcuts
    └── 📂 css/
        └── style.css             ← Facebook-inspired design system
```

---

## 🧩 Chrome Extension — Full Code

<details>
<summary><b>📄 manifest.json — Corrected</b></summary>

```json
{
  "manifest_version": 3,
  "name": "FB Advanced Tools",
  "version": "1.0.0",
  "description": "Personal Facebook posting tools",

  "background": {
    "service_worker": "background.js"
  },

  "content_scripts": [
    {
      "matches": [
        "http://localhost/*",
        "http://127.0.0.1/*",
        "https://your-website.vercel.app/*"
      ],
      "js": ["content.js"],
      "run_at": "document_start"
    }
  ],

  "permissions": ["cookies", "tabs"],

  "host_permissions": [
    "*://*.facebook.com/*",
    "http://localhost/*",
    "http://127.0.0.1/*",
    "https://your-website.vercel.app/*"
  ],

  "externally_connectable": {
    "matches": [
      "http://localhost/*",
      "http://127.0.0.1/*",
      "https://your-website.vercel.app/*"
    ]
  },

  "icons": { "16": "icon.png", "48": "icon.png", "128": "icon.png" },
  "action": { "default_title": "FB Advanced Tools" }
}
```

> **What was removed from v1.0:** `declarativeNetRequest` (never used), `storage` (never used), `scripting` (caused crashes), `type:"module"` (caused silent failures), `fbcdn.net` host permission (not needed).

</details>

<details>
<summary><b>⚙️ background.js — Complete</b></summary>

```javascript
// background.js — Extension Service Worker
// The extension's only job: read the c_user cookie and return the userId.
// All actual Facebook API calls happen from the website using credentials:"include".

const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "https://your-website.vercel.app"
];

chrome.runtime.onMessageExternal.addListener(
  function (message, sender, sendResponse) {

    // Security: only respond to our own website
    if (!ALLOWED_ORIGINS.includes(sender.origin)) {
      sendResponse({ error: "Unauthorized origin" });
      return true;
    }

    switch (message.type) {

      case "PING":
        sendResponse({ status: "ok", version: "1.0.0" });
        break;

      case "GET_USER_ID":
        chrome.cookies.get(
          { url: "https://www.facebook.com", name: "c_user" },
          function (cookie) {
            sendResponse({
              userId: cookie ? cookie.value : null,
              loggedIn: !!cookie
            });
          }
        );
        break;

      case "CHECK_FB_LOGIN":
        chrome.cookies.get(
          { url: "https://www.facebook.com", name: "c_user" },
          function (cookie) {
            sendResponse({ loggedIn: !!cookie && !!cookie.value });
          }
        );
        break;

      default:
        sendResponse({ error: "Unknown message type: " + message.type });
    }

    return true; // Required: keeps channel open for async callbacks
  }
);
```

</details>

<details>
<summary><b>🔌 content.js & extension-bridge.js</b></summary>

**content.js** (runs on your website):
```javascript
// Relay between page JS and background service worker
window.postMessage({ type: "FB_TOOLS_EXTENSION_READY" }, "*");

window.addEventListener("message", function (event) {
  if (event.source !== window) return;
  const msg = event.data;
  if (!msg?.type?.startsWith("FB_TOOLS_")) return;

  chrome.runtime.sendMessage(msg, function (response) {
    window.postMessage({
      type: msg.type + "_RESPONSE",
      requestId: msg.requestId,
      ...(response || { error: "No response" })
    }, "*");
  });
});
```

**extension-bridge.js** (on your website):
```javascript
const EXTENSION_ID = "YOUR_EXTENSION_ID_HERE";

class FBToolsExtension {
  constructor() { this.isAvailable = false; this.userId = null; }

  async checkAvailability() {
    return new Promise((resolve) => {
      if (typeof chrome === "undefined" || !chrome.runtime) {
        resolve(false); return;
      }
      chrome.runtime.sendMessage(EXTENSION_ID, { type: "PING" }, (res) => {
        this.isAvailable = !chrome.runtime.lastError && !!res;
        resolve(this.isAvailable);
      });
    });
  }

  async getUserId() {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(EXTENSION_ID, { type: "GET_USER_ID" }, (res) => {
        if (chrome.runtime.lastError) return reject(new Error(chrome.runtime.lastError.message));
        if (!res?.loggedIn) return reject(new Error("Not logged into Facebook."));
        this.userId = res.userId;
        resolve(res.userId);
      });
    });
  }
}

window.FBExtension = new FBToolsExtension();
```

</details>

### Install the Extension

```
1. Open Chrome → chrome://extensions
2. Enable "Developer mode" (top-right toggle)
3. Click "Load unpacked" → select your /extension folder
4. Copy the Extension ID from the card (32-character string)
5. Paste it into extension-bridge.js as EXTENSION_ID
6. Reload your website
```

---

## 🔑 Authentication — The Right Way

<details>
<summary><b>📋 Full FacebookAPI Class — Core of Everything</b></summary>

```javascript
// facebook-api.js

class FacebookAPI {
  constructor() {
    this.userId = null;
    this.fbDtsg = null;
    this.lsdToken = null;
    this.userToken = null;
    this.initialized = false;
  }

  async initialize() {
    if (!window.FBExtension.isAvailable)
      throw new Error("Extension not found. Load it from chrome://extensions.");

    // Get userId from extension (reads c_user cookie)
    this.userId = await window.FBExtension.getUserId();

    // Get CSRF tokens from Facebook homepage
    await this.fetchCsrfTokens();

    // Get user access token for Graph API calls
    await this.fetchUserAccessToken();

    this.initialized = true;
    return true;
  }

  async fetchCsrfTokens() {
    // credentials:"include" → browser sends user's FB session cookies automatically
    const response = await fetch("https://www.facebook.com/", {
      credentials: "include",
      headers: { "Accept": "text/html", "Accept-Language": "en-US,en;q=0.9" }
    });
    const html = await response.text();

    const dtsgMatch =
      html.match(/"DTSGInitData"[^}]*"token":"([^"]+)"/) ||
      html.match(/name="fb_dtsg"\s+value="([^"]+)"/)    ||
      html.match(/"fb_dtsg","([^"]{10,50})"/);

    if (!dtsgMatch)
      throw new Error("Cannot extract fb_dtsg. Try re-logging into Facebook.");
    this.fbDtsg = dtsgMatch[1];

    const lsdMatch = html.match(/"LSD"[^}]*"token":"([^"]+)"/);
    if (lsdMatch) this.lsdToken = lsdMatch[1];
  }

  async fetchUserAccessToken() {
    try {
      const res = await fetch(
        "https://www.facebook.com/connect/get_token?client_id=124024574287414&sdk=joey",
        { credentials: "include" }
      );
      const text = await res.text();
      const match = text.match(/access_token=([^&"]+)/);
      if (match) this.userToken = match[1];
    } catch {
      console.warn("Could not get user access token — some features limited");
    }
  }

  // All API calls go through this — NEVER sets Cookie header manually
  async apiFetch(url, method = "GET", body = null, extraHeaders = {}) {
    const response = await fetch(url, {
      method,
      credentials: "include",  // ← Correct way to send session cookies
      headers: {
        "Referer": "https://www.facebook.com/",
        "Origin": "https://www.facebook.com",
        "Accept-Language": "en-US,en;q=0.9",
        ...extraHeaders
      },
      body: body || undefined
    });

    if (response.status === 401 || response.status === 403)
      throw new Error("Not authenticated — please re-login to Facebook");
    if (!response.ok && response.status !== 302)
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    return response;
  }

  async graphql(docId, variables, friendlyName = "") {
    if (!this.initialized) await this.initialize();

    const body = new URLSearchParams({
      av: this.userId, __user: this.userId, __a: "1",
      fb_dtsg: this.fbDtsg,
      fb_api_caller_class: "RelayModern",
      fb_api_req_friendly_name: friendlyName,
      variables: JSON.stringify(variables),
      server_timestamps: "true",
      doc_id: docId,
      ...(this.lsdToken ? { lsd: this.lsdToken } : {})
    });

    const response = await this.apiFetch(
      "https://www.facebook.com/api/graphql/", "POST", body,
      { "Content-Type": "application/x-www-form-urlencoded",
        "X-FB-Friendly-Name": friendlyName }
    );
    const text = await response.text();
    return JSON.parse(text.split("\n")[0]);
  }

  async getMyPages() {
    if (!this.initialized) await this.initialize();
    const res = await this.apiFetch(
      `https://graph.facebook.com/v18.0/me/accounts?fields=id,name,access_token&limit=100&access_token=${this.userToken}`
    );
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    return data.data || [];
  }

  // Returns ALL ad accounts — any status works for ad creative creation
  // No payment method is needed, even brand new accounts work
  async getAdAccounts() {
    if (!this.initialized) await this.initialize();
    const res = await this.apiFetch(
      `https://graph.facebook.com/v18.0/me/adaccounts?fields=id,name,account_status&limit=100&access_token=${this.userToken}`
    );
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    return data.data || []; // Return ALL — no status filter
  }

  generateToken(len = 32) {
    return Array.from({ length: len }, () =>
      Math.floor(Math.random() * 16).toString(16)).join("");
  }
}

window.FB_API = new FacebookAPI();
```

</details>

---

## 🎬 Tool 1 — Video Carousel Post

> Post **2–10 videos** as a swipeable carousel on your Facebook Page.  
> *Minimum is 2 (not 3) — Facebook's API requires at least 2 child_attachments.*

### How It Works

```
Select 2–10 videos → Upload each (chunked) → Wait for processing
→ Create carousel post → Post goes live in feed
```

<details>
<summary><b>📋 Video Upload + Carousel Creation Code</b></summary>

```javascript
// 3-Phase Chunked Video Upload
async uploadVideo(file, pageId, pageToken, onProgress) {
  // Phase 1: Start
  const startData = await fetch(
    `https://graph.facebook.com/v18.0/${pageId}/videos`, {
    method: "POST", credentials: "include",
    body: new URLSearchParams({ upload_phase: "start", file_size: file.size, access_token: pageToken })
  }).then(r => r.json());

  if (startData.error) throw new Error(startData.error.message);

  const { upload_session_id, video_id } = startData;
  let start = parseInt(startData.start_offset);
  let end = parseInt(startData.end_offset);

  // Phase 2: Transfer chunks
  while (start < file.size) {
    const form = new FormData();
    form.append("upload_phase", "transfer");
    form.append("upload_session_id", upload_session_id);
    form.append("start_offset", start);
    form.append("video_file_chunk", file.slice(start, end), file.name);
    form.append("access_token", pageToken);

    const chunkData = await fetch(
      `https://graph.facebook.com/v18.0/${pageId}/videos`,
      { method: "POST", body: form, credentials: "include" }
    ).then(r => r.json());

    if (chunkData.error) throw new Error(chunkData.error.message);
    start = parseInt(chunkData.start_offset);
    end = parseInt(chunkData.end_offset);
    onProgress?.(Math.round((start / file.size) * 100));
  }

  // Phase 3: Finish
  await fetch(`https://graph.facebook.com/v18.0/${pageId}/videos`, {
    method: "POST", credentials: "include",
    body: new URLSearchParams({ upload_phase: "finish", upload_session_id, access_token: pageToken })
  });

  return video_id;
}

// Wait for Facebook to process the video (REQUIRED before posting)
async waitForVideoReady(videoId, pageToken, timeoutMs = 180000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const data = await fetch(
      `https://graph.facebook.com/v18.0/${videoId}?fields=status&access_token=${pageToken}`,
      { credentials: "include" }
    ).then(r => r.json());

    if (data.status?.video_status === "ready" || data.status?.processing_progress === 100)
      return true;
    if (data.status?.video_status === "error")
      throw new Error("Video processing failed. Try re-uploading.");

    await new Promise(r => setTimeout(r, 5000)); // Check every 5s
  }
  throw new Error("Video processing timed out (3 min).");
}

// Create the Carousel Post
async createVideoCarousel(pageId, pageToken, videoFiles, message, onProgress) {
  const videoIds = [];

  for (let i = 0; i < videoFiles.length; i++) {
    onProgress?.(`Uploading video ${i + 1} of ${videoFiles.length}...`);
    const id = await this.uploadVideo(videoFiles[i], pageId, pageToken,
      p => onProgress?.(`Video ${i + 1}: ${p}%`));

    onProgress?.(`Processing video ${i + 1}...`);
    await this.waitForVideoReady(id, pageToken);
    videoIds.push(id);

    // Human delay between uploads
    if (i < videoFiles.length - 1)
      await new Promise(r => setTimeout(r, 2000 + Math.random() * 2000));
  }

  onProgress?.("Creating carousel post...");

  const result = await fetch(`https://graph.facebook.com/v18.0/${pageId}/feed`, {
    method: "POST", credentials: "include",
    body: new URLSearchParams({
      message,
      child_attachments: JSON.stringify(videoIds.map((id, i) => ({
        media_fbid: id, name: `Video ${i + 1}`,
        description: message, link: `https://www.facebook.com/video/${id}`
      }))),
      multi_share_end_card: "false",
      multi_share_optimized: "false",
      published: "true",
      access_token: pageToken
    })
  }).then(r => r.json());

  if (result.error) throw new Error(result.error.message);
  const [pid, postId] = result.id.split("_");
  return { postId: result.id, url: `https://www.facebook.com/${pid}/posts/${postId}` };
}
```

</details>

---

## 👆 Tool 2 — Swipe Up Video Creator

> Video post with **Swipe Up** link overlay. Only visible in **mobile Facebook app** newsfeed.

### CTA Button Types

| API Value | Button Text |
|-----------|------------|
| `LEARN_MORE` | Learn More |
| `SHOP_NOW` | Shop Now |
| `SIGN_UP` | Sign Up |
| `WATCH_MORE` | Watch More |
| `BOOK_NOW` | Book Now |
| `CALL_NOW` | Call Now |
| `DOWNLOAD` | Download |
| `GET_OFFER` | Get Offer |
| `CONTACT_US` | Contact Us |
| `GET_DIRECTIONS` | Get Directions |

<details>
<summary><b>📋 Full Code</b></summary>

```javascript
async createSwipeUpPost(pageId, pageToken, videoFile, linkUrl, ctaType, message, onProgress) {
  onProgress?.("Uploading video...");
  const videoId = await this.uploadVideo(videoFile, pageId, pageToken,
    p => onProgress?.(`Uploading: ${p}%`));

  onProgress?.("Waiting for video to process...");
  await this.waitForVideoReady(videoId, pageToken);
  onProgress?.("Creating swipe-up post...");

  const result = await fetch(`https://graph.facebook.com/v18.0/${pageId}/feed`, {
    method: "POST", credentials: "include",
    body: new URLSearchParams({
      message,
      object_attachment: videoId,
      call_to_action: JSON.stringify({
        type: ctaType,
        value: {
          link: linkUrl,
          link_format: "VIDEO_MOBILE_SWIPE_UP"  // ← The swipe-up trigger
        }
      }),
      published: "true",
      access_token: pageToken
    })
  }).then(r => r.json());

  if (result.error) throw new Error(result.error.message);
  const [pid, postId] = result.id.split("_");
  return { postId: result.id, url: `https://www.facebook.com/${pid}/posts/${postId}` };
}
```

> **On desktop:** renders as normal video + link button. Open Facebook mobile app to see the swipe-up effect.

</details>

---

## 📱 Tool 3 — 2-Card Video Carousel

> Exactly **2 videos** in carousel format. 2-card layout renders **larger on mobile** than 3+ cards.

<details>
<summary><b>📋 Full Code</b></summary>

```javascript
async createTwoCardCarousel(pageId, pageToken, video1, video2, message, link1, link2, onProgress) {
  onProgress?.("Uploading video 1 of 2...");
  const id1 = await this.uploadVideo(video1, pageId, pageToken, p => onProgress?.(`Video 1: ${p}%`));
  await this.waitForVideoReady(id1, pageToken);

  onProgress?.("Uploading video 2 of 2...");
  const id2 = await this.uploadVideo(video2, pageId, pageToken, p => onProgress?.(`Video 2: ${p}%`));
  await this.waitForVideoReady(id2, pageToken);

  onProgress?.("Creating 2-card post...");

  const result = await fetch(`https://graph.facebook.com/v18.0/${pageId}/feed`, {
    method: "POST", credentials: "include",
    body: new URLSearchParams({
      message,
      child_attachments: JSON.stringify([
        { media_fbid: id1, name: "Video 1", description: message,
          link: link1 || `https://www.facebook.com/video/${id1}` },
        { media_fbid: id2, name: "Video 2", description: message,
          link: link2 || `https://www.facebook.com/video/${id2}` }
      ]),
      multi_share_end_card: "false",   // ← Critical for 2-card format
      multi_share_optimized: "false",  // ← Prevent Facebook reordering
      published: "true",
      access_token: pageToken
    })
  }).then(r => r.json());

  if (result.error) throw new Error(result.error.message);
  const [pid, postId] = result.id.split("_");
  return { postId: result.id, url: `https://www.facebook.com/${pid}/posts/${postId}` };
}
```

</details>

---

## 🃏 Tool 4 — Generate One Card V2

> Single image that displays **fake album count** (e.g., `1 / 5 📷`). Looks like an album — clicking goes to your URL.

### Ad Account — What You Actually Need

```
✅ ANY Facebook Ad Account
✅ No payment method required
✅ $0 balance is fine
✅ Brand new account works
✅ "Unsettled" status works
✅ "Pending Review" works

Create one free in 30 seconds:
→ facebook.com/adsmanager → "Create Ad Account" → Name + Timezone → Done
→ No credit card asked. ID format: act_XXXXXXXXX
```

### How the Fake Count Works

```
Normal Post              One Card V2
──────────────           ─────────────────────────────
┌──────────┐             ┌────────────────────────────┐
│          │             │                            │
│  Image   │    vs.      │  Image      ╔══════════╗  │
│          │             │             ║ 1 / 5  📷║  │ ← Triggers curiosity
└──────────┘             │             ╚══════════╝  │   Clicking → your URL
                         └────────────────────────────┘
```

<details>
<summary><b>📋 Full Code — 3 Steps</b></summary>

```javascript
async generateOneCardV2(adAccountId, pageId, pageToken, imageFile,
                        linkUrl, headline, description, fakeCount, message, onProgress) {

  const accountId = adAccountId.startsWith("act_") ? adAccountId : `act_${adAccountId}`;

  // ── Step 1: Upload image to ad account image library ──
  onProgress?.("Uploading image...");
  const imageForm = new FormData();
  imageForm.append("filename", imageFile, imageFile.name);
  imageForm.append("access_token", pageToken);

  const imageData = await fetch(
    `https://graph.facebook.com/v18.0/${accountId}/adimages`,
    { method: "POST", body: imageForm, credentials: "include" }
  ).then(r => r.json());

  if (imageData.error) throw new Error("Image upload: " + imageData.error.message);

  const keys = Object.keys(imageData.images || {});
  if (!keys.length) throw new Error("Image upload returned no hash.");
  const imageHash = imageData.images[keys[0]].hash;

  // ── Step 2: Create ad creative with fake_album_count ──
  onProgress?.("Creating one-card creative...");

  const creative = await fetch(
    `https://graph.facebook.com/v18.0/${accountId}/adcreatives`, {
    method: "POST", credentials: "include",
    body: new URLSearchParams({
      name: `OneCard_${Date.now()}`,
      object_story_spec: JSON.stringify({
        page_id: pageId,
        link_data: {
          link: linkUrl, message, name: headline, description,
          image_hash: imageHash,
          child_attachments: JSON.stringify([{
            link: linkUrl, image_hash: imageHash,
            name: headline, description
          }]),
          multi_share_end_card: false,
          fake_album_count: Math.max(2, parseInt(fakeCount) || 5) // ← The magic
        }
      }),
      access_token: pageToken
    })
  }).then(r => r.json());

  if (creative.error) throw new Error("Creative: " + creative.error.message);

  // ── Step 3: Publish as organic page post ──
  onProgress?.("Publishing post...");

  const post = await fetch(`https://graph.facebook.com/v18.0/${pageId}/feed`, {
    method: "POST", credentials: "include",
    body: new URLSearchParams({
      message, published: "true",
      creative: JSON.stringify({ creative_id: creative.id }),
      access_token: pageToken
    })
  }).then(r => r.json());

  if (post.error) throw new Error("Post: " + post.error.message);
  const [pid, postId] = post.id.split("_");
  return { postId: post.id, url: `https://www.facebook.com/${pid}/posts/${postId}` };
}
```

</details>

---

## 🖥 Frontend UI Guide

<details>
<summary><b>🏠 index.html — Homepage</b></summary>

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>FB Advanced Tools</title>
  <link rel="stylesheet" href="css/style.css" />
  <script src="js/extension-bridge.js"></script>
</head>
<body>
  <header>
    <h1>🛠️ FB Advanced Tools</h1>
    <p>Personal Facebook posting tools — no watermarks, no subscriptions</p>
    <div id="ext-status">Checking extension... ⏳</div>
  </header>

  <main>
    <div class="tools-grid">
      <div class="tool-card" onclick="location.href='tools/video-carousel.html'">
        <div class="tool-icon">🎬</div>
        <h2>Video Carousel Post</h2>
        <p>Post 2–10 videos as a swipeable carousel on your page</p>
        <span class="badge">2–10 Videos</span>
      </div>
      <div class="tool-card" onclick="location.href='tools/swipe-up.html'">
        <div class="tool-icon">👆</div>
        <h2>Swipe Up Video Creator</h2>
        <p>Mobile-only video post with swipe-up CTA link</p>
        <span class="badge">Mobile Only</span>
      </div>
      <div class="tool-card" onclick="location.href='tools/two-card.html'">
        <div class="tool-icon">📱</div>
        <h2>2-Card Carousel</h2>
        <p>Two-video carousel — larger mobile layout</p>
        <span class="badge">2 Videos</span>
      </div>
      <div class="tool-card" onclick="location.href='tools/one-card-v2.html'">
        <div class="tool-icon">🃏</div>
        <h2>Generate One Card V2</h2>
        <p>Fake album count clickbait image post</p>
        <span class="badge free">Free Ad Account</span>
      </div>
    </div>

    <div class="warning-box" id="ext-warning" style="display:none">
      <strong>⚠️ Extension not detected.</strong> Go to <code>chrome://extensions</code>
      → Enable Developer Mode → Load Unpacked → select the <code>/extension</code> folder.
    </div>
  </main>

  <script>
    async function check() {
      const ok = await window.FBExtension.checkAvailability();
      document.getElementById("ext-status").textContent =
        ok ? "✅ Extension connected" : "❌ Extension not found";
      if (!ok) document.getElementById("ext-warning").style.display = "block";
    }
    check();
  </script>
</body>
</html>
```

</details>

<details>
<summary><b>🛠 utils.js — Helper Functions</b></summary>

```javascript
function humanDelay(min = 1500, max = 3500) {
  return new Promise(r => setTimeout(r, Math.random() * (max - min) + min));
}

function formatFileSize(bytes) {
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + " MB";
  return (bytes / 1073741824).toFixed(2) + " GB";
}

function validateVideo(file) {
  if (!file.type.startsWith("video/"))
    throw new Error(`"${file.name}" is not a video file.`);
  if (file.size > 1073741824)
    throw new Error(`"${file.name}" exceeds 1 GB limit (${formatFileSize(file.size)}).`);
}

function validateImage(file) {
  if (!file.type.startsWith("image/"))
    throw new Error(`"${file.name}" is not an image file.`);
  if (file.size > 31457280)
    throw new Error(`"${file.name}" exceeds 30 MB limit.`);
}

function showProgress(labelId, barId, text, percent = null) {
  const label = document.getElementById(labelId);
  const bar = document.getElementById(barId);
  if (label) label.textContent = text;
  if (bar && percent !== null) bar.value = percent;
}

function showSuccess(id, url) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.display = "block";
  el.innerHTML = `✅ <strong>Post created!</strong> <a href="${url}" target="_blank">View on Facebook →</a>`;
}

function showError(id, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.display = "block";
  el.innerHTML = `❌ <strong>Error:</strong> ${msg}`;
}

function show(id) { const e = document.getElementById(id); if (e) e.style.display = "block"; }
function hide(id) { const e = document.getElementById(id); if (e) e.style.display = "none"; }
```

</details>

---

## 🔒 Security

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ⚠️  YOUR FACEBOOK SESSION = FULL ACCOUNT ACCESS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  With your session cookies someone could:
  Post, delete, message, manage pages, change password.

  ✅ Run on localhost for maximum safety
  ✅ Only use code you can read yourself
  ✅ Keep your extension source private

  ❌ Never send session data to any server
  ❌ Never use someone else's hosted version of this
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Why this tool is safer than FewFeed:** FewFeed's servers receive your session data on every request. This tool makes all requests **directly from your browser to Facebook**. Your session data never touches any external server.

---

## ⚡ Rate Limiting & Anti-Ban

### Safe Daily Limits

| Operation | Safe Limit | Consequence if Exceeded |
|-----------|:----------:|------------------------|
| Carousel posts | 8–10/day | Posts hidden or errored |
| Video uploads | 20–25/hour | Upload API fails |
| Swipe-up posts | 10–15/day | CTA stripped |
| One Card posts | 10–15/day | Creative creation errors |

### Warning Signs

| Sign | Action |
|------|--------|
| `"Action Blocked"` error | Stop completely — wait 24h |
| Checkpoint/verification required | Complete Facebook's check |
| Posts auto-removed | Reduce frequency, vary content |
| Friends can't see posts | Shadowban — slow down significantly |

**Always:** add a caption to every post, vary posting times, add delays between uploads.

---

## 🐛 Troubleshooting

<details>
<summary><b>❌ "Extension not found"</b></summary>

```
1. chrome://extensions → Enable Developer Mode
2. Load Unpacked → select /extension folder
3. Copy Extension ID → paste into extension-bridge.js
4. Hard refresh website (Ctrl+Shift+R)
```
</details>

<details>
<summary><b>❌ "Not logged into Facebook"</b></summary>

```
1. Go to facebook.com and log in
2. Make sure it's the same Chrome profile as the extension
3. Disable cookie-blocking extensions temporarily
4. Log out and back into Facebook, then retry
```
</details>

<details>
<summary><b>❌ "Cannot extract fb_dtsg token"</b></summary>

```
Facebook changed their HTML format. Fix:
1. facebook.com → F12 → Network tab → Refresh page
2. Click first request (www.facebook.com) → Response tab
3. Search for: DTSGInitData or fb_dtsg
4. Copy the new format → update regex in fetchCsrfTokens()
```
</details>

<details>
<summary><b>❌ "Invalid doc_id" on GraphQL calls</b></summary>

```
Facebook updated their internal operation ID. Fix:
1. facebook.com → F12 → Network → filter "graphql"
2. Perform the action manually on Facebook
3. Find the POST request → Payload tab → copy new doc_id
4. Update in your code

Note: doc_ids are stable for weeks–months. This is the only real maintenance.
```
</details>

<details>
<summary><b>❌ Videos not playing after carousel is posted</b></summary>

```
Cause: Facebook still processing videos (normal)
Fix:
1. waitForVideoReady() should prevent this — ensure it's called
2. Wait 5–10 minutes after post is created, then refresh
3. If still not playing after 30 min: re-upload the videos
4. Check format: MP4, H.264 video codec, AAC audio codec
```
</details>

<details>
<summary><b>❌ Tool 4: "Ad account not found" or no accounts shown</b></summary>

```
Fix:
1. facebook.com/adsmanager → Create Ad Account (free, no card needed)
2. Just enter a name + timezone → done in 30 seconds
3. Ensure the ad account is linked to your Page
4. The code accepts any status — Unsettled, Pending, etc. all work
5. Format: act_XXXXXXXXX (code adds "act_" prefix automatically)
```
</details>

<details>
<summary><b>❌ Swipe-up doesn't show on phone</b></summary>

```
This is expected if testing on desktop — swipe-up is mobile-only.
On mobile:
1. Open Facebook app → find the post
2. Swipe-up arrow appears at bottom of video
If not appearing on mobile:
→ Ensure CTA link starts with https://
→ Try LEARN_MORE as CTA type (most reliable)
```
</details>

<details>
<summary><b>❌ Large video upload fails partway through</b></summary>

Add retry logic to chunk uploads:

```javascript
async uploadChunkWithRetry(url, formData, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fetch(url, { method:"POST", body:formData, credentials:"include" })
        .then(r => r.json());
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise(r => setTimeout(r, 2000 * Math.pow(2, i))); // 2s, 4s, 8s
    }
  }
}
```
</details>

---

## 🚢 Deployment

### Option A — Localhost (Simplest)

```bash
# Optional: use a simple static server
npm install -g http-server
cd fb-tools/website
http-server -p 3000
# Open: http://localhost:3000
```

Or just open `index.html` directly in Chrome.

### Option B — Vercel (Free HTTPS)

```bash
npm install -g vercel
cd fb-tools/website && vercel
# URL: https://your-project.vercel.app
```

After deploying: update `manifest.json` + `background.js` with your URL → reload extension at `chrome://extensions`.

### Option C — GitHub Pages (Free)

Push `/website` contents to repo root → Settings → Pages → main branch.  
URL: `https://yourusername.github.io/repo-name`

> After any deployment: update the domain in `manifest.json` (`content_scripts.matches` + `externally_connectable.matches`) and in `background.js` (`ALLOWED_ORIGINS`). Then reload the extension.

---

## 🤖 AI Prompt — Build Everything from Scratch

<details>
<summary><b>📋 Click to expand — Full AI Prompt (copy entire block)</b></summary>

```
You are an expert full-stack developer. Build a complete personal Facebook
advanced posting toolset for personal use only.

## THE 4 TOOLS:
1. Video Carousel Post — 2–10 videos as swipeable carousel on a Facebook Page
2. Swipe Up Video Creator — mobile-only video post with swipe-up CTA link
3. 2-Card Video Carousel — exactly 2 videos in carousel (larger mobile layout)
4. Generate One Card V2 — single image with fake album count (needs any free ad account)

## NON-NEGOTIABLE ARCHITECTURE RULES:

RULE 1 — COOKIES:
Browsers FORBID setting the Cookie header in cross-origin fetch calls.
NEVER: fetch(url, { headers: { "Cookie": cookieString } })
ALWAYS: fetch(url, { credentials: "include" })
The browser sends existing facebook.com cookies automatically with credentials:include.

RULE 2 — EXTENSION PURPOSE:
The Chrome Extension ONLY reads the c_user cookie value and returns it as userId.
ALL API calls happen from the website using credentials:"include". That's it.

RULE 3 — AUTH FLOW:
1. Extension → reads c_user cookie → website gets userId
2. Website fetches facebook.com with credentials:"include" → extracts fb_dtsg
3. Website fetches get_token endpoint → gets user access token
4. User token → GET /me/accounts → page access tokens
5. Page tokens used for all Graph API calls (video upload, posting)

RULE 4 — AD ACCOUNTS:
Return ALL ad accounts. No payment method needed. Any status works
(Active, Unsettled, Pending Review, new accounts, $0 balance — all work).
Do NOT filter by account_status. Do NOT require payment method.

## TECH STACK (no exceptions):
- Chrome Extension (Manifest V3)
- Website: plain HTML + CSS + Vanilla JavaScript ONLY
- NO Node.js, NO npm, NO frameworks, NO TypeScript, NO build tools
- NO backend server

## MANIFEST.JSON (exact — do not add extra permissions):
permissions: ["cookies", "tabs"] only
Do NOT include: declarativeNetRequest, storage, scripting, type:"module"
host_permissions: *.facebook.com, localhost, 127.0.0.1

## BACKGROUND.JS handles:
- PING → return {status:"ok"}
- GET_USER_ID → chrome.cookies.get c_user → return {userId, loggedIn}
- CHECK_FB_LOGIN → return {loggedIn: bool}
- Validate sender.origin, return true from listener

## FACEBOOKAPI CLASS:
initialize(): getUserId from extension → fetchCsrfTokens() → fetchUserAccessToken()
fetchCsrfTokens(): fetch("https://www.facebook.com/", {credentials:"include"})
  extract fb_dtsg: /"DTSGInitData"[^}]*"token":"([^"]+)"/
  extract lsd: /"LSD"[^}]*"token":"([^"]+)"/
fetchUserAccessToken(): fetch connect/get_token endpoint with credentials:"include"
apiFetch(): all fetches use credentials:"include", NEVER set Cookie header
graphql(): POST to /api/graphql/ with fb_dtsg, lsd, etc.
getMyPages(): GET /me/accounts with userToken
getAdAccounts(): GET /me/adaccounts — return ALL, zero status filtering
uploadVideo(file, pageId, pageToken, onProgress): 3-phase chunked upload:
  Phase 1: POST /videos upload_phase=start → get upload_session_id, video_id
  Phase 2: loop: POST /videos upload_phase=transfer with chunks
  Phase 3: POST /videos upload_phase=finish
  Return video_id
waitForVideoReady(videoId, pageToken, timeoutMs=180000):
  Poll GET /videoId?fields=status every 5s
  Success when: video_status==="ready" OR processing_progress===100
  Fail if video_status==="error"
createVideoCarousel(pageId, pageToken, files[], message, onProgress):
  Upload each video + wait for ready + delay between uploads
  POST /{pageId}/feed: child_attachments array (min 2, max 10),
  multi_share_end_card:"false", multi_share_optimized:"false"
createSwipeUpPost(pageId, pageToken, file, linkUrl, ctaType, message, onProgress):
  Upload + wait for ready
  POST /{pageId}/feed: object_attachment=videoId,
  call_to_action:{type:ctaType, value:{link, link_format:"VIDEO_MOBILE_SWIPE_UP"}}
createTwoCardCarousel(pageId, pageToken, v1, v2, msg, link1, link2, onProgress):
  Upload both + wait for both to be ready
  POST with exactly 2 child_attachments, same flags as carousel
generateOneCardV2(adAccountId, pageId, pageToken, imageFile, linkUrl,
                  headline, desc, fakeCount, message, onProgress):
  Step 1: POST /act_{id}/adimages → extract image hash from response
  Step 2: POST /act_{id}/adcreatives with object_story_spec:
    page_id, link_data:{link, message, name:headline, description:desc,
    image_hash, child_attachments:[{link,image_hash,name,description}],
    fake_album_count: Math.max(2, fakeCount)}
  Step 3: POST /{pageId}/feed with creative:{creative_id}, published:"true"

POST URL: const [pid, postId] = result.id.split("_");
return `https://www.facebook.com/${pid}/posts/${postId}`;

## EACH TOOL PAGE needs:
- Header with back link and tool name
- Connect button → FB_API.initialize() → shows userId on success
- Page dropdown (from getMyPages(), store access_token in dataset.token)
- Tool 4: also Ad Account dropdown (from getAdAccounts())
- File inputs with drag-drop styling (dashed border)
- Caption/message textarea (all tools)
- Tool 2: CTA selector with all 10 options
- Tool 4: headline, description, fake count (number, min 2, max 20)
- Tools 1+3: optional per-card link URL inputs
- Submit button (disabled until connected, loading state while posting)
- Progress: text label + <progress> bar
- Success box (green): "✅ Post created!" + view link
- Error box (red): error message text
- NEVER use browser alert()

## VALIDATION before API calls:
- Videos: must be video/*, max 1GB
- Images: must be image/*, max 30MB
- Carousel: minimum 2, maximum 10 videos
- fakeAlbumCount: minimum 2

## STYLE:
Primary blue: #1877f2, Background: #f0f2f5, Cards: white, radius: 12px
Tool cards hover: 2px border #1877f2 + translateY(-3px)
Progress bar in #1877f2, success box #d4edda, error box #f8d7da
Dashed file drop zones, responsive mobile layout
Use CSS custom properties (variables) for the color system

Build ALL files completely. No placeholder code. No TODO comments.
Provide setup instructions at end: load extension, get ID, test each tool.
```

</details>

---

## 📌 Quick Reference

### API Endpoints

| Action | Endpoint | Method | Token Type |
|--------|---------|:------:|-----------|
| Upload video | `graph.facebook.com/v18.0/{pageId}/videos` | POST | Page token |
| Upload ad image | `graph.facebook.com/v18.0/act_{id}/adimages` | POST | Page token |
| Create ad creative | `graph.facebook.com/v18.0/act_{id}/adcreatives` | POST | Page token |
| Create post | `graph.facebook.com/v18.0/{pageId}/feed` | POST | Page token |
| Get my pages | `graph.facebook.com/v18.0/me/accounts` | GET | User token |
| Get ad accounts | `graph.facebook.com/v18.0/me/adaccounts` | GET | User token |
| Internal ops | `facebook.com/api/graphql/` | POST | fb_dtsg + cookies |

### Key Parameters Per Tool

| Tool | Critical Parameters |
|------|-------------------|
| **Video Carousel** | `child_attachments` (2–10), `multi_share_end_card=false`, `multi_share_optimized=false` |
| **Swipe Up** | `object_attachment` (video ID), `call_to_action.value.link_format=VIDEO_MOBILE_SWIPE_UP` |
| **2-Card Carousel** | Same as carousel but exactly 2 items in `child_attachments` |
| **One Card V2** | `image_hash`, `fake_album_count` (min 2), `creative_id` in `/feed` call |

### Common Error Codes

| Code | Meaning | Fix |
|:----:|---------|-----|
| `100` | Invalid parameter | Check request structure |
| `190` | Access token expired | Re-initialize (reconnect account) |
| `200` | Permission denied | Check page permissions |
| `368` | Policy block | Stop 24h, reduce frequency |
| `613` | Rate limit | Wait 1 hour |
| `2018` | API call limit | Wait 1 hour |

### Video Specs

| Spec | Value |
|------|-------|
| Format | MP4 (H.264 + AAC) |
| Max size | 1 GB |
| Max duration | 240 minutes |
| Recommended | 1080p, 16:9 |

### Image Specs (Tool 4)

| Spec | Value |
|------|-------|
| Format | JPEG or PNG |
| Max size | 30 MB |
| Minimum | 600×314 px |
| Recommended | 1200×628 px |

---

<div align="center">

---

### 🧠 The Golden Rule

> If a `doc_id` stops working: open DevTools → Network → perform the action on Facebook → capture the new ID.  
> This is the only ongoing maintenance this system ever needs.

---

**Built with reverse-engineering, curiosity, and zero tolerance for watermarks.**

[![JS](https://img.shields.io/badge/Made%20with-Vanilla%20JS-F7DF1E?style=flat-square&logo=javascript)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Chrome MV3](https://img.shields.io/badge/Chrome-Extension%20MV3-4285F4?style=flat-square&logo=googlechrome)](https://developer.chrome.com/docs/extensions/mv3/)
[![Facebook](https://img.shields.io/badge/Facebook-Internal%20API-1877F2?style=flat-square&logo=facebook)](https://developers.facebook.com/)

*Version 2.0 — March 2026 — All v1.0 mistakes corrected*

</div>
