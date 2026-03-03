<div align="center">

# 🚀 FB Advanced Tools
### Build Your Own Facebook Posting Tools — No Watermarks. No Subscriptions. No Payment Required.

<br/>

[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension%20MV3-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white)](https://developer.chrome.com/docs/extensions/)
[![JavaScript](https://img.shields.io/badge/JavaScript-Vanilla%20ES2022-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Facebook API](https://img.shields.io/badge/Facebook-Graph%20%2B%20GraphQL%20API-1877F2?style=for-the-badge&logo=facebook&logoColor=white)](https://developers.facebook.com/)
[![No Build Tools](https://img.shields.io/badge/Build%20Tools-None%20Required-brightgreen?style=for-the-badge)](#)
[![Version](https://img.shields.io/badge/Version-3.0-orange?style=for-the-badge)](#)

<br/>

> **Four advanced Facebook posting formats — hidden from the normal UI, unlocked through Facebook's internal API.**
> Self-hosted. Zero dependencies. Cookie never leaves your browser. No payment ever needed.

</div>

---

## 📋 Table of Contents

| # | Section |
|:-:|---------|
| 1 | [🎯 Project Overview & Goal](#1--project-overview--goal) |
| 2 | [💡 The Core Insight — Why These Tools Exist](#2--the-core-insight--why-these-tools-exist) |
| 3 | [⚙️ How Facebook's Internal API Works](#3-️-how-facebooks-internal-api-works) |
| 4 | [🏗 Architecture & Tech Stack](#4--architecture--tech-stack) |
| 5 | [📁 Complete Project Structure](#5--complete-project-structure) |
| 6 | [🧩 Chrome Extension — Full Code](#6--chrome-extension--full-code) |
| 7 | [🔑 Authentication — How Cookies & Tokens Work](#7--authentication--how-cookies--tokens-work) |
| 8 | [🎬 Tool 1 — Video Carousel Post](#8--tool-1--video-carousel-post) |
| 9 | [👆 Tool 2 — Swipe Up Video Creator](#9--tool-2--swipe-up-video-creator) |
| 10 | [📱 Tool 3 — 2-Card Video Carousel](#10--tool-3--2-card-video-carousel) |
| 11 | [🃏 Tool 4 — One Card V2 Image Post](#11--tool-4--one-card-v2-image-post) |
| 12 | [🖥 Frontend Website — Complete UI Guide](#12--frontend-website--complete-ui-guide) |
| 13 | [🔒 Security & Safety](#13--security--safety) |
| 14 | [⚡ Rate Limiting & Anti-Ban Strategy](#14--rate-limiting--anti-ban-strategy) |
| 15 | [🐛 Complete Troubleshooting Guide](#15--complete-troubleshooting-guide) |
| 16 | [🚢 Deployment Guide](#16--deployment-guide) |
| 17 | [🤖 AI Prompts — Build from Scratch](#17--ai-prompts--build-from-scratch) |
| 18 | [📌 Quick Reference Cheatsheet](#18--quick-reference-cheatsheet) |
| 19 | [📝 Version History & Corrections](#19--version-history--corrections) |

---

## 1. 🎯 Project Overview & Goal

### What We Are Building

A personal web-based toolset of four tools that unlock Facebook posting formats the normal UI hides:

| Tool | What It Does | Why FB UI Doesn't Have It |
|------|-------------|--------------------------|
| 🎬 **Video Carousel Post** | Post 2–10 videos as a swipeable carousel | FB limits carousel to link-previews in the UI |
| 👆 **Swipe Up Video** | Mobile-only video with swipe-up CTA link | Only in Stories natively — not in Feed via UI |
| 📱 **2-Card Video Carousel** | Exactly 2 videos in carousel (bigger mobile cards) | 2-card renders uniquely large on mobile — not in UI |
| 🃏 **One Card V2 Image Post** | Single image with custom link, headline & description via Ad Creative | Ad Creative format not exposed in regular post UI |

### The Problem Being Solved

Tools like FewFeed offer these features but:
- Add **watermarks** to every post unless you pay a subscription
- You are **dependent** on their servers being online
- **Privacy risk**: Your FB session cookie = full account access — their servers can see it
- You have **no control** over bugs, downtime, or future paywalls

### The Solution

```
FewFeed                              Your Own Tool
──────────────────────────────────   ──────────────────────────────────
❌ Watermark on every post       →   ✅ Zero watermarks, forever
❌ Paid subscription to remove   →   ✅ Free forever
❌ Your session sent to servers  →   ✅ Cookie never leaves your browser
❌ Dependent on their uptime     →   ✅ Runs on your machine
❌ No control over bugs/changes  →   ✅ You own the code
```

Build identical tools yourself. No watermarks. No subscriptions. Your cookie never leaves your own browser.

---

## 2. 💡 The Core Insight — Why These Tools Exist

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

When you log into Facebook, your browser stores **session cookies**. Any `fetch()` call made to `facebook.com` with `credentials: "include"` automatically sends those cookies — Facebook cannot distinguish it from you clicking a button manually.

### How FewFeed Discovered Every Feature

Every tool on FewFeed was built by:
1. Opening Facebook in Chrome → press F12 → Network tab
2. Filtering by `graphql` in the search box
3. Performing the desired action manually on Facebook
4. Finding the POST request → clicking "Payload" tab
5. Copying the `doc_id` and `variables` JSON
6. Automating that exact request in code

This is exactly what we do.

---

## 3. ⚙️ How Facebook's Internal API Works

### 3.1 The Two API Systems

| | Public Graph API | Internal GraphQL API |
|--|----------------|---------------------|
| **URL** | `graph.facebook.com/v18.0/` | `facebook.com/api/graphql/` |
| **Auth** | Developer App Token | Session cookies via `credentials:"include"` + `fb_dtsg` CSRF token |
| **Rate limits** | Strict developer limits | Same as normal browser usage |
| **Feature set** | What Meta allows third-party apps | Everything the Facebook app can do |
| **Used for in this project** | Video/image upload, page token retrieval | Special post formats |

Our tools use **both**:
- **Graph API** → video uploads, image uploads, page management (uses page access token)
- **Internal GraphQL** → creating posts in special formats (uses session cookies + fb_dtsg)

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

Every POST to Facebook's internal API requires a `fb_dtsg` CSRF token. This is a per-session token that changes each login. You must extract it from the Facebook page HTML before making any API calls.

```javascript
// After fetching facebook.com with credentials:"include", extract fb_dtsg:
const match =
  html.match(/"DTSGInitData"[^}]*"token":"([^"]+)"/) ||  // Most common
  html.match(/name="fb_dtsg"\s+value="([^"]+)"/)        ||  // HTML input field
  html.match(/"fb_dtsg","([^"]{10,50})"/);                   // Alternate JSON
```

### 3.6 CRITICAL: Why You Cannot Set the Cookie Header Manually

Browsers **forbid** JavaScript from setting the `Cookie` header in any `fetch()` call. It is a "forbidden header name" — the browser silently ignores it.

```javascript
// ❌ THIS DOES NOT WORK — browser silently ignores the Cookie header
fetch("https://www.facebook.com/api/graphql/", {
  headers: { "Cookie": "c_user=123; xs=abc" }  // ← SILENTLY IGNORED
});

// ✅ THIS IS CORRECT — browser sends session cookies automatically
fetch("https://www.facebook.com/api/graphql/", {
  credentials: "include"  // ← Browser attaches all facebook.com cookies invisibly
});
```

**Why the architecture is designed this way:**
- The **extension** reads `c_user` via `chrome.cookies` API (extensions CAN read cookies from other domains)
- The extension only returns the `userId` string — not the cookie itself
- All actual **API calls** use `credentials: "include"` — the browser handles cookie transmission invisibly
- Your raw cookie string is **never passed around as text** anywhere in the code

---

## 4. 🏗 Architecture & Tech Stack

```
┌─────────────────────────────────────────────────────────────────┐
│                         YOUR SYSTEM                             │
│                                                                 │
│  Chrome Extension (Manifest V3)                                 │
│  └── Reads c_user cookie → returns userId to website           │
│      (cookie itself never passed as text — only the user ID)   │
│                                                                 │
│  Website (Plain HTML + Vanilla JS — no build step needed)       │
│  ├── All fetch() calls use credentials:"include"                │
│  ├── Browser sends FB session cookies automatically             │
│  └── Zero frameworks, zero Node.js required to run             │
│                                                                 │
│  Facebook APIs (called directly browser → Facebook)             │
│  ├── graph.facebook.com  →  video/image upload, page tokens     │
│  └── facebook.com/api/graphql/  →  special post formats         │
└─────────────────────────────────────────────────────────────────┘
```

### Actual Requirements

```
✅ Chrome browser (logged into Facebook)
✅ A Facebook Page (for posting)
✅ Tool 4 only: Any Facebook Ad Account — free to create, no payment method needed

❌ Node.js        — NOT required
❌ npm            — NOT required
❌ Paid ad spend  — NOT required
❌ Payment method — NOT required
❌ Backend server — NOT required
```

### Why These Choices

| Decision | Reason |
|----------|--------|
| Chrome Extension | Only way for a webpage to read another domain's (facebook.com) cookies |
| `credentials:"include"` | Correct, secure way to send session cookies in cross-origin fetch |
| Plain HTML/JS | No build tools, no npm, open index.html directly in browser |
| No backend | All calls go browser → Facebook directly. More private. Nothing to host or maintain. |

---

## 5. 📁 Complete Project Structure

```
fb-tools/
│
├── 📂 extension/
│   ├── manifest.json        ← Permissions: cookies + tabs only
│   ├── background.js        ← Service worker: reads c_user cookie, that's it
│   ├── content.js           ← Relays messages from website to background worker
│   └── icon.png             ← Any 128×128 image
│
└── 📂 website/
    ├── index.html           ← Homepage with 4 tool cards + extension status
    ├── 📂 tools/
    │   ├── video-carousel.html    ← Tool 1
    │   ├── swipe-up.html          ← Tool 2
    │   ├── two-card.html          ← Tool 3
    │   └── one-card-v2.html       ← Tool 4
    ├── 📂 js/
    │   ├── facebook-api.js        ← FacebookAPI class (core of everything)
    │   ├── extension-bridge.js    ← FBToolsExtension class
    │   └── utils.js               ← Helpers: delays, validators, UI shortcuts
    └── 📂 css/
        └── style.css              ← Facebook-inspired design system
```

### Complete Data Flow

```
USER clicks "Connect Account"
        │
        ▼
extension-bridge.js sends PING to extension → confirms it's installed
        │
        ▼
extension-bridge.js sends GET_USER_ID to extension
        │
        ▼
background.js reads c_user cookie → returns { userId, loggedIn }
        │
        ▼
facebook-api.js fetches https://www.facebook.com/ with credentials:"include"
├── Browser automatically sends user's FB session cookies (never seen as text)
├── Extracts fb_dtsg CSRF token from HTML response
└── Fetches user access token → uses it to fetch page access tokens
        │
        ▼
UI populates page dropdown. USER fills form and clicks submit.
        │
        ▼
Tool-specific API calls (all with credentials:"include")
├── Graph API: video/image upload using page access_token
└── Graph API /feed endpoint: create post in special format
        │
        ▼
UI shows ✅ success with direct clickable link to the new post
```

---

## 6. 🧩 Chrome Extension — Full Code

### 6.1 manifest.json

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

> Replace `your-website.vercel.app` with your actual deployed domain.
>
> **Do NOT add:** `declarativeNetRequest`, `storage`, `scripting`, or `"type":"module"` in background — these cause silent failures or are unused and were mistakes in v1.0.

### 6.2 background.js

```javascript
// background.js — Chrome Extension Service Worker
// The extension's ONLY job: read the c_user cookie and return the userId.
// All actual Facebook API calls happen from the website using credentials:"include".
// The raw cookie string is never extracted, passed around, or seen as text.

const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "https://your-website.vercel.app"
];

chrome.runtime.onMessageExternal.addListener(
  function (message, sender, sendResponse) {

    // Security: only respond to our own website origins
    if (!ALLOWED_ORIGINS.includes(sender.origin)) {
      sendResponse({ error: "Unauthorized origin: " + sender.origin });
      return true;
    }

    switch (message.type) {

      case "PING":
        // Used by website to check if extension is installed and responding
        sendResponse({ status: "ok", version: "1.0.0" });
        break;

      case "GET_USER_ID":
        // Read the Facebook User ID from the c_user cookie
        chrome.cookies.get(
          { url: "https://www.facebook.com", name: "c_user" },
          function (cookie) {
            if (chrome.runtime.lastError) {
              sendResponse({ error: chrome.runtime.lastError.message });
              return;
            }
            sendResponse({
              userId: cookie ? cookie.value : null,
              loggedIn: !!cookie && !!cookie.value
            });
          }
        );
        break;

      case "CHECK_FB_LOGIN":
        // Just check login status, no userId needed
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

    return true; // REQUIRED — keeps the message channel open for async callbacks
  }
);
```

### 6.3 content.js

```javascript
// content.js — runs on your website pages
// Acts as a relay between page JavaScript and the background service worker

// Tell the page the extension is present and ready
window.postMessage({ type: "FB_TOOLS_EXTENSION_READY" }, "*");

// Forward FB_TOOLS_-prefixed messages from the page to the background worker
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
// extension-bridge.js — loaded on every tool page of your website
// How your website communicates with the Chrome extension

const EXTENSION_ID = "YOUR_EXTENSION_ID_HERE";
// ↑ Get this from chrome://extensions after loading the extension (32-char string)

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
      chrome.runtime.sendMessage(EXTENSION_ID, { type: "PING" }, (response) => {
        if (chrome.runtime.lastError || !response) {
          this.isAvailable = false;
          resolve(false);
        } else {
          this.isAvailable = true;
          resolve(true);
        }
      });
    });
  }

  // Get the Facebook User ID from the c_user cookie
  async getUserId() {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(EXTENSION_ID, { type: "GET_USER_ID" }, (response) => {
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
      });
    });
  }

  // Check login status only
  async isLoggedIn() {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(EXTENSION_ID, { type: "CHECK_FB_LOGIN" }, (response) => {
        resolve(response?.loggedIn === true);
      });
    });
  }
}

// Global instance — used by all tool pages
window.FBExtension = new FBToolsExtension();
```

### 6.5 How to Install the Extension

```
Step 1:  Open Chrome
Step 2:  Go to: chrome://extensions
Step 3:  Enable "Developer mode" toggle (top-right corner)
Step 4:  Click "Load unpacked"
Step 5:  Select your /extension folder
Step 6:  Note the Extension ID (looks like: abcdefghijklmnopqrstuvwxyz123456)
Step 7:  Open /website/js/extension-bridge.js
Step 8:  Replace "YOUR_EXTENSION_ID_HERE" with your actual ID
Step 9:  Hard-refresh your website (Ctrl+Shift+R)
```

---

## 7. 🔑 Authentication — How Cookies & Tokens Work

### 7.1 The Core FacebookAPI Class

This class handles all authentication and API calls. Every tool uses it.

```javascript
// facebook-api.js
// CRITICAL: All fetch() calls use credentials:"include"
// The browser automatically attaches the user's facebook.com session cookies.
// We NEVER handle the cookie string as text anywhere in this code.

class FacebookAPI {

  constructor() {
    this.userId    = null;   // From extension (value of c_user cookie)
    this.fbDtsg    = null;   // CSRF token extracted from facebook.com HTML
    this.lsdToken  = null;   // Secondary token for some internal endpoints
    this.userToken = null;   // User-level access token for Graph API
    this.initialized = false;
  }

  // ── Full initialization — called on "Connect Account" button ──
  async initialize() {
    if (!window.FBExtension.isAvailable)
      throw new Error("Extension not found. Please install the FB Tools extension.");

    // Step 1: Get userId from extension (reads c_user cookie value only)
    this.userId = await window.FBExtension.getUserId();
    if (!this.userId)
      throw new Error("Not logged into Facebook. Please log in at facebook.com first.");

    // Step 2: Fetch CSRF tokens by fetching facebook.com
    await this.fetchCsrfTokens();

    // Step 3: Get user access token (needed for Graph API calls like /me/accounts)
    await this.fetchUserAccessToken();

    this.initialized = true;
    return true;
  }

  // ── Extract CSRF tokens from the facebook.com homepage ──
  async fetchCsrfTokens() {
    let html;
    try {
      // credentials:"include" → browser sends user's FB session cookies automatically
      const response = await fetch("https://www.facebook.com/", {
        credentials: "include",
        headers: {
          "Accept": "text/html,application/xhtml+xml",
          "Accept-Language": "en-US,en;q=0.9"
        }
      });
      html = await response.text();
    } catch (err) {
      throw new Error("Cannot reach Facebook. Check your internet connection.");
    }

    // Try multiple patterns — Facebook occasionally changes their HTML format
    const dtsgMatch =
      html.match(/"DTSGInitData"[^}]*"token":"([^"]+)"/) ||
      html.match(/name="fb_dtsg"\s+value="([^"]+)"/)    ||
      html.match(/"fb_dtsg","([^"]{10,50})"/);

    if (!dtsgMatch)
      throw new Error(
        "Could not extract fb_dtsg token. " +
        "Try logging out and back into Facebook, then refresh this page."
      );
    this.fbDtsg = dtsgMatch[1];

    // Extract lsd token (used by some internal API endpoints)
    const lsdMatch =
      html.match(/"LSD"[^}]*"token":"([^"]+)"/) ||
      html.match(/\["LSD",\[\],{"token":"([^"]+)"/);
    if (lsdMatch) this.lsdToken = lsdMatch[1];
  }

  // ── Get user-level access token for Graph API calls ──
  async fetchUserAccessToken() {
    try {
      const response = await fetch(
        "https://www.facebook.com/connect/get_token" +
        "?client_id=124024574287414&sdk=joey&redirect_uri=https://www.facebook.com/",
        { credentials: "include" }
      );
      const text = await response.text();
      const match = text.match(/access_token=([^&"]+)/);
      if (match) this.userToken = match[1];
    } catch {
      // Non-fatal — log warning. Some features may degrade without this token.
      console.warn("Could not fetch user access token — some features may be limited");
    }
  }

  // ── Core fetch wrapper — ALL requests to Facebook go through this ──
  // NOTE: Never sets Cookie header (browsers forbid it). Uses credentials:"include".
  async apiFetch(url, method = "GET", body = null, extraHeaders = {}) {
    const response = await fetch(url, {
      method,
      credentials: "include",  // ← Correct, secure way to send session cookies
      headers: {
        "Referer": "https://www.facebook.com/",
        "Origin": "https://www.facebook.com",
        "Accept-Language": "en-US,en;q=0.9",
        ...extraHeaders
      },
      body: body || undefined
    });

    if (response.status === 401 || response.status === 403)
      throw new Error("Not authenticated (401/403) — please re-login to Facebook");
    if (response.status === 400)
      throw new Error("Bad request (400) — check all required fields are present");
    if (!response.ok && response.status !== 302)
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    return response;
  }

  // ── Internal GraphQL API call ──
  async graphql(docId, variables, friendlyName = "") {
    if (!this.initialized) await this.initialize();

    const body = new URLSearchParams({
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
    if (this.lsdToken) body.append("lsd", this.lsdToken);

    const response = await this.apiFetch(
      "https://www.facebook.com/api/graphql/",
      "POST",
      body,
      {
        "Content-Type": "application/x-www-form-urlencoded",
        "X-FB-Friendly-Name": friendlyName,
        "X-FB-LSD": this.lsdToken || ""
      }
    );

    const text = await response.text();
    // Facebook sometimes returns multiple JSON objects separated by newlines
    try { return JSON.parse(text.split("\n")[0]); }
    catch { return JSON.parse(text); }
  }

  // ── Get user's Facebook Pages ──
  async getMyPages() {
    if (!this.initialized) await this.initialize();
    const res = await this.apiFetch(
      `https://graph.facebook.com/v18.0/me/accounts` +
      `?fields=id,name,access_token,category&limit=100` +
      `&access_token=${encodeURIComponent(this.userToken)}`
    );
    const data = await res.json();
    if (data.error) throw new Error("Could not fetch pages: " + data.error.message);
    return data.data || [];
  }

  // ── Get user's Ad Accounts ──
  // Returns ALL accounts regardless of status.
  // Any ad account (brand new, $0 balance, Unsettled, Pending) works for Tool 4.
  // No payment method is needed. No billing ever occurs.
  async getAdAccounts() {
    if (!this.initialized) await this.initialize();
    const res = await this.apiFetch(
      `https://graph.facebook.com/v18.0/me/adaccounts` +
      `?fields=id,name,account_status&limit=100` +
      `&access_token=${encodeURIComponent(this.userToken)}`
    );
    const data = await res.json();
    if (data.error) throw new Error("Could not fetch ad accounts: " + data.error.message);
    return data.data || []; // No status filter — return ALL
  }

  // ── Helper: build post URL from Facebook's "pageId_postId" response format ──
  buildPostUrl(resultId) {
    const [pid, postId] = resultId.split("_");
    return `https://www.facebook.com/${pid}/posts/${postId}`;
  }

  // ── Helper: random hex token for API requests ──
  generateToken(len = 32) {
    return Array.from({ length: len },
      () => Math.floor(Math.random() * 16).toString(16)).join("");
  }
}

window.FB_API = new FacebookAPI();
```

### 7.2 Getting Page Access Tokens

Page access tokens are used for all Graph API calls. They are obtained via `/me/accounts` using the user-level token.

```javascript
// How to populate a page selector dropdown
async function setupPageSelector(selectElement) {
  const pages = await window.FB_API.getMyPages();
  pages.forEach(page => {
    const option = document.createElement("option");
    option.value = page.id;
    option.textContent = page.name + " (" + page.category + ")";
    option.dataset.token = page.access_token; // Store for use on submit
    selectElement.appendChild(option);
  });
}

// On form submit, read the stored token:
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

## 8. 🎬 Tool 1 — Video Carousel Post

### What It Does

Creates a post with **2–10 videos** arranged in a swipeable carousel. Each card shows a video thumbnail. Mobile users swipe horizontally to see all videos.

> **Minimum is 2 videos** — Facebook's carousel API requires at least 2 `child_attachments`.

### Why This Isn't in Facebook's UI

Facebook's regular "Create Post" UI only allows carousels of website link previews. Video carousels are reserved for Facebook Ads in the UI — but the underlying API supports them for regular page posts.

### How It Works

```
1. User selects 2–10 video files
2. Each video uploads to Facebook in chunks (3-phase resumable protocol)
3. Tool polls until each video finishes processing on Facebook's servers
4. Carousel post is created using all video IDs in child_attachments
5. Post appears in page feed as swipeable video carousel
```

### 8.1 Video Upload — 3-Phase Chunked Protocol

```javascript
// Add to FacebookAPI class in facebook-api.js

async uploadVideo(file, pageId, pageToken, onProgress = null) {

  // ── Phase 1: Start — initialize the upload session ──
  const startData = await fetch(
    `https://graph.facebook.com/v18.0/${pageId}/videos`,
    {
      method: "POST",
      credentials: "include",
      body: new URLSearchParams({
        upload_phase: "start",
        file_size: file.size,
        access_token: pageToken
      })
    }
  ).then(r => r.json());

  if (startData.error)
    throw new Error("Upload start failed: " + startData.error.message);

  const { upload_session_id, video_id } = startData;
  let start = parseInt(startData.start_offset);
  let end   = parseInt(startData.end_offset);

  // ── Phase 2: Transfer — upload file in chunks ──
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

    if (chunkData.error)
      throw new Error("Upload chunk failed: " + chunkData.error.message);

    start = parseInt(chunkData.start_offset);
    end   = parseInt(chunkData.end_offset);
    onProgress?.(Math.round((start / file.size) * 100));
  }

  // ── Phase 3: Finish — complete the upload ──
  const finishData = await fetch(
    `https://graph.facebook.com/v18.0/${pageId}/videos`,
    {
      method: "POST",
      credentials: "include",
      body: new URLSearchParams({
        upload_phase: "finish",
        upload_session_id,
        access_token: pageToken
      })
    }
  ).then(r => r.json());

  if (finishData.error)
    throw new Error("Upload finish failed: " + finishData.error.message);

  return video_id;
}
```

### 8.2 Wait for Video to Be Ready

Facebook processes videos asynchronously after upload. Including an unprocessed video in a carousel will silently fail or produce broken posts. Always poll first.

```javascript
// Add to FacebookAPI class in facebook-api.js

async waitForVideoReady(videoId, pageToken, timeoutMs = 180000) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const data = await fetch(
      `https://graph.facebook.com/v18.0/${videoId}?fields=status&access_token=${pageToken}`,
      { credentials: "include" }
    ).then(r => r.json());

    if (data.status) {
      const { video_status, processing_progress } = data.status;
      if (video_status === "ready" || processing_progress === 100) return true;
      if (video_status === "error")
        throw new Error("Facebook failed to process this video. Try re-uploading.");
    }

    await new Promise(r => setTimeout(r, 5000)); // Poll every 5 seconds
  }

  throw new Error("Video processing timed out after 3 minutes.");
}
```

### 8.3 Create the Carousel Post

```javascript
// Add to FacebookAPI class in facebook-api.js

async createVideoCarousel(pageId, pageToken, videoFiles, message, onProgress) {
  const videoIds = [];

  for (let i = 0; i < videoFiles.length; i++) {
    onProgress?.(`Uploading video ${i + 1} of ${videoFiles.length}...`);
    const id = await this.uploadVideo(
      videoFiles[i], pageId, pageToken,
      p => onProgress?.(`Video ${i + 1}: ${p}% uploaded`)
    );

    onProgress?.(`Processing video ${i + 1}...`);
    await this.waitForVideoReady(id, pageToken);
    videoIds.push(id);

    // Human-like delay between uploads — avoid triggering rate limits
    if (i < videoFiles.length - 1)
      await new Promise(r => setTimeout(r, 2000 + Math.random() * 2000));
  }

  onProgress?.("Creating carousel post...");

  const result = await fetch(
    `https://graph.facebook.com/v18.0/${pageId}/feed`,
    {
      method: "POST",
      credentials: "include",
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
        multi_share_end_card: "false",    // No "See More" end card
        multi_share_optimized: "false",   // Prevent Facebook from reordering cards
        published: "true",
        access_token: pageToken
      })
    }
  ).then(r => r.json());

  if (result.error)
    throw new Error("Carousel creation failed: " + result.error.message);

  return { postId: result.id, url: this.buildPostUrl(result.id) };
}
```

---

## 9. 👆 Tool 2 — Swipe Up Video Creator

### What It Does

Creates a video post with a **Swipe Up** button overlay linking to any URL. The swipe-up effect only renders in the **mobile Facebook app** newsfeed. On desktop it appears as a normal video with a link button below — this is expected behavior.

### How It Works

The swipe-up format is created by adding a `call_to_action` with `link_format: "VIDEO_MOBILE_SWIPE_UP"` to a video post. Facebook's mobile app detects this flag and renders the swipe-up gesture overlay.

### Supported CTA Types

| API Value | Button Displays As |
|-----------|-------------------|
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

### The API Call

```javascript
// Add to FacebookAPI class in facebook-api.js

async createSwipeUpPost(pageId, pageToken, videoFile, linkUrl, ctaType, message, onProgress) {

  onProgress?.("Uploading video...");
  const videoId = await this.uploadVideo(
    videoFile, pageId, pageToken,
    p => onProgress?.(`Uploading: ${p}%`)
  );

  onProgress?.("Waiting for video to process...");
  await this.waitForVideoReady(videoId, pageToken);

  onProgress?.("Creating swipe-up post...");

  const result = await fetch(
    `https://graph.facebook.com/v18.0/${pageId}/feed`,
    {
      method: "POST",
      credentials: "include",
      body: new URLSearchParams({
        message,
        object_attachment: videoId,    // Attach the uploaded video by ID
        call_to_action: JSON.stringify({
          type: ctaType,               // e.g. "LEARN_MORE", "SHOP_NOW"
          value: {
            link: linkUrl,
            link_format: "VIDEO_MOBILE_SWIPE_UP"  // ← This flag triggers the swipe-up UI
          }
        }),
        published: "true",
        access_token: pageToken
      })
    }
  ).then(r => r.json());

  if (result.error)
    throw new Error("Swipe-up post failed: " + result.error.message);

  return { postId: result.id, url: this.buildPostUrl(result.id) };
}
```

### Testing the Swipe-Up Effect

- **On desktop:** The post appears as a normal video with a link button below — expected
- **On mobile app:** Open Facebook app → find the post in your feed → swipe up on the video
- If swipe-up doesn't appear on mobile: check that the CTA URL starts with `https://`

---

## 10. 📱 Tool 3 — 2-Card Video Carousel

### What It Does

Exactly **2 videos** in carousel format. The 2-card layout renders significantly **larger on mobile screens** than a 3+ card carousel — each card takes up more screen real estate, leading to higher engagement and watch time.

### Key Differences from Tool 1

- Exactly 2 items in `child_attachments` (never more, never less)
- `multi_share_end_card: false` — no "See More" end card
- `multi_share_optimized: false` — prevent Facebook from reordering cards
- Visual result: each card is bigger and bolder on mobile

### The API Call

```javascript
// Add to FacebookAPI class in facebook-api.js

async createTwoCardCarousel(pageId, pageToken, video1File, video2File,
                             message, link1, link2, onProgress) {

  onProgress?.("Uploading video 1 of 2...");
  const video1Id = await this.uploadVideo(
    video1File, pageId, pageToken,
    p => onProgress?.(`Video 1: ${p}%`)
  );
  await this.waitForVideoReady(video1Id, pageToken);

  onProgress?.("Uploading video 2 of 2...");
  const video2Id = await this.uploadVideo(
    video2File, pageId, pageToken,
    p => onProgress?.(`Video 2: ${p}%`)
  );
  await this.waitForVideoReady(video2Id, pageToken);

  onProgress?.("Creating 2-card carousel post...");

  const result = await fetch(
    `https://graph.facebook.com/v18.0/${pageId}/feed`,
    {
      method: "POST",
      credentials: "include",
      body: new URLSearchParams({
        message,
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
        multi_share_end_card: "false",   // Critical for correct 2-card format
        multi_share_optimized: "false",  // Prevent Facebook from reordering
        published: "true",
        access_token: pageToken
      })
    }
  ).then(r => r.json());

  if (result.error)
    throw new Error("2-card carousel failed: " + result.error.message);

  return { postId: result.id, url: this.buildPostUrl(result.id) };
}
```

---

## 11. 🃏 Tool 4 — One Card V2 Image Post

### What It Does

Posts a single image to your Facebook Page using the **Ad Creative system**. This unlocks a post format not available in the regular Create Post UI: an image with a **custom link URL, headline, and description** rendered as a clean card. Clicking the card takes users to your link.

### What This Tool Does NOT Do

**The tool does NOT add any fake album count overlay.** It posts the image exactly as you upload it.

If you want an album-count look (e.g. `1 / 5 📷` in the corner), simply **edit the image yourself** in any photo editor — Photoshop, Canva, iPhone Photos, anything — before uploading it here. The tool posts whatever image you give it with no modifications.

```
Without editing:                    After you edit the image yourself:
─────────────────────────────       ─────────────────────────────────────
┌──────────────────────────┐        ┌───────────────────────────────────┐
│                          │        │                              1/5 📷│
│    Your Image            │  vs.   │    Your Image (with overlay)      │
│                          │        │                                   │
├──────────────────────────┤        ├───────────────────────────────────┤
│ Headline text            │        │ Headline text                     │
│ yourdomain.com           │        │ yourdomain.com                    │
│ Description text         │        │ Description text                  │
└──────────────────────────┘        └───────────────────────────────────┘
      Tool creates this                  You get this by editing first
```

### How It Works (3 Steps)

```
Step 1: Upload image to ad account's image library → get image hash
Step 2: Create ad creative with the image, link, headline, description
Step 3: Publish the creative as an organic page post → goes live in feed

The ad account is only used as a storage container for the creative.
No billing. No ads are run. You are never charged anything.
```

### Ad Account Requirements

```
✅ ANY Facebook Ad Account — regardless of status
✅ No payment method required
✅ No ad spend required, ever
✅ Brand new ad account works immediately
✅ $0 balance is fine
✅ "Unsettled" status works
✅ "Pending Review" status works

Only requirement: the ad account must exist and be linked to your page.

How to create a free ad account in 30 seconds:
1. Go to https://www.facebook.com/adsmanager
2. Click "Create Ad Account"
3. Enter a name (anything) and your timezone
4. Click Create → done. No credit card asked.
5. ID format: act_XXXXXXXXX (code adds the "act_" prefix automatically)
```

### Ad Account Status Reference

| Status Code | Status Name | Works for Tool 4? |
|:-----------:|------------|:-----------------:|
| 1 | Active | ✅ Yes |
| 2 | Disabled | ❌ No |
| 3 | Unsettled | ✅ Yes |
| 7 | Pending Review | ✅ Yes |
| 9 | In Grace Period | ✅ Yes |
| 101 | Temporarily Unavailable | ⚠️ Maybe |

### The API Call — 3 Steps

```javascript
// Add to FacebookAPI class in facebook-api.js

async generateOneCardV2(adAccountId, pageId, pageToken,
                        imageFile, linkUrl, headline, description,
                        message, onProgress) {

  // Ensure correct format — add "act_" prefix if not already there
  const accountId = adAccountId.startsWith("act_")
    ? adAccountId
    : `act_${adAccountId}`;

  // ── STEP 1: Upload image to ad account's image library ──
  onProgress?.("Uploading image...");

  const imageForm = new FormData();
  imageForm.append("filename", imageFile, imageFile.name);
  imageForm.append("access_token", pageToken);

  const imageData = await fetch(
    `https://graph.facebook.com/v18.0/${accountId}/adimages`,
    { method: "POST", body: imageForm, credentials: "include" }
  ).then(r => r.json());

  if (imageData.error)
    throw new Error("Image upload failed: " + imageData.error.message);

  // Extract the image hash from the response
  // Response format: { images: { "filename.jpg": { hash: "abc123..." } } }
  const imageKeys = Object.keys(imageData.images || {});
  if (!imageKeys.length)
    throw new Error("Image upload returned no hash. Check the image file format.");
  const imageHash = imageData.images[imageKeys[0]].hash;

  // ── STEP 2: Create the ad creative ──
  onProgress?.("Creating image post creative...");

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
        child_attachments: JSON.stringify([{
          link: linkUrl,
          image_hash: imageHash,
          name: headline,
          description: description
        }]),
        multi_share_end_card: false
        // NOTE: fake_album_count is intentionally NOT set here.
        // The tool posts the image as-is. If you want an album-count
        // overlay, add it to your image in a photo editor before uploading.
      }
    }),
    access_token: pageToken
  });

  const creative = await fetch(
    `https://graph.facebook.com/v18.0/${accountId}/adcreatives`,
    { method: "POST", body: creativeBody, credentials: "include" }
  ).then(r => r.json());

  if (creative.error)
    throw new Error("Creative creation failed: " + creative.error.message);

  // ── STEP 3: Publish the creative as an organic page post ──
  onProgress?.("Publishing post...");

  const post = await fetch(
    `https://graph.facebook.com/v18.0/${pageId}/feed`,
    {
      method: "POST",
      credentials: "include",
      body: new URLSearchParams({
        message: message,
        published: "true",
        creative: JSON.stringify({ creative_id: creative.id }),
        access_token: pageToken
      })
    }
  ).then(r => r.json());

  if (post.error)
    throw new Error("Publishing failed: " + post.error.message);

  return {
    postId: post.id,
    creativeId: creative.id,
    url: this.buildPostUrl(post.id)
  };
}
```

---

## 12. 🖥 Frontend Website — Complete UI Guide

### 12.1 Homepage — index.html

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
        <p>Mobile-only video post with swipe-up CTA link overlay</p>
        <span class="badge">Mobile Only</span>
      </div>

      <div class="tool-card" onclick="location.href='tools/two-card.html'">
        <div class="tool-icon">📱</div>
        <h2>2-Card Video Carousel</h2>
        <p>Two-video carousel — bigger cards on mobile screens</p>
        <span class="badge">2 Videos</span>
      </div>

      <div class="tool-card" onclick="location.href='tools/one-card-v2.html'">
        <div class="tool-icon">🃏</div>
        <h2>One Card V2 Image Post</h2>
        <p>Single image with custom link, headline & description</p>
        <span class="badge free-ad">Free Ad Account</span>
      </div>

    </div>

    <div class="info-box" id="ext-warning" style="display:none">
      <strong>⚠️ Extension not detected.</strong>
      Go to <code>chrome://extensions</code> → Enable Developer Mode
      → Load Unpacked → select the <code>/extension</code> folder.
    </div>
  </main>

  <script>
    async function checkExtension() {
      const ok = await window.FBExtension.checkAvailability();
      document.getElementById("ext-status").textContent =
        ok ? "✅ Extension connected" : "❌ Extension not found";
      if (!ok) document.getElementById("ext-warning").style.display = "block";
    }
    checkExtension();
  </script>
</body>
</html>
```

### 12.2 style.css — Complete Design System

```css
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --blue:         #1877f2;
  --blue-dark:    #1558b0;
  --blue-light:   #e7f3ff;
  --gray-bg:      #f0f2f5;
  --gray-border:  #dddfe2;
  --gray-text:    #65676b;
  --text:         #1c1e21;
  --white:        #ffffff;
  --green:        #d4edda;
  --green-border: #c3e6cb;
  --green-text:   #155724;
  --red:          #f8d7da;
  --red-border:   #f5c6cb;
  --red-text:     #721c24;
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
  display: inline-block;
  font-size: 13px;
  background: rgba(0,0,0,0.18);
  padding: 6px 14px;
  border-radius: 20px;
}

/* ── Homepage Tool Grid ── */
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
  border: 2px solid transparent;
  transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s;
}
.tool-card:hover {
  border-color: var(--blue);
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(24,119,242,0.15);
}
.tool-icon  { font-size: 40px; margin-bottom: 14px; }
.tool-card h2 { font-size: 17px; margin-bottom: 8px; }
.tool-card p  { font-size: 13px; color: var(--gray-text); margin-bottom: 16px; line-height: 1.5; }

/* ── Badges ── */
.badge { display: inline-block; padding: 3px 12px; border-radius: 20px;
         font-size: 12px; font-weight: 600;
         background: var(--blue-light); color: var(--blue); }
.badge.free-ad { background: #e8f5e9; color: #2e7d32; }

/* ── Info/Warning Boxes ── */
.info-box {
  background: #fff8e1; border: 1px solid #ffe082; color: #5d4037;
  padding: 16px 20px; border-radius: 10px; font-size: 14px; line-height: 1.6;
}
.info-box code { background: rgba(0,0,0,0.07); padding: 2px 6px;
                 border-radius: 4px; font-size: 12px; }

/* ── Tool Page Layout ── */
.page-header { background: var(--blue); color: var(--white); padding: 18px 30px; }
.page-header a { color: rgba(255,255,255,0.8); text-decoration: none; font-size: 13px; }
.page-header a:hover { color: white; }
.page-header h1 { font-size: 20px; margin-top: 6px; }

.tool-container { max-width: 660px; margin: 30px auto; padding: 0 20px; }

.card {
  background: var(--white); border-radius: 12px; padding: 26px;
  margin-bottom: 18px; box-shadow: 0 1px 4px rgba(0,0,0,0.08);
}
.card-title {
  font-size: 16px; font-weight: 700; margin-bottom: 18px;
  padding-bottom: 14px; border-bottom: 1px solid var(--gray-border);
  color: var(--text);
}

/* ── Forms ── */
.form-group { margin-bottom: 18px; }
.form-group label {
  display: block; font-weight: 600; font-size: 14px;
  margin-bottom: 7px; color: var(--text);
}
.form-group input[type="text"],
.form-group input[type="url"],
.form-group input[type="number"],
.form-group select,
.form-group textarea {
  width: 100%; padding: 10px 13px; border: 1.5px solid var(--gray-border);
  border-radius: 8px; font-size: 14px; color: var(--text);
  outline: none; transition: border-color 0.2s; background: var(--white);
  font-family: inherit;
}
.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus { border-color: var(--blue); }
.form-group textarea { height: 90px; resize: vertical; }
.form-group small { display: block; margin-top: 5px; font-size: 12px; color: var(--gray-text); }

/* File drop zone */
.file-drop {
  border: 2px dashed var(--gray-border); border-radius: 10px;
  padding: 22px; text-align: center; cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
}
.file-drop:hover { border-color: var(--blue); background: var(--blue-light); }
.file-drop input[type="file"] { display: none; }
.file-drop .file-icon { font-size: 32px; margin-bottom: 8px; }
.file-drop p { font-size: 14px; color: var(--gray-text); }

/* ── Buttons ── */
.btn {
  padding: 11px 24px; border: none; border-radius: 8px;
  font-size: 15px; font-weight: 600; cursor: pointer;
  transition: background 0.2s, transform 0.1s;
}
.btn:active { transform: scale(0.98); }
.btn-primary { background: var(--blue); color: white; width: 100%; }
.btn-primary:hover    { background: var(--blue-dark); }
.btn-primary:disabled { background: #bcc0c4; cursor: not-allowed; transform: none; }
.btn-secondary { background: var(--gray-bg); color: var(--text); }

/* ── Progress Bar ── */
.progress-box { background: var(--gray-bg); border-radius: 10px;
                padding: 16px 18px; margin: 14px 0; }
.progress-label { font-size: 13px; color: var(--text);
                  font-weight: 500; margin-bottom: 10px; }
progress { width: 100%; height: 8px; border-radius: 4px;
           appearance: none; border: none; }
progress::-webkit-progress-bar   { background: var(--gray-border); border-radius: 4px; }
progress::-webkit-progress-value { background: var(--blue); border-radius: 4px; }
progress::-moz-progress-bar      { background: var(--blue); border-radius: 4px; }

/* ── Result Boxes ── */
.success-box {
  background: var(--green); border: 1px solid var(--green-border);
  color: var(--green-text); padding: 16px 18px; border-radius: 8px;
  margin-top: 14px; font-size: 14px;
}
.success-box a { color: var(--green-text); font-weight: 700; }

.error-box {
  background: var(--red); border: 1px solid var(--red-border);
  color: var(--red-text); padding: 16px 18px; border-radius: 8px;
  margin-top: 14px; font-size: 14px;
}

/* ── Connect Section ── */
.connect-section { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
.connect-section .btn { width: auto; }
.connect-status { font-size: 14px; color: var(--gray-text); }

/* ── Responsive ── */
@media (max-width: 600px) {
  main, .tool-container { padding: 16px; }
  header { padding: 16px 20px; }
  .tools-grid { grid-template-columns: 1fr; }
}
```

### 12.3 utils.js — Helper Functions

```javascript
// utils.js — Shared helpers used across all tool pages

// Random delay to appear human-like between operations
function humanDelay(minMs = 1500, maxMs = 3500) {
  const ms = Math.floor(Math.random() * (maxMs - minMs)) + minMs;
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Format bytes into readable size string
function formatFileSize(bytes) {
  if (bytes < 1024)       return bytes + " B";
  if (bytes < 1048576)    return (bytes / 1024).toFixed(1) + " KB";
  if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + " MB";
  return (bytes / 1073741824).toFixed(2) + " GB";
}

// Validate a video file before upload
function validateVideo(file) {
  if (!file.type.startsWith("video/"))
    throw new Error(`"${file.name}" is not a video file.`);
  if (file.size > 1073741824) // 1 GB
    throw new Error(`"${file.name}" is too large (${formatFileSize(file.size)}). Max: 1 GB.`);
  return true;
}

// Validate an image file before upload
function validateImage(file) {
  if (!file.type.startsWith("image/"))
    throw new Error(`"${file.name}" is not an image file.`);
  if (file.size > 31457280) // 30 MB
    throw new Error(`"${file.name}" is too large (${formatFileSize(file.size)}). Max: 30 MB.`);
  return true;
}

// Update progress UI
function showProgress(labelId, barId, text, percent = null) {
  const label = document.getElementById(labelId);
  const bar   = document.getElementById(barId);
  if (label) label.textContent = text;
  if (bar && percent !== null) bar.value = percent;
}

// Show success box with post link
function showSuccess(containerId, postUrl) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.style.display = "block";
  el.innerHTML = `✅ <strong>Post created successfully!</strong><br/>
    <a href="${postUrl}" target="_blank" rel="noopener">👉 View Post on Facebook</a>`;
}

// Show error box — never use browser alert()
function showError(containerId, message) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.style.display = "block";
  el.innerHTML = `❌ <strong>Error:</strong> ${message}`;
}

function hide(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = "none";
}

function show(id, displayType = "block") {
  const el = document.getElementById(id);
  if (el) el.style.display = displayType;
}
```

### 12.4 Tool Page UI Requirements

Every tool page must include all of the following:

1. **Page header** with back link to homepage + tool name
2. **Connect Account** button → calls `FB_API.initialize()` → shows userId on success
3. **Page selector** dropdown (populated from `getMyPages()`, stores `access_token` in `dataset.token`)
4. **Tool 4 additionally**: Ad Account selector (from `getAdAccounts()`)
5. **File input(s)** with drag-drop zone styling (dashed border, hover fill effect)
6. **Caption/message** textarea (all tools)
7. **Tool 2**: CTA type selector with all 10 options listed above
8. **Tool 4**: Link URL input, headline input, description input
9. **Tools 1 & 3**: Optional per-card link URL inputs
10. **Submit button**: disabled until connected + files selected; shows loading state during post
11. **Progress section**: status text label + `<progress value="0" max="100">` bar
12. **Success box** (green `#d4edda`): "✅ Post created!" + direct link to view post
13. **Error box** (red `#f8d7da`): clear error message
14. **Never** use `browser alert()` — always styled boxes

---

## 13. 🔒 Security & Safety

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
| Who sees your session | FewFeed's servers on every request | Only your browser |
| Cookie stored where | Their database | Never stored anywhere |
| Can be breached | Yes — if they get hacked | No — nothing to breach |
| Requires trust in them | Yes | No |

### 13.3 HTTPS Is Required When Deployed Online

If you deploy the website online (not localhost), it **must** be on HTTPS. Serving over HTTP would expose authentication data in transit. Vercel and GitHub Pages provide free HTTPS automatically.

---

## 14. ⚡ Rate Limiting & Anti-Ban Strategy

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
- If you get blocked: stop completely, wait 24 hours, then resume slowly
- Don't post the exact same content repeatedly

---

## 15. 🐛 Complete Troubleshooting Guide

### ❌ "Extension not found" / Extension not responding

```
Cause: Extension not loaded in Chrome, wrong ID, or origin not allowed

Fix:
1. Open chrome://extensions
2. Enable "Developer mode" (top-right toggle)
3. Click "Load unpacked" → select your /extension folder
4. Note the Extension ID shown on the card (32-character string)
5. Open website/js/extension-bridge.js
6. Replace "YOUR_EXTENSION_ID_HERE" with your actual ID
7. Open extension/background.js — confirm your website's origin
   is in the ALLOWED_ORIGINS array
8. Hard refresh your website (Ctrl+Shift+R or Cmd+Shift+R)
```

### ❌ "Not logged into Facebook"

```
Cause: No active Facebook session in Chrome, or wrong Chrome profile

Fix:
1. Open facebook.com in Chrome and log in
2. Make sure you're using the same Chrome profile as the extension
3. Check if cookie-blocking extensions are active — temporarily disable them
4. Chrome Settings → Privacy → Cookies → Allow all cookies
5. Log out of Facebook and log back in, then retry
```

### ❌ "Could not extract fb_dtsg token"

```
Cause: Facebook updated their HTML structure — the regex pattern is outdated

Fix:
1. Open facebook.com → press F12 → Network tab
2. Refresh the page
3. Click the first request (www.facebook.com) → Response tab
4. Search (Ctrl+F) for: DTSGInitData or fb_dtsg
5. Look at the surrounding format and update the regex in fetchCsrfTokens()

Current patterns to try (in order):
  → "DTSGInitData",[],"token":"XXXXXXX"
  → name="fb_dtsg" value="XXXXXXX"
  → "fb_dtsg_ag":{"token":"XXXXXXX"}
  → "fb_dtsg","XXXXXXX"
```

### ❌ "Could not fetch pages" / Empty page dropdown

```
Cause: User access token expired or failed to fetch

Fix:
1. Click "Disconnect" and reconnect your account
2. Log out of Facebook and back in, then reconnect
3. Check if the get_token endpoint is being blocked by an extension
4. Verify in DevTools Console after connecting:
   → Type: window.FB_API.userToken
   → If undefined/null, the token fetch is failing silently
```

### ❌ "Video upload start failed" / "HTTP 400 on upload"

```
Cause: Page token lacks video permission, wrong pageId, or wrong video format

Fix:
1. Verify page token has "pages_manage_posts" permission
2. Make sure the pageId matches the page the token belongs to
3. Test with a small video first (< 10 MB) to isolate the issue
4. Check video format requirements:
   → Format: MP4
   → Video codec: H.264
   → Audio codec: AAC
   → Max size: 1 GB
5. Convert with HandBrake or FFmpeg if needed
```

### ❌ "GraphQL: Invalid doc_id"

```
Cause: Facebook updated their internal operation IDs (happens every few weeks/months)

Fix:
1. Open facebook.com → F12 → Network tab → filter by "graphql"
2. Perform the action manually on Facebook
3. Find the matching POST request → click it → Payload tab
4. Copy the new doc_id value → update in your code

doc_ids are stable for weeks to months at a time.
Recapturing them is the only ongoing maintenance this project ever needs.
```

### ❌ "Videos not playing" after carousel is posted

```
Cause: Facebook still processing the videos (normal after upload)

Fix:
1. waitForVideoReady() should prevent this — verify it's being called
2. Wait 5–10 minutes after post is created, then refresh
3. If still broken after 30 minutes: re-upload the videos and try again
4. Verify video is MP4 with H.264 + AAC — other formats may upload
   but fail to process silently
```

### ❌ Tool 4: "No ad accounts shown" or "Creative creation failed"

```
Cause: No ad account exists, or not linked to page, or wrong ID format

Fix:
1. Go to facebook.com/adsmanager
2. Create an ad account (free — no card needed, takes 30 seconds):
   → "Create Ad Account" → name + timezone → Done
3. Make sure ad account is linked to your Page:
   → Business Settings → Pages → link the ad account
4. Any account status works (Unsettled, Pending, etc.)
   Only "Disabled" (status 2) does not work.
5. The code adds "act_" prefix automatically — paste just the number
   or the full "act_XXXXXXXXX" format, both work

Note: No payment required. No ads ever run. Never charged.
```

### ❌ Tool 4: Image appears but no headline or link below it

```
Cause: The creative format may not have rendered fully, or link_data structure issue

Fix:
1. Verify linkUrl starts with https://
2. Make sure headline is not empty (required field)
3. Check the ad account is properly linked to the page being posted to
4. Try a different image (JPEG works most reliably, minimum 600×314 px)
5. View the post immediately after creation — Facebook sometimes
   needs a moment to fully render the card format
```

### ❌ "Swipe-up doesn't appear on mobile"

```
Cause: Swipe-up is a mobile-only format — expected behavior on desktop

Verify on mobile:
1. Open Facebook app on your phone (not mobile browser — the app)
2. Find the post in your newsfeed (not your profile page)
3. The swipe-up arrow appears at the bottom of the video while playing

If still not appearing on mobile:
→ Confirm the CTA link starts with https:// (not http://)
→ Try LEARN_MORE as the CTA type (most reliable)
→ Make sure the post was published to a Page, not personal profile
```

### ❌ Large video upload fails partway through

```javascript
// Add retry logic around chunk uploads to handle network timeouts

async function uploadChunkWithRetry(url, formData, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fetch(url, {
        method: "POST",
        body: formData,
        credentials: "include"
      }).then(r => r.json());
    } catch (err) {
      if (attempt === maxRetries - 1) throw err;
      // Exponential backoff: 2s, 4s, 8s
      await new Promise(r => setTimeout(r, 2000 * Math.pow(2, attempt)));
    }
  }
}
```

---

## 16. 🚢 Deployment Guide

### Option A — Localhost (Simplest, Most Secure)

```bash
# Optional: simple HTTP server (only time any external tooling is needed)
npm install -g http-server
cd fb-tools/website
http-server -p 3000
# Open: http://localhost:3000
```

Or simply open `index.html` directly in Chrome — most features work with `file://` URLs though an HTTP server is more reliable for extension communication.

### Option B — Vercel (Free HTTPS, Permanent URL)

```bash
npm install -g vercel
cd fb-tools/website
vercel
# URL: https://your-project-name.vercel.app
```

After deploying, update **three places**:
1. `extension/manifest.json` → add URL to `content_scripts.matches` AND `externally_connectable.matches`
2. `extension/background.js` → add URL to `ALLOWED_ORIGINS` array
3. Go to `chrome://extensions` → click the reload icon on your extension card

### Option C — GitHub Pages (Free)

Push the contents of `/website` to your repo root → Settings → Pages → Source: main branch → Save.
URL: `https://yourusername.github.io/repo-name`

Then update the same three places as Option B.

> **After any URL change or manifest edit:** always reload the extension at `chrome://extensions`.

---

## 17. 🤖 AI Prompts — Build from Scratch

Five ready-to-copy prompts. **Prompt A** builds all four tools at once. **Prompts B–E** build each tool individually so you can work on one at a time. Copy the full block between the `---BEGIN---` and `---END---` markers and paste into any AI coding assistant.

---

### 📦 Prompt A — All 4 Tools (Complete Project)

---BEGIN PROMPT A---
```
You are an expert full-stack developer. Build a complete personal Facebook
advanced posting toolset for personal use only on my own Facebook Pages.

## THE 4 TOOLS:
1. Video Carousel Post  — 2–10 videos as swipeable carousel on a Facebook Page
2. Swipe Up Video       — mobile-only video post with swipe-up CTA link overlay
3. 2-Card Carousel      — exactly 2 videos in carousel (larger mobile layout)
4. One Card V2          — single image post via Ad Creative system with custom
                          link, headline & description. No fake album count added
                          by the tool — user edits their own image if they want
                          any overlay effect before uploading.

## NON-NEGOTIABLE ARCHITECTURE RULES:

RULE 1 — COOKIES:
Browsers FORBID setting the Cookie header in cross-origin fetch calls.
NEVER:  fetch(url, { headers: { "Cookie": cookieString } })
ALWAYS: fetch(url, { credentials: "include" })
The browser sends facebook.com session cookies automatically with credentials:include.

RULE 2 — EXTENSION PURPOSE:
The Chrome Extension's ONLY job: read the c_user cookie, return it as userId string.
ALL actual API calls happen from the website using credentials:"include". Nothing else.

RULE 3 — AUTH FLOW:
Step 1: Extension reads c_user cookie → website receives userId
Step 2: Website fetches facebook.com (credentials:"include") → extracts fb_dtsg + lsd
Step 3: Website fetches get_token endpoint → user access token
Step 4: User token → GET /me/accounts → page access tokens
Step 5: Page tokens used for all Graph API calls (video/image upload, posting)

RULE 4 — AD ACCOUNTS:
Return ALL ad accounts. No status filtering. No payment method needed.
Any status works: Active, Unsettled, Pending Review, brand new, $0 balance.
Only "Disabled" (status 2) won't work. The ad account is only a storage container.
No billing. No ads run. User is never charged.

RULE 5 — ONE CARD V2:
Do NOT add fake_album_count to the API call. The tool posts a clean single image
with a custom link, headline, and description via the Ad Creative system.
The user edits their own image if they want any overlay effect. The tool adds nothing.

## TECH STACK (no exceptions):
- Chrome Extension (Manifest V3)
- Website: plain HTML + CSS + Vanilla JavaScript ONLY
- NO Node.js, NO npm, NO frameworks, NO TypeScript, NO build tools
- NO backend server — all calls go directly browser → Facebook

## FILE STRUCTURE:
fb-tools/
├── extension/
│   ├── manifest.json    — permissions: ["cookies","tabs"] only
│   ├── background.js    — reads c_user, handles PING/GET_USER_ID/CHECK_FB_LOGIN
│   ├── content.js       — relays messages from website to background
│   └── icon.png
└── website/
    ├── index.html       — homepage with 4 tool cards
    ├── tools/
    │   ├── video-carousel.html
    │   ├── swipe-up.html
    │   ├── two-card.html
    │   └── one-card-v2.html
    ├── js/
    │   ├── facebook-api.js      — FacebookAPI class with all methods
    │   ├── extension-bridge.js  — FBToolsExtension class
    │   └── utils.js             — helpers
    └── css/
        └── style.css

## MANIFEST.JSON (exact — never add extra permissions):
permissions: ["cookies", "tabs"] only
Do NOT add: declarativeNetRequest, storage, scripting, type:"module"
host_permissions: *.facebook.com, localhost, 127.0.0.1
externally_connectable matches: localhost, 127.0.0.1

## BACKGROUND.JS:
Validate sender.origin against ALLOWED_ORIGINS before responding.
Handle messages: PING → {status:"ok"}, GET_USER_ID → {userId, loggedIn},
CHECK_FB_LOGIN → {loggedIn:bool}. Return true from listener for async.

## FACEBOOKAPI CLASS METHODS:
initialize(): getUserId from extension → fetchCsrfTokens() → fetchUserAccessToken()
fetchCsrfTokens(): fetch("https://www.facebook.com/", {credentials:"include"})
  extract fb_dtsg: /"DTSGInitData"[^}]*"token":"([^"]+)"/
  extract lsd:     /"LSD"[^}]*"token":"([^"]+)"/
fetchUserAccessToken(): fetch connect/get_token endpoint with credentials:"include"
apiFetch(url, method, body, headers): ALWAYS credentials:"include", NEVER Cookie header
graphql(docId, variables, friendlyName): POST to /api/graphql/ with fb_dtsg, lsd, etc.
getMyPages(): GET /me/accounts?fields=id,name,access_token,category with userToken
getAdAccounts(): GET /me/adaccounts?fields=id,name,account_status — return ALL, no filter
buildPostUrl(resultId): split "pageId_postId" → return full facebook.com URL

uploadVideo(file, pageId, pageToken, onProgress):
  Phase 1: POST /videos upload_phase=start → get upload_session_id, video_id
  Phase 2: loop chunks: POST /videos upload_phase=transfer with file.slice chunks
  Phase 3: POST /videos upload_phase=finish
  Return: video_id

waitForVideoReady(videoId, pageToken, timeoutMs=180000):
  Poll GET /videoId?fields=status every 5s
  Success: video_status==="ready" OR processing_progress===100
  Fail: video_status==="error" or timeout

createVideoCarousel(pageId, pageToken, files[], message, onProgress):
  Upload each → waitForReady → humanDelay(2000–4000ms) between each
  POST /{pageId}/feed: child_attachments (2–10 items with media_fbid),
  multi_share_end_card:"false", multi_share_optimized:"false", published:"true"

createSwipeUpPost(pageId, pageToken, file, linkUrl, ctaType, message, onProgress):
  Upload + waitForReady
  POST /{pageId}/feed: object_attachment=videoId,
  call_to_action:{type:ctaType, value:{link, link_format:"VIDEO_MOBILE_SWIPE_UP"}}

createTwoCardCarousel(pageId, pageToken, v1, v2, message, link1, link2, onProgress):
  Upload both + waitForReady for both
  POST with exactly 2 child_attachments, same flags as carousel

generateOneCardV2(adAccountId, pageId, pageToken, imageFile, linkUrl,
                  headline, description, message, onProgress):
  accountId = adAccountId.startsWith("act_") ? adAccountId : "act_"+adAccountId
  Step 1: POST /act_{id}/adimages with FormData(filename=imageFile, access_token)
          → extract imageHash from data.images[Object.keys(data.images)[0]].hash
  Step 2: POST /act_{id}/adcreatives with object_story_spec JSON:
          { page_id, link_data: { link, message, name:headline, description,
            image_hash, child_attachments:[{link, image_hash, name, description}],
            multi_share_end_card:false } }
          Do NOT include fake_album_count
  Step 3: POST /{pageId}/feed with creative:{creative_id}, published:"true"

## EACH TOOL PAGE UI:
- Header with back link + tool name
- Connect button → FB_API.initialize() → show connected userId
- Page dropdown: from getMyPages(), store access_token in dataset.token
- Tool 4 also: Ad Account dropdown from getAdAccounts()
- File input(s) with drag-drop zones (dashed border, hover fill, accept types)
- Caption/message textarea (all tools)
- Tool 2: CTA type selector (all 10: LEARN_MORE, SHOP_NOW, SIGN_UP, WATCH_MORE,
  BOOK_NOW, CALL_NOW, DOWNLOAD, GET_OFFER, CONTACT_US, GET_DIRECTIONS)
- Tool 4: link URL input, headline input, description input
- Tool 4: tip text saying user can edit image themselves for any overlay effect
- Tools 1+3: optional per-card link URL inputs
- Submit button: disabled until connected + files selected; loading state while posting
- Progress text label + <progress value="0" max="100"> bar
- Success box (green #d4edda): "✅ Post created!" + view link
- Error box (red #f8d7da): clear error message
- NEVER use browser alert()

## VALIDATION before API calls:
- Videos: must be video/* type, max 1 GB each
- Images: must be image/* type, max 30 MB
- Carousel (Tool 1): minimum 2, maximum 10 videos
- Tool 3: exactly 2 videos required
- Tool 4: link URL, headline required; description optional

## STYLE (style.css):
CSS custom properties for all colors. Primary: #1877f2, Background: #f0f2f5.
Cards: white, 12px radius. Hover: 2px solid #1877f2 + translateY(-3px).
Progress bar in #1877f2. Dashed file drop zones. Mobile responsive. No alerts.

Build ALL files completely. No placeholder code. No TODO comments.
End with setup instructions: load extension, get Extension ID, test each tool.
```
---END PROMPT A---

---

### 🎬 Prompt B — Tool 1 Only (Video Carousel Post)

---BEGIN PROMPT B---
```
You are an expert full-stack developer. Build a single Facebook posting tool:
Video Carousel Post. Personal use only on my own Facebook Page.

## WHAT THIS TOOL DOES:
Posts 2–10 videos as a swipeable carousel on a Facebook Page.
Minimum 2 videos, maximum 10 videos.
This format is not available in Facebook's normal Create Post UI.

## NON-NEGOTIABLE ARCHITECTURE RULES:

RULE 1 — COOKIES:
Browsers forbid setting Cookie header in fetch. NEVER:
  fetch(url, { headers: { "Cookie": "..." } })
ALWAYS: fetch(url, { credentials: "include" })
Browser sends facebook.com session cookies automatically.

RULE 2 — EXTENSION PURPOSE:
Chrome Extension ONLY reads c_user cookie → returns userId.
All actual API calls use credentials:"include" from the website.

RULE 3 — AUTH FLOW:
1. Extension reads c_user → website gets userId
2. Website fetches facebook.com (credentials:"include") → fb_dtsg + lsd tokens
3. Website fetches get_token endpoint → user access token
4. User token → /me/accounts → page access tokens

## TECH STACK:
Chrome Extension (MV3) + plain HTML + CSS + Vanilla JS only.
No Node.js, no npm, no frameworks, no TypeScript, no backend server.

## FILE STRUCTURE:
fb-video-carousel/
├── extension/
│   ├── manifest.json
│   ├── background.js
│   ├── content.js
│   └── icon.png
└── website/
    ├── index.html
    ├── js/
    │   ├── facebook-api.js
    │   ├── extension-bridge.js
    │   └── utils.js
    └── css/
        └── style.css

## MANIFEST.JSON:
permissions: ["cookies", "tabs"] only.
Do NOT add: declarativeNetRequest, storage, scripting, type:"module"
host_permissions: *.facebook.com, localhost, 127.0.0.1
externally_connectable: localhost, 127.0.0.1

## BACKGROUND.JS:
Validate sender.origin against ALLOWED_ORIGINS.
Handle: PING → {status:"ok"}, GET_USER_ID → {userId, loggedIn},
CHECK_FB_LOGIN → {loggedIn}. Return true from listener.

## FACEBOOKAPI CLASS:
initialize(): getUserId() → fetchCsrfTokens() → fetchUserAccessToken()
fetchCsrfTokens(): fetch facebook.com (credentials:"include")
  extract fb_dtsg: /"DTSGInitData"[^}]*"token":"([^"]+)"/
  extract lsd:     /"LSD"[^}]*"token":"([^"]+)"/
fetchUserAccessToken(): fetch connect/get_token (credentials:"include")
apiFetch(): all fetches credentials:"include", never set Cookie header
getMyPages(): GET /me/accounts?fields=id,name,access_token,category with userToken
buildPostUrl(id): split "pid_postId" → return full facebook.com post URL

uploadVideo(file, pageId, pageToken, onProgress):
  Phase 1: POST /v18.0/{pageId}/videos upload_phase=start → upload_session_id, video_id
  Phase 2: loop: POST /videos upload_phase=transfer with file.slice chunks
  Phase 3: POST /videos upload_phase=finish
  Return: video_id

waitForVideoReady(videoId, pageToken, timeoutMs=180000):
  Poll GET /v18.0/{videoId}?fields=status every 5s
  Return true when: video_status==="ready" OR processing_progress===100
  Throw on: video_status==="error" or timeout

createVideoCarousel(pageId, pageToken, videoFiles[], message, onProgress):
  For each file: upload → waitForReady → humanDelay(2000, 4000ms)
  POST https://graph.facebook.com/v18.0/{pageId}/feed:
    message, published:"true", access_token,
    child_attachments: [{media_fbid, name, description, link}] for each video,
    multi_share_end_card:"false",
    multi_share_optimized:"false"
  Return: {postId, url}

## TOOL UI (index.html):
- Header with tool name and brief description
- Connect button → initialize() → show "Connected: [userId]"
- Page selector dropdown (from getMyPages(), token in dataset.token)
- File drop zone: accept="video/*", multiple, up to 10 files
  Show list of selected filenames + sizes after selection
- Caption textarea
- Optional: link URL inputs per video (shown after files selected)
- Submit button: disabled until connected + min 2 files selected
- Progress: text label + <progress value="0" max="100"> bar
- Success box (green): post link
- Error box (red): error message
- Never use alert()

## VALIDATION:
- Each video: video/* type, max 1 GB
- Minimum 2 videos, maximum 10

## UTILS:
humanDelay(min, max), formatFileSize(bytes), validateVideo(file),
showProgress(labelId, barId, text, percent), showSuccess(id, url),
showError(id, msg), show(id), hide(id)

## STYLE:
Facebook-inspired. CSS custom properties. Primary: #1877f2. Background: #f0f2f5.
White cards, 12px radius. Dashed file drop zones. Mobile responsive.

Build all files completely. No placeholder code.
End with setup instructions: load extension, get ID, step-by-step test.
```
---END PROMPT B---

---

### 👆 Prompt C — Tool 2 Only (Swipe Up Video Creator)

---BEGIN PROMPT C---
```
You are an expert full-stack developer. Build a single Facebook posting tool:
Swipe Up Video Creator. Personal use only on my own Facebook Page.

## WHAT THIS TOOL DOES:
Posts a video to a Facebook Page with a swipe-up CTA button that links to any URL.
The swipe-up effect only renders in the mobile Facebook app newsfeed.
On desktop it appears as a normal video with a link button below — expected behavior.

## NON-NEGOTIABLE ARCHITECTURE RULES:

RULE 1 — COOKIES:
Browsers forbid setting Cookie header in fetch. NEVER:
  fetch(url, { headers: { "Cookie": "..." } })
ALWAYS: fetch(url, { credentials: "include" })

RULE 2 — EXTENSION PURPOSE:
Chrome Extension ONLY reads c_user cookie → returns userId.
All API calls use credentials:"include" from the website.

RULE 3 — AUTH FLOW:
1. Extension reads c_user → userId
2. Website fetches facebook.com (credentials:"include") → fb_dtsg + lsd
3. Fetches get_token endpoint → user access token
4. User token → /me/accounts → page access tokens

## TECH STACK:
Chrome Extension (MV3) + plain HTML + CSS + Vanilla JS only.
No Node.js, no npm, no frameworks, no backend.

## FILE STRUCTURE:
fb-swipe-up/
├── extension/
│   ├── manifest.json
│   ├── background.js
│   ├── content.js
│   └── icon.png
└── website/
    ├── index.html
    ├── js/
    │   ├── facebook-api.js
    │   ├── extension-bridge.js
    │   └── utils.js
    └── css/
        └── style.css

## MANIFEST.JSON:
permissions: ["cookies","tabs"] only. No extras.
host_permissions: *.facebook.com, localhost, 127.0.0.1
externally_connectable: localhost, 127.0.0.1

## BACKGROUND.JS:
Validate sender.origin. PING/GET_USER_ID/CHECK_FB_LOGIN. Return true.

## FACEBOOKAPI CLASS:
initialize, fetchCsrfTokens, fetchUserAccessToken, apiFetch, getMyPages, buildPostUrl.

uploadVideo(file, pageId, pageToken, onProgress): 3-phase chunked upload, return video_id
waitForVideoReady(videoId, pageToken, timeoutMs=180000): poll every 5s, return true when ready

createSwipeUpPost(pageId, pageToken, videoFile, linkUrl, ctaType, message, onProgress):
  1. uploadVideo() → videoId
  2. waitForVideoReady(videoId, pageToken)
  3. POST https://graph.facebook.com/v18.0/{pageId}/feed:
     message, published:"true", access_token,
     object_attachment: videoId,
     call_to_action: JSON.stringify({
       type: ctaType,
       value: { link: linkUrl, link_format: "VIDEO_MOBILE_SWIPE_UP" }
     })
  Return: {postId, url: buildPostUrl(result.id)}

## TOOL UI (index.html):
- Header: "Swipe Up Video Creator" + note that swipe-up is mobile app only
- Connect button → initialize() → show connected userId
- Page selector dropdown (from getMyPages())
- Single video file drop zone (accept="video/*", one file)
  Show filename + size after selection
- CTA type selector with all 10 options:
  LEARN_MORE, SHOP_NOW, SIGN_UP, WATCH_MORE, BOOK_NOW,
  CALL_NOW, DOWNLOAD, GET_OFFER, CONTACT_US, GET_DIRECTIONS
- Link URL input (required, must start with https://)
- Caption textarea
- Submit button: disabled until connected + file + URL all present
- Progress text + <progress> bar
- Success box with post link + note: "Check Facebook mobile app for swipe-up effect"
- Error box
- Never alert()

## VALIDATION:
- Video: must be video/* type, max 1 GB
- Link URL: required, must start with https://
- CTA type: must be selected (default to LEARN_MORE)

## STYLE: Facebook-inspired, CSS vars, mobile responsive.

Build all files completely. No placeholder code.
End with setup + testing instructions.
```
---END PROMPT C---

---

### 📱 Prompt D — Tool 3 Only (2-Card Video Carousel)

---BEGIN PROMPT D---
```
You are an expert full-stack developer. Build a single Facebook posting tool:
2-Card Video Carousel. Personal use only on my own Facebook Page.

## WHAT THIS TOOL DOES:
Posts exactly 2 videos as a carousel on a Facebook Page.
The 2-card format renders with larger cards on mobile screens compared to
a 3+ card carousel, giving higher visual impact and engagement.
Exactly 2 videos — no more, no less.

## NON-NEGOTIABLE ARCHITECTURE RULES:

RULE 1 — COOKIES:
NEVER: fetch(url, { headers: { "Cookie": "..." } })
ALWAYS: fetch(url, { credentials: "include" })

RULE 2 — EXTENSION PURPOSE:
Chrome Extension ONLY reads c_user cookie → returns userId.
All API calls use credentials:"include" from the website.

RULE 3 — AUTH FLOW:
1. Extension reads c_user → userId
2. Website fetches facebook.com (credentials:"include") → fb_dtsg + lsd
3. Fetches get_token endpoint → user access token
4. User token → /me/accounts → page access tokens

## TECH STACK:
Chrome Extension (MV3) + plain HTML + CSS + Vanilla JS only.
No Node.js, no npm, no frameworks, no backend.

## FILE STRUCTURE:
fb-two-card/
├── extension/
│   ├── manifest.json
│   ├── background.js
│   ├── content.js
│   └── icon.png
└── website/
    ├── index.html
    ├── js/
    │   ├── facebook-api.js
    │   ├── extension-bridge.js
    │   └── utils.js
    └── css/
        └── style.css

## MANIFEST.JSON:
permissions: ["cookies","tabs"] only.
host_permissions: *.facebook.com, localhost, 127.0.0.1
externally_connectable: localhost, 127.0.0.1

## BACKGROUND.JS: Validate origin. PING/GET_USER_ID/CHECK_FB_LOGIN. Return true.

## FACEBOOKAPI CLASS:
initialize, fetchCsrfTokens, fetchUserAccessToken, apiFetch, getMyPages, buildPostUrl.

uploadVideo(file, pageId, pageToken, onProgress): 3-phase chunked upload, return video_id
waitForVideoReady(videoId, pageToken, timeoutMs=180000): poll every 5s, return true when ready

createTwoCardCarousel(pageId, pageToken, video1File, video2File,
                      message, link1, link2, onProgress):
  1. uploadVideo(video1File) → id1; waitForVideoReady(id1, pageToken)
  2. uploadVideo(video2File) → id2; waitForVideoReady(id2, pageToken)
  3. POST https://graph.facebook.com/v18.0/{pageId}/feed:
     message, published:"true", access_token,
     child_attachments: JSON.stringify([
       { media_fbid: id1, name:"Video 1", description:message,
         link: link1 || "https://www.facebook.com/video/"+id1 },
       { media_fbid: id2, name:"Video 2", description:message,
         link: link2 || "https://www.facebook.com/video/"+id2 }
     ]),
     multi_share_end_card: "false",
     multi_share_optimized: "false"
  Return: {postId, url: buildPostUrl(result.id)}

## TOOL UI (index.html):
- Header: "2-Card Video Carousel" + note about larger mobile card layout
- Connect button → initialize() → show userId
- Page selector dropdown
- Two clearly labeled separate file drop zones: "Video 1" and "Video 2"
  Each accepts one video file only (accept="video/*")
  Show filename + size after selection under each zone
- Optional link URL for each card (two separate inputs, below each file zone)
- Caption textarea (applies to both cards)
- Submit button: disabled until connected + both videos selected
- Progress text + <progress> bar (updates as each video uploads)
- Success box with view link
- Error box
- Never alert()

## VALIDATION:
- Each video: must be video/* type, max 1 GB
- Both videos must be selected before submitting

## STYLE:
Facebook-inspired. CSS vars. Mobile responsive.
Two video slots should be visually distinct and clearly labeled.

Build all files completely. No placeholder code.
End with setup + testing instructions.
```
---END PROMPT D---

---

### 🃏 Prompt E — Tool 4 Only (One Card V2 Image Post)

---BEGIN PROMPT E---
```
You are an expert full-stack developer. Build a single Facebook posting tool:
One Card V2 Image Post. Personal use only on my own Facebook Page.

## WHAT THIS TOOL DOES:
Posts a single image to a Facebook Page using the Ad Creative system.
This creates a post with a custom link URL, headline, and description
displayed as a clean card below the image — a format not available in
Facebook's normal Create Post UI.

The tool posts the image EXACTLY as uploaded. It does NOT add any fake album
count or overlay. If the user wants a "1/5 📷" effect or any other overlay,
they edit their image in a photo editor BEFORE uploading here.

## NON-NEGOTIABLE ARCHITECTURE RULES:

RULE 1 — COOKIES:
NEVER: fetch(url, { headers: { "Cookie": "..." } })
ALWAYS: fetch(url, { credentials: "include" })

RULE 2 — EXTENSION PURPOSE:
Chrome Extension ONLY reads c_user cookie → returns userId.
All API calls use credentials:"include" from the website.

RULE 3 — AUTH FLOW:
1. Extension reads c_user → userId
2. Website fetches facebook.com (credentials:"include") → fb_dtsg + lsd
3. Fetches get_token endpoint → user access token
4. User token → /me/accounts → page access tokens
5. User token → /me/adaccounts → all ad accounts (any status works)

RULE 4 — AD ACCOUNTS:
Return ALL ad accounts, no status filtering. No payment method needed.
Any status works: Active (1), Unsettled (3), Pending Review (7), Grace Period (9).
Only Disabled (status 2) does not work. The ad account is a storage container only.
No billing. No ads run. User is never charged.

RULE 5 — NO FAKE ALBUM COUNT:
Do NOT add fake_album_count to any API call. Do NOT add any image overlay.
The tool posts the image as uploaded. This is by design.

## TECH STACK:
Chrome Extension (MV3) + plain HTML + CSS + Vanilla JS only.
No Node.js, no npm, no frameworks, no backend.

## FILE STRUCTURE:
fb-one-card-v2/
├── extension/
│   ├── manifest.json
│   ├── background.js
│   ├── content.js
│   └── icon.png
└── website/
    ├── index.html
    ├── js/
    │   ├── facebook-api.js
    │   ├── extension-bridge.js
    │   └── utils.js
    └── css/
        └── style.css

## MANIFEST.JSON:
permissions: ["cookies","tabs"] only.
host_permissions: *.facebook.com, localhost, 127.0.0.1
externally_connectable: localhost, 127.0.0.1

## BACKGROUND.JS: Validate origin. PING/GET_USER_ID/CHECK_FB_LOGIN. Return true.

## FACEBOOKAPI CLASS:
initialize, fetchCsrfTokens, fetchUserAccessToken, apiFetch, buildPostUrl.

getMyPages(): GET /me/accounts?fields=id,name,access_token with userToken
getAdAccounts(): GET /me/adaccounts?fields=id,name,account_status
  Return ALL accounts — zero status filtering — any status works

generateOneCardV2(adAccountId, pageId, pageToken, imageFile,
                  linkUrl, headline, description, message, onProgress):

  const accountId = adAccountId.startsWith("act_") ? adAccountId : "act_"+adAccountId;

  STEP 1 — Upload image to ad account image library:
  POST https://graph.facebook.com/v18.0/{accountId}/adimages
  Body: FormData with filename=imageFile, access_token=pageToken
  Response: { images: { "filename": { hash: "abc..." } } }
  Extract: imageHash = data.images[Object.keys(data.images)[0]].hash

  STEP 2 — Create ad creative:
  POST https://graph.facebook.com/v18.0/{accountId}/adcreatives
  Body (URLSearchParams):
    name: "OneCard_" + Date.now(),
    access_token: pageToken,
    object_story_spec: JSON.stringify({
      page_id: pageId,
      link_data: {
        link: linkUrl,
        message: message,
        name: headline,
        description: description,
        image_hash: imageHash,
        child_attachments: JSON.stringify([{
          link: linkUrl,
          image_hash: imageHash,
          name: headline,
          description: description
        }]),
        multi_share_end_card: false
        // Do NOT add fake_album_count here or anywhere
      }
    })
  Extract: creativeId = data.id

  STEP 3 — Publish as organic post:
  POST https://graph.facebook.com/v18.0/{pageId}/feed
  Body:
    message: message,
    published: "true",
    creative: JSON.stringify({ creative_id: creativeId }),
    access_token: pageToken
  Return: { postId: data.id, creativeId, url: buildPostUrl(data.id) }

## TOOL UI (index.html):
- Header: "One Card V2 — Image Post"
- Brief explanation: "Post a single image with a custom link, headline & description
  via the Ad Creative system. The image posts exactly as you upload it."
- Tip box: "💡 Want a fake album count look? Edit your image in any photo editor
  (add the 1/5 📷 overlay yourself), then upload the edited image here."
- Connect button → initialize() → show userId
- Page selector dropdown (from getMyPages(), token in dataset.token)
- Ad Account selector dropdown (from getAdAccounts(), show name + status)
- Image file drop zone: accept="image/*", single file
  Show filename + size after selection
- Link URL input (required, https:// required)
- Headline input (required, appears as card title)
- Description input (optional, appears below headline)
- Caption/message textarea (post caption above the card)
- Submit button: disabled until connected + image + link + headline all filled
- Progress text + <progress> bar
- Success box: "✅ Post created!" + view link
- Error box: clear error message
- Never alert()

## VALIDATION:
- Image: must be image/* type, max 30 MB
- Link URL: required, must start with https://
- Headline: required
- Description: optional
- Ad account: must be selected
- Page: must be selected

## STYLE: Facebook-inspired. CSS vars. Primary #1877f2. Mobile responsive.

Build all files completely. No placeholder code.
End with setup instructions including:
- How to load the extension
- How to create a free ad account
- How to link an ad account to a Facebook Page
- Step-by-step test of the tool
```
---END PROMPT E---

---

## 18. 📌 Quick Reference Cheatsheet

### Facebook API Endpoints

| Action | Full Endpoint URL | Method | Auth |
|--------|-----------------|:------:|------|
| Upload video | `https://graph.facebook.com/v18.0/{pageId}/videos` | POST | page token |
| Upload ad image | `https://graph.facebook.com/v18.0/act_{id}/adimages` | POST | page token |
| Create ad creative | `https://graph.facebook.com/v18.0/act_{id}/adcreatives` | POST | page token |
| Create post | `https://graph.facebook.com/v18.0/{pageId}/feed` | POST | page token |
| Get my pages | `https://graph.facebook.com/v18.0/me/accounts` | GET | user token |
| Get ad accounts | `https://graph.facebook.com/v18.0/me/adaccounts` | GET | user token |
| Internal GraphQL | `https://www.facebook.com/api/graphql/` | POST | fb_dtsg + cookies |

### Key Parameters Per Tool

| Tool | Critical Parameters |
|------|-------------------|
| **Video Carousel** | `child_attachments` (2–10 items with `media_fbid`), `multi_share_end_card:"false"`, `multi_share_optimized:"false"` |
| **Swipe Up** | `object_attachment` (video ID), `call_to_action` with `link_format:"VIDEO_MOBILE_SWIPE_UP"` |
| **2-Card Carousel** | Exactly 2 items in `child_attachments`, same flags as Carousel |
| **One Card V2** | `image_hash` from adimages, `child_attachments` in link_data, `creative_id` in /feed call |

### Ad Account Status Codes (Tool 4)

| Status Code | Status Name | Works? |
|:-----------:|------------|:------:|
| 1 | Active | ✅ Yes |
| 2 | Disabled | ❌ No |
| 3 | Unsettled | ✅ Yes |
| 7 | Pending Review | ✅ Yes |
| 9 | In Grace Period | ✅ Yes |
| 101 | Temporarily Unavailable | ⚠️ Maybe |

### Common Facebook Error Codes

| Code | Meaning | Fix |
|:----:|---------|-----|
| `100` | Invalid parameter | Check request body structure |
| `190` | Access token expired | Re-initialize (reconnect account) |
| `200` | Permission denied | Check page/account permissions |
| `368` | Policy block | Stop 24h, reduce frequency |
| `613` | Call rate limit reached | Wait 1 hour |
| `2018` | API call limit reached | Wait 1 hour |
| `2500` | Query limit exceeded | Slow down, add delays |

### CTA Types — Tool 2 (Swipe Up)

```
LEARN_MORE  •  SHOP_NOW  •  SIGN_UP   •  WATCH_MORE  •  BOOK_NOW
CALL_NOW    •  DOWNLOAD  •  GET_OFFER •  CONTACT_US  •  GET_DIRECTIONS
```

### Video Requirements (Tools 1, 2, 3)

| Spec | Requirement |
|------|------------|
| Format | MP4 (strongly recommended) |
| Video codec | H.264 |
| Audio codec | AAC |
| Max file size | 1 GB |
| Max duration | 240 minutes |
| Recommended resolution | 1080p (1920×1080) |
| Recommended aspect ratio | 16:9 (landscape) |
| Minimum for quality | 720p |

### Image Requirements (Tool 4)

| Spec | Requirement |
|------|------------|
| Format | JPEG or PNG |
| Max file size | 30 MB |
| Minimum dimensions | 600×314 pixels |
| Recommended dimensions | 1200×628 pixels |
| Recommended aspect ratio | 1.91:1 |

---

## 19. 📝 Version History & Corrections

### v3.0 — Current (March 2026)

- **Single file** — README and Guide merged into one complete document
- **Tool 4 redesigned** — `fake_album_count` completely removed from the API call. The tool posts a clean image with a custom link, headline, and description via the Ad Creative system. If the user wants any overlay on the image (fake album count, text, etc.), they edit their photo themselves before uploading. This keeps the tool simpler, more reliable, and gives full creative control to the user.
- **5 AI prompts added** — Prompt A (all 4 tools) + Prompt B (Tool 1 only) + Prompt C (Tool 2 only) + Prompt D (Tool 3 only) + Prompt E (Tool 4 only)
- All content from both the v2.0 Guide and v2.0 README preserved and merged

### v2.0 — Corrections from original v1.0

All 12 mistakes found in v1.0 were corrected:

| # | Location | v1.0 Error | v2.0+ Correction |
|:-:|----------|-----------|-----------------|
| 1 | `rawFetch()` | Set `"Cookie": cookieString` in headers — **silently ignored by browser** | All fetches use `credentials: "include"` |
| 2 | `getAdAccounts()` | Filtered with `account_status === 1` only | Return ALL accounts — no status filter |
| 3 | Tool 4 prerequisites | "Ad Account must be Active status" | Any status works — no payment needed |
| 4 | `manifest.json` | Included `declarativeNetRequest` permission | Removed — never used |
| 5 | `manifest.json` | Included `storage` permission | Removed — not used |
| 6 | `background.js` | Used `chrome.scripting.executeScript` — `scripting` not in permissions | Removed — would crash |
| 7 | Requirements | Listed "Node.js v18+" as required | Not required — plain HTML/JS |
| 8 | `manifest.json` | Used `"type":"module"` for background | Removed — causes silent failures in MV3 |
| 9 | Tool 1 | Said "minimum 3 videos" | Corrected to 2 — API minimum is 2 |
| 10 | All tools | No `waitForVideoReady()` before posting | Added — carousels fail without it |
| 11 | Cheatsheet | Listed `/{pageId}/photos` for Tool 4 image upload | Corrected to `/act_{id}/adimages` |
| 12 | All tools | Missing `credentials: "include"` on Graph API calls | Added to all fetch calls |

---

<div align="center">

---

### 🧠 The Golden Rule

> If a `doc_id` stops working — open Chrome DevTools → Network tab → perform the action manually on Facebook → find the POST request → copy the new `doc_id`.
>
> **This is the only ongoing maintenance this entire system ever requires.**

---

**Built with reverse-engineering, curiosity, and zero tolerance for watermarks.**

[![Vanilla JS](https://img.shields.io/badge/Made%20with-Vanilla%20JS-F7DF1E?style=flat-square&logo=javascript)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Chrome MV3](https://img.shields.io/badge/Chrome-Extension%20MV3-4285F4?style=flat-square&logo=googlechrome)](https://developer.chrome.com/docs/extensions/mv3/)
[![Facebook API](https://img.shields.io/badge/Facebook-Internal%20API-1877F2?style=flat-square&logo=facebook)](https://developers.facebook.com/)

*Version 3.0 — March 2026 — Single file. All information. All prompts.*

</div>
