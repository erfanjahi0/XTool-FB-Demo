<div align="center">

# 🚀 FB Advanced Tools
### Build Your Own Facebook Posting Tools — No Watermarks. No Subscriptions. Full Control.

<br/>

[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white)](https://developer.chrome.com/docs/extensions/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES2022-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Facebook API](https://img.shields.io/badge/Facebook-Graph%20API-1877F2?style=for-the-badge&logo=facebook&logoColor=white)](https://developers.facebook.com/)
[![License](https://img.shields.io/badge/License-Personal%20Use-green?style=for-the-badge)](#)
[![Status](https://img.shields.io/badge/Status-Active-brightgreen?style=for-the-badge)](#)

<br/>

> **A self-hosted toolkit that unlocks 4 powerful Facebook posting formats hidden from the normal UI.**  
> Built by reverse-engineering Facebook's internal GraphQL API. Zero dependencies. Zero server required.

<br/>

---

</div>

## 📋 Table of Contents

| # | Section |
|---|---------|
| 1 | [🎯 What We're Building](#-what-were-building) |
| 2 | [💡 The Core Insight](#-the-core-insight) |
| 3 | [🔬 How Facebook's Internal API Works](#-how-facebooks-internal-api-works) |
| 4 | [🛠 Tech Stack](#-tech-stack) |
| 5 | [📁 Project Structure](#-project-structure) |
| 6 | [🧩 Chrome Extension — Deep Dive](#-chrome-extension--deep-dive) |
| 7 | [🔑 Authentication & Cookies](#-authentication--cookies) |
| 8 | [🎬 Tool 1 — Video Carousel Post](#-tool-1--video-carousel-post) |
| 9 | [👆 Tool 2 — Swipe Up Video Creator](#-tool-2--swipe-up-video-creator) |
| 10 | [📱 Tool 3 — 2-Card Video Carousel](#-tool-3--2-card-video-carousel) |
| 11 | [🃏 Tool 4 — Generate One Card V2](#-tool-4--generate-one-card-v2) |
| 12 | [🖥 Frontend UI Guide](#-frontend-ui-guide) |
| 13 | [🔒 Security & Safety](#-security--safety) |
| 14 | [⚡ Rate Limiting & Anti-Ban](#-rate-limiting--anti-ban) |
| 15 | [🐛 Troubleshooting Guide](#-troubleshooting-guide) |
| 16 | [🚢 Deployment](#-deployment) |
| 17 | [🤖 AI Prompt — Build from Scratch](#-ai-prompt--build-from-scratch) |
| 18 | [📌 Quick Reference Cheatsheet](#-quick-reference-cheatsheet) |

---

## 🎯 What We're Building

Four professional Facebook posting tools that **exist in Facebook's internal API but are hidden from the normal UI**:

<br/>

<div align="center">

| Tool | Description | FB UI Has It? | Requires |
|:----:|:-----------|:-------------:|:--------:|
| 🎬 **Video Carousel** | Post 3–10 videos as a swipeable carousel | ❌ | Page |
| 👆 **Swipe Up Video** | Mobile video with swipe-up CTA link overlay | ❌ | Page |
| 📱 **2-Card Carousel** | Two-video carousel (larger mobile layout) | ❌ | Page |
| 🃏 **One Card V2** | Single image with fake album count clickbait | ❌ | Page + Ad Account |

</div>

<br/>

### Why build this instead of using FewFeed?

```
FewFeed                          Your Own Tool
────────────────────────────     ────────────────────────────
❌ Watermarks on every post  →   ✅ Zero watermarks
❌ Paid subscription required →  ✅ Free forever
❌ They can see your cookies  →  ✅ Your cookie never leaves your browser
❌ Dependent on their servers →  ✅ Runs on your machine
❌ Can break anytime          →  ✅ You control the code
```

---

## 💡 The Core Insight

Facebook has **two layers**:

```
┌─────────────────────────────────────────────────────────────┐
│                   LAYER 1 — Facebook's UI                   │
│              (what you see on facebook.com)                 │
│                                                             │
│   Intentionally LIMITED  •  Designed for average users      │
│   Many features are HIDDEN or LOCKED behind this layer      │
└─────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│              LAYER 2 — Facebook's Internal API              │
│        (what the Facebook app itself calls directly)        │
│                                                             │
│   FULL feature set  •  GraphQL-based  •  No restrictions   │
│   Accessible with your session cookie as authentication     │
└─────────────────────────────────────────────────────────────┘
```

> **Key Realization:** When you're logged into Facebook, your browser holds a session cookie. Any request made to Facebook's internal API with that cookie is indistinguishable from a normal browser click.

### How FewFeed was reverse-engineered (and how you'll build yours):

```
Step 1 → Open Facebook in Chrome + press F12
Step 2 → Go to Network tab → filter by "graphql"
Step 3 → Perform the action manually on Facebook
Step 4 → Capture the POST request (URL + headers + body)
Step 5 → Note the doc_id value — this is the operation ID
Step 6 → Automate that exact request with your own code
```

---

## 🔬 How Facebook's Internal API Works

<details>
<summary><b>📖 Click to expand — API Systems Explained</b></summary>

<br/>

### Two API Systems

| | Public Graph API | Internal GraphQL API |
|--|-----------------|---------------------|
| **URL** | `graph.facebook.com/v18.0/` | `facebook.com/api/graphql/` |
| **Auth** | Developer App Token | Your session cookie |
| **Rate Limits** | Strict | Same as normal browsing |
| **Features** | Limited (what Meta allows) | Everything Facebook can do |
| **Used by** | Third-party developers | Facebook's own app |

### What is a `doc_id`?

Facebook pre-compiles all UI operations into numbered "documents". When you click anything on Facebook, the browser sends:

```http
POST https://www.facebook.com/api/graphql/
Content-Type: application/x-www-form-urlencoded

doc_id=7382689905134458
&variables={"input":{"...":"..."}}
&server_timestamps=true
```

The `doc_id` identifies which internal operation to run. These IDs are found by reading the Network tab in DevTools.

</details>

<details>
<summary><b>🍪 Understanding Facebook Session Cookies</b></summary>

<br/>

When logged into Facebook, these cookies authenticate every request:

| Cookie | What It Is | Importance |
|--------|-----------|-----------|
| `c_user` | Your Facebook User ID | 🔴 Critical |
| `xs` | Session authentication token | 🔴 Critical |
| `datr` | Browser fingerprint token | 🟠 High |
| `fr` | Ad tracking token | 🟡 Medium |
| `sb` | Security token | 🟡 Medium |

> ⚠️ **The combination of `c_user` + `xs` is effectively your Facebook password. Never share these with anyone.**

### The `fb_dtsg` CSRF Token

Every POST request also requires a `fb_dtsg` token. It changes every session:

```javascript
async function getFbDtsg(html) {
  const match =
    html.match(/"DTSGInitData"[^}]*"token":"([^"]+)"/) ||
    html.match(/name="fb_dtsg"\s+value="([^"]+)"/)    ||
    html.match(/"fb_dtsg","([^"]{10,50})"/);

  return match ? match[1] : null;
}
```

</details>

---

## 🛠 Tech Stack

```
┌─────────────────────────────────────────────────────────────────┐
│                         YOUR SYSTEM                             │
│                                                                 │
│  ┌─────────────────────────────┐                                │
│  │    Chrome Extension (MV3)   │  ← Reads FB cookies securely  │
│  │  background.js + content.js │  ← No other app can do this   │
│  └──────────────┬──────────────┘                                │
│                 │ chrome.runtime.sendMessage                     │
│  ┌──────────────▼──────────────┐                                │
│  │     Website (Plain HTML)    │  ← Zero frameworks needed      │
│  │   HTML + CSS + Vanilla JS   │  ← Easy to read & modify       │
│  └──────────────┬──────────────┘                                │
│                 │ fetch() with cookies                           │
│  ┌──────────────▼──────────────┐                                │
│  │    Facebook's Internal API  │  ← graph.facebook.com          │
│  │    + Public Graph API       │  ← facebook.com/api/graphql/   │
│  └─────────────────────────────┘                                │
└─────────────────────────────────────────────────────────────────┘
```

### Why these choices?

| Choice | Reason |
|--------|--------|
| **Chrome Extension** | Only way to read browser cookies from a website |
| **Plain HTML/JS** | No build tools, no npm, easy to understand and modify |
| **No Backend** | All calls go browser → Facebook directly. More private. |
| **Manifest V3** | Required by Chrome since 2023 |

### Minimum Requirements

- ✅ Chrome or Chromium browser
- ✅ Facebook account (logged in)
- ✅ A Facebook Page (for posting)
- ✅ Active Ad Account (Tool 4 only — free to create, no spend required)

---

## 📁 Project Structure

```
fb-tools/
│
├── 📂 extension/                    ← Chrome Extension
│   ├── manifest.json                ← Permissions & configuration
│   ├── background.js                ← Service worker (reads cookies)
│   ├── content.js                   ← Injected into your website
│   └── icon.png                     ← 128×128 extension icon
│
├── 📂 website/                      ← Your tool website
│   ├── index.html                   ← Home page (tool selector)
│   │
│   ├── 📂 tools/
│   │   ├── video-carousel.html      ← Tool 1
│   │   ├── swipe-up.html            ← Tool 2
│   │   ├── two-card.html            ← Tool 3
│   │   └── one-card-v2.html         ← Tool 4
│   │
│   ├── 📂 js/
│   │   ├── facebook-api.js          ← All Facebook API calls (core)
│   │   ├── extension-bridge.js      ← Website ↔ Extension comms
│   │   └── utils.js                 ← Helpers, validators, delays
│   │
│   └── 📂 css/
│       └── style.css                ← Facebook-style UI
│
└── README.md
```

---

## 🧩 Chrome Extension — Deep Dive

<details>
<summary><b>📄 manifest.json — Complete</b></summary>

```json
{
  "manifest_version": 3,
  "name": "FB Advanced Tools",
  "version": "1.0.0",
  "description": "Personal Facebook posting tools",

  "background": {
    "service_worker": "background.js",
    "type": "module"
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

  "permissions": ["cookies", "tabs", "storage"],

  "host_permissions": [
    "*://*.facebook.com/*",
    "*://*.fbcdn.net/*",
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

  "icons": {
    "16": "icon.png",
    "48": "icon.png",
    "128": "icon.png"
  }
}
```

> Replace `your-website.vercel.app` with your actual domain.

</details>

<details>
<summary><b>⚙️ background.js — Complete Service Worker</b></summary>

```javascript
// background.js — Extension Service Worker
// Reads FB cookies and passes them to the website securely

const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "https://your-website.vercel.app"
];

chrome.runtime.onMessageExternal.addListener(
  async function (message, sender, sendResponse) {

    // Security: only respond to our trusted website
    if (!ALLOWED_ORIGINS.includes(sender.origin)) {
      sendResponse({ error: "Unauthorized origin" });
      return;
    }

    switch (message.type) {

      case "PING":
        sendResponse({ status: "ok", version: "1.0.0" });
        break;

      case "GET_FB_COOKIE":
        await handleGetFbCookie(sendResponse);
        break;

      case "GET_USER_ID":
        await handleGetUserId(sendResponse);
        break;
    }

    return true; // Keep channel open for async response
  }
);

async function handleGetFbCookie(sendResponse) {
  try {
    const cookies = await chrome.cookies.getAll({ domain: ".facebook.com" });

    if (!cookies || cookies.length === 0) {
      sendResponse({ error: "No Facebook cookies. Are you logged in?" });
      return;
    }

    const cookieString = cookies.map(c => `${c.name}=${c.value}`).join("; ");

    // Extract key cookies separately for convenience
    const keys = {};
    ["c_user", "xs", "datr", "fr", "sb"].forEach(name => {
      const found = cookies.find(c => c.name === name);
      if (found) keys[name] = found.value;
    });

    sendResponse({ cookieString, userId: keys.c_user || null, keys });
  } catch (err) {
    sendResponse({ error: err.message });
  }
}

async function handleGetUserId(sendResponse) {
  try {
    const cookie = await chrome.cookies.get({
      url: "https://www.facebook.com",
      name: "c_user"
    });
    sendResponse({ userId: cookie ? cookie.value : null });
  } catch (err) {
    sendResponse({ error: err.message });
  }
}
```

</details>

<details>
<summary><b>🔌 content.js — Website Bridge</b></summary>

```javascript
// content.js — runs on YOUR website
// Relays messages between the webpage and background service worker

window.postMessage({ type: "FB_TOOLS_EXTENSION_READY" }, "*");

window.addEventListener("message", function (event) {
  if (event.source !== window) return;
  const message = event.data;
  if (!message?.type?.startsWith("FB_TOOLS_")) return;

  chrome.runtime.sendMessage(message, function (response) {
    window.postMessage({
      type: message.type + "_RESPONSE",
      requestId: message.requestId,
      ...response
    }, "*");
  });
});
```

</details>

<details>
<summary><b>🌉 extension-bridge.js — On Your Website</b></summary>

```javascript
// extension-bridge.js — loaded on your website pages
// How your website communicates with the extension

const EXTENSION_ID = "YOUR_EXTENSION_ID_HERE";
// Get this from chrome://extensions after loading the extension

class FBToolsExtension {
  constructor() {
    this.isAvailable = false;
    this.checkAvailability();
  }

  async checkAvailability() {
    return new Promise((resolve) => {
      try {
        chrome.runtime.sendMessage(EXTENSION_ID, { type: "PING" }, (response) => {
          this.isAvailable = !chrome.runtime.lastError && !!response;
          resolve(this.isAvailable);
        });
      } catch {
        this.isAvailable = false;
        resolve(false);
      }
    });
  }

  async getFbCookies() {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(EXTENSION_ID, { type: "GET_FB_COOKIE" }, (response) => {
        if (chrome.runtime.lastError) return reject(new Error(chrome.runtime.lastError.message));
        if (response.error) return reject(new Error(response.error));
        resolve(response);
      });
    });
  }
}

window.FBExtension = new FBToolsExtension();
```

</details>

### ⚡ How to Install the Extension

```
1. Open Chrome → go to chrome://extensions
2. Enable "Developer mode" (top-right toggle)
3. Click "Load unpacked" → select your /extension folder
4. Copy the Extension ID shown on the card
5. Paste it into extension-bridge.js as EXTENSION_ID
6. Reload your website
```

---

## 🔑 Authentication & Cookies

<details>
<summary><b>📋 Core FacebookAPI Class — Full Code</b></summary>

```javascript
// facebook-api.js — Core class used by all tools

class FacebookAPI {
  constructor() {
    this.cookieString = null;
    this.userId = null;
    this.fbDtsg = null;
    this.lsdToken = null;
    this.initialized = false;
  }

  async initialize() {
    const cookieData = await window.FBExtension.getFbCookies();
    this.cookieString = cookieData.cookieString;
    this.userId = cookieData.userId;

    if (!this.cookieString || !this.userId) {
      throw new Error("Could not get cookies. Are you logged into Facebook?");
    }

    await this.fetchCsrfTokens();
    this.initialized = true;
    return true;
  }

  async fetchCsrfTokens() {
    const response = await this.rawFetch("https://www.facebook.com/", "GET");
    const html = await response.text();

    const dtsgMatch =
      html.match(/"DTSGInitData"[^}]*"token":"([^"]+)"/) ||
      html.match(/name="fb_dtsg"\s+value="([^"]+)"/)    ||
      html.match(/"fb_dtsg","([^"]{10,50})"/);

    if (!dtsgMatch) throw new Error("Could not extract fb_dtsg. Try re-logging into Facebook.");
    this.fbDtsg = dtsgMatch[1];

    const lsdMatch = html.match(/"LSD"[^}]*"token":"([^"]+)"/);
    if (lsdMatch) this.lsdToken = lsdMatch[1];
  }

  async rawFetch(url, method = "GET", body = null, extraHeaders = {}) {
    const headers = {
      "Cookie": this.cookieString,
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "Referer": "https://www.facebook.com/",
      "Origin": "https://www.facebook.com",
      ...extraHeaders
    };

    const options = { method, headers, credentials: "include" };
    if (body) options.body = body;

    const response = await fetch(url, options);
    if (!response.ok && response.status !== 302)
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    return response;
  }

  async graphql(docId, variables, friendlyName = "") {
    if (!this.initialized) await this.initialize();

    const formData = new URLSearchParams({
      av: this.userId,
      __user: this.userId,
      __a: "1",
      fb_dtsg: this.fbDtsg,
      fb_api_caller_class: "RelayModern",
      fb_api_req_friendly_name: friendlyName,
      variables: JSON.stringify(variables),
      server_timestamps: "true",
      doc_id: docId
    });

    if (this.lsdToken) formData.append("lsd", this.lsdToken);

    const response = await this.rawFetch(
      "https://www.facebook.com/api/graphql/",
      "POST",
      formData,
      { "Content-Type": "application/x-www-form-urlencoded" }
    );

    const text = await response.text();
    return JSON.parse(text.split("\n")[0]);
  }

  async getMyPages() {
    if (!this.initialized) await this.initialize();
    const response = await this.rawFetch(
      "https://graph.facebook.com/v18.0/me/accounts?fields=id,name,access_token&limit=100"
    );
    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    return data.data || [];
  }

  async getAdAccounts() {
    if (!this.initialized) await this.initialize();
    const response = await this.rawFetch(
      "https://graph.facebook.com/v18.0/me/adaccounts?fields=id,name,account_status&limit=50"
    );
    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    return (data.data || []).filter(a => a.account_status === 1); // Active only
  }
}

window.FB_API = new FacebookAPI();
```

</details>

---

## 🎬 Tool 1 — Video Carousel Post

> Post **3–10 videos** as a swipeable carousel on your Facebook Page.

### How It Works

```
┌─────────┐    ┌─────────┐    ┌─────────┐
│ Video 1 │ ←→ │ Video 2 │ ←→ │ Video 3 │  ...up to 10
└─────────┘    └─────────┘    └─────────┘
     ↑ Users swipe between cards in their feed
```

**Flow:**
1. Select 3–10 video files in the UI
2. Each video uploads to Facebook → returns a `video_id`
3. A carousel post is created using those `video_id`s
4. Post appears in feed as swipeable video carousel

<details>
<summary><b>📋 Full API Code</b></summary>

```javascript
// Add to FacebookAPI class

async uploadVideoWithToken(file, pageId, accessToken, onProgress) {
  // Step 1: Start upload session
  const initParams = new URLSearchParams({
    upload_phase: "start",
    file_size: file.size,
    access_token: accessToken
  });

  const init = await fetch(`https://graph.facebook.com/v18.0/${pageId}/videos`,
    { method: "POST", body: initParams }
  ).then(r => r.json());

  if (init.error) throw new Error(init.error.message);

  const { upload_session_id, video_id } = init;
  let { start_offset, end_offset } = init;

  // Step 2: Upload in chunks
  while (parseInt(start_offset) < file.size) {
    const chunk = file.slice(parseInt(start_offset), parseInt(end_offset));
    const chunkForm = new FormData();
    chunkForm.append("upload_phase", "transfer");
    chunkForm.append("upload_session_id", upload_session_id);
    chunkForm.append("start_offset", start_offset);
    chunkForm.append("video_file_chunk", chunk, file.name);
    chunkForm.append("access_token", accessToken);

    const chunkData = await fetch(`https://graph.facebook.com/v18.0/${pageId}/videos`,
      { method: "POST", body: chunkForm }
    ).then(r => r.json());

    if (chunkData.error) throw new Error(chunkData.error.message);
    start_offset = chunkData.start_offset;
    end_offset = chunkData.end_offset;
    onProgress?.(Math.round((parseInt(start_offset) / file.size) * 100));
  }

  // Step 3: Finish
  await fetch(`https://graph.facebook.com/v18.0/${pageId}/videos`, {
    method: "POST",
    body: new URLSearchParams({
      upload_phase: "finish",
      upload_session_id,
      access_token: accessToken
    })
  });

  return video_id;
}

async createVideoCarousel(pageId, pageToken, videoFiles, message, onProgress) {
  const videoIds = [];

  for (let i = 0; i < videoFiles.length; i++) {
    onProgress?.(`Uploading video ${i + 1} of ${videoFiles.length}...`);
    const id = await this.uploadVideoWithToken(
      videoFiles[i], pageId, pageToken,
      p => onProgress?.(`Video ${i + 1}: ${p}%`)
    );
    videoIds.push(id);
    await new Promise(r => setTimeout(r, 2000)); // Delay between uploads
  }

  onProgress?.("Creating carousel post...");

  const result = await fetch(`https://graph.facebook.com/v18.0/${pageId}/feed`, {
    method: "POST",
    body: new URLSearchParams({
      message,
      child_attachments: JSON.stringify(
        videoIds.map((id, i) => ({
          media_fbid: id,
          name: `Video ${i + 1}`,
          description: message,
          link: `https://www.facebook.com/video/${id}`
        }))
      ),
      multi_share_end_card: "false",
      multi_share_optimized: "false",
      published: "true",
      access_token: pageToken
    })
  }).then(r => r.json());

  if (result.error) throw new Error(result.error.message);
  return { postId: result.id };
}
```

</details>

---

## 👆 Tool 2 — Swipe Up Video Creator

> Creates a video post with a **Swipe Up** overlay linking to any URL.  
> Only visible on the **mobile Facebook app** newsfeed.

### Supported CTA Button Types

| Value | Displays As |
|-------|------------|
| `LEARN_MORE` | Learn More |
| `SHOP_NOW` | Shop Now |
| `SIGN_UP` | Sign Up |
| `WATCH_MORE` | Watch More |
| `BOOK_NOW` | Book Now |
| `DOWNLOAD` | Download |
| `GET_OFFER` | Get Offer |
| `CONTACT_US` | Contact Us |

<details>
<summary><b>📋 Full API Code</b></summary>

```javascript
async createSwipeUpPost(pageId, pageToken, videoFile, linkUrl, ctaType, message, onProgress) {

  onProgress?.("Uploading video...");
  const videoId = await this.uploadVideoWithToken(
    videoFile, pageId, pageToken,
    p => onProgress?.(`Uploading: ${p}%`)
  );

  onProgress?.("Creating swipe-up post...");

  const result = await fetch(`https://graph.facebook.com/v18.0/${pageId}/feed`, {
    method: "POST",
    body: new URLSearchParams({
      message,
      object_attachment: videoId,
      call_to_action: JSON.stringify({
        type: ctaType,                           // e.g. "LEARN_MORE"
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
  return { postId: result.id };
}
```

> ⚠️ **Note:** On desktop, this renders as a normal video post with a link. Open Facebook on your phone to see the swipe-up effect.

</details>

---

## 📱 Tool 3 — 2-Card Video Carousel

> Exactly **2 videos** in carousel format. The 2-card layout renders **larger on mobile screens** than a standard 3+ card carousel, getting significantly more engagement.

<details>
<summary><b>📋 Full API Code</b></summary>

```javascript
async createTwoCardCarousel(pageId, pageToken, video1, video2, message, link1, link2, onProgress) {

  onProgress?.("Uploading video 1 of 2...");
  const video1Id = await this.uploadVideoWithToken(video1, pageId, pageToken,
    p => onProgress?.(`Video 1: ${p}%`)
  );

  onProgress?.("Uploading video 2 of 2...");
  const video2Id = await this.uploadVideoWithToken(video2, pageId, pageToken,
    p => onProgress?.(`Video 2: ${p}%`)
  );

  onProgress?.("Creating 2-card post...");

  const result = await fetch(`https://graph.facebook.com/v18.0/${pageId}/feed`, {
    method: "POST",
    body: new URLSearchParams({
      message,
      child_attachments: JSON.stringify([
        {
          media_fbid: video1Id,
          name: "Video 1",
          link: link1 || `https://www.facebook.com/video/${video1Id}`
        },
        {
          media_fbid: video2Id,
          name: "Video 2",
          link: link2 || `https://www.facebook.com/video/${video2Id}`
        }
      ]),
      multi_share_end_card: "false",    // ← Critical for 2-card format
      multi_share_optimized: "false",   // ← Prevent Facebook reordering
      published: "true",
      access_token: pageToken
    })
  }).then(r => r.json());

  if (result.error) throw new Error(result.error.message);
  return { postId: result.id };
}
```

</details>

---

## 🃏 Tool 4 — Generate One Card V2

> Creates a single image post that displays a **fake album count** (e.g., `1/5 📷`) to trick users into clicking — linking them to your URL instead of an album.

### Prerequisites

```
✅ Facebook Page (any)
✅ Ad Account linked to that page
✅ Ad Account status must be "Active"
✅ No ad spend required — free to create
```

### Get Your Ad Account ID

```
1. Go to https://www.facebook.com/adsmanager
2. Your account ID is shown in the URL or top-left: act_XXXXXXXXX
3. If you don't have one, click "Create Ad Account" — it's free
```

### How The "Fake Album Count" Works

```
Normal post         One Card V2 post
─────────────       ─────────────────────────────
┌───────────┐       ┌───────────────────────────┐
│           │       │                           │
│  Image    │  vs   │   Image                   │
│           │       │              ╔══════════╗ │
└───────────┘       │              ║ 1 / 5 📷 ║ │  ← Fake count
  Normal image      │              ╚══════════╝ │     triggers
                    └───────────────────────────┘     curiosity
                       Exploits the Ad Creative system
```

<details>
<summary><b>📋 Full API Code — 3 Steps</b></summary>

```javascript
async generateOneCardV2(adAccountId, pageId, pageToken, imageFile, linkUrl,
                        headline, description, fakeAlbumCount, message, onProgress) {

  const accountId = adAccountId.startsWith("act_")
    ? adAccountId
    : `act_${adAccountId}`;

  // ── STEP 1: Upload image to Ad Account image library ──
  onProgress?.("Uploading image...");
  const imageForm = new FormData();
  imageForm.append("filename", imageFile, imageFile.name);
  imageForm.append("access_token", pageToken);

  const imageData = await fetch(
    `https://graph.facebook.com/v18.0/${accountId}/adimages`,
    { method: "POST", body: imageForm }
  ).then(r => r.json());

  if (imageData.error) throw new Error("Image upload: " + imageData.error.message);

  const firstKey = Object.keys(imageData.images)[0];
  const imageHash = imageData.images[firstKey].hash;

  // ── STEP 2: Create Ad Creative with the "One Card" format ──
  onProgress?.("Creating one-card creative...");

  const creative = await fetch(
    `https://graph.facebook.com/v18.0/${accountId}/adcreatives`,
    {
      method: "POST",
      body: new URLSearchParams({
        name: `OneCard_${Date.now()}`,
        object_story_spec: JSON.stringify({
          page_id: pageId,
          link_data: {
            link: linkUrl,
            message,
            name: headline,
            description,
            image_hash: imageHash,
            child_attachments: JSON.stringify([{
              link: linkUrl,
              image_hash: imageHash,
              name: headline,
              description
            }]),
            multi_share_end_card: false,
            fake_album_count: parseInt(fakeAlbumCount) || 5  // ← The magic number
          }
        }),
        access_token: pageToken
      })
    }
  ).then(r => r.json());

  if (creative.error) throw new Error("Creative: " + creative.error.message);

  // ── STEP 3: Publish as organic page post ──
  onProgress?.("Publishing post...");

  const post = await fetch(`https://graph.facebook.com/v18.0/${pageId}/feed`, {
    method: "POST",
    body: new URLSearchParams({
      message,
      published: "true",
      creative: JSON.stringify({ creative_id: creative.id }),
      access_token: pageToken
    })
  }).then(r => r.json());

  if (post.error) throw new Error("Post: " + post.error.message);
  return { postId: post.id, creativeId: creative.id };
}
```

</details>

---

## 🖥 Frontend UI Guide

<details>
<summary><b>🏠 Homepage — index.html</b></summary>

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
    <p>Personal Facebook tools — no watermarks, no subscriptions</p>
    <div id="ext-status">Checking extension... ⏳</div>
  </header>

  <main>
    <div class="tools-grid">

      <div class="tool-card" onclick="location.href='tools/video-carousel.html'">
        <div class="icon">🎬</div>
        <h2>Video Carousel Post</h2>
        <p>Post 3–10 videos as a swipeable carousel</p>
        <span class="badge">3–10 videos</span>
      </div>

      <div class="tool-card" onclick="location.href='tools/swipe-up.html'">
        <div class="icon">👆</div>
        <h2>Swipe Up Video</h2>
        <p>Mobile-only video with swipe-up CTA link</p>
        <span class="badge">Mobile Only</span>
      </div>

      <div class="tool-card" onclick="location.href='tools/two-card.html'">
        <div class="icon">📱</div>
        <h2>2-Card Carousel</h2>
        <p>Two-video carousel — larger mobile layout</p>
        <span class="badge">2 Videos</span>
      </div>

      <div class="tool-card" onclick="location.href='tools/one-card-v2.html'">
        <div class="icon">🃏</div>
        <h2>One Card V2</h2>
        <p>Fake album count clickbait image post</p>
        <span class="badge ad">Requires Ad Account</span>
      </div>

    </div>
  </main>

  <script>
    async function checkExt() {
      await window.FBExtension.checkAvailability();
      document.getElementById("ext-status").textContent =
        window.FBExtension.isAvailable
          ? "✅ Extension connected"
          : "❌ Extension not found — load it from chrome://extensions";
    }
    checkExt();
  </script>
</body>
</html>
```

</details>

<details>
<summary><b>🎨 style.css — Complete Stylesheet</b></summary>

```css
* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  background: #f0f2f5;
  color: #1c1e21;
}

/* ── Header ── */
header {
  background: #1877f2;
  color: white;
  padding: 24px 40px;
}
header h1 { font-size: 26px; margin-bottom: 6px; }
header p  { opacity: 0.85; font-size: 14px; margin-bottom: 12px; }

#ext-status {
  font-size: 13px;
  background: rgba(0,0,0,0.15);
  padding: 6px 14px;
  border-radius: 20px;
  display: inline-block;
}

/* ── Tool Grid ── */
main { padding: 40px; max-width: 1100px; margin: 0 auto; }

.tools-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 20px;
}

.tool-card {
  background: white;
  border-radius: 12px;
  padding: 28px 24px;
  cursor: pointer;
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
  transition: all 0.2s ease;
  border: 2px solid transparent;
}
.tool-card:hover {
  border-color: #1877f2;
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(24,119,242,0.15);
}
.tool-card .icon { font-size: 42px; margin-bottom: 14px; }
.tool-card h2    { font-size: 18px; margin-bottom: 8px; }
.tool-card p     { font-size: 14px; color: #65676b; margin-bottom: 16px; line-height: 1.5; }

/* ── Badges ── */
.badge     { background: #e7f3ff; color: #1877f2; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
.badge.ad  { background: #fff3cd; color: #856404; }

/* ── Form Elements ── */
.tool-container { max-width: 680px; margin: 40px auto; padding: 0 20px; }

.card { background: white; border-radius: 12px; padding: 28px; margin-bottom: 20px; box-shadow: 0 1px 4px rgba(0,0,0,0.08); }
.card h2 { font-size: 20px; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid #e4e6ea; }

.form-group { margin-bottom: 20px; }
.form-group label { display: block; font-weight: 600; font-size: 14px; margin-bottom: 8px; color: #1c1e21; }
.form-group input,
.form-group select,
.form-group textarea {
  width: 100%; padding: 10px 14px; border: 1.5px solid #ddd;
  border-radius: 8px; font-size: 14px; outline: none; transition: border-color 0.2s;
}
.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus { border-color: #1877f2; }
.form-group textarea { height: 90px; resize: vertical; }
.form-group small { color: #65676b; font-size: 12px; margin-top: 4px; display: block; }

/* ── Buttons ── */
.btn { padding: 12px 28px; border: none; border-radius: 8px; font-size: 15px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
.btn-primary { background: #1877f2; color: white; width: 100%; }
.btn-primary:hover    { background: #1558b0; }
.btn-primary:disabled { background: #bcc0c4; cursor: not-allowed; }

/* ── Progress ── */
.progress-box { background: #f0f2f5; border-radius: 10px; padding: 18px; margin: 16px 0; }
.progress-text { font-size: 14px; color: #1c1e21; margin-bottom: 10px; }
progress { width: 100%; height: 8px; border-radius: 4px; appearance: none; }
progress::-webkit-progress-bar   { background: #ddd; border-radius: 4px; }
progress::-webkit-progress-value { background: #1877f2; border-radius: 4px; }

/* ── Result Boxes ── */
.success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 16px; border-radius: 8px; margin-top: 16px; }
.error   { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; padding: 16px; border-radius: 8px; margin-top: 16px; }

.success a { color: #155724; font-weight: 600; }
```

</details>

---

## 🔒 Security & Safety

> **Your cookie = your password. This section is not optional reading.**

```
⚠️  CRITICAL RULES
────────────────────────────────────────────────────────────────
  Your Facebook cookie gives FULL account access.
  With it, anyone can: post, message, delete, pay, change settings.

  ✅ DO:   Make all API calls directly from your browser to Facebook
  ✅ DO:   Run the website on localhost for maximum privacy
  ✅ DO:   Keep your extension source code private

  ❌ DON'T: Send your cookie to any server (yours or anyone else's)
  ❌ DON'T: Use someone else's copy of this tool
  ❌ DON'T: Paste your cookie string into any website you don't own
  ❌ DON'T: Use this on accounts you can't afford to lose
────────────────────────────────────────────────────────────────
```

**Why your tool is safer than FewFeed:**
- FewFeed's servers receive your cookie with every request
- Your tool makes requests **directly browser → Facebook**
- Your cookie never touches any server

---

## ⚡ Rate Limiting & Anti-Ban

### Safe Daily Limits

| Action | Safe Daily Limit | What Happens If Exceeded |
|--------|:---------------:|--------------------------|
| Carousel posts | 10/day | Posts hidden from feed |
| Video uploads | 25/hour | Upload API returns error |
| API calls | 200/hour | Temporary IP block |
| Swipe-up posts | 15/day | CTA stripped from post |

### Add Delays Between Operations

```javascript
// Always delay between bulk operations to appear human
function humanDelay(min = 2000, max = 5000) {
  const ms = Math.floor(Math.random() * (max - min)) + min;
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Example: uploading multiple videos
for (const video of videos) {
  await uploadVideo(video);
  await humanDelay(2000, 4000); // Wait 2–4 seconds between each
}
```

### Warning Signs to Watch For

| Sign | Meaning | Action |
|------|---------|--------|
| `Action Blocked` error | Temporary tool block | Stop for 24 hours |
| `Checkpoint` required | Account flagged | Complete verification |
| Sudden CAPTCHAs | Behavior looks suspicious | Slow everything down |
| Posts auto-removed | Spam filter triggered | Review post content |

---

## 🐛 Troubleshooting Guide

<details>
<summary><b>❌ "Extension not found"</b></summary>

**Cause:** Extension not installed or not loaded properly.

```
Fix:
1. Open chrome://extensions
2. Enable Developer Mode (top-right toggle)
3. Click "Load unpacked" → select your /extension folder
4. Copy the Extension ID from the card
5. Paste into extension-bridge.js as EXTENSION_ID value
6. Hard refresh your website (Ctrl+Shift+R)
```
</details>

<details>
<summary><b>❌ "No Facebook cookies found"</b></summary>

**Cause:** Not logged into Facebook, or cookies are being blocked.

```
Fix:
1. Open facebook.com in Chrome and verify you are logged in
2. Check for ad blockers or privacy extensions blocking cookies
3. Log out and back into Facebook
4. Ensure Chrome's cookie settings allow third-party cookies
   → Chrome Settings → Privacy → Cookies → Allow all
```
</details>

<details>
<summary><b>❌ "Could not extract fb_dtsg token"</b></summary>

**Cause:** Facebook updated their HTML structure — the regex needs updating.

```
Fix:
1. Go to facebook.com → press F12 → Network tab
2. Refresh the page → click the main document request
3. In Response tab, search for: DTSGInitData or fb_dtsg
4. Copy the token pattern and update the regex in fetchCsrfTokens()

Common patterns to search for:
  → "DTSGInitData",[],"token":"XXXXXXX"
  → name="fb_dtsg" value="XXXXXXX"
  → "fb_dtsg_ag":{"token":"XXXXXXX"}
```
</details>

<details>
<summary><b>❌ "Invalid doc_id" on GraphQL calls</b></summary>

**Cause:** Facebook periodically updates their internal operation IDs.

```
Fix:
1. Open Chrome DevTools → Network tab → filter: "graphql"
2. Perform the action MANUALLY on Facebook
3. Find the POST request → click it → Payload tab
4. Copy the new doc_id value
5. Update it in your code

Note: doc_ids typically stay stable for weeks-months.
This is the only real maintenance this system needs.
```
</details>

<details>
<summary><b>❌ Carousel videos not playing after posting</b></summary>

**Cause:** Facebook processes videos asynchronously — they need time after upload.

```
Fix:
1. Wait 5–10 minutes after the post is created
2. Refresh the post — videos will be available
3. If still not playing after 30 min, the upload may have failed

Add a video readiness check:
```

```javascript
async function waitForVideo(videoId, pageToken, timeout = 120000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const data = await fetch(
      `https://graph.facebook.com/v18.0/${videoId}?fields=status&access_token=${pageToken}`
    ).then(r => r.json());

    if (data.status?.processing_progress === 100) return true;
    await new Promise(r => setTimeout(r, 5000)); // Check every 5s
  }
  throw new Error("Video processing timed out after 2 minutes");
}
```
</details>

<details>
<summary><b>❌ Tool 4 "Ad Account required" error</b></summary>

**Cause:** No active ad account, wrong ID format, or account is disabled.

```
Fix:
1. Go to https://www.facebook.com/adsmanager
2. Create an ad account if none exists (free — no credit card to start)
3. Your account must show status: "Active"
4. Format must be: act_XXXXXXXXX (with "act_" prefix)
5. The ad account must be linked to the page you're posting from
```
</details>

<details>
<summary><b>❌ Swipe-Up not visible after posting</b></summary>

**Cause:** Swipe-up format is mobile-only — it does not render on desktop.

```
This is expected behavior. The post is created correctly.
To verify: Open Facebook on your phone → find the post in your feed.
The swipe-up button only appears in the mobile app newsfeed.
```
</details>

<details>
<summary><b>❌ Large video upload fails mid-way</b></summary>

**Cause:** Network timeout or chunk too large.

```javascript
// Add retry logic to chunk uploads:
async function uploadChunkWithRetry(url, formData, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fetch(url, { method: "POST", body: formData }).then(r => r.json());
    } catch (err) {
      if (attempt === maxRetries - 1) throw err;
      // Exponential backoff: wait 2s, 4s, 8s...
      await new Promise(r => setTimeout(r, 2000 * Math.pow(2, attempt)));
    }
  }
}
```
</details>

---

## 🚢 Deployment

### Option A — Run Locally (Simplest)

```bash
# Install a simple HTTP server
npm install -g http-server

# Start in your website folder
cd fb-tools/website
http-server -p 3000

# Open: http://localhost:3000
```

### Option B — Vercel (Free HTTPS)

```bash
npm install -g vercel
cd fb-tools/website
vercel

# Your site: https://your-project.vercel.app
# Update manifest.json and extension-bridge.js with your new URL
# Reload extension at chrome://extensions
```

### Option C — GitHub Pages (Free)

```bash
# Push website/ contents to a gh-pages branch
# Enable GitHub Pages in repo Settings → Pages
# URL: https://yourusername.github.io/fb-tools
```

> After deploying anywhere, update the URLs in `manifest.json` under `content_scripts.matches` and `externally_connectable.matches`, then reload the extension.

---

## 🤖 AI Prompt — Build from Scratch

> Copy the prompt below and paste it into any AI coding assistant (Claude, GPT-4, Gemini, Copilot). It contains everything needed to generate the full working project.

<details>
<summary><b>📋 Click to expand — Full AI Prompt (copy entire block)</b></summary>

```
You are an expert full-stack developer. Build a complete personal Facebook advanced 
posting toolset. This is for personal use on my own Facebook account and pages only.

## PROJECT: FB Advanced Posting Tools

### THE FOUR TOOLS TO BUILD:
1. Video Carousel Post      — Post 3–10 videos as a swipeable carousel on a Page
2. Swipe Up Video Creator   — Mobile-only video post with swipe-up CTA link overlay
3. 2-Card Video Carousel    — Exactly 2 videos in carousel (larger mobile layout)
4. Generate One Card V2     — Single image with fake album count overlay (needs Ad Account)

### CORE ARCHITECTURE:
- Chrome Extension (Manifest V3) reads the user's Facebook session cookies from Chrome
- A simple website communicates with the extension via chrome.runtime.sendMessage
- The extension returns: cookieString, userId (c_user), and fb_dtsg CSRF token
- The website uses these to make authenticated API calls directly to:
    • https://graph.facebook.com/v18.0/    (public Graph API — use with page access_token)
    • https://www.facebook.com/api/graphql/ (internal — use with session cookie + fb_dtsg)
- NO backend server needed — all requests go browser → Facebook directly
- NO npm, NO frameworks, NO TypeScript — plain HTML + CSS + Vanilla JS only

### FILE STRUCTURE TO CREATE:
fb-tools/
├── extension/
│   ├── manifest.json    (Manifest V3, permissions: cookies, tabs, storage)
│   ├── background.js    (service worker, reads cookies, handles messages)
│   ├── content.js       (relays messages between page and background)
│   └── icon.png         (simple placeholder 128x128)
└── website/
    ├── index.html       (homepage with 4 tool cards)
    ├── tools/
    │   ├── video-carousel.html
    │   ├── swipe-up.html
    │   ├── two-card.html
    │   └── one-card-v2.html
    ├── js/
    │   ├── facebook-api.js       (FacebookAPI class with all methods)
    │   ├── extension-bridge.js   (FBToolsExtension class)
    │   └── utils.js              (humanDelay, validators, formatFileSize)
    └── css/
        └── style.css             (Facebook-inspired clean design)

### CHROME EXTENSION REQUIREMENTS:
manifest.json:
- manifest_version: 3
- permissions: ["cookies", "tabs", "storage"]
- host_permissions: ["*://*.facebook.com/*", "http://localhost/*", "http://127.0.0.1/*"]
- externally_connectable.matches: ["http://localhost/*", "http://127.0.0.1/*"]
- background.service_worker: "background.js"
- content_scripts matching: ["http://localhost/*", "http://127.0.0.1/*"]

background.js:
- chrome.runtime.onMessageExternal.addListener
- Validate sender.origin against allowed origins list
- Handle message types: "PING", "GET_FB_COOKIE", "GET_USER_ID"
- GET_FB_COOKIE: chrome.cookies.getAll({domain: ".facebook.com"})
  → return {cookieString, userId: c_user value, keys: {c_user, xs, datr}}
- Always return true from listener for async support

content.js:
- window.postMessage({type: "FB_TOOLS_EXTENSION_READY"}, "*")
- Forward FB_TOOLS_ prefixed messages to chrome.runtime.sendMessage

### FACEBOOK API CLASS (facebook-api.js):
Class: FacebookAPI
Properties: cookieString, userId, fbDtsg, lsdToken, initialized

Methods to implement:
1. initialize() — get cookies from FBExtension, call fetchCsrfTokens()
2. fetchCsrfTokens() — GET facebook.com, extract fb_dtsg with regex:
   html.match(/"DTSGInitData"[^}]*"token":"([^"]+)"/) as primary pattern
3. rawFetch(url, method, body, extraHeaders) — attach Cookie header to all requests
4. graphql(docId, variables, friendlyName) — POST to /api/graphql/ with all params
5. getMyPages() — GET /me/accounts?fields=id,name,access_token
6. getAdAccounts() — GET /me/adaccounts, filter status===1 (active only)
7. uploadVideoWithToken(file, pageId, token, onProgress):
   - Phase 1: POST /videos with upload_phase=start, file_size
   - Phase 2: Loop chunks: POST /videos with upload_phase=transfer
   - Phase 3: POST /videos with upload_phase=finish
   - Return video_id
8. createVideoCarousel(pageId, token, files[], message, onProgress):
   - Upload each video with delay between uploads
   - POST /{pageId}/feed with child_attachments array, multi_share_end_card=false,
     multi_share_optimized=false
9. createSwipeUpPost(pageId, token, videoFile, linkUrl, ctaType, message, onProgress):
   - Upload video → get video_id
   - POST /{pageId}/feed with object_attachment=videoId, call_to_action JSON:
     {type: ctaType, value: {link: linkUrl, link_format: "VIDEO_MOBILE_SWIPE_UP"}}
10. createTwoCardCarousel(pageId, token, v1, v2, message, link1, link2, onProgress):
    - Upload both videos
    - POST /{pageId}/feed with exactly 2 items in child_attachments
    - multi_share_end_card=false, multi_share_optimized=false
11. generateOneCardV2(adAccountId, pageId, token, imageFile, linkUrl, headline,
                      desc, fakeCount, message, onProgress):
    - Step 1: POST /act_{id}/adimages with image file → get hash from response
    - Step 2: POST /act_{id}/adcreatives with object_story_spec containing
              link_data with image_hash, child_attachments, fake_album_count
    - Step 3: POST /{pageId}/feed with creative JSON, published=true

### UI REQUIREMENTS (each tool page):
- "Connect Account" button → calls FB_API.initialize() → shows user ID
- Page selector dropdown → populated from getMyPages()
- Tool 4 additionally: Ad Account selector from getAdAccounts()
- File input(s) with correct accept types and count limits
- Caption/message textarea
- CTA selector for swipe-up tool (all 8 CTA types)
- Fake album count input (1-20) for one-card tool
- Large action button (disabled until connected)
- Progress section: text + <progress> bar (0-100)
- Success box (green): shows "✅ Post created!" + clickable post link
- Error box (red): shows clear error message
- Back link to homepage

### EXTENSION-BRIDGE.JS:
- EXTENSION_ID constant = "YOUR_EXTENSION_ID_HERE"
- FBToolsExtension class with: checkAvailability(), getFbCookies()
- Show warning banner on page if extension not detected
- window.FBExtension = new FBToolsExtension() as global

### UTILS.JS:
- humanDelay(min, max) — returns Promise with random setTimeout
- formatFileSize(bytes) — returns "2.3 MB" format
- validateVideo(file) — check: must be video/*, max 1GB
- validateImage(file) — check: must be image/*, max 30MB
- showProgress(text, percent) — updates #progress-text and #progress-bar
- showSuccess(postUrl) — shows #success-box with link
- showError(message) — shows #error-box with message

### STYLE (style.css):
- Primary blue: #1877f2 (Facebook blue)
- Background: #f0f2f5
- White cards with border-radius: 12px, subtle box-shadow
- Hover effect on tool cards: border #1877f2, slight lift (translateY -3px)
- Progress bar styled in blue with rounded ends
- Responsive grid: repeat(auto-fill, minmax(260px, 1fr))
- Green success box, red error box with appropriate borders

### VALIDATION & ERROR HANDLING:
- Every async function: try/catch with user-friendly error messages
- "Not logged into Facebook" — clear instruction
- "Extension not found" — tells user to install from chrome://extensions
- "No active ad account" — explains what it is and how to create one
- "Video processing" — tells user to wait a few minutes
- Never use browser alert() — always use styled error boxes

### VIDEO FORMAT REQUIREMENTS TO DISPLAY:
Format: MP4 (H.264 + AAC) | Max size: 1GB | Max length: 240 min | Min resolution: 720p

Build ALL files completely with full working code.
No placeholder code, no TODO comments.
After all files, provide step-by-step setup instructions.
```

</details>

---

## 📌 Quick Reference Cheatsheet

### API Endpoints

| Action | Endpoint | Method |
|--------|---------|:------:|
| Upload video | `/v18.0/{pageId}/videos` | `POST` |
| Upload ad image | `/v18.0/act_{id}/adimages` | `POST` |
| Create ad creative | `/v18.0/act_{id}/adcreatives` | `POST` |
| Create post | `/v18.0/{pageId}/feed` | `POST` |
| Get pages | `/v18.0/me/accounts` | `GET` |
| Get ad accounts | `/v18.0/me/adaccounts` | `GET` |
| Internal GraphQL | `facebook.com/api/graphql/` | `POST` |

> All Graph API calls: prefix with `https://graph.facebook.com`

### Video Specs

| Spec | Value |
|------|-------|
| Format | MP4 (H.264 video, AAC audio) |
| Max file size | 1 GB |
| Max duration | 240 minutes |
| Recommended | 1080p, 16:9 aspect ratio |
| Minimum | 720p |

### Common Error Codes

| Code | Meaning | Fix |
|------|---------|-----|
| `190` | Invalid/expired token | Re-initialize (re-login to FB) |
| `200` | Permission error | Check page permissions |
| `100` | Invalid parameter | Check request body format |
| `368` | Policy block | Wait 24h, reduce frequency |
| `2018` | Rate limit reached | Wait 1 hour |
| `613` | Too many calls | Slow down requests |

### Tool Parameter Summary

| Tool | Key Parameters |
|------|---------------|
| **Video Carousel** | `child_attachments[]` · `multi_share_end_card=false` · `multi_share_optimized=false` |
| **Swipe Up** | `object_attachment` (video ID) · `call_to_action.value.link_format=VIDEO_MOBILE_SWIPE_UP` |
| **2-Card Carousel** | Exactly 2 items in `child_attachments` · same flags as carousel |
| **One Card V2** | `fake_album_count` · `image_hash` · `creative_id` · Active Ad Account |

---

<div align="center">

---

### 🧠 The Golden Rule

> If a `doc_id` stops working, open DevTools → Network → perform the action manually → capture the new ID.  
> This is the only ongoing maintenance this system requires.

---

**Built with reverse-engineering, curiosity, and zero tolerance for watermarks.**

[![Made with JavaScript](https://img.shields.io/badge/Made%20with-JavaScript-F7DF1E?style=flat-square&logo=javascript)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension%20MV3-4285F4?style=flat-square&logo=googlechrome)](https://developer.chrome.com/docs/extensions/mv3/)
[![Facebook API](https://img.shields.io/badge/Facebook-Internal%20GraphQL-1877F2?style=flat-square&logo=facebook)](https://developers.facebook.com/)

*Version 2.0 · March 2026*

</div>
