# 🛠️ Facebook Advanced Tools — Complete Build Guide from Scratch
### Build Your Own: Video Carousel Post · Swipe Up Video · 2-Card Carousel · Generate One Card V2

---

> **Document Purpose:** This is a complete, self-contained guide to understanding, designing, and building four advanced Facebook posting tools that bypass Facebook's limited UI. Every concept, code snippet, architecture decision, API call, troubleshooting step, and AI prompt is documented here. Nothing is left out.

---

## 📋 Table of Contents

1. [Project Overview & Goal](#1-project-overview--goal)
2. [Why These Tools Exist (The Core Insight)](#2-why-these-tools-exist-the-core-insight)
3. [How Facebook's Internal System Works](#3-how-facebooks-internal-system-works)
4. [Tech Stack Decision](#4-tech-stack-decision)
5. [Complete Project Architecture](#5-complete-project-architecture)
6. [Chrome Extension — Deep Dive](#6-chrome-extension--deep-dive)
7. [Getting Facebook Access Tokens & Cookies](#7-getting-facebook-access-tokens--cookies)
8. [Tool 1: Facebook Video Carousel Post](#8-tool-1-facebook-video-carousel-post)
9. [Tool 2: Swipe Up Video Creator](#9-tool-2-swipe-up-video-creator)
10. [Tool 3: Facebook 2-Card Video Carousel Post](#10-tool-3-facebook-2-card-video-carousel-post)
11. [Tool 4: Generate One Card V2](#11-tool-4-generate-one-card-v2)
12. [Frontend Website — Complete UI Guide](#12-frontend-website--complete-ui-guide)
13. [Backend Server (Optional but Recommended)](#13-backend-server-optional-but-recommended)
14. [Security & Safety Considerations](#14-security--safety-considerations)
15. [Rate Limiting & Anti-Ban Strategy](#15-rate-limiting--anti-ban-strategy)
16. [Complete Troubleshooting Guide](#16-complete-troubleshooting-guide)
17. [Deployment Guide](#17-deployment-guide)
18. [Complete AI Prompt to Build from Scratch](#18-complete-ai-prompt-to-build-from-scratch)
19. [Quick Reference Cheatsheet](#19-quick-reference-cheatsheet)

---

## 1. Project Overview & Goal

### What We Are Building

A **personal web-based toolset** consisting of:

| Tool | What It Does | Why FB UI Doesn't Have It |
|------|-------------|--------------------------|
| Video Carousel Post | Post 3–10 videos as a swipeable carousel | FB restricts carousel to link-preview format only in the UI |
| Swipe Up Video Creator | Creates mobile-only swipe-up CTA videos | Only available in Stories natively, not in Feed posts via UI |
| 2-Card Video Carousel | Exactly 2 videos in carousel format | 2-card renders uniquely on mobile — FB UI minimum is 3 cards |
| Generate One Card V2 | Single image that mimics album clickbait with fake count | Uses Ad Creative system internally — not exposed in regular post UI |

### The Problem Being Solved

Tools like FewFeed offer these features but:
- Add **watermarks** to output unless you pay
- You are **dependent** on their servers staying up
- You have **no control** over what they do with your Facebook session data
- **Privacy risk**: Your FB cookie = full access to your account

### The Solution

Build identical tools yourself. You own the code. No watermarks. No subscriptions. Full privacy.

---

## 2. Why These Tools Exist (The Core Insight)

### Facebook Has Two Layers

```
┌─────────────────────────────────────────────────┐
│           LAYER 1: Facebook's Public UI         │
│   (what you see at facebook.com)                │
│   • Intentionally LIMITED                        │
│   • Designed for average users                  │
│   • Many features HIDDEN or LOCKED              │
└─────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────┐
│        LAYER 2: Facebook's Internal API         │
│   (what the Facebook app itself uses)           │
│   • FULL feature set                            │
│   • GraphQL-based                               │
│   • Accessible with your session cookie         │
│   • Powers ALL Facebook features                │
└─────────────────────────────────────────────────┘
```

### The Key Realization

When you are logged into Facebook, your browser holds a **session cookie** (`c_user`, `xs`, `datr`). These cookies authenticate EVERY request your browser makes to Facebook — including to the internal API.

This means:

> **If you can make a request to Facebook's internal API with your session cookie attached, Facebook cannot tell the difference between you clicking a button manually vs. your tool doing it programmatically.**

FewFeed and similar tools discovered Facebook's internal API calls by:
1. Opening Facebook in Chrome DevTools
2. Filtering Network tab by `graphql`
3. Performing the desired action manually
4. Capturing the exact request (URL, headers, body, `doc_id`)
5. Automating that captured request

This is **exactly** what we will do.

---

## 3. How Facebook's Internal System Works

### 3.1 The Two API Systems Facebook Uses

#### System A: Public Graph API
- URL: `https://graph.facebook.com/v18.0/`
- Requires: Developer App + App Token + User Permissions
- Rate limits: Strict
- Features: Limited (what Meta wants third-party developers to access)
- Good for: Page posting, basic content management

#### System B: Internal GraphQL API (What FewFeed uses)
- URL: `https://www.facebook.com/api/graphql/`
- Requires: Your session cookie only (no developer app needed)
- Rate limits: Same as normal browsing
- Features: EVERYTHING Facebook's app can do
- Identified by: `doc_id` parameter (Facebook's internal operation IDs)

### 3.2 What is a `doc_id`?

Facebook pre-compiles all of its UI operations into numbered "documents". When you click something on Facebook, the browser sends a request like:

```
POST https://www.facebook.com/api/graphql/
Content-Type: application/x-www-form-urlencoded

doc_id=7382689905134458
&variables={"input":{"...":"..."}}
&server_timestamps=true
```

The `doc_id` is the **operation identifier**. It tells Facebook's server which operation to run. These IDs are found by inspecting the Network tab.

### 3.3 How to Find Any `doc_id`

This is how every feature on FewFeed was discovered:

```
Step 1: Open Chrome → Go to facebook.com → Log in
Step 2: Press F12 → Click "Network" tab
Step 3: In the filter box, type "graphql"
Step 4: Now perform the action on Facebook manually
         (e.g., try to create a carousel post)
Step 5: Look at the POST requests that appear in Network tab
Step 6: Click on one → look at "Payload" tab
Step 7: Find "doc_id" value → that's your operation ID
Step 8: Also copy the full "variables" JSON — this is your template
```

### 3.4 Session Cookie Structure

When you're logged into Facebook, these cookies exist:

| Cookie Name | What It Is | Importance |
|------------|-----------|-----------|
| `c_user` | Your Facebook User ID | HIGH — identifies who you are |
| `xs` | Session token | CRITICAL — authenticates the session |
| `datr` | Browser identifier | HIGH — anti-fraud |
| `fr` | Ad tracking token | MEDIUM |
| `sb` | Security token | MEDIUM |

**The combination of `c_user` + `xs` is effectively your password to the API.**

### 3.5 The `fb_dtsg` Token

Almost every POST request to Facebook also requires a `fb_dtsg` CSRF token. This changes every session. You must extract it.

```javascript
// Extract fb_dtsg from the page
// It's embedded in the HTML of any facebook.com page
async function getFbDtsg(cookie) {
  const response = await fetch("https://www.facebook.com/", {
    headers: { "Cookie": cookie }
  });
  const html = await response.text();
  
  // Method 1: JSON config
  const match1 = html.match(/"DTSGInitData"[^}]*"token":"([^"]+)"/);
  if (match1) return match1[1];
  
  // Method 2: Input field
  const match2 = html.match(/name="fb_dtsg" value="([^"]+)"/);
  if (match2) return match2[1];
  
  // Method 3: From __eqmc data
  const match3 = html.match(/"EAAb"[^"]*"([^"]{20,})"/);
  if (match3) return match3[1];
  
  return null;
}
```

---

## 4. Tech Stack Decision

### Recommended Stack (Minimal & Effective)

```
┌─────────────────────────────────────────────────────────┐
│                    YOUR TOOL SYSTEM                     │
│                                                         │
│  Chrome Extension (Manifest V3)                         │
│  ├── Reads FB cookies from browser                      │
│  ├── Passes cookies to your website                     │
│  └── Intercepts/modifies headers if needed              │
│                                                         │
│  Frontend Website                                       │
│  ├── Framework: Next.js (or plain HTML + vanilla JS)    │
│  ├── Styling: Tailwind CSS                              │
│  ├── Hosted: Vercel (free) or localhost                 │
│  └── Communicates with Extension via postMessage        │
│                                                         │
│  Backend (Optional)                                     │
│  ├── Node.js + Express                                  │
│  ├── Only needed for: scheduling, history, multi-acct  │
│  └── Can skip entirely for personal use                 │
└─────────────────────────────────────────────────────────┘
```

### Why These Choices

| Choice | Why |
|--------|-----|
| **Chrome Extension** | Only way to access browser cookies from a website. Also can modify request headers. |
| **Next.js** | Fast setup, built-in routing, easy to deploy on Vercel for free. Can use plain HTML if preferred. |
| **No Backend (for personal use)** | All API calls can go directly from browser → Facebook. No server needed. Simpler. More private. |
| **Plain JS (no TypeScript)** | Easier to debug and modify quickly. |

### Minimum Requirements

- A computer with Chrome/Chromium browser
- Node.js v18+ installed
- A Facebook account (logged in)
- For Tool 4 (One Card V2): An active Facebook Ad Account (any status — even with $0 balance)

---

## 5. Complete Project Architecture

### 5.1 Folder Structure

```
fb-tools/
│
├── extension/                    ← Chrome Extension
│   ├── manifest.json             ← Extension configuration
│   ├── background.js             ← Service worker (reads cookies, handles messages)
│   ├── content.js                ← Injected into website pages
│   └── icon.png                  ← Extension icon (any 128x128 image)
│
├── website/                      ← Your tool website
│   ├── index.html                ← Home page (tool selector)
│   ├── tools/
│   │   ├── video-carousel.html   ← Tool 1
│   │   ├── swipe-up.html         ← Tool 2
│   │   ├── two-card.html         ← Tool 3
│   │   └── one-card-v2.html      ← Tool 4
│   ├── js/
│   │   ├── facebook-api.js       ← All Facebook API functions
│   │   ├── extension-bridge.js   ← Talks to the extension
│   │   └── utils.js              ← Helper functions
│   └── css/
│       └── style.css             ← Basic styling
│
└── README.md                     ← Quick start guide
```

### 5.2 Data Flow Diagram

```
USER ACTION (click button on website)
         │
         ▼
  extension-bridge.js
  (sends message to extension)
         │
         ▼
  background.js (extension)
  ├── Reads fb cookie from Chrome
  ├── Extracts c_user, xs, datr
  └── Returns cookie string to website
         │
         ▼
  facebook-api.js (on website)
  ├── Calls getFbDtsg() → gets CSRF token
  ├── Builds request body (with doc_id + variables)
  ├── POST → https://www.facebook.com/api/graphql/
  └── Returns result
         │
         ▼
  UI UPDATES
  (shows success, post link, error message)
```

### 5.3 Extension ↔ Website Communication

```javascript
// WEBSITE sends message TO extension:
chrome.runtime.sendMessage(EXTENSION_ID, {
  type: "GET_COOKIE",
  domain: "facebook.com"
}, function(response) {
  const cookie = response.cookie;
});

// EXTENSION receives and responds:
chrome.runtime.onMessageExternal.addListener(
  function(message, sender, sendResponse) {
    if (message.type === "GET_COOKIE") {
      chrome.cookies.getAll({ domain: message.domain }, function(cookies) {
        const cookieString = cookies
          .map(c => `${c.name}=${c.value}`)
          .join("; ");
        sendResponse({ cookie: cookieString });
      });
    }
    return true; // Keep channel open for async response
  }
);
```

---

## 6. Chrome Extension — Deep Dive

### 6.1 manifest.json (Complete)

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
      "all_frames": false,
      "run_at": "document_start"
    }
  ],

  "permissions": [
    "cookies",
    "tabs",
    "storage",
    "declarativeNetRequest"
  ],

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
  },

  "action": {
    "default_title": "FB Advanced Tools"
  }
}
```

> **Important:** Replace `your-website.vercel.app` with your actual domain. For local development, `localhost` and `127.0.0.1` work fine.

### 6.2 background.js (Complete Service Worker)

```javascript
// background.js — Extension Service Worker
// This is the brain of the extension

// ──────────────────────────────────────────
// Listen for messages from the website
// ──────────────────────────────────────────
chrome.runtime.onMessageExternal.addListener(
  async function(message, sender, sendResponse) {
    
    // Verify the sender is our trusted website
    const allowedOrigins = [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "https://your-website.vercel.app"
    ];
    
    if (!allowedOrigins.includes(sender.origin)) {
      sendResponse({ error: "Unauthorized origin" });
      return;
    }

    switch (message.type) {
      
      // ── Get ALL Facebook cookies as a cookie string ──
      case "GET_FB_COOKIE":
        await handleGetFbCookie(sendResponse);
        break;

      // ── Get specific cookie value ──
      case "GET_SPECIFIC_COOKIE":
        await handleGetSpecificCookie(message.name, sendResponse);
        break;

      // ── Get current Facebook User ID ──
      case "GET_USER_ID":
        await handleGetUserId(sendResponse);
        break;

      // ── Get access token from Facebook ──
      case "GET_ACCESS_TOKEN":
        await handleGetAccessToken(sendResponse);
        break;

      // ── Ping (check if extension is installed) ──
      case "PING":
        sendResponse({ status: "ok", version: "1.0.0" });
        break;

      default:
        sendResponse({ error: "Unknown message type" });
    }

    return true; // IMPORTANT: keeps message channel open for async
  }
);

// ──────────────────────────────────────────
// Handler Functions
// ──────────────────────────────────────────

async function handleGetFbCookie(sendResponse) {
  try {
    const cookies = await chrome.cookies.getAll({ domain: ".facebook.com" });
    
    if (!cookies || cookies.length === 0) {
      sendResponse({ error: "No Facebook cookies found. Are you logged in?" });
      return;
    }

    // Build cookie string (format: "name=value; name2=value2")
    const cookieString = cookies
      .map(c => `${c.name}=${c.value}`)
      .join("; ");
    
    // Also extract key cookies separately for convenience
    const keyMap = {};
    const importantCookies = ["c_user", "xs", "datr", "fr", "sb", "wd"];
    importantCookies.forEach(name => {
      const found = cookies.find(c => c.name === name);
      if (found) keyMap[name] = found.value;
    });

    sendResponse({
      cookieString,
      userId: keyMap.c_user || null,
      keys: keyMap
    });
  } catch (err) {
    sendResponse({ error: err.message });
  }
}

async function handleGetSpecificCookie(name, sendResponse) {
  try {
    const cookie = await chrome.cookies.get({
      url: "https://www.facebook.com",
      name: name
    });
    sendResponse({ value: cookie ? cookie.value : null });
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

async function handleGetAccessToken(sendResponse) {
  try {
    // Fetch a Facebook page and extract the access token from the JS bundle
    const tabs = await chrome.tabs.query({ 
      url: "*://*.facebook.com/*", 
      active: false 
    });
    
    if (tabs.length > 0) {
      // Inject script into an existing Facebook tab to get the token
      const results = await chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        func: extractAccessTokenFromPage,
      });
      
      if (results && results[0] && results[0].result) {
        sendResponse({ token: results[0].result });
        return;
      }
    }
    
    // Fallback: fetch the token endpoint directly
    const cookies = await chrome.cookies.getAll({ domain: ".facebook.com" });
    const cookieStr = cookies.map(c => `${c.name}=${c.value}`).join("; ");
    
    sendResponse({ 
      cookieString: cookieStr,
      note: "Use cookieString for API calls directly" 
    });
  } catch (err) {
    sendResponse({ error: err.message });
  }
}

// This function runs inside the Facebook tab context
function extractAccessTokenFromPage() {
  try {
    // Try to get from global require
    if (typeof require !== "undefined") {
      const config = require("MEnvironment");
      if (config && config.accessToken) return config.accessToken;
    }
    
    // Try from window
    if (window.__accessToken) return window.__accessToken;
    
    // Try from script tags
    const scripts = document.querySelectorAll("script");
    for (const script of scripts) {
      const match = script.textContent.match(/"accessToken":"([^"]+)"/);
      if (match) return match[1];
    }
    
    return null;
  } catch (e) {
    return null;
  }
}
```

### 6.3 content.js (Injected into your website)

```javascript
// content.js — runs on YOUR website pages
// Acts as a relay between the page and the background service worker

// Tell the page that the extension is available
window.postMessage({ type: "FB_TOOLS_EXTENSION_READY" }, "*");

// Listen for messages from the webpage
window.addEventListener("message", function(event) {
  // Only accept messages from the same page
  if (event.source !== window) return;
  
  const message = event.data;
  if (!message || !message.type || !message.type.startsWith("FB_TOOLS_")) return;

  // Forward to background service worker
  chrome.runtime.sendMessage(message, function(response) {
    // Send response back to the page
    window.postMessage({
      type: message.type + "_RESPONSE",
      requestId: message.requestId,
      ...response
    }, "*");
  });
});
```

### 6.4 extension-bridge.js (On your website)

```javascript
// extension-bridge.js — loaded on your website
// This is how your website talks to the extension

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
        chrome.runtime.sendMessage(
          EXTENSION_ID, 
          { type: "PING" },
          (response) => {
            if (chrome.runtime.lastError) {
              this.isAvailable = false;
              console.warn("FB Tools Extension not found:", chrome.runtime.lastError.message);
            } else {
              this.isAvailable = true;
            }
            resolve(this.isAvailable);
          }
        );
      } catch (e) {
        this.isAvailable = false;
        resolve(false);
      }
    });
  }

  // Get Facebook cookies
  async getFbCookies() {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        EXTENSION_ID,
        { type: "GET_FB_COOKIE" },
        (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          if (response.error) {
            reject(new Error(response.error));
            return;
          }
          resolve(response);
        }
      );
    });
  }

  // Get user ID only
  async getUserId() {
    const data = await this.getFbCookies();
    return data.userId;
  }

  // Get access token
  async getAccessToken() {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        EXTENSION_ID,
        { type: "GET_ACCESS_TOKEN" },
        (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          resolve(response);
        }
      );
    });
  }
}

// Export as global for use in tool pages
window.FBExtension = new FBToolsExtension();
```

### 6.5 How to Install the Extension (Development Mode)

```
Step 1: Open Chrome
Step 2: Go to: chrome://extensions
Step 3: Enable "Developer mode" toggle (top right)
Step 4: Click "Load unpacked"
Step 5: Select your /extension folder
Step 6: Note the Extension ID shown (looks like: abcdefghijklmnopqrstuvwxyz123456)
Step 7: Copy that ID into extension-bridge.js where it says YOUR_EXTENSION_ID_HERE
```

---

## 7. Getting Facebook Access Tokens & Cookies

### 7.1 The Core Authentication Function

This is used by every tool. Put this in `facebook-api.js`:

```javascript
// facebook-api.js — Core authentication and request functions

class FacebookAPI {
  
  constructor() {
    this.cookieString = null;
    this.userId = null;
    this.fbDtsg = null;
    this.lsdToken = null;
    this.initialized = false;
  }

  // ── Step 1: Initialize with cookies from extension ──
  async initialize() {
    try {
      const cookieData = await window.FBExtension.getFbCookies();
      this.cookieString = cookieData.cookieString;
      this.userId = cookieData.userId;
      
      if (!this.cookieString || !this.userId) {
        throw new Error("Could not get Facebook cookies. Please make sure you are logged into Facebook.");
      }

      // Step 2: Get the CSRF token (required for all POST requests)
      await this.fetchCsrfTokens();
      
      this.initialized = true;
      return true;
    } catch (err) {
      throw new Error("Initialization failed: " + err.message);
    }
  }

  // ── Step 2: Get fb_dtsg (CSRF token) and lsd token ──
  async fetchCsrfTokens() {
    const response = await this.rawFetch("https://www.facebook.com/", "GET");
    const html = await response.text();
    
    // Extract fb_dtsg
    const dtsgMatch = 
      html.match(/"DTSGInitData"[^}]*"token":"([^"]+)"/) ||
      html.match(/name="fb_dtsg"\s+value="([^"]+)"/) ||
      html.match(/"fb_dtsg","([^"]{10,50})"/) ||
      html.match(/"token":"([A-Za-z0-9_\-:]{20,80})"/);
    
    if (!dtsgMatch) {
      throw new Error("Could not extract fb_dtsg token. Try logging out and back into Facebook.");
    }
    this.fbDtsg = dtsgMatch[1];

    // Extract lsd token (needed for some endpoints)
    const lsdMatch = html.match(/"LSD"[^}]*"token":"([^"]+)"/) ||
                     html.match(/\["LSD",\[\],{"token":"([^"]+)"/);
    if (lsdMatch) this.lsdToken = lsdMatch[1];
  }

  // ── Core fetch with cookies attached ──
  async rawFetch(url, method = "GET", body = null, extraHeaders = {}) {
    const headers = {
      "Cookie": this.cookieString,
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Referer": "https://www.facebook.com/",
      "Origin": "https://www.facebook.com",
      "Accept-Language": "en-US,en;q=0.9",
      ...extraHeaders
    };

    const options = { method, headers, credentials: "include" };
    if (body) {
      options.body = body;
    }

    const response = await fetch(url, options);
    if (!response.ok && response.status !== 302) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response;
  }

  // ── GraphQL request (the main API call method) ──
  async graphql(docId, variables, friendlyName = "") {
    if (!this.initialized) await this.initialize();

    const formData = new URLSearchParams();
    formData.append("av", this.userId);
    formData.append("__user", this.userId);
    formData.append("__a", "1");
    formData.append("__req", this.generateReqId());
    formData.append("__hs", this.generateHs());
    formData.append("dpr", "1");
    formData.append("__ccg", "EXCELLENT");
    formData.append("fb_dtsg", this.fbDtsg);
    formData.append("fb_api_caller_class", "RelayModern");
    formData.append("fb_api_req_friendly_name", friendlyName);
    formData.append("variables", JSON.stringify(variables));
    formData.append("server_timestamps", "true");
    formData.append("doc_id", docId);
    
    if (this.lsdToken) {
      formData.append("lsd", this.lsdToken);
    }

    const response = await this.rawFetch(
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
    
    // Facebook sometimes returns multiple JSON objects, we want the first
    const firstLine = text.split("\n")[0];
    try {
      return JSON.parse(firstLine);
    } catch {
      return JSON.parse(text);
    }
  }

  // ── Upload a video to Facebook ──
  async uploadVideo(file, targetId, onProgress = null) {
    if (!this.initialized) await this.initialize();

    // Step 1: Initialize upload
    const initBody = new FormData();
    initBody.append("upload_phase", "start");
    initBody.append("file_size", file.size);

    const initResponse = await this.rawFetch(
      `https://graph.facebook.com/v18.0/${targetId}/videos`,
      "POST",
      initBody,
      { "Content-Type": undefined } // Let browser set multipart boundary
    );
    const initData = await initResponse.json();

    if (initData.error) {
      throw new Error("Upload init failed: " + initData.error.message);
    }

    const { upload_session_id, video_id, start_offset, end_offset } = initData;
    let currentStart = parseInt(start_offset);
    let currentEnd = parseInt(end_offset);

    // Step 2: Upload in chunks
    while (currentStart < file.size) {
      const chunk = file.slice(currentStart, currentEnd);
      const chunkBody = new FormData();
      chunkBody.append("upload_phase", "transfer");
      chunkBody.append("upload_session_id", upload_session_id);
      chunkBody.append("start_offset", currentStart);
      chunkBody.append("video_file_chunk", chunk, file.name);

      const chunkResponse = await this.rawFetch(
        `https://graph.facebook.com/v18.0/${targetId}/videos`,
        "POST",
        chunkBody
      );
      const chunkData = await chunkResponse.json();

      if (chunkData.error) {
        throw new Error("Upload chunk failed: " + chunkData.error.message);
      }

      currentStart = parseInt(chunkData.start_offset);
      currentEnd = parseInt(chunkData.end_offset);

      if (onProgress) {
        onProgress(Math.round((currentStart / file.size) * 100));
      }
    }

    // Step 3: Finish upload
    const finishBody = new FormData();
    finishBody.append("upload_phase", "finish");
    finishBody.append("upload_session_id", upload_session_id);

    const finishResponse = await this.rawFetch(
      `https://graph.facebook.com/v18.0/${targetId}/videos`,
      "POST",
      finishBody
    );
    const finishData = await finishResponse.json();

    if (!finishData.success) {
      throw new Error("Upload finish failed");
    }

    return video_id;
  }

  // ── Upload an image to Facebook ──
  async uploadPhoto(file, targetId) {
    if (!this.initialized) await this.initialize();

    const formData = new FormData();
    formData.append("source", file, file.name);
    formData.append("published", "false"); // Upload unpublished first

    const response = await this.rawFetch(
      `https://graph.facebook.com/v18.0/${targetId}/photos`,
      "POST",
      formData
    );
    const data = await response.json();

    if (data.error) {
      throw new Error("Photo upload failed: " + data.error.message);
    }

    return data.id; // Returns photo ID
  }

  // ── Get user's pages ──
  async getMyPages() {
    if (!this.initialized) await this.initialize();

    const response = await this.rawFetch(
      `https://graph.facebook.com/v18.0/me/accounts?fields=id,name,access_token,category&limit=100`,
      "GET"
    );
    const data = await response.json();

    if (data.error) {
      throw new Error("Could not fetch pages: " + data.error.message);
    }

    return data.data || [];
  }

  // ── Get user's ad accounts ──
  async getAdAccounts() {
    if (!this.initialized) await this.initialize();

    const response = await this.rawFetch(
      `https://graph.facebook.com/v18.0/me/adaccounts?fields=id,name,account_status&limit=50`,
      "GET"
    );
    const data = await response.json();

    if (data.error) {
      throw new Error("Could not fetch ad accounts: " + data.error.message);
    }

    return data.data || [];
  }

  // Helper: generate a random request ID
  generateReqId() {
    return Math.floor(Math.random() * 99) + 1;
  }

  // Helper: generate a fake hs value (usually from page source, but a fake works)
  generateHs() {
    return "19857:" + Date.now();
  }
}

// Global instance
window.FB_API = new FacebookAPI();
```

---

## 8. Tool 1: Facebook Video Carousel Post

### 8.1 What It Does

Creates a post with **multiple videos (3–10)** arranged in a swipeable carousel format. Each card shows a video thumbnail. Users swipe to see all videos.

### 8.2 Why This Isn't in Facebook's UI

Facebook's regular "Create Post" UI restricts carousels to **link previews only** (website links with thumbnails). Video carousels are reserved for Facebook Ads. The internal API supports it for regular posts.

### 8.3 How It Works Step by Step

```
1. User selects 3-10 video files
2. Each video is uploaded to Facebook → gets a video_id
3. A carousel post is created using the video_ids
4. The post appears in feed as a swipeable video carousel
```

### 8.4 The API Call

```javascript
// In facebook-api.js — add this to the FacebookAPI class

async createVideoCarousel(pageId, pageAccessToken, videoFiles, message, onProgress) {
  
  // Step 1: Upload all videos first
  const videoIds = [];
  for (let i = 0; i < videoFiles.length; i++) {
    onProgress && onProgress(`Uploading video ${i + 1} of ${videoFiles.length}...`);
    
    const videoId = await this.uploadVideoWithToken(
      videoFiles[i], 
      pageId, 
      pageAccessToken,
      (percent) => onProgress && onProgress(`Video ${i+1}: ${percent}% uploaded`)
    );
    videoIds.push(videoId);
  }

  onProgress && onProgress("Creating carousel post...");

  // Step 2: Build child_attachments (one per video)
  const child_attachments = videoIds.map((videoId, index) => ({
    media_fbid: videoId,
    name: `Video ${index + 1}`,
    description: message,
    link: `https://www.facebook.com/video/${videoId}`
  }));

  // Step 3: Create the carousel post
  const postBody = new URLSearchParams({
    message: message,
    child_attachments: JSON.stringify(child_attachments),
    multi_share_end_card: "false",
    multi_share_optimized: "false",
    published: "true",
    access_token: pageAccessToken
  });

  const response = await fetch(
    `https://graph.facebook.com/v18.0/${pageId}/feed`,
    {
      method: "POST",
      body: postBody
    }
  );
  
  const result = await response.json();
  
  if (result.error) {
    throw new Error("Carousel post failed: " + result.error.message);
  }

  return {
    postId: result.id,
    url: `https://www.facebook.com/${result.id.replace("_", "/posts/")}`
  };
}

// Upload video using page access token (different from cookie method)
async uploadVideoWithToken(file, pageId, accessToken, onProgress) {
  // Initiate
  const initParams = new URLSearchParams({
    upload_phase: "start",
    file_size: file.size,
    access_token: accessToken
  });

  const initResponse = await fetch(
    `https://graph.facebook.com/v18.0/${pageId}/videos`,
    { method: "POST", body: initParams }
  );
  const init = await initResponse.json();

  if (init.error) throw new Error(init.error.message);

  const { upload_session_id, video_id } = init;
  let { start_offset, end_offset } = init;

  // Upload chunks
  while (parseInt(start_offset) < file.size) {
    const chunk = file.slice(parseInt(start_offset), parseInt(end_offset));
    const chunkForm = new FormData();
    chunkForm.append("upload_phase", "transfer");
    chunkForm.append("upload_session_id", upload_session_id);
    chunkForm.append("start_offset", start_offset);
    chunkForm.append("video_file_chunk", chunk, file.name);
    chunkForm.append("access_token", accessToken);

    const chunkResponse = await fetch(
      `https://graph.facebook.com/v18.0/${pageId}/videos`,
      { method: "POST", body: chunkForm }
    );
    const chunkData = await chunkResponse.json();

    if (chunkData.error) throw new Error(chunkData.error.message);

    start_offset = chunkData.start_offset;
    end_offset = chunkData.end_offset;
    onProgress && onProgress(Math.round((parseInt(start_offset) / file.size) * 100));
  }

  // Finish
  const finishParams = new URLSearchParams({
    upload_phase: "finish",
    upload_session_id,
    access_token: accessToken
  });

  await fetch(
    `https://graph.facebook.com/v18.0/${pageId}/videos`,
    { method: "POST", body: finishParams }
  );

  return video_id;
}
```

### 8.5 The UI (video-carousel.html)

```html
<!DOCTYPE html>
<html>
<head>
  <title>Video Carousel Post</title>
  <script src="../js/extension-bridge.js"></script>
  <script src="../js/facebook-api.js"></script>
</head>
<body>
  <h1>📹 Video Carousel Post</h1>
  
  <div id="setup-section">
    <button onclick="initTool()">🔑 Connect Facebook Account</button>
    <span id="status">Not connected</span>
  </div>

  <div id="tool-section" style="display:none">
    <!-- Page selector -->
    <label>Select Page:</label>
    <select id="page-select"></select>

    <!-- Video upload -->
    <label>Select Videos (3-10 videos):</label>
    <input type="file" id="video-files" multiple accept="video/*">
    <small>Each video: Max 1GB, formats: MP4, MOV, AVI</small>

    <!-- Post message -->
    <label>Post Caption:</label>
    <textarea id="post-message" placeholder="Write your post caption..."></textarea>

    <!-- Submit -->
    <button onclick="createCarousel()">🚀 Create Carousel Post</button>
  </div>

  <div id="progress" style="display:none">
    <div id="progress-text">Processing...</div>
    <progress id="progress-bar" value="0" max="100"></progress>
  </div>

  <div id="result" style="display:none">
    <h3>✅ Success!</h3>
    <a id="post-link" href="#" target="_blank">View Post</a>
  </div>

  <script>
    let pages = [];

    async function initTool() {
      try {
        document.getElementById("status").textContent = "Connecting...";
        await window.FB_API.initialize();
        pages = await window.FB_API.getMyPages();
        
        const select = document.getElementById("page-select");
        pages.forEach(page => {
          const option = document.createElement("option");
          option.value = page.id;
          option.textContent = page.name;
          option.dataset.token = page.access_token;
          select.appendChild(option);
        });
        
        document.getElementById("status").textContent = "✅ Connected as " + window.FB_API.userId;
        document.getElementById("setup-section").style.display = "none";
        document.getElementById("tool-section").style.display = "block";
      } catch (err) {
        document.getElementById("status").textContent = "❌ Error: " + err.message;
      }
    }

    async function createCarousel() {
      const select = document.getElementById("page-select");
      const pageId = select.value;
      const pageToken = select.options[select.selectedIndex].dataset.token;
      const files = document.getElementById("video-files").files;
      const message = document.getElementById("post-message").value;

      if (files.length < 2) {
        alert("Please select at least 2 videos");
        return;
      }
      if (files.length > 10) {
        alert("Maximum 10 videos allowed");
        return;
      }

      document.getElementById("progress").style.display = "block";

      try {
        const result = await window.FB_API.createVideoCarousel(
          pageId, 
          pageToken, 
          Array.from(files), 
          message,
          (msg) => {
            document.getElementById("progress-text").textContent = msg;
          }
        );
        
        document.getElementById("post-link").href = result.url;
        document.getElementById("result").style.display = "block";
        document.getElementById("progress").style.display = "none";
      } catch (err) {
        alert("Error: " + err.message);
        document.getElementById("progress").style.display = "none";
      }
    }
  </script>
</body>
</html>
```

---

## 9. Tool 2: Swipe Up Video Creator

### 9.1 What It Does

Creates a video post with a **"Swipe Up"** overlay that links to an external URL. Only visible on **mobile Facebook app newsfeeds**. Creates urgency/clickbait effect where viewers swipe up to visit your link.

### 9.2 How It Works (Technical)

The "swipe up" format is achieved by creating a post with a specific **call-to-action attachment** that Facebook renders as a swipe gesture on mobile. The key is using Facebook's internal video composer endpoint.

### 9.3 Method A: Using the Internal GraphQL API

```javascript
// In facebook-api.js

async createSwipeUpPost(pageId, pageToken, videoFile, linkUrl, ctaText, message, onProgress) {
  
  // Step 1: Upload the video
  onProgress && onProgress("Uploading video...");
  const videoId = await this.uploadVideoWithToken(
    videoFile, pageId, pageToken,
    (p) => onProgress && onProgress(`Uploading: ${p}%`)
  );

  onProgress && onProgress("Creating swipe-up post...");

  // Step 2: Create post with CTA overlay
  // This uses the video_id + call_to_action to create the swipe-up format
  const postBody = new URLSearchParams({
    message: message,
    // The video attachment
    object_attachment: videoId,
    // Call to action — this creates the swipe-up button
    call_to_action: JSON.stringify({
      type: ctaText,    // e.g. "LEARN_MORE", "SHOP_NOW", "SIGN_UP", "WATCH_MORE"
      value: {
        link: linkUrl,
        link_format: "VIDEO_MOBILE_SWIPE_UP" // KEY: this triggers the swipe-up UI
      }
    }),
    published: "true",
    access_token: pageToken
  });

  const response = await fetch(
    `https://graph.facebook.com/v18.0/${pageId}/feed`,
    { method: "POST", body: postBody }
  );
  
  const result = await response.json();
  if (result.error) throw new Error(result.error.message);
  
  return {
    postId: result.id,
    url: `https://www.facebook.com/${result.id.replace("_", "/posts/")}`
  };
}
```

### 9.4 Method B: Using Internal Composer (More Reliable)

This is what FewFeed actually uses. You capture this from DevTools:

```javascript
async createSwipeUpViaComposer(cookieString, fbDtsg, pageId, videoId, linkUrl, message) {
  
  // These doc_ids are found by inspecting Network tab while creating
  // a story/swipe-up on Facebook manually
  // They may change when Facebook updates — always re-check via DevTools
  
  const formData = new URLSearchParams({
    av: this.userId,
    __user: this.userId,
    __a: "1",
    fb_dtsg: fbDtsg,
    fb_api_caller_class: "RelayModern",
    fb_api_req_friendly_name: "useCometVideoComposerCreateStoryMutation",
    variables: JSON.stringify({
      input: {
        actor_id: pageId,
        client_mutation_id: this.generateMutationId(),
        composer_entry_point: "feed",
        composer_source_surface: "timeline",
        idempotence_token: this.generateToken(),
        message: {
          text: message
        },
        attachments: [
          {
            media: {
              id: videoId
            }
          }
        ],
        call_to_action: {
          type: "LEARN_MORE",
          encoded_creative_context: JSON.stringify({
            destination_link: linkUrl,
            link_format: "VIDEO_MOBILE_SWIPE_UP"
          })
        },
        with_tags_validated: false,
        audience: {
          privacy: {
            allow: [],
            base_state: "EVERYONE",
            deny: [],
            tag_expansion_state: "UNSPECIFIED"
          }
        }
      }
    }),
    server_timestamps: "true",
    doc_id: "7189542167811538" // <-- Get this from DevTools
  });

  const response = await fetch("https://www.facebook.com/api/graphql/", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Cookie": cookieString,
      "X-FB-Friendly-Name": "useCometVideoComposerCreateStoryMutation",
      "Referer": "https://www.facebook.com/"
    },
    body: formData
  });

  const text = await response.text();
  return JSON.parse(text.split("\n")[0]);
}

generateMutationId() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

generateToken() {
  return Array.from(
    { length: 32 }, 
    () => Math.floor(Math.random() * 16).toString(16)
  ).join("");
}
```

### 9.5 Supported CTA Types

```javascript
const CTA_TYPES = {
  "LEARN_MORE":     "Learn More",
  "SHOP_NOW":       "Shop Now",
  "SIGN_UP":        "Sign Up",
  "WATCH_MORE":     "Watch More",
  "BOOK_NOW":       "Book Now",
  "GET_DIRECTIONS": "Get Directions",
  "CALL_NOW":       "Call Now",
  "DOWNLOAD":       "Download",
  "GET_OFFER":      "Get Offer",
  "CONTACT_US":     "Contact Us"
};
```

---

## 10. Tool 3: Facebook 2-Card Video Carousel Post

### 10.1 What It Does

Exactly 2 videos in carousel format. The 2-card format has a **different visual appearance** on mobile compared to 3+ cards — it's larger, takes more screen space, and gets higher engagement.

### 10.2 The Key Difference from Tool 1

- Exactly 2 video cards
- `multi_share_end_card: false` (no "see more" card at the end)
- `multi_share_optimized: false` (don't let Facebook reorder)
- The 2-card layout renders bigger on mobile screens

### 10.3 The API Call

```javascript
async createTwoCardCarousel(pageId, pageToken, video1File, video2File, message, link1, link2, onProgress) {
  
  // Upload both videos
  onProgress && onProgress("Uploading video 1 of 2...");
  const video1Id = await this.uploadVideoWithToken(video1File, pageId, pageToken,
    (p) => onProgress && onProgress(`Video 1: ${p}%`)
  );
  
  onProgress && onProgress("Uploading video 2 of 2...");
  const video2Id = await this.uploadVideoWithToken(video2File, pageId, pageToken,
    (p) => onProgress && onProgress(`Video 2: ${p}%`)
  );

  onProgress && onProgress("Creating 2-card post...");

  // Create the carousel with exactly 2 cards
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
    // These two settings are CRITICAL for 2-card format
    multi_share_end_card: "false",
    multi_share_optimized: "false",
    published: "true",
    access_token: pageToken
  });

  const response = await fetch(
    `https://graph.facebook.com/v18.0/${pageId}/feed`,
    { method: "POST", body: postBody }
  );
  
  const result = await response.json();
  if (result.error) throw new Error(result.error.message);
  
  return {
    postId: result.id,
    url: `https://www.facebook.com/${result.id.replace("_", "/posts/")}`
  };
}
```

---

## 11. Tool 4: Generate One Card V2

### 11.1 What It Does

Creates a post that appears as a **single large image with a fake album count overlay** (e.g., "1/5 Photos"). This is a clickbait format that tricks users into thinking there are more photos. Clicking it opens a link instead of an album. Requires an **active Facebook Ad Account**.

### 11.2 How It Works

This exploits the **Ad Creative system**. An ad creative is normally used for ads, but the resulting post can be published organically. The creative format allows a single image with a carousel-style "1 of X" overlay.

### 11.3 Prerequisites

```
✅ A Facebook Page
✅ An Ad Account linked to that page (even with $0 balance)
✅ The Ad Account must be "Active" status (not disabled)
✅ An image URL (hosted somewhere public, or uploaded to FB)
✅ A link URL (where you want users to go)
```

### 11.4 The API Call (Step by Step)

```javascript
async generateOneCardV2(adAccountId, pageId, pageToken, imageFile, linkUrl, headline, description, fakeAlbumCount, message, onProgress) {
  
  // adAccountId format: "act_123456789" (with "act_" prefix)
  // or just "123456789" — the code adds prefix if missing
  
  const accountId = adAccountId.startsWith("act_") 
    ? adAccountId 
    : `act_${adAccountId}`;

  onProgress && onProgress("Uploading image...");
  
  // Step 1: Upload the image to the Ad Account's image library
  const imageHash = await this.uploadImageToAdAccount(imageFile, accountId, pageToken);
  
  onProgress && onProgress("Creating ad creative...");
  
  // Step 2: Create the Ad Creative
  // This is where the "one card" magic happens
  const creativeBody = new URLSearchParams({
    name: `OneCard_${Date.now()}`,
    object_story_spec: JSON.stringify({
      page_id: pageId,
      link_data: {
        // The link URL — where clicking takes the user
        link: linkUrl,
        
        // Message shown above the post
        message: message,
        
        // The headline (bold text on the card)
        name: headline,
        
        // Description (smaller text on the card)
        description: description,
        
        // Child attachments: the "one card" format uses child_attachments
        // with a single item + the fake album count
        child_attachments: JSON.stringify([
          {
            link: linkUrl,
            image_hash: imageHash,
            name: headline,
            description: description,
          }
        ]),
        
        // The "multi_share" settings control the album count display
        multi_share_end_card: false,
        
        // fake_album_count: shows "1/X" overlay on the image
        // This is the ONE CARD trick — single image looks like album
        fake_album_count: parseInt(fakeAlbumCount) || 5,
      }
    }),
    access_token: pageToken
  });

  const creativeResponse = await fetch(
    `https://graph.facebook.com/v18.0/${accountId}/adcreatives`,
    { method: "POST", body: creativeBody }
  );
  const creative = await creativeResponse.json();
  
  if (creative.error) throw new Error("Creative failed: " + creative.error.message);
  
  onProgress && onProgress("Publishing post...");
  
  // Step 3: Publish the creative as an organic post
  // The creative_id converts it from an ad creative to a real post
  const postBody = new URLSearchParams({
    message: message,
    // published: publish immediately
    published: "true",
    // Use the ad creative as the post's attachment
    creative: JSON.stringify({ creative_id: creative.id }),
    access_token: pageToken
  });

  const postResponse = await fetch(
    `https://graph.facebook.com/v18.0/${pageId}/feed`,
    { method: "POST", body: postBody }
  );
  
  const post = await postResponse.json();
  if (post.error) throw new Error("Post failed: " + post.error.message);
  
  return {
    postId: post.id,
    creativeId: creative.id,
    url: `https://www.facebook.com/${post.id.replace("_", "/posts/")}`
  };
}

// Upload image to Ad Account's image library
async uploadImageToAdAccount(imageFile, accountId, accessToken) {
  const formData = new FormData();
  formData.append("filename", imageFile, imageFile.name);
  formData.append("access_token", accessToken);

  const response = await fetch(
    `https://graph.facebook.com/v18.0/${accountId}/adimages`,
    { method: "POST", body: formData }
  );
  const data = await response.json();
  
  if (data.error) throw new Error("Image upload failed: " + data.error.message);
  
  // Extract the image hash from the response
  const images = data.images;
  const firstKey = Object.keys(images)[0];
  return images[firstKey].hash;
}
```

### 11.5 Getting Your Ad Account ID

```javascript
// Add this function to get the user's ad account IDs
async function getAdAccounts(pageToken) {
  const response = await fetch(
    `https://graph.facebook.com/v18.0/me/adaccounts?fields=id,name,account_status&access_token=${pageToken}`
  );
  const data = await response.json();
  
  // account_status codes:
  // 1 = Active ✅ (only this works for Tool 4)
  // 2 = Disabled ❌
  // 3 = Unsettled ⚠️ (may work)
  // 7 = Pending Review
  
  return data.data.filter(acc => acc.account_status === 1);
}
```

---

## 12. Frontend Website — Complete UI Guide

### 12.1 Homepage (index.html)

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FB Advanced Tools</title>
  <link rel="stylesheet" href="css/style.css">
  <script src="js/extension-bridge.js"></script>
</head>
<body>
  <header>
    <h1>🛠️ FB Advanced Tools</h1>
    <p>Personal Facebook posting tools — no watermarks, no subscriptions</p>
    <div id="extension-status">
      Checking extension... <span id="ext-indicator">⏳</span>
    </div>
  </header>

  <main>
    <div class="tools-grid">
      
      <div class="tool-card" onclick="location.href='tools/video-carousel.html'">
        <div class="tool-icon">🎬</div>
        <h2>Video Carousel Post</h2>
        <p>Post multiple videos as a swipeable carousel</p>
        <span class="badge">3–10 videos</span>
      </div>

      <div class="tool-card" onclick="location.href='tools/swipe-up.html'">
        <div class="tool-icon">👆</div>
        <h2>Swipe Up Video Creator</h2>
        <p>Mobile-only video posts with swipe-up CTA links</p>
        <span class="badge">Mobile only</span>
      </div>

      <div class="tool-card" onclick="location.href='tools/two-card.html'">
        <div class="tool-icon">📱</div>
        <h2>2-Card Video Carousel</h2>
        <p>Two-video carousel for maximum mobile screen space</p>
        <span class="badge">2 videos</span>
      </div>

      <div class="tool-card" onclick="location.href='tools/one-card-v2.html'">
        <div class="tool-icon">🃏</div>
        <h2>Generate One Card V2</h2>
        <p>Single image with fake album count clickbait overlay</p>
        <span class="badge requires-ad">Requires Ad Account</span>
      </div>

    </div>
  </main>

  <script>
    async function checkExtension() {
      try {
        await window.FBExtension.checkAvailability();
        if (window.FBExtension.isAvailable) {
          document.getElementById("ext-indicator").textContent = "✅ Extension connected";
        } else {
          document.getElementById("ext-indicator").innerHTML = 
            '❌ Extension not found — <a href="#">Install it</a>';
        }
      } catch (e) {
        document.getElementById("ext-indicator").textContent = "❌ Extension not found";
      }
    }
    checkExtension();
  </script>
</body>
</html>
```

### 12.2 CSS (style.css)

```css
* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  background: #f0f2f5;
  color: #1c1e21;
}

header {
  background: #1877f2;
  color: white;
  padding: 20px 40px;
}

header h1 { font-size: 24px; margin-bottom: 8px; }
header p { opacity: 0.85; font-size: 14px; }

#extension-status {
  margin-top: 12px;
  font-size: 13px;
  background: rgba(0,0,0,0.15);
  padding: 8px 12px;
  border-radius: 6px;
  display: inline-block;
}

main { padding: 40px; max-width: 1200px; margin: 0 auto; }

.tools-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.tool-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  transition: all 0.2s;
  border: 2px solid transparent;
}

.tool-card:hover {
  border-color: #1877f2;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(24,119,242,0.2);
}

.tool-icon { font-size: 40px; margin-bottom: 12px; }
.tool-card h2 { font-size: 18px; margin-bottom: 8px; color: #1c1e21; }
.tool-card p { font-size: 14px; color: #65676b; margin-bottom: 16px; }

.badge {
  background: #e7f3ff;
  color: #1877f2;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.badge.requires-ad { background: #fff3cd; color: #856404; }

/* Tool pages */
.tool-container {
  max-width: 700px;
  margin: 40px auto;
  padding: 0 20px;
}

.card {
  background: white;
  border-radius: 12px;
  padding: 28px;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.form-group { margin-bottom: 20px; }
.form-group label { display: block; font-weight: 600; margin-bottom: 6px; }
.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus { border-color: #1877f2; }

.form-group textarea { height: 100px; resize: vertical; }

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary { background: #1877f2; color: white; }
.btn-primary:hover { background: #1558b0; }
.btn-primary:disabled { background: #c2c9d6; cursor: not-allowed; }

.progress-container {
  background: #f0f2f5;
  border-radius: 8px;
  padding: 16px;
  margin: 12px 0;
}

.progress-bar {
  width: 100%;
  height: 8px;
  border-radius: 4px;
  appearance: none;
  background: #e4e6ea;
}

.progress-bar::-webkit-progress-value { background: #1877f2; border-radius: 4px; }

.success-box {
  background: #d4edda;
  border: 1px solid #c3e6cb;
  color: #155724;
  padding: 16px;
  border-radius: 8px;
  margin-top: 16px;
}

.error-box {
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  color: #721c24;
  padding: 16px;
  border-radius: 8px;
  margin-top: 16px;
}
```

---

## 13. Backend Server (Optional but Recommended)

For personal use, you **do not need a backend**. All API calls go directly browser → Facebook. However, if you want scheduling, history, or multi-account support:

```javascript
// server.js — Simple Express backend (optional)
// Only needed for: scheduling, history logging, multi-account

const express = require("express");
const cors = require("cors");
const app = express();

app.use(cors({ origin: ["http://localhost:3000", "https://your-site.com"] }));
app.use(express.json());

// Store post history (in memory — use a database for persistence)
const history = [];

app.post("/api/log-post", (req, res) => {
  history.push({
    ...req.body,
    timestamp: new Date().toISOString()
  });
  res.json({ success: true });
});

app.get("/api/history", (req, res) => {
  res.json(history);
});

// Schedule a post (using node-cron for real scheduling)
const cron = require("node-cron");
const scheduledPosts = [];

app.post("/api/schedule", (req, res) => {
  const { cronExpression, postData } = req.body;
  
  const task = cron.schedule(cronExpression, async () => {
    // Execute the post
    console.log("Executing scheduled post:", postData.type);
    // Call the appropriate Facebook API function
  });
  
  scheduledPosts.push({ task, postData });
  res.json({ success: true, message: "Post scheduled" });
});

app.listen(3001, () => console.log("Backend running on port 3001"));
```

---

## 14. Security & Safety Considerations

### 14.1 Your Cookie is Your Password

```
⚠️ CRITICAL WARNINGS:
• Your Facebook cookie string = full access to your account
• NEVER send your cookie to any third-party server
• NEVER share your cookie string with anyone
• All API calls should go DIRECTLY from your browser to Facebook
• This is why building your own tool is SAFER than using FewFeed
```

### 14.2 What FewFeed Can See

FewFeed's tool has access to your:
- Full Facebook session (can post, message, delete anything as you)
- All your pages and ad accounts
- Your friend list, messages, groups

Your own tool has the same access but **only you can see it**.

### 14.3 HTTPS Only

Always host your website on HTTPS. HTTP would expose your cookie in transit. For local development, `localhost` is exempt.

### 14.4 Extension Permissions

Only grant the permissions you actually need. The manifest above requests only what's necessary.

---

## 15. Rate Limiting & Anti-Ban Strategy

### 15.1 Facebook's Rate Limits

| Operation | Safe Limit | What Happens if Exceeded |
|-----------|-----------|--------------------------|
| Regular posts | 25/day per account | Posts start failing with error |
| Video uploads | 25 videos/hour | Upload API returns error |
| API calls | 200 calls/hour | Temporary block |
| Carousel posts | 10/day | Posts may be hidden |

### 15.2 Anti-Detection Strategies

```javascript
// Add random delays between operations to appear human
function humanDelay(minMs = 1000, maxMs = 3000) {
  const delay = Math.floor(Math.random() * (maxMs - minMs)) + minMs;
  return new Promise(resolve => setTimeout(resolve, delay));
}

// Randomize the User-Agent slightly
function getRandomUserAgent() {
  const versions = ["120.0.0.0", "119.0.0.0", "121.0.0.0"];
  const v = versions[Math.floor(Math.random() * versions.length)];
  return `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${v} Safari/537.36`;
}

// Between bulk operations, always add a delay
for (const video of videos) {
  await uploadVideo(video);
  await humanDelay(2000, 5000); // Wait 2-5 seconds between uploads
}
```

### 15.3 Signs Your Account is Being Flagged

```
🚩 Error: "Action Blocked" → Stop immediately, wait 24 hours
🚩 Error: "Checkpoint" → Account needs verification
🚩 Suddenly getting CAPTCHAs → Slow down
🚩 Posts being removed automatically → Content may be triggering spam filters
🚩 Friends can't see your posts → Shadowban active
```

### 15.4 Best Practices

- **Don't post more than 10 carousel posts per day**
- **Always add a message/caption** — blank posts look like spam
- **Vary your post timing** — don't post at exactly the same time every day
- **Don't run multiple tools simultaneously**
- **If something breaks, wait 24 hours before trying again**

---

## 16. Complete Troubleshooting Guide

### Error: "Extension not found"

```
Cause: Extension not installed or not loaded
Fix:
1. Go to chrome://extensions
2. Enable Developer Mode
3. Click "Load unpacked" → select your /extension folder
4. Get the Extension ID and update extension-bridge.js
5. Reload your website page
```

### Error: "No Facebook cookies found"

```
Cause: Not logged into Facebook, or cookies blocked
Fix:
1. Open Facebook in Chrome and make sure you're logged in
2. Check if any cookie-blocking extensions are interfering
3. Try logging out and back into Facebook
4. Check Chrome's cookie settings: Settings → Privacy → Cookies
```

### Error: "Could not extract fb_dtsg token"

```
Cause: Facebook changed their HTML structure
Fix:
1. The regex in fetchCsrfTokens() needs updating
2. Go to facebook.com, press F12, go to "Network" tab
3. Refresh the page
4. Click on the main document request (www.facebook.com)
5. In "Response" tab, search for "DTSGInitData" or "fb_dtsg"
6. Copy the token format and update the regex
Common updated patterns:
  - "token":"XXXXXXX"
  - name="fb_dtsg" value="XXXXXXX"
  - "fb_dtsg_ag":{"token":"XXXXXXX"}
```

### Error: "HTTP 400 Bad Request" on API calls

```
Cause: Missing required fields, wrong format, or expired token
Fix:
1. Open DevTools → Network tab
2. Look at the actual request being sent
3. Compare with a manual Facebook action in the same tab
4. Check if doc_id is still valid (they change occasionally)
5. Make sure all required fields are present in the request
```

### Error: "GraphQL Error: Invalid doc_id"

```
Cause: Facebook updated their internal operations, doc_id is outdated
Fix:
1. Open Chrome DevTools → Network → filter by "graphql"
2. Perform the action manually on Facebook
3. Find the request and copy the new doc_id
4. Update it in your code
This may need to be done every few weeks/months
```

### Error: "Object not found" on carousel post

```
Cause: Video IDs are not ready yet (Facebook processes videos asynchronously)
Fix:
1. After uploading a video, wait 30-60 seconds before using its ID
2. Add a polling check:

async function waitForVideoReady(videoId, pageToken, maxWait = 120000) {
  const start = Date.now();
  while (Date.now() - start < maxWait) {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${videoId}?fields=status&access_token=${pageToken}`
    );
    const data = await response.json();
    if (data.status && data.status.processing_progress === 100) return true;
    await new Promise(r => setTimeout(r, 5000)); // wait 5s between checks
  }
  throw new Error("Video processing timed out");
}
```

### Error: "Ad Account required" / One Card V2 not working

```
Cause: No active ad account, or wrong account ID format
Fix:
1. Go to https://www.facebook.com/adsmanager
2. Create an ad account if you don't have one (free, no card needed initially)
3. Get your Ad Account ID (format: act_XXXXXXXXX)
4. Make sure the status is "Active"
5. The ad account must be linked to the same page you're posting from
```

### Error: "Swipe Up doesn't show on desktop"

```
Cause: This is EXPECTED — swipe-up format only renders on Facebook mobile app
Fix: None needed — test on your phone's Facebook app
Note: On desktop, it will appear as a regular video post with a link
```

### Video Upload Fails at Large Files

```
Cause: Network timeout or chunk size too large
Fix:
1. Reduce chunk size from default to 1MB:
   const CHUNK_SIZE = 1 * 1024 * 1024; // 1MB chunks instead of default
2. Add retry logic:

async function uploadChunkWithRetry(url, formData, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, { method: "POST", body: formData });
      return await response.json();
    } catch (err) {
      if (attempt === maxRetries - 1) throw err;
      await new Promise(r => setTimeout(r, 2000 * (attempt + 1))); // exponential backoff
    }
  }
}
```

### Carousel Post Created but Videos Not Playing

```
Cause: Facebook hasn't finished processing the videos
Fix:
1. Wait 5-10 minutes after posting — videos process in background
2. The post will show a thumbnail while processing
3. If videos never play after 30 minutes, re-upload them
4. Make sure video format is MP4, H.264 codec
5. Max resolution: 1080p (1920x1080)
```

### Getting "CORS" Errors

```
Cause: Browser blocking the cross-origin request to facebook.com
Fix:
This should NOT happen with extension-based requests. If it does:
1. Make sure the request is going through the extension (not direct fetch)
2. The extension removes CORS headers via declarativeNetRequest
3. Add to manifest.json under declarative_net_request rules:
   - Remove "X-Frame-Options"
   - Remove "Content-Security-Policy"
4. Check that your site is listed in host_permissions
```

---

## 17. Deployment Guide

### Option A: Run Locally (Simplest)

```bash
# Just open index.html directly in Chrome
# OR use a simple HTTP server

# Install a simple server
npm install -g http-server

# Start server in website folder
cd website
http-server -p 3000

# Open: http://localhost:3000
```

### Option B: Deploy to Vercel (Free, HTTPS)

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
cd website
vercel

# Your site will be at: https://your-project-name.vercel.app
# Update this URL in manifest.json's externally_connectable and content_scripts
# Reload the extension in chrome://extensions after updating manifest.json
```

### Option C: Deploy to GitHub Pages (Free)

```bash
# Push your website folder to a GitHub repo
# Enable GitHub Pages in repo Settings → Pages
# Use the gh-pages branch
# Your URL: https://yourusername.github.io/your-repo-name
```

### After Deploying

1. Update `manifest.json` with your real domain
2. Update `extension-bridge.js` `EXTENSION_ID` with the correct ID
3. Reload the extension in `chrome://extensions`
4. Test everything end-to-end

---

## 18. Complete AI Prompt to Build from Scratch

> **Instructions:** Copy everything between the triple dashes below and paste it into any AI coding assistant (Claude, GPT-4, Gemini, Copilot). This prompt contains everything the AI needs to build the complete project from scratch with zero prior context.

---BEGIN AI PROMPT---

```
You are an expert full-stack developer. Build a complete personal Facebook advanced posting tool with 4 specific features. This is for personal use only on my own Facebook account and pages.

## PROJECT: FB Advanced Posting Tools

### WHAT TO BUILD:
A Chrome Extension + a simple website that work together to enable 4 Facebook posting features that are not available through Facebook's normal UI.

### THE FOUR TOOLS:
1. **Video Carousel Post** — Post 3–10 videos as a swipeable carousel on a Facebook Page
2. **Swipe Up Video Creator** — Mobile-only video post with a "swipe up" CTA link overlay  
3. **2-Card Video Carousel** — Exactly 2 videos in carousel format (different visual layout than 3+)
4. **Generate One Card V2** — Single image that shows a fake album count overlay (requires Ad Account)

### HOW IT WORKS (Core Architecture):
- A Chrome Extension reads the user's Facebook session cookies from Chrome
- The website communicates with the extension via chrome.runtime.sendMessage
- The extension returns the cookie string + user ID + fb_dtsg CSRF token
- The website uses these to make direct authenticated API calls to:
  - https://graph.facebook.com/v18.0/ (public Graph API, used with page access token)
  - https://www.facebook.com/api/graphql/ (internal GraphQL API, used with session cookie)
- No backend server is needed — all requests go directly browser → Facebook

### TECH STACK:
- Chrome Extension: Manifest V3, background service worker, content script
- Website: Plain HTML + CSS + Vanilla JavaScript (no frameworks, easy to understand)
- Hosting: Can run on localhost or deployed to Vercel
- No npm, no build tools, no TypeScript — keep it simple

### FILE STRUCTURE:
```
fb-tools/
├── extension/
│   ├── manifest.json
│   ├── background.js
│   ├── content.js
│   └── icon.png (create a simple 128x128 blue square icon)
└── website/
    ├── index.html (tool selector homepage)
    ├── tools/
    │   ├── video-carousel.html
    │   ├── swipe-up.html
    │   ├── two-card.html
    │   └── one-card-v2.html
    ├── js/
    │   ├── facebook-api.js (all FB API functions in a class)
    │   ├── extension-bridge.js (talks to extension)
    │   └── utils.js (helpers: delays, file handling, validation)
    └── css/
        └── style.css (clean Facebook-style UI)
```

### CHROME EXTENSION REQUIREMENTS:
manifest.json must:
- Use manifest_version 3
- Request permissions: "cookies", "tabs", "storage"
- List host_permissions for *.facebook.com, localhost, 127.0.0.1
- Have externally_connectable for localhost and 127.0.0.1
- Have a background service_worker: "background.js"
- Have content_scripts matching localhost/*

background.js must:
- Listen for chrome.runtime.onMessageExternal messages
- Handle message types: "PING", "GET_FB_COOKIE", "GET_USER_ID"
- For GET_FB_COOKIE: use chrome.cookies.getAll({domain: ".facebook.com"}) and return cookie string
- Extract c_user (user ID), xs, datr cookies separately
- Return true from listener to keep async channel open

content.js must:
- Post message to window: {type: "FB_TOOLS_EXTENSION_READY"}
- Forward messages from window to chrome.runtime.sendMessage

### FACEBOOK API CLASS (facebook-api.js):
Build a FacebookAPI class with these methods:
- initialize() — gets cookies from extension, fetches fb_dtsg from facebook.com
- fetchCsrfTokens() — GETs facebook.com and extracts fb_dtsg using regex
- rawFetch(url, method, body, extraHeaders) — attaches cookies to all requests
- graphql(docId, variables, friendlyName) — POSTs to /api/graphql/ endpoint
- uploadVideo(file, targetId, accessToken, onProgress) — chunked video upload to Graph API
- uploadPhoto(file, accountId, accessToken) — image upload to Graph API
- getMyPages() — fetches user's pages with access_token
- getAdAccounts() — fetches active ad accounts
- createVideoCarousel(pageId, pageToken, videoFiles[], message, onProgress)
- createSwipeUpPost(pageId, pageToken, videoFile, linkUrl, ctaType, message, onProgress)
- createTwoCardCarousel(pageId, pageToken, video1, video2, message, link1, link2, onProgress)
- generateOneCardV2(adAccountId, pageId, pageToken, imageFile, linkUrl, headline, description, fakeCount, message, onProgress)

### KEY IMPLEMENTATION DETAILS:

#### Getting fb_dtsg:
After fetching https://www.facebook.com/ with cookies, extract fb_dtsg using:
```javascript
const match = html.match(/"DTSGInitData"[^}]*"token":"([^"]+)"/) ||
              html.match(/name="fb_dtsg"\s+value="([^"]+)"/) ||
              html.match(/"fb_dtsg","([^"]{10,50})"/);
```

#### Video Upload (Graph API):
Uses the resumable upload protocol:
1. POST /videos with upload_phase=start and file_size → get upload_session_id, video_id, start_offset, end_offset
2. Loop: POST /videos with upload_phase=transfer, upload_session_id, start_offset, video_file_chunk
3. POST /videos with upload_phase=finish, upload_session_id
Return the video_id for use in carousel.

#### Video Carousel API call:
POST https://graph.facebook.com/v18.0/{pageId}/feed with:
- message: caption text
- child_attachments: JSON array of {media_fbid: videoId, name: title, link: url}
- multi_share_end_card: false
- multi_share_optimized: false
- access_token: page access token

#### Swipe Up API call:
POST https://graph.facebook.com/v18.0/{pageId}/feed with:
- message: caption
- object_attachment: videoId
- call_to_action: JSON {type: "LEARN_MORE", value: {link: url, link_format: "VIDEO_MOBILE_SWIPE_UP"}}
- access_token: page token

#### 2-Card Carousel:
Same as video carousel but exactly 2 items in child_attachments array.

#### One Card V2 (3 steps):
Step 1: POST to /act_{adAccountId}/adimages with image file → get image hash
Step 2: POST to /act_{adAccountId}/adcreatives with object_story_spec containing page_id, link_data with image_hash, link, name, description, child_attachments, fake_album_count
Step 3: POST to /{pageId}/feed with creative: JSON {creative_id: creativeId}, published: true

### UI REQUIREMENTS FOR EACH TOOL PAGE:
Each tool page must have:
1. A "Connect Account" section that calls FB_API.initialize() and shows the user's name
2. A page selector dropdown (populated from getMyPages())
3. File input(s) appropriate for the tool
4. Text inputs for message/caption/headline/description
5. A prominent action button
6. A progress section showing upload percentage and status messages
7. A success section showing the post link
8. An error section showing errors clearly
9. Back button to homepage

### EXTENSION-BRIDGE.JS:
- Define EXTENSION_ID as a constant (leave as "YOUR_EXTENSION_ID_HERE" placeholder)
- Create FBToolsExtension class
- checkAvailability() — sends PING message, returns boolean
- getFbCookies() — sends GET_FB_COOKIE message, returns {cookieString, userId, keys}
- Show warning if extension not available

### UTILS.JS:
- humanDelay(minMs, maxMs) — returns Promise that resolves after random delay
- formatFileSize(bytes) — returns human readable size
- validateVideoFile(file) — checks format and size
- showProgress(text, percent) — updates progress UI
- showSuccess(postUrl) — shows success box with link
- showError(message) — shows error box

### STYLE REQUIREMENTS (style.css):
- Clean, modern Facebook-inspired design
- Blue primary color: #1877f2
- Gray background: #f0f2f5
- White cards with subtle shadows
- Rounded corners on all elements
- Progress bar styled in Facebook blue
- Mobile-responsive layout
- Status badges on tool cards
- Clear success (green) and error (red) message boxes

### ERROR HANDLING:
Every API call must be wrapped in try/catch. Show user-friendly errors:
- "Not logged into Facebook" → tells user to log into Facebook first
- "Extension not found" → tells user to install the extension
- "Invalid ad account" → tells user what an ad account is and how to create one
- "Video processing" → tells user videos need time to process
- All errors should appear in a styled error box, never as browser alerts

### ADDITIONAL NOTES:
- Add helpful delay between video uploads (2-3 seconds between each)
- Show a progress bar for file uploads with percentage
- After creating a post, display the direct URL to view it
- Validate files before uploading: check type, check size limits
- Video size limit: 1GB, image size limit: 30MB
- Add a "How This Works" section on each tool page
- All sensitive data (cookies) stays in browser only — never logged or sent anywhere
- Code should be clean, well-commented, and easy for a non-developer to understand

Please build all files completely, with full working code. Do not use placeholder code or TODO comments — implement everything. After building, provide setup instructions including how to load the extension, get the Extension ID, and start using the tools.
```
---END AI PROMPT---

---

## 19. Quick Reference Cheatsheet

### Facebook API Endpoints

| What | Endpoint | Method |
|------|---------|--------|
| Upload video | `graph.facebook.com/v18.0/{pageId}/videos` | POST |
| Upload image | `graph.facebook.com/v18.0/{pageId}/photos` | POST |
| Create post | `graph.facebook.com/v18.0/{pageId}/feed` | POST |
| Get pages | `graph.facebook.com/v18.0/me/accounts` | GET |
| Get ad accounts | `graph.facebook.com/v18.0/me/adaccounts` | GET |
| Upload ad image | `graph.facebook.com/v18.0/act_{id}/adimages` | POST |
| Create creative | `graph.facebook.com/v18.0/act_{id}/adcreatives` | POST |
| Internal GraphQL | `www.facebook.com/api/graphql/` | POST |

### Key Parameters for Each Tool

| Tool | Critical Parameters |
|------|-------------------|
| Video Carousel | `child_attachments[]`, `multi_share_end_card=false`, `multi_share_optimized=false` |
| Swipe Up | `object_attachment` (video ID), `call_to_action.value.link_format=VIDEO_MOBILE_SWIPE_UP` |
| 2-Card Carousel | Same as carousel but exactly 2 items in `child_attachments` |
| One Card V2 | `fake_album_count`, `image_hash`, `creative_id`, active Ad Account |

### Common Error Codes

| Code | Meaning | Fix |
|------|---------|-----|
| 190 | Invalid access token | Re-initialize, re-login to Facebook |
| 200 | Permission error | Check page permissions |
| 100 | Invalid parameter | Check request body format |
| 368 | Blocked for policy | Wait 24h, use tool less aggressively |
| 2018 | API limit reached | Wait 1 hour |

### CTA Types for Swipe Up

`LEARN_MORE` · `SHOP_NOW` · `SIGN_UP` · `WATCH_MORE` · `BOOK_NOW` · `CALL_NOW` · `DOWNLOAD` · `GET_OFFER` · `CONTACT_US` · `GET_DIRECTIONS`

### Video Format Requirements

| Spec | Requirement |
|------|------------|
| Format | MP4 (H.264 video, AAC audio) |
| Max size | 1 GB |
| Max length | 240 minutes |
| Max resolution | 1920 x 1080 |
| Aspect ratio | 16:9 recommended |
| Min resolution | 720p for best quality |

---

## 📝 Final Notes

This guide documents everything needed to build all four tools from scratch:

1. **The extension** reads your session cookie securely from Chrome
2. **The website** uses that cookie to call Facebook's internal APIs
3. **Each tool** exploits a specific API capability that Facebook's UI hides
4. **No watermarks**, no subscriptions, no third-party servers involved
5. **Your data stays yours** — cookies never leave your browser

The most important skill you'll develop building this is reading Facebook's Network tab in DevTools. Every new Facebook feature can be automated once you can read the GraphQL calls.

**If a `doc_id` stops working** — open DevTools, perform the action manually on Facebook, and capture the new one. This is the only maintenance this system requires.

---

*Built with reverse-engineering, curiosity, and zero tolerance for watermarks.*
*Version 1.0 — March 2026*
```
