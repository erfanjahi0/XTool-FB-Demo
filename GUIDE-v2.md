# 🛠️ Facebook Advanced Tools — Complete Build Guide
### Build Your Own: Video Carousel Post · Swipe Up Video · 2-Card Carousel · Generate One Card V2
**Version 2.0 — Fully Corrected**

---

> This is a complete, self-contained guide to understanding, designing, and building four advanced Facebook posting tools that use Facebook's internal API. Every concept, code snippet, architecture decision, API call, troubleshooting step, and AI prompt is documented here. All mistakes from v1.0 are corrected and explained.

---

## 📋 Table of Contents

1. [Project Overview & Goal](#1-project-overview--goal)
2. [Why These Tools Exist — The Core Insight](#2-why-these-tools-exist--the-core-insight)
3. [How Facebook's Internal System Works](#3-how-facebooks-internal-system-works)
4. [Tech Stack Decision](#4-tech-stack-decision)
5. [Complete Project Architecture](#5-complete-project-architecture)
6. [Chrome Extension — Deep Dive](#6-chrome-extension--deep-dive)
7. [Authentication — How Cookies and Tokens Work](#7-authentication--how-cookies-and-tokens-work)
8. [Tool 1 — Facebook Video Carousel Post](#8-tool-1--facebook-video-carousel-post)
9. [Tool 2 — Swipe Up Video Creator](#9-tool-2--swipe-up-video-creator)
10. [Tool 3 — Facebook 2-Card Video Carousel Post](#10-tool-3--facebook-2-card-video-carousel-post)
11. [Tool 4 — Generate One Card V2](#11-tool-4--generate-one-card-v2)
12. [Frontend Website — Complete UI Guide](#12-frontend-website--complete-ui-guide)
13. [Security & Safety Considerations](#13-security--safety-considerations)
14. [Rate Limiting & Anti-Ban Strategy](#14-rate-limiting--anti-ban-strategy)
15. [Complete Troubleshooting Guide](#15-complete-troubleshooting-guide)
16. [Deployment Guide](#16-deployment-guide)
17. [Complete AI Prompt to Build from Scratch](#17-complete-ai-prompt-to-build-from-scratch)
18. [Quick Reference Cheatsheet](#18-quick-reference-cheatsheet)
19. [v1.0 Mistakes — Full Correction Log](#19-v10-mistakes--full-correction-log)

---

## 1. Project Overview & Goal

### What We Are Building

A personal web-based toolset of four tools:

| Tool | What It Does | Why FB UI Doesn't Have It |
|------|-------------|--------------------------|
| 🎬 Video Carousel Post | Post 2–10 videos as a swipeable carousel | FB limits carousel to link-preview format in UI |
| 👆 Swipe Up Video Creator | Mobile-only video with swipe-up CTA link | Only in Stories natively, not in Feed via UI |
| 📱 2-Card Video Carousel | Exactly 2 videos in carousel format | 2-card renders uniquely on mobile — bigger cards |
| 🃏 Generate One Card V2 | Single image with fake album count overlay | Uses Ad Creative system — not exposed in regular post UI |

### The Problem Being Solved

Tools like FewFeed offer these features but:
- Add **watermarks** to output unless you pay a subscription
- You are **dependent** on their servers being online
- **Privacy risk**: Your FB session cookie = full account access — they can see it
- You have **no control** over bugs, downtime, or future paywalls

### The Solution

Build identical tools yourself. You own the code. No watermarks. No subscriptions. Your cookie never leaves your own browser.

---

## 2. Why These Tools Exist — The Core Insight

### Facebook Has Two Layers

```
┌─────────────────────────────────────────────────────┐
│              LAYER 1: Facebook's Public UI          │
│            (what you see at facebook.com)           │
│                                                     │
│  • Intentionally LIMITED for average users          │
│  • Many features are HIDDEN or reserved for Ads     │
└─────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────┐
│           LAYER 2: Facebook's Internal API          │
│        (what the Facebook app itself calls)         │
│                                                     │
│  • FULL feature set — no artificial limits          │
│  • GraphQL-based, accessible with session cookies   │
│  • Powers every single thing Facebook can do        │
└─────────────────────────────────────────────────────┘
```

### The Key Realization

When you log into Facebook, your browser stores **session cookies**. Your browser automatically attaches these cookies to every request it makes to facebook.com — including requests made by your JavaScript code using `fetch()` with `credentials: "include"`.

> **If you make a request to Facebook's internal API with `credentials: "include"`, Facebook cannot distinguish it from you clicking a button manually.**

### How FewFeed Discovered Every Feature

Every tool on FewFeed was built by:
1. Opening Facebook in Chrome → press F12 → Network tab
2. Filtering by `graphql` in the search box
3. Performing the desired action manually on Facebook
4. Finding the POST request → clicking "Payload" tab
5. Copying the `doc_id` and `variables` JSON
6. Automating that exact request in code

This is exactly what we will do.

---

## 3. How Facebook's Internal System Works

### 3.1 The Two API Systems

| | Public Graph API | Internal GraphQL API |
|--|----------------|---------------------|
| URL | `graph.facebook.com/v18.0/` | `facebook.com/api/graphql/` |
| Auth method | Developer App Token | Session cookies (`credentials: "include"`) |
| Rate limits | Strict developer limits | Same as normal browser usage |
| Feature set | Limited (what Meta allows developers) | Everything the app can do |
| Who uses it | Third-party apps | Facebook's own website |

Our tools use **both**:
- **Graph API** → for video uploads (uses page access token)
- **Internal GraphQL** → for creating posts in special formats

### 3.2 What is a `doc_id`?

Facebook pre-compiles every UI operation into numbered "documents". When you click anything on Facebook, your browser sends:

```
POST https://www.facebook.com/api/graphql/
Content-Type: application/x-www-form-urlencoded

doc_id=7382689905134458
&variables={"input":{"...":"..."}}
&fb_dtsg=CSRF_TOKEN_HERE
&server_timestamps=true
```

The `doc_id` tells Facebook's server which operation to run. These IDs are stable for weeks or months but can change when Facebook does major updates. When that happens, you recapture them from DevTools.

### 3.3 How to Find Any `doc_id`

```
Step 1:  Open Chrome → go to facebook.com → log in
Step 2:  Press F12 → click "Network" tab
Step 3:  In the filter box, type "graphql"
Step 4:  Perform the action manually on Facebook
Step 5:  Look at POST requests that appear in the Network tab
Step 6:  Click on a request → look at "Payload" tab
Step 7:  Find "doc_id" value → that's your operation ID
Step 8:  Also copy the full "variables" JSON — this is your template
```

### 3.4 Facebook Session Cookies

| Cookie Name | What It Is | Role |
|------------|-----------|------|
| `c_user` | Your Facebook User ID | Identifies who you are |
| `xs` | Session authentication token | Authenticates the session |
| `datr` | Browser fingerprint | Anti-fraud detection |
| `fr` | Ad tracking token | Used in some requests |
| `sb` | Security token | Supplemental security |

> ⚠️ **The combination of `c_user` + `xs` is effectively your Facebook password. Guard these carefully.**

### 3.5 The `fb_dtsg` CSRF Token

Every POST request to Facebook's internal API also requires a `fb_dtsg` CSRF token. This is a one-per-session token that changes each time you log in. You must extract it from the Facebook page HTML before making any API calls.

```javascript
// How to extract fb_dtsg from the facebook.com homepage
async function extractFbDtsg() {
  // This fetch works because the user is logged into Facebook in the same browser
  // credentials: "include" makes the browser send their session cookies automatically
  const response = await fetch("https://www.facebook.com/", {
    credentials: "include"
  });
  const html = await response.text();

  // Try multiple patterns — Facebook occasionally changes the format
  const match =
    html.match(/"DTSGInitData"[^}]*"token":"([^"]+)"/) ||  // Most common
    html.match(/name="fb_dtsg"\s+value="([^"]+)"/)        ||  // HTML input field
    html.match(/"fb_dtsg","([^"]{10,50})"/);                   // Alternate JSON

  return match ? match[1] : null;
}
```

### 3.6 IMPORTANT: Why You Cannot Set the Cookie Header Manually

> This was a critical error in the original guide (v1.0). Here is the correct explanation.

Browsers **forbid** JavaScript from setting the `Cookie` header in any `fetch()` call. It is classified as a "forbidden header name" in the browser's security model. If you try to set it, the browser silently ignores it.

```javascript
// ❌ THIS DOES NOT WORK — browser ignores the Cookie header
fetch("https://www.facebook.com/api/graphql/", {
  headers: { "Cookie": "c_user=123; xs=abc" }  // IGNORED by browser
});

// ✅ THIS IS CORRECT — browser sends session cookies automatically
fetch("https://www.facebook.com/api/graphql/", {
  credentials: "include"  // Browser sends all existing facebook.com cookies
});
```

This is why the architecture works the way it does:
- The **extension** reads cookies to get your `userId` (because extensions CAN read cookies via `chrome.cookies` API)
- All actual **API calls** use `credentials: "include"` — the browser automatically sends your facebook.com session cookies without you ever seeing or handling them manually
- Your cookie string is **never passed around as text** — the browser handles it invisibly

---

## 4. Tech Stack Decision

### Recommended Stack

```
┌──────────────────────────────────────────────────────────────┐
│                       YOUR SYSTEM                            │
│                                                              │
│  Chrome Extension (Manifest V3)                              │
│  ├── Reads c_user cookie → gives you the userId             │
│  ├── No cookies are ever passed as text strings              │
│  └── Validates you're logged in before tool runs             │
│                                                              │
│  Frontend Website (Plain HTML + Vanilla JS)                  │
│  ├── All fetch() calls use credentials: "include"            │
│  ├── Browser sends FB session cookies automatically          │
│  ├── Talks to extension only to get userId                   │
│  └── Zero frameworks — easy to read, debug, modify           │
│                                                              │
│  Facebook APIs (Direct from Browser)                         │
│  ├── graph.facebook.com → video upload, page tokens          │
│  └── facebook.com/api/graphql/ → internal posting formats    │
└──────────────────────────────────────────────────────────────┘
```

### Why These Choices

| Choice | Why |
|--------|-----|
| **Chrome Extension** | Only way for a website to read your browser's cookies from another domain (facebook.com) |
| **`credentials: "include"`** | Correct and secure way to send session cookies in cross-origin fetch |
| **Plain HTML/JS** | No Node.js, no npm, no build tools — run directly in browser |
| **No backend** | All calls go directly browser → Facebook. More private. Nothing for you to maintain. |

### Actual Requirements

- ✅ A computer with Chrome or Chromium browser
- ✅ A Facebook account (logged in)
- ✅ A Facebook Page (for posting)
- ✅ Tool 4 only: Any Facebook Ad Account (free, no payment method required, any status)
- ❌ ~~Node.js~~ — Not needed
- ❌ ~~npm~~ — Not needed
- ❌ ~~A paid Ad Account~~ — Not needed

---

## 5. Complete Project Architecture

### 5.1 Folder Structure

```
fb-tools/
│
├── extension/                     ← Chrome Extension
│   ├── manifest.json              ← Permissions & config
│   ├── background.js              ← Service worker (reads c_user cookie)
│   ├── content.js                 ← Injected into your website pages
│   └── icon.png                   ← Any 128×128 image
│
├── website/                       ← Your tool website
│   ├── index.html                 ← Home page (tool selector)
│   ├── tools/
│   │   ├── video-carousel.html    ← Tool 1
│   │   ├── swipe-up.html          ← Tool 2
│   │   ├── two-card.html          ← Tool 3
│   │   └── one-card-v2.html       ← Tool 4
│   ├── js/
│   │   ├── facebook-api.js        ← All Facebook API logic (core)
│   │   ├── extension-bridge.js    ← Talks to the extension
│   │   └── utils.js               ← Helpers: delays, validators, formatters
│   └── css/
│       └── style.css              ← Facebook-style UI
│
└── README.md
```

### 5.2 Data Flow (Corrected)

```
USER CLICKS "Connect Account"
        │
        ▼
extension-bridge.js sends message to extension
        │
        ▼
background.js reads c_user cookie → returns userId to website
        │
        ▼
facebook-api.js fetches facebook.com with credentials:"include"
├── Browser automatically sends user's FB session cookies
├── Extracts fb_dtsg CSRF token from HTML response
└── Fetches /me/accounts to get page access tokens
        │
        ▼
USER FILLS FORM AND CLICKS "Create Post"
        │
        ▼
facebook-api.js makes API calls with credentials:"include"
├── Graph API: video upload (using page access_token)
└── Internal GraphQL: create post in special format
        │
        ▼
UI shows success with post link
```

### 5.3 Extension ↔ Website Communication

```javascript
// WEBSITE sends message TO extension (requesting userId):
chrome.runtime.sendMessage(EXTENSION_ID, {
  type: "GET_USER_ID"
}, function(response) {
  const userId = response.userId;
  // userId = the c_user cookie value (e.g. "1234567890")
});

// EXTENSION reads the cookie and responds:
chrome.runtime.onMessageExternal.addListener(
  function(message, sender, sendResponse) {
    if (message.type === "GET_USER_ID") {
      chrome.cookies.get(
        { url: "https://www.facebook.com", name: "c_user" },
        function(cookie) {
          sendResponse({ userId: cookie ? cookie.value : null });
        }
      );
    }
    return true; // Keep channel open for async response
  }
);
```

---

## 6. Chrome Extension — Deep Dive

### 6.1 manifest.json (Complete — Corrected)

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
      "all_frames": false,
      "run_at": "document_start"
    }
  ],

  "permissions": [
    "cookies",
    "tabs"
  ],

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

  "icons": {
    "16": "icon.png",
    "48": "icon.png",
    "128": "icon.png"
  },

  "action": {
    "default_title": "FB Advanced Tools"
  }
}
```

**Corrections from v1.0:**
- Removed `"declarativeNetRequest"` — was never used in code
- Removed `"storage"` — not used
- Removed `"scripting"` — not needed with the corrected architecture
- Removed `"type": "module"` from background — caused silent failures
- Removed `*://*.fbcdn.net/*` — not needed

> Replace `your-website.vercel.app` with your actual deployed domain. For local development, `localhost` and `127.0.0.1` work as-is.

### 6.2 background.js (Complete — Corrected)

```javascript
// background.js — Chrome Extension Service Worker
// Purpose: Read c_user cookie and provide userId to the website
// That's the only thing this extension needs to do

const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "https://your-website.vercel.app"
];

// Listen for messages from our website
chrome.runtime.onMessageExternal.addListener(
  function (message, sender, sendResponse) {

    // Security: only respond to our own website
    if (!ALLOWED_ORIGINS.includes(sender.origin)) {
      sendResponse({ error: "Unauthorized origin: " + sender.origin });
      return true;
    }

    switch (message.type) {

      case "PING":
        // Used to check if extension is installed
        sendResponse({ status: "ok", version: "1.0.0" });
        break;

      case "GET_USER_ID":
        // Get the Facebook User ID from the c_user cookie
        chrome.cookies.get(
          { url: "https://www.facebook.com", name: "c_user" },
          function (cookie) {
            if (chrome.runtime.lastError) {
              sendResponse({ error: chrome.runtime.lastError.message });
              return;
            }
            sendResponse({
              userId: cookie ? cookie.value : null,
              loggedIn: !!cookie
            });
          }
        );
        break;

      case "CHECK_FB_LOGIN":
        // Check if user is logged into Facebook
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

    return true; // REQUIRED: keeps the message channel open for async callbacks
  }
);
```

### 6.3 content.js (Injected into your website)

```javascript
// content.js — runs on your website pages
// Acts as a relay between the page JavaScript and the background service worker
// This is needed because the page cannot call chrome.runtime.sendMessage directly
// when using the window.postMessage approach. With externally_connectable, the
// page CAN call chrome.runtime.sendMessage if it has the extension ID.

// Tell the page the extension is present
window.postMessage({ type: "FB_TOOLS_EXTENSION_READY" }, "*");

// Relay messages from the page to the background worker
window.addEventListener("message", function (event) {
  if (event.source !== window) return;

  const message = event.data;
  if (!message || typeof message.type !== "string") return;
  if (!message.type.startsWith("FB_TOOLS_")) return;

  chrome.runtime.sendMessage(message, function (response) {
    window.postMessage({
      type: message.type + "_RESPONSE",
      requestId: message.requestId,
      ...(response || { error: "No response from extension" })
    }, "*");
  });
});
```

### 6.4 extension-bridge.js (On your website)

```javascript
// extension-bridge.js — loaded on your website
// How your website communicates with the Chrome extension

const EXTENSION_ID = "YOUR_EXTENSION_ID_HERE";
// ↑ Get this from chrome://extensions after loading the extension

class FBToolsExtension {

  constructor() {
    this.isAvailable = false;
    this.userId = null;
  }

  // Check if the extension is installed and responding
  async checkAvailability() {
    return new Promise((resolve) => {
      if (typeof chrome === "undefined" || !chrome.runtime) {
        this.isAvailable = false;
        resolve(false);
        return;
      }

      chrome.runtime.sendMessage(
        EXTENSION_ID,
        { type: "PING" },
        (response) => {
          if (chrome.runtime.lastError || !response) {
            this.isAvailable = false;
            resolve(false);
          } else {
            this.isAvailable = true;
            resolve(true);
          }
        }
      );
    });
  }

  // Get the Facebook User ID from the c_user cookie
  async getUserId() {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        EXTENSION_ID,
        { type: "GET_USER_ID" },
        (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          if (!response || response.error) {
            reject(new Error(response?.error || "Failed to get user ID"));
            return;
          }
          if (!response.loggedIn || !response.userId) {
            reject(new Error("You are not logged into Facebook. Please log in first."));
            return;
          }
          this.userId = response.userId;
          resolve(response.userId);
        }
      );
    });
  }

  // Check if user is logged into Facebook
  async isLoggedIn() {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        EXTENSION_ID,
        { type: "CHECK_FB_LOGIN" },
        (response) => {
          resolve(response?.loggedIn === true);
        }
      );
    });
  }
}

// Global instance — used by all tool pages
window.FBExtension = new FBToolsExtension();
```

### 6.5 How to Install the Extension (Development Mode)

```
Step 1:  Open Chrome
Step 2:  Go to: chrome://extensions
Step 3:  Enable "Developer mode" toggle (top-right corner)
Step 4:  Click "Load unpacked"
Step 5:  Select your /extension folder
Step 6:  Note the Extension ID (looks like: abcdefghijklmnopqrstuvwxyz123456)
Step 7:  Open /website/js/extension-bridge.js
Step 8:  Replace "YOUR_EXTENSION_ID_HERE" with your actual ID
Step 9:  Refresh your website
```

---

## 7. Authentication — How Cookies and Tokens Work

### 7.1 The Core FacebookAPI Class

This class handles all authentication and API calls. Every tool uses it.

```javascript
// facebook-api.js — Core class
// IMPORTANT: All fetch calls use credentials:"include"
// This tells the browser to automatically attach the user's facebook.com
// session cookies to every request. We never touch cookies as text strings.

class FacebookAPI {

  constructor() {
    this.userId = null;       // From extension (c_user cookie)
    this.fbDtsg = null;       // CSRF token extracted from facebook.com HTML
    this.lsdToken = null;     // Secondary token for some endpoints
    this.userToken = null;    // User-level access token
    this.initialized = false;
  }

  // ── Initialize: get userId from extension, then get tokens from FB ──
  async initialize() {
    // Step 1: Get userId from extension (reads c_user cookie)
    if (!window.FBExtension.isAvailable) {
      throw new Error("Extension not found. Please install the FB Tools extension.");
    }

    this.userId = await window.FBExtension.getUserId();

    if (!this.userId) {
      throw new Error("Not logged into Facebook. Please log in at facebook.com first.");
    }

    // Step 2: Get CSRF tokens by fetching facebook.com
    // credentials:"include" makes browser send the user's FB session cookies
    await this.fetchCsrfTokens();

    // Step 3: Get user access token (needed for Graph API calls)
    await this.fetchUserAccessToken();

    this.initialized = true;
    return true;
  }

  // ── Extract CSRF tokens from the facebook.com page ──
  async fetchCsrfTokens() {
    let html;
    try {
      const response = await fetch("https://www.facebook.com/", {
        credentials: "include",  // Browser sends user's session cookies automatically
        headers: {
          "Accept": "text/html,application/xhtml+xml",
          "Accept-Language": "en-US,en;q=0.9"
        }
      });
      html = await response.text();
    } catch (err) {
      throw new Error("Cannot reach Facebook. Check your internet connection.");
    }

    // Extract fb_dtsg CSRF token
    const dtsgMatch =
      html.match(/"DTSGInitData"[^}]*"token":"([^"]+)"/) ||
      html.match(/name="fb_dtsg"\s+value="([^"]+)"/)    ||
      html.match(/"fb_dtsg","([^"]{10,50})"/);

    if (!dtsgMatch) {
      throw new Error(
        "Could not extract fb_dtsg token. " +
        "Try logging out and back into Facebook, then refresh this page."
      );
    }
    this.fbDtsg = dtsgMatch[1];

    // Extract lsd token (needed for some internal API calls)
    const lsdMatch =
      html.match(/"LSD"[^}]*"token":"([^"]+)"/) ||
      html.match(/\["LSD",\[\],{"token":"([^"]+)"/);
    if (lsdMatch) this.lsdToken = lsdMatch[1];
  }

  // ── Get user-level access token from Facebook's own token endpoint ──
  async fetchUserAccessToken() {
    try {
      // Facebook exposes a token endpoint that works with session cookies
      // This returns a short-lived token scoped to the user's session
      const response = await fetch(
        "https://www.facebook.com/connect/get_token?" +
        "client_id=124024574287414&sdk=joey&redirect_uri=https://www.facebook.com/",
        { credentials: "include" }
      );
      const text = await response.text();
      const match = text.match(/access_token=([^&"]+)/);
      if (match) {
        this.userToken = match[1];
      }
    } catch {
      // Non-fatal — some tools can work without it
      console.warn("Could not fetch user access token — some features may be limited");
    }
  }

  // ── Core fetch method — ALL requests to Facebook go through this ──
  async apiFetch(url, method = "GET", body = null, extraHeaders = {}) {
    const headers = {
      // NOTE: We do NOT set Cookie header — browsers forbid that.
      // credentials:"include" below handles cookies automatically.
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Referer": "https://www.facebook.com/",
      "Origin": "https://www.facebook.com",
      "Accept-Language": "en-US,en;q=0.9",
      ...extraHeaders
    };

    const options = {
      method,
      headers,
      credentials: "include"  // ← This is how FB session cookies are sent
    };
    if (body) options.body = body;

    const response = await fetch(url, options);

    if (response.status === 400) {
      throw new Error("Bad request (400) — check all required fields are included");
    }
    if (response.status === 401 || response.status === 403) {
      throw new Error("Not authenticated (401/403) — please re-login to Facebook");
    }
    if (!response.ok && response.status !== 302) {
      throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
    }
    return response;
  }

  // ── Internal GraphQL API call ──
  async graphql(docId, variables, friendlyName = "") {
    if (!this.initialized) await this.initialize();

    const formData = new URLSearchParams({
      av: this.userId,
      __user: this.userId,
      __a: "1",
      __req: String(Math.floor(Math.random() * 99) + 1),
      dpr: "1",
      fb_dtsg: this.fbDtsg,
      fb_api_caller_class: "RelayModern",
      fb_api_req_friendly_name: friendlyName,
      variables: JSON.stringify(variables),
      server_timestamps: "true",
      doc_id: docId
    });

    if (this.lsdToken) formData.append("lsd", this.lsdToken);

    const response = await this.apiFetch(
      "https://www.facebook.com/api/graphql/",
      "POST",
      formData,
      {
        "Content-Type": "application/x-www-form-urlencoded",
        "X-FB-Friendly-Name": friendlyName,
        "X-FB-LSD": this.lsdToken || "",
      }
    );

    const text = await response.text();

    // Facebook returns one JSON object per line — take the first
    const firstLine = text.split("\n")[0];
    try {
      return JSON.parse(firstLine);
    } catch {
      try {
        return JSON.parse(text);
      } catch {
        throw new Error("Unexpected response format from Facebook API");
      }
    }
  }

  // ── Get user's Facebook Pages ──
  async getMyPages() {
    if (!this.initialized) await this.initialize();

    const response = await this.apiFetch(
      `https://graph.facebook.com/v18.0/me/accounts` +
      `?fields=id,name,access_token,category&limit=100` +
      `&access_token=${encodeURIComponent(this.userToken)}`
    );
    const data = await response.json();

    if (data.error) {
      throw new Error("Could not fetch pages: " + data.error.message);
    }
    return data.data || [];
  }

  // ── Get user's Ad Accounts ──
  // NOTE: Returns ALL ad accounts regardless of status.
  // Any ad account (even brand new, no payment method, any status) works
  // for creating ad creatives. No payment is ever charged.
  async getAdAccounts() {
    if (!this.initialized) await this.initialize();

    const response = await this.apiFetch(
      `https://graph.facebook.com/v18.0/me/adaccounts` +
      `?fields=id,name,account_status&limit=100` +
      `&access_token=${encodeURIComponent(this.userToken)}`
    );
    const data = await response.json();

    if (data.error) {
      throw new Error("Could not fetch ad accounts: " + data.error.message);
    }

    // Return ALL accounts — any status works for creative creation
    return data.data || [];
  }

  // Helper: generate a unique token for API requests
  generateToken(length = 32) {
    return Array.from(
      { length },
      () => Math.floor(Math.random() * 16).toString(16)
    ).join("");
  }

  // Helper: generate a mutation ID for GraphQL calls
  generateMutationId() {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  }
}

// Create the global instance used by all tool pages
window.FB_API = new FacebookAPI();
```

### 7.2 Getting Page Access Tokens

Page access tokens are used for the Graph API (video uploads). They are obtained via `/me/accounts` and are tied to specific Facebook Pages you manage.

```javascript
// How to get and use page access tokens
async function setupPageSelector(selectElement) {
  const pages = await window.FB_API.getMyPages();

  pages.forEach(page => {
    const option = document.createElement("option");
    option.value = page.id;
    option.textContent = page.name + " (" + page.category + ")";
    option.dataset.token = page.access_token;  // Store token in dataset
    selectElement.appendChild(option);
  });
}

// When the user selects a page:
function getSelectedPage(selectElement) {
  const selected = selectElement.options[selectElement.selectedIndex];
  return {
    pageId: selected.value,
    pageToken: selected.dataset.token,
    pageName: selected.textContent
  };
}
```

---

## 8. Tool 1 — Facebook Video Carousel Post

### 8.1 What It Does

Creates a post with **2–10 videos** arranged in a swipeable carousel format. Each card shows a video thumbnail. Mobile users swipe horizontally to see all videos.

> **Note:** The minimum is 2 videos (not 3 as stated in v1.0). Facebook's carousel API requires at least 2 `child_attachments`.

### 8.2 Why This Isn't in Facebook's UI

Facebook's regular "Create Post" UI only allows carousels of website link previews. Video carousels are reserved for Facebook Ads in the UI — but the underlying API supports them for regular page posts.

### 8.3 How It Works

```
1. User selects 2–10 video files
2. Each video uploads to Facebook in chunks → returns a video_id
3. Tool waits for each video to be "ready" before proceeding
4. Carousel post is created using all video_ids in child_attachments
5. Post appears in page feed as swipeable video carousel
```

### 8.4 Video Upload (Chunked Protocol)

Facebook uses a 3-phase upload protocol for all videos:

```javascript
// Add to FacebookAPI class in facebook-api.js

async uploadVideo(file, pageId, pageToken, onProgress = null) {
  // ── Phase 1: Start — initialize the upload session ──
  const startParams = new URLSearchParams({
    upload_phase: "start",
    file_size: file.size,
    access_token: pageToken
  });

  const startResponse = await fetch(
    `https://graph.facebook.com/v18.0/${pageId}/videos`,
    {
      method: "POST",
      body: startParams,
      credentials: "include"
    }
  );
  const startData = await startResponse.json();

  if (startData.error) {
    throw new Error("Video upload start failed: " + startData.error.message);
  }

  const { upload_session_id, video_id } = startData;
  let start_offset = parseInt(startData.start_offset);
  let end_offset = parseInt(startData.end_offset);

  // ── Phase 2: Transfer — upload file in chunks ──
  while (start_offset < file.size) {
    const chunk = file.slice(start_offset, end_offset);

    const chunkForm = new FormData();
    chunkForm.append("upload_phase", "transfer");
    chunkForm.append("upload_session_id", upload_session_id);
    chunkForm.append("start_offset", start_offset);
    chunkForm.append("video_file_chunk", chunk, file.name);
    chunkForm.append("access_token", pageToken);

    const chunkResponse = await fetch(
      `https://graph.facebook.com/v18.0/${pageId}/videos`,
      { method: "POST", body: chunkForm, credentials: "include" }
    );
    const chunkData = await chunkResponse.json();

    if (chunkData.error) {
      throw new Error("Upload chunk failed: " + chunkData.error.message);
    }

    start_offset = parseInt(chunkData.start_offset);
    end_offset = parseInt(chunkData.end_offset);

    // Report progress (0–100)
    if (onProgress) {
      onProgress(Math.round((start_offset / file.size) * 100));
    }
  }

  // ── Phase 3: Finish — complete the upload ──
  const finishParams = new URLSearchParams({
    upload_phase: "finish",
    upload_session_id,
    access_token: pageToken
  });

  const finishResponse = await fetch(
    `https://graph.facebook.com/v18.0/${pageId}/videos`,
    { method: "POST", body: finishParams, credentials: "include" }
  );
  const finishData = await finishResponse.json();

  if (finishData.error) {
    throw new Error("Upload finish failed: " + finishData.error.message);
  }

  return video_id;
}
```

### 8.5 Wait for Video to Be Ready

After upload finishes, Facebook processes the video asynchronously. You must wait until it's ready before including it in a carousel post:

```javascript
async waitForVideoReady(videoId, pageToken, timeoutMs = 180000) {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${videoId}` +
      `?fields=status&access_token=${pageToken}`,
      { credentials: "include" }
    );
    const data = await response.json();

    // Check if video processing is complete
    if (data.status) {
      const progress = data.status.processing_progress;
      const videoStatus = data.status.video_status;

      if (videoStatus === "ready" || progress === 100) {
        return true; // Ready to use
      }
      if (videoStatus === "error") {
        throw new Error("Video processing failed on Facebook's end. Try re-uploading.");
      }
    }

    // Wait 5 seconds before checking again
    await new Promise(r => setTimeout(r, 5000));
  }

  throw new Error("Video processing timed out after 3 minutes. The post may still work.");
}
```

### 8.6 Create the Carousel Post

```javascript
async createVideoCarousel(pageId, pageToken, videoFiles, message, onProgress) {
  const videoIds = [];

  // Upload each video one at a time
  for (let i = 0; i < videoFiles.length; i++) {
    onProgress?.(`Uploading video ${i + 1} of ${videoFiles.length}...`);

    const videoId = await this.uploadVideo(
      videoFiles[i],
      pageId,
      pageToken,
      (percent) => onProgress?.(`Video ${i + 1}: ${percent}% uploaded`)
    );

    onProgress?.(`Waiting for video ${i + 1} to process...`);
    await this.waitForVideoReady(videoId, pageToken);

    videoIds.push(videoId);

    // Human-like delay between uploads
    if (i < videoFiles.length - 1) {
      await new Promise(r => setTimeout(r, 2000 + Math.random() * 2000));
    }
  }

  onProgress?.("Creating carousel post...");

  // Build the carousel post
  const postBody = new URLSearchParams({
    message: message,
    child_attachments: JSON.stringify(
      videoIds.map((videoId, index) => ({
        media_fbid: videoId,
        name: `Video ${index + 1}`,
        description: message,
        link: `https://www.facebook.com/video/${videoId}`
      }))
    ),
    multi_share_end_card: "false",    // No "See More" end card
    multi_share_optimized: "false",   // Don't let Facebook reorder cards
    published: "true",
    access_token: pageToken
  });

  const response = await fetch(
    `https://graph.facebook.com/v18.0/${pageId}/feed`,
    { method: "POST", body: postBody, credentials: "include" }
  );
  const result = await response.json();

  if (result.error) {
    throw new Error("Failed to create carousel: " + result.error.message);
  }

  // Build the post URL
  // Facebook post IDs are format: "pageId_postId"
  const [pid, postId] = result.id.split("_");
  return {
    postId: result.id,
    url: `https://www.facebook.com/${pid}/posts/${postId}`
  };
}
```

---

## 9. Tool 2 — Swipe Up Video Creator

### 9.1 What It Does

Creates a video post with a **"Swipe Up"** button overlay linking to any URL. The effect only appears in the **mobile Facebook app newsfeed** — on desktop it renders as a normal video post with a link button below it.

### 9.2 How It Works

The swipe-up format is created by adding a `call_to_action` with `link_format: "VIDEO_MOBILE_SWIPE_UP"` to a video post. Facebook's mobile app detects this flag and renders the swipe-up gesture overlay.

### 9.3 The API Call

```javascript
async createSwipeUpPost(pageId, pageToken, videoFile, linkUrl, ctaType, message, onProgress) {

  // Step 1: Upload the video
  onProgress?.("Uploading video...");
  const videoId = await this.uploadVideo(
    videoFile, pageId, pageToken,
    (p) => onProgress?.(`Uploading: ${p}%`)
  );

  onProgress?.("Waiting for video to process...");
  await this.waitForVideoReady(videoId, pageToken);

  onProgress?.("Creating swipe-up post...");

  // Step 2: Create the post with swipe-up CTA
  const postBody = new URLSearchParams({
    message: message,
    object_attachment: videoId,  // Attach the uploaded video
    call_to_action: JSON.stringify({
      type: ctaType,  // e.g. "LEARN_MORE", "SHOP_NOW", etc.
      value: {
        link: linkUrl,
        link_format: "VIDEO_MOBILE_SWIPE_UP"  // ← This triggers the swipe-up UI
      }
    }),
    published: "true",
    access_token: pageToken
  });

  const response = await fetch(
    `https://graph.facebook.com/v18.0/${pageId}/feed`,
    { method: "POST", body: postBody, credentials: "include" }
  );
  const result = await response.json();

  if (result.error) {
    throw new Error("Failed to create swipe-up post: " + result.error.message);
  }

  const [pid, postId] = result.id.split("_");
  return {
    postId: result.id,
    url: `https://www.facebook.com/${pid}/posts/${postId}`
  };
}
```

### 9.4 Supported CTA Button Types

```javascript
const CTA_TYPES = {
  "LEARN_MORE":     "Learn More",
  "SHOP_NOW":       "Shop Now",
  "SIGN_UP":        "Sign Up",
  "WATCH_MORE":     "Watch More",
  "BOOK_NOW":       "Book Now",
  "CALL_NOW":       "Call Now",
  "DOWNLOAD":       "Download",
  "GET_OFFER":      "Get Offer",
  "CONTACT_US":     "Contact Us",
  "GET_DIRECTIONS": "Get Directions"
};
```

### 9.5 Testing the Swipe-Up Effect

- **On desktop:** The post appears as a normal video with a link button below — this is expected
- **On mobile app:** Open Facebook app → find the post → swipe up on the video
- If the swipe-up gesture doesn't appear on mobile, check that the CTA URL is a valid https:// link

---

## 10. Tool 3 — Facebook 2-Card Video Carousel Post

### 10.1 What It Does

Exactly **2 videos** in carousel format. The 2-card layout renders significantly **larger on mobile screens** than a 3+ card carousel — each card takes up more screen real estate, leading to higher engagement and watch time.

### 10.2 The Key Differences from Tool 1

- Exactly 2 items in `child_attachments` (never more, never less)
- `multi_share_end_card: false` — no "See More" end card
- `multi_share_optimized: false` — prevent Facebook from reordering cards
- Visual result: each card is bigger, bolder on mobile

### 10.3 The API Call

```javascript
async createTwoCardCarousel(pageId, pageToken, video1File, video2File, message, link1, link2, onProgress) {

  // Upload both videos with readiness check
  onProgress?.("Uploading video 1 of 2...");
  const video1Id = await this.uploadVideo(video1File, pageId, pageToken,
    p => onProgress?.(`Video 1: ${p}%`)
  );
  await this.waitForVideoReady(video1Id, pageToken);

  onProgress?.("Uploading video 2 of 2...");
  const video2Id = await this.uploadVideo(video2File, pageId, pageToken,
    p => onProgress?.(`Video 2: ${p}%`)
  );
  await this.waitForVideoReady(video2Id, pageToken);

  onProgress?.("Creating 2-card carousel post...");

  const postBody = new URLSearchParams({
    message: message,
    child_attachments: JSON.stringify([
      {
        media_fbid: video1Id,
        name: "Video 1",
        description: message,
        link: link1 || `https://www.facebook.com/video/${video1Id}`
      },
      {
        media_fbid: video2Id,
        name: "Video 2",
        description: message,
        link: link2 || `https://www.facebook.com/video/${video2Id}`
      }
    ]),
    multi_share_end_card: "false",
    multi_share_optimized: "false",
    published: "true",
    access_token: pageToken
  });

  const response = await fetch(
    `https://graph.facebook.com/v18.0/${pageId}/feed`,
    { method: "POST", body: postBody, credentials: "include" }
  );
  const result = await response.json();

  if (result.error) {
    throw new Error("Failed to create 2-card carousel: " + result.error.message);
  }

  const [pid, postId] = result.id.split("_");
  return {
    postId: result.id,
    url: `https://www.facebook.com/${pid}/posts/${postId}`
  };
}
```

---

## 11. Tool 4 — Generate One Card V2

### 11.1 What It Does

Creates a single image post that displays a **fake album count overlay** (e.g., "1 / 5 📷"). Users think there are multiple photos and click to see more — but clicking takes them to your link URL instead of an album. This "clickbait" effect dramatically increases click-through rate.

### 11.2 How It Works

This exploits the **Ad Creative system**. An ad creative is normally used to define how a paid Facebook ad looks. But the creative itself can be published as a regular organic page post without ever running an ad. Facebook uses the ad account purely as a storage container for the creative object — no billing happens at creative creation.

```
Step 1: Upload image to ad account's image library → get image hash
Step 2: Create ad creative with fake_album_count parameter → get creative ID
Step 3: Publish creative as organic page post → post goes live
```

### 11.3 Ad Account Requirements (CORRECTED)

```
✅ ANY Facebook Ad Account — regardless of status
✅ No payment method required
✅ No ad spend required, ever
✅ Brand new ad account works
✅ Ad account with $0 balance works
✅ "Unsettled" status works
✅ "Pending Review" status works

Only requirement: the ad account must exist and be linked to your page
```

**How to create a free ad account in 30 seconds:**
```
1. Go to https://www.facebook.com/adsmanager
2. Click "Create Ad Account"
3. Enter a name (anything you want)
4. Select your currency and timezone
5. Click Create → done
6. No credit card asked. No payment required.
7. Copy the ID shown: format is act_XXXXXXXXX
```

### 11.4 The API Call — 3 Steps

```javascript
async generateOneCardV2(
  adAccountId, pageId, pageToken,
  imageFile, linkUrl, headline, description,
  fakeAlbumCount, message,
  onProgress
) {
  // Ensure correct format — prefix "act_" if missing
  const accountId = adAccountId.startsWith("act_")
    ? adAccountId
    : `act_${adAccountId}`;

  // ── STEP 1: Upload image to ad account image library ──
  onProgress?.("Uploading image...");

  const imageForm = new FormData();
  imageForm.append("filename", imageFile, imageFile.name);
  imageForm.append("access_token", pageToken);

  const imageResponse = await fetch(
    `https://graph.facebook.com/v18.0/${accountId}/adimages`,
    { method: "POST", body: imageForm, credentials: "include" }
  );
  const imageData = await imageResponse.json();

  if (imageData.error) {
    throw new Error("Image upload failed: " + imageData.error.message);
  }

  // Extract the image hash from the response
  // Response structure: { images: { "filename.jpg": { hash: "abc123" } } }
  const imageKeys = Object.keys(imageData.images || {});
  if (!imageKeys.length) {
    throw new Error("Image upload returned no hash. Check the image file format.");
  }
  const imageHash = imageData.images[imageKeys[0]].hash;

  // ── STEP 2: Create the ad creative with fake album count ──
  onProgress?.("Creating one-card creative...");

  const creativeBody = new URLSearchParams({
    name: `OneCard_${Date.now()}`,
    object_story_spec: JSON.stringify({
      page_id: pageId,
      link_data: {
        link: linkUrl,
        message: message,
        name: headline,
        description: description,
        image_hash: imageHash,
        // child_attachments defines the carousel-style presentation
        child_attachments: JSON.stringify([{
          link: linkUrl,
          image_hash: imageHash,
          name: headline,
          description: description
        }]),
        multi_share_end_card: false,
        // fake_album_count: the "1 of X" overlay on the image
        // This is the core trick that makes the post look like an album
        fake_album_count: Math.max(2, parseInt(fakeAlbumCount) || 5)
      }
    }),
    access_token: pageToken
  });

  const creativeResponse = await fetch(
    `https://graph.facebook.com/v18.0/${accountId}/adcreatives`,
    { method: "POST", body: creativeBody, credentials: "include" }
  );
  const creativeData = await creativeResponse.json();

  if (creativeData.error) {
    throw new Error("Creative creation failed: " + creativeData.error.message);
  }

  // ── STEP 3: Publish the creative as an organic page post ──
  onProgress?.("Publishing post...");

  const postBody = new URLSearchParams({
    message: message,
    published: "true",
    creative: JSON.stringify({ creative_id: creativeData.id }),
    access_token: pageToken
  });

  const postResponse = await fetch(
    `https://graph.facebook.com/v18.0/${pageId}/feed`,
    { method: "POST", body: postBody, credentials: "include" }
  );
  const postData = await postResponse.json();

  if (postData.error) {
    throw new Error("Post creation failed: " + postData.error.message);
  }

  const [pid, postId] = postData.id.split("_");
  return {
    postId: postData.id,
    creativeId: creativeData.id,
    url: `https://www.facebook.com/${pid}/posts/${postId}`
  };
}
```

---

## 12. Frontend Website — Complete UI Guide

### 12.1 Homepage (index.html)

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
        <span class="badge">2–10 videos</span>
      </div>

      <div class="tool-card" onclick="location.href='tools/swipe-up.html'">
        <div class="tool-icon">👆</div>
        <h2>Swipe Up Video Creator</h2>
        <p>Mobile-only video posts with swipe-up CTA link overlay</p>
        <span class="badge">Mobile only</span>
      </div>

      <div class="tool-card" onclick="location.href='tools/two-card.html'">
        <div class="tool-icon">📱</div>
        <h2>2-Card Video Carousel</h2>
        <p>Two-video carousel — larger cards on mobile screens</p>
        <span class="badge">2 videos</span>
      </div>

      <div class="tool-card" onclick="location.href='tools/one-card-v2.html'">
        <div class="tool-icon">🃏</div>
        <h2>Generate One Card V2</h2>
        <p>Fake album count clickbait image post with link</p>
        <span class="badge free-ad">Free Ad Account</span>
      </div>

    </div>

    <div class="info-box" id="ext-warning" style="display:none">
      <strong>⚠️ Extension not detected.</strong>
      You need to install the FB Tools Chrome extension to use these tools.
      Go to <code>chrome://extensions</code> → Load unpacked → select the <code>/extension</code> folder.
    </div>
  </main>

  <script>
    async function checkExtension() {
      const available = await window.FBExtension.checkAvailability();
      if (available) {
        document.getElementById("ext-status").textContent = "✅ Extension connected";
      } else {
        document.getElementById("ext-status").textContent = "❌ Extension not found";
        document.getElementById("ext-warning").style.display = "block";
      }
    }
    checkExtension();
  </script>
</body>
</html>
```

### 12.2 style.css (Complete)

```css
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --blue: #1877f2;
  --blue-dark: #1558b0;
  --blue-light: #e7f3ff;
  --gray-bg: #f0f2f5;
  --gray-border: #dddfe2;
  --gray-text: #65676b;
  --text: #1c1e21;
  --white: #ffffff;
  --green: #d4edda;
  --green-border: #c3e6cb;
  --green-text: #155724;
  --red: #f8d7da;
  --red-border: #f5c6cb;
  --red-text: #721c24;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, sans-serif;
  background: var(--gray-bg);
  color: var(--text);
  min-height: 100vh;
}

/* ── Header ── */
header {
  background: var(--blue);
  color: var(--white);
  padding: 20px 40px;
}
header h1 { font-size: 24px; margin-bottom: 6px; }
header p  { opacity: 0.85; font-size: 14px; margin-bottom: 10px; }

#ext-status {
  font-size: 13px;
  background: rgba(0,0,0,0.18);
  padding: 6px 14px;
  border-radius: 20px;
  display: inline-block;
}

/* ── Tool Grid ── */
main { padding: 36px 40px; max-width: 1100px; margin: 0 auto; }

.tools-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 18px;
  margin-bottom: 24px;
}

.tool-card {
  background: var(--white);
  border-radius: 12px;
  padding: 26px 22px;
  cursor: pointer;
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
  transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s;
  border: 2px solid transparent;
}
.tool-card:hover {
  border-color: var(--blue);
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(24,119,242,0.15);
}
.tool-icon { font-size: 40px; margin-bottom: 14px; }
.tool-card h2 { font-size: 17px; margin-bottom: 8px; }
.tool-card p  { font-size: 13px; color: var(--gray-text); margin-bottom: 16px; line-height: 1.5; }

/* ── Badges ── */
.badge        { display: inline-block; padding: 3px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
.badge        { background: var(--blue-light); color: var(--blue); }
.badge.free-ad { background: #e8f5e9; color: #2e7d32; }

/* ── Info/Warning Box ── */
.info-box {
  background: #fff8e1;
  border: 1px solid #ffe082;
  color: #5d4037;
  padding: 16px 20px;
  border-radius: 10px;
  font-size: 14px;
  line-height: 1.6;
}
.info-box code { background: rgba(0,0,0,0.07); padding: 2px 6px; border-radius: 4px; font-size: 12px; }

/* ── Tool Pages ── */
.page-header { background: var(--blue); color: var(--white); padding: 18px 30px; }
.page-header a { color: rgba(255,255,255,0.8); text-decoration: none; font-size: 13px; }
.page-header a:hover { color: white; }
.page-header h1 { font-size: 20px; margin-top: 6px; }

.tool-container { max-width: 660px; margin: 30px auto; padding: 0 20px; }

.card {
  background: var(--white);
  border-radius: 12px;
  padding: 26px;
  margin-bottom: 18px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
}
.card-title {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 18px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--gray-border);
  color: var(--text);
}

/* ── Form ── */
.form-group { margin-bottom: 18px; }
.form-group label {
  display: block;
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 7px;
  color: var(--text);
}
.form-group input[type="text"],
.form-group input[type="url"],
.form-group input[type="number"],
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 10px 13px;
  border: 1.5px solid var(--gray-border);
  border-radius: 8px;
  font-size: 14px;
  color: var(--text);
  outline: none;
  transition: border-color 0.2s;
  background: var(--white);
}
.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus { border-color: var(--blue); }
.form-group textarea { height: 90px; resize: vertical; font-family: inherit; }
.form-group small { display: block; margin-top: 5px; font-size: 12px; color: var(--gray-text); }

/* File input */
.file-drop {
  border: 2px dashed var(--gray-border);
  border-radius: 10px;
  padding: 22px;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
}
.file-drop:hover { border-color: var(--blue); background: var(--blue-light); }
.file-drop input { display: none; }
.file-drop p { font-size: 14px; color: var(--gray-text); }
.file-drop .file-icon { font-size: 32px; margin-bottom: 8px; }

/* ── Buttons ── */
.btn {
  padding: 11px 24px;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s, transform 0.1s;
}
.btn:active { transform: scale(0.98); }
.btn-primary { background: var(--blue); color: white; width: 100%; }
.btn-primary:hover    { background: var(--blue-dark); }
.btn-primary:disabled { background: #bcc0c4; cursor: not-allowed; transform: none; }
.btn-secondary { background: var(--gray-bg); color: var(--text); }

/* ── Progress ── */
.progress-box {
  background: var(--gray-bg);
  border-radius: 10px;
  padding: 16px 18px;
  margin: 14px 0;
}
.progress-label {
  font-size: 13px;
  color: var(--text);
  margin-bottom: 10px;
  font-weight: 500;
}
progress {
  width: 100%;
  height: 8px;
  border-radius: 4px;
  appearance: none;
  border: none;
}
progress::-webkit-progress-bar   { background: var(--gray-border); border-radius: 4px; }
progress::-webkit-progress-value { background: var(--blue); border-radius: 4px; }
progress::-moz-progress-bar      { background: var(--blue); border-radius: 4px; }

/* ── Feedback Boxes ── */
.success-box {
  background: var(--green);
  border: 1px solid var(--green-border);
  color: var(--green-text);
  padding: 16px 18px;
  border-radius: 8px;
  margin-top: 14px;
  font-size: 14px;
}
.success-box a { color: var(--green-text); font-weight: 700; }

.error-box {
  background: var(--red);
  border: 1px solid var(--red-border);
  color: var(--red-text);
  padding: 16px 18px;
  border-radius: 8px;
  margin-top: 14px;
  font-size: 14px;
}

/* ── Connect Section ── */
.connect-section {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}
.connect-section .btn { width: auto; }
.connect-status {
  font-size: 14px;
  color: var(--gray-text);
}

/* ── Responsive ── */
@media (max-width: 600px) {
  main, .tool-container { padding: 16px; }
  header { padding: 16px 20px; }
  .tools-grid { grid-template-columns: 1fr; }
}
```

### 12.3 utils.js

```javascript
// utils.js — Helper functions used across all tool pages

// Random delay (to appear human-like between operations)
function humanDelay(minMs = 1500, maxMs = 3500) {
  const delay = Math.floor(Math.random() * (maxMs - minMs)) + minMs;
  return new Promise(resolve => setTimeout(resolve, delay));
}

// Format file size for display
function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + " GB";
}

// Validate a video file
function validateVideo(file) {
  const maxSize = 1 * 1024 * 1024 * 1024; // 1 GB
  const validTypes = ["video/mp4", "video/quicktime", "video/x-msvideo", "video/avi"];

  if (!file.type.startsWith("video/")) {
    throw new Error(`"${file.name}" is not a video file.`);
  }
  if (file.size > maxSize) {
    throw new Error(`"${file.name}" is too large (${formatFileSize(file.size)}). Max size is 1 GB.`);
  }
  return true;
}

// Validate an image file
function validateImage(file) {
  const maxSize = 30 * 1024 * 1024; // 30 MB
  const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];

  if (!file.type.startsWith("image/")) {
    throw new Error(`"${file.name}" is not an image file.`);
  }
  if (file.size > maxSize) {
    throw new Error(`"${file.name}" is too large (${formatFileSize(file.size)}). Max size is 30 MB.`);
  }
  return true;
}

// Update progress UI
function showProgress(labelId, barId, text, percent = null) {
  const label = document.getElementById(labelId);
  const bar = document.getElementById(barId);
  if (label) label.textContent = text;
  if (bar && percent !== null) bar.value = percent;
}

// Show success message
function showSuccess(containerId, postUrl) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.style.display = "block";
  el.innerHTML = `
    ✅ <strong>Post created successfully!</strong><br/>
    <a href="${postUrl}" target="_blank" rel="noopener">👉 View Post on Facebook</a>
  `;
}

// Show error message
function showError(containerId, message) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.style.display = "block";
  el.innerHTML = `❌ <strong>Error:</strong> ${message}`;
}

// Hide an element
function hide(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = "none";
}

// Show an element
function show(id, displayType = "block") {
  const el = document.getElementById(id);
  if (el) el.style.display = displayType;
}
```

---

## 13. Security & Safety Considerations

### 13.1 Your Cookie is Your Password

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ⚠️  CRITICAL: YOUR FACEBOOK SESSION = FULL ACCESS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  With your session, anyone can:
  → Post, delete, and edit anything as you
  → Send messages to all your contacts
  → Manage all your pages and ad accounts
  → Change your account settings and password

  ✅ DO: Run this tool on localhost only
  ✅ DO: Only use your own copy of this code
  ✅ DO: Keep your extension source private

  ❌ DON'T: Send session data to any server
  ❌ DON'T: Use others' hosted versions of this tool
  ❌ DON'T: Paste cookies into any website you don't own
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 13.2 Why Your Own Tool is Safer Than FewFeed

| | FewFeed | Your Own Tool |
|--|---------|-------------|
| Who sees your session | FewFeed's servers | Only your browser |
| Cookie stored where | Their database | Never stored anywhere |
| Can be breached | Yes — if they get hacked | No — nothing to breach |
| Requires trust in them | Yes | No |

### 13.3 HTTPS Is Required When Deployed

If you deploy the website online (not localhost), it **must** be on HTTPS. Serving over HTTP would expose authentication data in transit. Vercel and GitHub Pages provide free HTTPS automatically.

---

## 14. Rate Limiting & Anti-Ban Strategy

### 14.1 Safe Limits

| Operation | Conservative Daily Limit | What Happens If Exceeded |
|-----------|:------------------------:|--------------------------|
| Carousel posts | 8–10 per day | Posts silently hidden or error |
| Video uploads | 20–25 per hour | Upload API returns error |
| Swipe-up posts | 10–15 per day | CTA stripped or post hidden |
| One Card posts | 10–15 per day | Creative creation may error |
| Total API calls | ~150 per hour | Temporary soft block |

### 14.2 Add Human-Like Delays

```javascript
// Always delay between operations — never fire requests back-to-back
for (const video of videoFiles) {
  await uploadVideo(video);
  await humanDelay(2000, 4000); // 2–4 second random delay between uploads
}
```

### 14.3 Warning Signs

| Sign | Meaning | Action |
|------|---------|--------|
| `"Action Blocked"` error | Tool used too aggressively | Stop completely, wait 24h |
| Checkpoint required | Account flagged for review | Complete Facebook's verification |
| Unexpected CAPTCHAs | Behavior appears suspicious | Slow everything down |
| Posts auto-removed | Spam filter triggered | Review content, post less frequently |
| Friends can't see posts | Shadowban | Reduce frequency, vary timing |

### 14.4 Best Practices

- Always add a caption/message — blank posts look automated
- Vary posting times — same time every day looks like a bot
- Don't run multiple tools at the same time
- If you get blocked: stop, wait 24 hours, then resume slowly

---

## 15. Complete Troubleshooting Guide

### ❌ "Extension not found" / "Extension not installed"

```
Cause: Extension not loaded in Chrome

Fix:
1. Open chrome://extensions
2. Enable "Developer mode" (top-right toggle)
3. Click "Load unpacked" → select your /extension folder
4. Note the Extension ID shown on the card
5. Open website/js/extension-bridge.js
6. Replace "YOUR_EXTENSION_ID_HERE" with your ID
7. Hard refresh your website (Ctrl+Shift+R or Cmd+Shift+R)
```

### ❌ "Not logged into Facebook"

```
Cause: No Facebook session cookies in Chrome, or wrong Chrome profile

Fix:
1. Go to facebook.com and log in
2. Make sure you're in the same Chrome profile as the extension
3. Check if cookie-blocking extensions are active — temporarily disable them
4. Try: Chrome Settings → Privacy → Cookies → Allow all cookies
5. Log out of Facebook and log back in, then retry
```

### ❌ "Could not extract fb_dtsg token"

```
Cause: Facebook updated their page HTML format

Fix:
1. Open facebook.com in Chrome → press F12 → Network tab
2. Refresh the page
3. Click the first request (www.facebook.com)
4. Click "Response" tab → use Ctrl+F to search for: DTSGInitData
5. Find the token value and look at its surrounding format
6. Update the regex in fetchCsrfTokens() to match the new format

Current patterns to try:
  → "DTSGInitData",[],"token":"XXXXXXX"
  → name="fb_dtsg" value="XXXXXXX"
  → "fb_dtsg_ag":{"token":"XXXXXXX"}
```

### ❌ "Could not fetch pages" / "Invalid access token"

```
Cause: User token expired or could not be fetched

Fix:
1. Click "Disconnect" and reconnect your account
2. Log out of Facebook and back in, then reconnect
3. Check if the token endpoint (connect/get_token) is being blocked

Alternative: Get the token manually
1. Go to https://www.facebook.com/
2. Open DevTools → Console tab
3. Type: document.querySelector('[type=hidden][name=fb_dtsg]').value
4. This gives you fb_dtsg if the page contains it as a form field
```

### ❌ "Video upload start failed" / "HTTP 400 on upload"

```
Cause: Page token doesn't have video upload permission, or wrong pageId

Fix:
1. Verify the page access token has "pages_manage_posts" and
   "pages_read_engagement" permissions
2. Make sure the pageId matches the page the token belongs to
3. Try the upload with a smaller test video first (< 10MB)
4. Check video format: must be MP4 with H.264 video + AAC audio
```

### ❌ "GraphQL: Invalid doc_id"

```
Cause: Facebook updated their internal operation IDs

Fix:
1. Open Chrome → go to facebook.com → press F12 → Network tab
2. Filter by "graphql"
3. Perform the same action manually on Facebook
4. Find the matching POST request → click Payload tab
5. Copy the new doc_id value
6. Update it in your code

Note: doc_ids are stable for weeks or months at a time.
This is the only ongoing maintenance the tool requires.
```

### ❌ "Videos not playing after carousel is posted"

```
Cause: Facebook is still processing the videos

Fix:
1. The waitForVideoReady() function should prevent this
2. If videos still don't play: wait 5–10 minutes and refresh
3. If videos never become available after 30 minutes:
   → The upload may have silently failed
   → Re-upload the videos and try again
4. Check video format requirements:
   → Format: MP4
   → Codec: H.264 video + AAC audio
   → Max resolution: 1920×1080 (1080p)
```

### ❌ Tool 4 "Ad account not found" or "No ad accounts available"

```
Cause: No ad account exists, or it's not linked to the page

Fix:
1. Go to https://www.facebook.com/adsmanager
2. Create an ad account (free, no payment required)
   → Click "Create Ad Account" → fill in name + timezone → done
3. Link the ad account to your page:
   → Go to Business Settings → Ad Accounts → Add People/Assets
4. Make sure you're using the correct page token
   (token must belong to the page you're trying to post to)
5. Ad account ID format must be "act_XXXXXXXXX" — the "act_" prefix
   is added automatically by the code, so just paste the number
```

### ❌ "fake_album_count has no effect" / No album count showing

```
Cause: Facebook may have tightened restrictions on this feature

Fix:
1. Make sure the ad account is properly linked to the page
2. Try a different fake_album_count value (minimum 2, try 3–5)
3. Make sure the image meets minimum size: at least 600×314 pixels
4. Try using a JPEG image rather than PNG
5. If it still doesn't show, Facebook may have deprecated this
   specific feature for your region or account type
```

### ❌ "Swipe up doesn't appear on mobile"

```
Cause: Expected on desktop — swipe-up is mobile-only

Verify:
1. Open Facebook app on your phone
2. Find the post in your feed (may need to scroll)
3. The swipe-up arrow appears at the bottom of the video
4. If not appearing on mobile: check that the CTA link starts with https://
5. Try a different CTA type (LEARN_MORE is the most reliable)
```

### ❌ Large video upload fails halfway

```javascript
// Add retry logic around chunk uploads:
async uploadChunkWithRetry(url, formData, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        method: "POST",
        body: formData,
        credentials: "include"
      });
      return await response.json();
    } catch (err) {
      if (attempt === maxRetries - 1) throw err;
      // Exponential backoff: 2s, 4s, 8s
      const wait = 2000 * Math.pow(2, attempt);
      await new Promise(r => setTimeout(r, wait));
    }
  }
}
```

---

## 16. Deployment Guide

### Option A — Run Locally (Simplest, Most Secure)

```bash
# Install a simple static file server globally
npm install -g http-server   # ← Only time Node.js is needed, and it's optional

# Start the server inside your website folder
cd fb-tools/website
http-server -p 3000

# Open in Chrome: http://localhost:3000
```

> Alternatively, just open `index.html` directly in Chrome — most features work with `file://` URLs but the extension communication works better with a real HTTP server.

### Option B — Vercel (Free HTTPS, Permanent URL)

```bash
npm install -g vercel
cd fb-tools/website
vercel

# Your site: https://your-project-name.vercel.app

# After deploying:
# 1. Update manifest.json: add "https://your-project-name.vercel.app/*"
#    to both content_scripts.matches and externally_connectable.matches
# 2. Update background.js ALLOWED_ORIGINS array
# 3. Go to chrome://extensions → reload the extension
# 4. Test end-to-end
```

### Option C — GitHub Pages (Free)

```bash
# 1. Create a GitHub repo
# 2. Push contents of /website folder to the repo root (not in a subfolder)
# 3. Go to repo Settings → Pages → Source: main branch, / (root)
# 4. Your URL: https://yourusername.github.io/repo-name
# 5. Update manifest.json and background.js with the new URL
# 6. Reload extension in chrome://extensions
```

### After Any Deployment

1. Update URLs in `extension/manifest.json` (`content_scripts.matches` and `externally_connectable.matches`)
2. Update `ALLOWED_ORIGINS` in `extension/background.js`
3. Reload extension at `chrome://extensions` (click the refresh icon on the extension card)
4. Test: Open your deployed URL → check extension connects → try connecting Facebook account

---

## 17. Complete AI Prompt to Build from Scratch

> Copy everything between the markers below and paste it into Claude, GPT-4, Gemini, or any AI coding assistant. It contains all architecture decisions, corrections, and implementation details.

---BEGIN AI PROMPT---

```
You are an expert full-stack developer. Build a complete personal Facebook
advanced posting toolset. Personal use only on my own Facebook account and pages.

## PROJECT: FB Advanced Posting Tools (4 Tools)

TOOLS TO BUILD:
1. Video Carousel Post      — Post 2–10 videos as swipeable carousel on a Page
2. Swipe Up Video Creator   — Mobile-only video post with swipe-up CTA link
3. 2-Card Video Carousel    — Exactly 2 videos in carousel (larger mobile layout)
4. Generate One Card V2     — Single image with fake album count (needs any ad account)

TECH STACK (no exceptions):
- Chrome Extension (Manifest V3) — reads userId from browser cookies
- Website: plain HTML + CSS + Vanilla JavaScript ONLY
- No Node.js, no npm, no frameworks, no TypeScript, no build tools
- No backend server — all requests go directly browser → Facebook

CRITICAL ARCHITECTURE (read carefully):

1. COOKIES: Browsers FORBID setting the Cookie header in cross-origin fetch calls.
   NEVER do: fetch(url, { headers: { "Cookie": cookieString } })
   ALWAYS do: fetch(url, { credentials: "include" })
   The browser automatically sends existing facebook.com cookies with credentials:include.

2. EXTENSION PURPOSE: The extension's ONLY job is to read the c_user cookie
   value and provide it to the website as the userId. That's it.
   All API calls happen from the website using credentials:"include".

3. AUTHENTICATION FLOW:
   Step 1: Extension reads c_user cookie → website gets userId
   Step 2: Website fetches facebook.com with credentials:"include" → extracts fb_dtsg
   Step 3: Website fetches token endpoint → gets user access token
   Step 4: Website uses user access token to fetch page access tokens
   Step 5: All tool operations use page access tokens + credentials:"include"

4. AD ACCOUNT FOR TOOL 4: NO payment method required. ANY ad account status
   works (including brand new, $0 balance, Unsettled, Pending Review).
   The ad account is only used as a storage container for the creative.
   Do NOT filter ad accounts by status. Return ALL of them.

FILE STRUCTURE:
fb-tools/
├── extension/
│   ├── manifest.json    — MV3, permissions: ["cookies","tabs"] only
│   ├── background.js    — reads c_user cookie, handles PING/GET_USER_ID/CHECK_FB_LOGIN
│   ├── content.js       — relays messages between page and background
│   └── icon.png         — placeholder
└── website/
    ├── index.html       — homepage with 4 tool cards
    ├── tools/
    │   ├── video-carousel.html
    │   ├── swipe-up.html
    │   ├── two-card.html
    │   └── one-card-v2.html
    ├── js/
    │   ├── facebook-api.js      — FacebookAPI class (all methods)
    │   ├── extension-bridge.js  — FBToolsExtension class
    │   └── utils.js             — helpers
    └── css/
        └── style.css

MANIFEST.JSON (exact permissions):
{
  "manifest_version": 3,
  "name": "FB Advanced Tools",
  "version": "1.0.0",
  "background": { "service_worker": "background.js" },
  "content_scripts": [{ "matches": ["http://localhost/*","http://127.0.0.1/*"],
                         "js": ["content.js"], "run_at": "document_start" }],
  "permissions": ["cookies", "tabs"],
  "host_permissions": ["*://*.facebook.com/*","http://localhost/*","http://127.0.0.1/*"],
  "externally_connectable": { "matches": ["http://localhost/*","http://127.0.0.1/*"] }
}
DO NOT include: declarativeNetRequest, storage, scripting, type:"module"

BACKGROUND.JS must:
- Handle messages: PING (return {status:"ok"}), GET_USER_ID (return {userId, loggedIn}),
  CHECK_FB_LOGIN (return {loggedIn: bool})
- Use chrome.cookies.get({url:"https://www.facebook.com", name:"c_user"}) for userId
- Validate sender.origin against allowed origins before responding
- Return true from listener for async support

FACEBOOKAPI CLASS methods:
- initialize(): get userId from extension, call fetchCsrfTokens(), call fetchUserAccessToken()
- fetchCsrfTokens(): fetch("https://www.facebook.com/", {credentials:"include"})
  then extract fb_dtsg with regex: /"DTSGInitData"[^}]*"token":"([^"]+)"/
  and lsd token with: /"LSD"[^}]*"token":"([^"]+)"/
- fetchUserAccessToken(): fetch connect/get_token endpoint with credentials:"include"
- apiFetch(url, method, body, extraHeaders): ALL fetches use credentials:"include",
  NEVER set Cookie header manually
- graphql(docId, variables, friendlyName): POST to /api/graphql/ with fb_dtsg, lsd, etc.
- getMyPages(): GET /me/accounts?fields=id,name,access_token with userToken
- getAdAccounts(): GET /me/adaccounts?fields=id,name,account_status — return ALL, no filter
- uploadVideo(file, pageId, pageToken, onProgress): 3-phase chunked upload
  Phase 1: POST /videos with upload_phase=start, file_size → get upload_session_id, video_id
  Phase 2: loop chunks → POST /videos with upload_phase=transfer
  Phase 3: POST /videos with upload_phase=finish
- waitForVideoReady(videoId, pageToken, timeoutMs=180000): poll /videoId?fields=status
  every 5 seconds until status.video_status === "ready" or processing_progress === 100
- createVideoCarousel(pageId, pageToken, videoFiles[], message, onProgress):
  upload each video, wait for ready, then POST /{pageId}/feed with:
  child_attachments:[{media_fbid, name, description, link}]
  multi_share_end_card:"false", multi_share_optimized:"false", published:"true"
- createSwipeUpPost(pageId, pageToken, videoFile, linkUrl, ctaType, message, onProgress):
  upload video, wait for ready, then POST /{pageId}/feed with:
  object_attachment:videoId, call_to_action:{type:ctaType, value:{link, link_format:"VIDEO_MOBILE_SWIPE_UP"}}
- createTwoCardCarousel(pageId, pageToken, v1, v2, message, link1, link2, onProgress):
  upload BOTH videos, wait for both to be ready, then POST with exactly 2 child_attachments
- generateOneCardV2(adAccountId, pageId, pageToken, imageFile, linkUrl, headline,
  desc, fakeCount, message, onProgress):
  Step 1: POST /act_{id}/adimages with FormData(filename=imageFile) → get image hash
  Step 2: POST /act_{id}/adcreatives with object_story_spec containing page_id,
    link_data:{link, message, name:headline, description:desc, image_hash,
    child_attachments:[{link, image_hash, name, description}], fake_album_count:fakeCount}
  Step 3: POST /{pageId}/feed with creative:{creative_id}, published:"true"

POST URL CONSTRUCTION:
Facebook post IDs are "pageId_postId" format.
Build URL as: const [pid, postId] = result.id.split("_");
return `https://www.facebook.com/${pid}/posts/${postId}`;

EACH TOOL PAGE UI must have:
1. Header with back link + tool name
2. "Connect Account" button → runs FB_API.initialize() → shows userId when done
3. Page selector dropdown (populated from getMyPages(), stores token in dataset.token)
4. Tool 4 also needs: Ad Account selector (populated from getAdAccounts())
5. File input(s) with drag-drop styling, appropriate accept types
6. Caption/message textarea (all tools)
7. For Tool 2: CTA type selector with all 10 options
8. For Tool 4: headline input, description input, fake album count (number, min 2, max 20)
9. For Tools 1+3: optional link URL per card
10. Action button (disabled until connected, shows loading state)
11. Progress section: status text + <progress value="0" max="100"> bar
12. Success box (green background): "✅ Post created!" + link to view post
13. Error box (red background): error message
Never use browser alert() — always show styled error box

VALIDATION:
- Videos: must be video/* type, max 1GB each
- Images: must be image/* type, max 30MB
- Carousel: minimum 2 videos, maximum 10
- One Card: fake_album_count minimum 2
- All inputs validated before making any API call

UTILS.JS functions:
- humanDelay(min=1500, max=3500) → Promise<void>
- formatFileSize(bytes) → string like "2.3 MB"
- validateVideo(file) → throws if invalid
- validateImage(file) → throws if invalid
- showProgress(labelId, barId, text, percent) → void
- showSuccess(containerId, postUrl) → void
- showError(containerId, message) → void
- show(id, displayType) and hide(id) helpers

STYLE (style.css):
- Primary: #1877f2 (Facebook blue), Background: #f0f2f5, Cards: white
- Tool cards with hover effect: 2px border #1877f2 + translateY(-3px)
- Progress bar styled in #1877f2 (CSS variables recommended)
- Green success box (#d4edda), Red error box (#f8d7da)
- Drag-drop file zone with dashed border
- Responsive: works on mobile screens
- Facebook-inspired clean design

Build ALL files completely with no placeholder code or TODOs.
Provide setup instructions at the end: how to load extension,
get Extension ID, and test each tool.
```

---END AI PROMPT---

---

## 18. Quick Reference Cheatsheet

### Facebook API Endpoints

| What | Endpoint | Method | Auth |
|------|---------|:------:|------|
| Upload video | `graph.facebook.com/v18.0/{pageId}/videos` | POST | page token |
| Upload ad image | `graph.facebook.com/v18.0/act_{id}/adimages` | POST | page token |
| Create ad creative | `graph.facebook.com/v18.0/act_{id}/adcreatives` | POST | page token |
| Create post | `graph.facebook.com/v18.0/{pageId}/feed` | POST | page token |
| Get my pages | `graph.facebook.com/v18.0/me/accounts` | GET | user token |
| Get ad accounts | `graph.facebook.com/v18.0/me/adaccounts` | GET | user token |
| Internal GraphQL | `facebook.com/api/graphql/` | POST | fb_dtsg + cookies |

> All Graph API URLs: prefix with `https://`

### Key Parameters Per Tool

| Tool | Required Parameters |
|------|-------------------|
| **Video Carousel** | `child_attachments` array (2–10 items with `media_fbid`), `multi_share_end_card=false`, `multi_share_optimized=false` |
| **Swipe Up** | `object_attachment` (video ID), `call_to_action` with `link_format=VIDEO_MOBILE_SWIPE_UP` |
| **2-Card Carousel** | Same as carousel but exactly 2 items in `child_attachments` |
| **One Card V2** | `image_hash` (from adimages), `fake_album_count` (min 2), `creative_id` |

### Ad Account Status Codes

| Status Code | Meaning | Works for Tool 4? |
|:-----------:|---------|:-----------------:|
| 1 | Active | ✅ Yes |
| 2 | Disabled | ❌ No |
| 3 | Unsettled | ✅ Yes |
| 7 | Pending Review | ✅ Yes |
| 9 | In Grace Period | ✅ Yes |
| 101 | Temporarily Unavailable | ⚠️ Maybe |

> Only Disabled (status 2) accounts definitely won't work. All others can create ad creatives.

### Common Facebook Error Codes

| Code | Meaning | Fix |
|------|---------|-----|
| `100` | Invalid parameter | Check request body structure |
| `190` | Access token expired or invalid | Re-initialize (reconnect account) |
| `200` | Permission denied | Check page/account permissions |
| `368` | Blocked — policy violation | Stop for 24h, reduce frequency |
| `613` | Call rate limit reached | Wait 1 hour |
| `2018` | API call limit reached | Wait 1 hour |
| `2500` | Query limit exceeded | Slow down, add delays |

### CTA Types for Swipe Up

```
LEARN_MORE  •  SHOP_NOW  •  SIGN_UP  •  WATCH_MORE  •  BOOK_NOW
CALL_NOW  •  DOWNLOAD  •  GET_OFFER  •  CONTACT_US  •  GET_DIRECTIONS
```

### Video Requirements

| Spec | Requirement |
|------|------------|
| Format | MP4 (strongly recommended) |
| Video codec | H.264 |
| Audio codec | AAC |
| Max file size | 1 GB |
| Max duration | 240 minutes |
| Recommended resolution | 1080p (1920×1080) |
| Aspect ratio | 16:9 (landscape) recommended |
| Minimum | 720p for good quality |

### Image Requirements (Tool 4)

| Spec | Requirement |
|------|------------|
| Format | JPEG or PNG |
| Max file size | 30 MB |
| Minimum size | 600×314 pixels |
| Recommended | 1200×628 pixels |
| Aspect ratio | 1.91:1 recommended |

---

## 19. v1.0 Mistakes — Full Correction Log

This section documents every error found in v1.0 of this guide, so you understand exactly what changed and why.

| # | Location | v1.0 Error | v2.0 Correction |
|---|----------|-----------|----------------|
| 1 | `rawFetch()` | Set `"Cookie": cookieString` in headers | Browsers forbid the Cookie header in cross-origin fetch. Use `credentials: "include"` instead |
| 2 | `getAdAccounts()` | Filtered accounts with `account_status === 1` only | Return ALL accounts — any status works for ad creative creation |
| 3 | Tool 4 prerequisites | "Ad Account must be Active status" | Any ad account works. No payment method required. Even brand new accounts with $0 balance work |
| 4 | `manifest.json` | Included `"declarativeNetRequest"` permission | Never used in any code — removed |
| 5 | `manifest.json` | Included `"storage"` permission | Not used — removed |
| 6 | `background.js` | Used `chrome.scripting.executeScript` in `handleGetAccessToken` | `"scripting"` permission not in manifest — would crash. Simplified to cookie-only approach |
| 7 | Requirements | Listed "Node.js v18+" as required | Not required at all — project is plain HTML/JS |
| 8 | `manifest.json` | Used `"type": "module"` for service worker | Causes silent failures in many Chrome MV3 setups — removed |
| 9 | Tool 1 UI | Said "minimum 3 videos" | Facebook carousel API minimum is 2 child_attachments — corrected to 2 |
| 10 | All tools | No video readiness check before posting | Added `waitForVideoReady()` — carousels fail if videos aren't processed yet |
| 11 | Cheatsheet | "Upload image → `/{pageId}/photos`" for Tool 4 | Tool 4 uses `/act_{id}/adimages` — different endpoint with different auth |
| 12 | All tools | No `credentials: "include"` on Graph API fetch calls | Added `credentials: "include"` to all fetch calls throughout |

---

*Built with reverse-engineering, curiosity, and zero tolerance for watermarks.*
*Version 2.0 — March 2026 — All v1.0 mistakes corrected*
