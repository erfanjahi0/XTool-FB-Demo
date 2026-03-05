# 🛠️ Development Guide — FB Organic Ad-Style Post Tool

> **This guide is for developers building a working implementation of the workflow documented in [README.md](./README.md). It focuses entirely on how to build it — code, structure, error handling, and edge cases.**

---

## 📋 Table of Contents

1. [Tech Stack Recommendations](#1-tech-stack-recommendations)
2. [Project Structure](#2-project-structure)
3. [Token Acquisition — OAuth Flow](#3-token-acquisition--oauth-flow)
4. [Step 1a — Fetch Ad Accounts](#4-step-1a--fetch-ad-accounts)
5. [Step 1b — Fetch Managed Pages](#5-step-1b--fetch-managed-pages)
6. [Step 2 — Upload Image to Ad Library](#6-step-2--upload-image-to-ad-library)
7. [Step 3 — Create Ad Creative](#7-step-3--create-ad-creative)
8. [Step 4 — Poll for Story ID](#8-step-4--poll-for-story-id)
9. [Step 5 — Publish to Page Feed](#9-step-5--publish-to-page-feed)
10. [Step 6 — Verify Live Post](#10-step-6--verify-live-post)
11. [Putting It All Together](#11-putting-it-all-together)
12. [Error Reference](#12-error-reference)
13. [Security Checklist](#13-security-checklist)

---

## 1. Tech Stack Recommendations

This tool is essentially a **multi-step API chain with file upload**. It works well in any language. Recommended options:

| Use Case | Stack |
|---|---|
| Web app (browser) | Vanilla JS + Fetch API |
| Web app (framework) | React or Vue + Axios |
| Backend / CLI | Node.js (axios, form-data) |
| Backend / CLI | Python (requests, httpx) |
| Chrome Extension | Vanilla JS + Fetch API |

> All code examples in this guide use **JavaScript (Fetch API)** — the same environment Fewfeed uses. Python equivalents are provided for key steps.

---

## 2. Project Structure

A minimal working implementation needs just these pieces:

```
/
├── index.html          ← UI: token input, image picker, form fields
├── app.js              ← Main controller (orchestrates all 6 steps)
├── api.js              ← All API call functions (one per step)
├── upload.js           ← Multipart image upload handler
└── config.js           ← API version constant, base URL
```

**config.js:**

```javascript
export const API_VERSION = 'v21.0';
export const BASE_URL = `https://graph.facebook.com/${API_VERSION}`;
```

---

## 3. Token Acquisition — OAuth Flow

> ⚠️ This step is required before anything else. The token is the key to all 6 API calls.

The token needed is a **User Access Token** with these permissions:
- `ads_management`
- `pages_manage_posts`
- `pages_read_engagement`

### Option A — Facebook Login SDK (Recommended for web apps)

```html
<!-- Load the SDK -->
<script async defer src="https://connect.facebook.net/en_US/sdk.js"></script>

<script>
  window.fbAsyncInit = function() {
    FB.init({
      appId: 'YOUR_APP_ID',
      version: 'v21.0'
    });
  };

  function loginAndGetToken() {
    FB.login(function(response) {
      if (response.authResponse) {
        const userToken = response.authResponse.accessToken;
        console.log('User token:', userToken);
        // → Pass this to Step 1a
      }
    }, {
      scope: 'ads_management,pages_manage_posts,pages_read_engagement'
    });
  }
</script>

<button onclick="loginAndGetToken()">Connect with Facebook</button>
```

### Option B — Manual Token (for testing/personal use)

Generate a token manually at [Meta Graph API Explorer](https://developers.facebook.com/tools/explorer/), select the required permissions, and paste it directly:

```javascript
const USER_TOKEN = 'EAABsbCS1iHgBQ...'; // paste your token here for testing
```

> ⚠️ Never hardcode tokens in production code. Use `localStorage` or a server-side session for temporary storage, and environment variables in backend implementations.

---

## 4. Step 1a — Fetch Ad Accounts

### Goal
Get the `act_<AD_ACCOUNT_ID>` to use in the image upload and creative creation calls.

### Code

```javascript
// api.js
export async function fetchAdAccounts(userToken) {
  const url = new URL(`https://graph.facebook.com/v21.0/me/adaccounts`);
  url.searchParams.set('access_token', userToken);
  url.searchParams.set('fields', 'account_status,account_id');

  const response = await fetch(url.toString());
  const data = await response.json();

  if (data.error) throw new Error(`[Step 1a] ${data.error.message}`);
  if (!data.data || data.data.length === 0) {
    throw new Error('[Step 1a] No ad accounts found for this user.');
  }

  return data.data; // array of ad accounts
}
```

### Response shape

```json
{
  "data": [
    {
      "account_id": "936983582027090",
      "account_status": 1,
      "id": "act_936983582027090"
    }
  ]
}
```

### Handling account_status

Only proceed with **active** accounts. Check before continuing:

```javascript
const ACCOUNT_STATUS = {
  1: 'Active',
  2: 'Disabled',
  3: 'Unsettled',
  7: 'Pending Review',
  9: 'In Grace Period',
  100: 'Temporarily Unavailable',
  101: 'Closed'
};

const activeAccounts = accounts.filter(a => a.account_status === 1);
if (activeAccounts.length === 0) {
  throw new Error('No active ad accounts available. Account may be disabled or unsettled.');
}

const adAccountId = activeAccounts[0].id; // e.g. "act_936983582027090"
```

---

## 5. Step 1b — Fetch Managed Pages

### Goal
Get the **Page ID** and — critically — the **Page-scoped access token** used for all remaining API calls.

### Code

```javascript
// api.js
export async function fetchManagedPages(userToken) {
  const url = new URL(`https://graph.facebook.com/v21.0/me/accounts`);
  url.searchParams.set('access_token', userToken);
  url.searchParams.set('fields', 'access_token,id,name,picture,is_published');
  url.searchParams.set('limit', '100');

  const response = await fetch(url.toString());
  const data = await response.json();

  if (data.error) throw new Error(`[Step 1b] ${data.error.message}`);
  if (!data.data || data.data.length === 0) {
    throw new Error('[Step 1b] No managed pages found for this user.');
  }

  return data.data; // array of pages
}
```

### Response shape

```json
{
  "data": [
    {
      "access_token": "EAABsbCS1iHgBQ...<PAGE_TOKEN>",
      "id": "1028026590391757",
      "name": "My Facebook Page",
      "picture": {
        "data": {
          "url": "https://scontent.xx.fbcdn.net/v/page_picture.jpg"
        }
      },
      "is_published": true
    }
  ]
}
```

### 🔑 Token Switch — Critical

After this step, **stop using the User token**. Extract the Page token and use it for all subsequent calls:

```javascript
// Let user pick a page if they have multiple
const selectedPage = pages[0]; // or show a page selector UI

const pageId = selectedPage.id;           // "1028026590391757"
const pageToken = selectedPage.access_token; // use this from now on
const pageName = selectedPage.name;

// ✅ From here: ALL API calls use pageToken, not userToken
```

---

## 6. Step 2 — Upload Image to Ad Library

### Goal
Upload the image to the Ad Account's image library to preserve the **1080×1080** square format. Returns an `image_hash`.

### ⚠️ The Multipart Field Name Rule

Facebook's `adimages` endpoint expects the form field `name` to match the **filename of the image**. This is non-standard and trips up most developers.

```
✅ Correct:   name="photo.jpg"; filename="photo.jpg"
❌ Wrong:     name="file"; filename="photo.jpg"
❌ Wrong:     name="image"; filename="photo.jpg"
```

### Code (JavaScript)

```javascript
// upload.js
export async function uploadAdImage(adAccountId, imageFile, pageToken) {
  const url = new URL(`https://graph.facebook.com/v21.0/${adAccountId}/adimages/`);
  url.searchParams.set('access_token', pageToken);
  url.searchParams.set('method', 'post');
  url.searchParams.set('__cppo', '1');
  url.searchParams.set('fields', 'url');

  // Build multipart form — use filename as the field name
  const formData = new FormData();
  formData.append(imageFile.name, imageFile, imageFile.name);
  // ↑ field name = imageFile.name (e.g. "photo.jpg") — this is intentional

  const response = await fetch(url.toString(), {
    method: 'POST',
    body: formData
    // Do NOT set Content-Type header manually — browser sets it
    // automatically with the correct boundary string
  });

  const data = await response.json();

  if (data.error) throw new Error(`[Step 2] ${data.error.message}`);

  // Response is nested under the filename key
  const imageData = data.images?.[imageFile.name];
  if (!imageData?.hash) {
    throw new Error('[Step 2] Image uploaded but no hash returned. Check field name.');
  }

  return imageData.hash; // e.g. "d8a3f2b1c4e5a6d7e8f9a0b1c2d3e4f5"
}
```

### Code (Python equivalent)

```python
import requests

def upload_ad_image(ad_account_id, image_path, page_token):
    url = f"https://graph.facebook.com/v21.0/{ad_account_id}/adimages/"
    params = {
        "access_token": page_token,
        "method": "post",
        "__cppo": "1",
        "fields": "url"
    }

    filename = image_path.split("/")[-1]  # e.g. "photo.jpg"

    with open(image_path, "rb") as img:
        # Field name MUST equal the filename — this is required by Facebook
        files = {filename: (filename, img, "image/jpeg")}
        response = requests.post(url, params=params, files=files)

    data = response.json()
    if "error" in data:
        raise Exception(f"[Step 2] {data['error']['message']}")

    image_hash = data["images"][filename]["hash"]
    return image_hash
```

### Response shape

```json
{
  "images": {
    "photo.jpg": {
      "hash": "d8a3f2b1c4e5a6d7e8f9a0b1c2d3e4f5",
      "url": "https://scontent.xx.fbcdn.net/v/t45.1600-4/photo_hash_n.jpg"
    }
  }
}
```

### Image requirements

| Property | Requirement |
|---|---|
| Dimensions | **1080 × 1080 px** recommended |
| Format | JPG, PNG |
| Max file size | 30 MB |
| Aspect ratio | 1:1 for square post (what this tool is for) |

---

## 7. Step 3 — Create Ad Creative

### Goal
Build the Ad creative shell with the image, headline, caption, link, and CTA button. Returns `creative_id`.

### Code

```javascript
// api.js
export async function createAdCreative(adAccountId, pageId, imageHash, postData, pageToken) {
  const url = new URL(`https://graph.facebook.com/v21.0/${adAccountId}/adcreatives`);
  url.searchParams.set('access_token', pageToken);
  url.searchParams.set('fields', 'effective_object_story_id');

  const body = {
    name: `Organic_Post_${Date.now()}`,
    object_story_spec: {
      page_id: pageId,
      link_data: {
        link: postData.destinationUrl,
        image_hash: imageHash,
        name: postData.headline,         // the bold title under the image
        message: postData.caption,       // the text above the post
        call_to_action: {
          type: postData.ctaType        // e.g. "LEARN_MORE"
        }
      }
    }
  };

  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  const data = await response.json();

  if (data.error) throw new Error(`[Step 3] ${data.error.message}`);
  if (!data.id) throw new Error('[Step 3] Creative created but no ID returned.');

  return {
    creativeId: data.id,
    storyId: data.effective_object_story_id || null // may be null — Step 4 handles this
  };
}
```

### Supported CTA types

```javascript
const CTA_TYPES = [
  'LEARN_MORE',
  'SHOP_NOW',
  'SIGN_UP',
  'CONTACT_US',
  'WATCH_MORE',
  'BOOK_TRAVEL',
  'DOWNLOAD',
  'GET_OFFER',
  'SUBSCRIBE',
  'APPLY_NOW'
];
```

### Response shape

```json
{
  "id": "1296466215730627",
  "effective_object_story_id": "1028026590391757_122104756065264372"
}
```

> `effective_object_story_id` may be absent on the first response. This is normal — proceed to Step 4.

---

## 8. Step 4 — Poll for Story ID

### Goal
Poll the creative endpoint until `effective_object_story_id` is populated. This confirms Meta's backend has fully processed the creative before you publish.

### Why this step exists

Meta processes creatives asynchronously. Skipping straight to Step 5 without waiting risks publishing an incomplete or broken post. The polling approach is what Fewfeed uses in production.

### Code

```javascript
// api.js
export async function pollForStoryId(creativeId, pageToken, options = {}) {
  const {
    maxAttempts = 10,
    intervalMs = 2000   // wait 2 seconds between each attempt
  } = options;

  const url = new URL(`https://graph.facebook.com/v21.0/${creativeId}`);
  url.searchParams.set('access_token', pageToken);
  url.searchParams.set('fields', 'effective_object_story_id');

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`[Step 4] Polling attempt ${attempt}/${maxAttempts}...`);

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.error) throw new Error(`[Step 4] ${data.error.message}`);

    if (data.effective_object_story_id) {
      console.log(`[Step 4] Story ID ready: ${data.effective_object_story_id}`);
      return data.effective_object_story_id;
    }

    // Not ready yet — wait before next attempt
    if (attempt < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
  }

  throw new Error(`[Step 4] Story ID not available after ${maxAttempts} attempts. Creative may have failed.`);
}
```

### Response shapes

**Not ready (keep polling):**
```json
{
  "id": "1296466215730627"
}
```

**Ready (proceed to Step 5):**
```json
{
  "id": "1296466215730627",
  "effective_object_story_id": "1028026590391757_122104756065264372"
}
```

### Tuning poll settings

| Scenario | maxAttempts | intervalMs |
|---|---|---|
| Typical (default) | 10 | 2000 |
| Fast network | 7 | 1500 |
| Slow / under load | 15 | 3000 |

---

## 9. Step 5 — Publish to Page Feed

### Goal
Push the creative to the Page's public timeline. This is the actual publish action.

### Code

```javascript
// api.js
export async function publishToFeed(pageId, creativeId, pageToken) {
  const url = new URL(`https://graph.facebook.com/v21.0/${pageId}/feed`);
  url.searchParams.set('access_token', pageToken);

  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      creative: {
        creative_id: creativeId
      }
    })
  });

  const data = await response.json();

  if (data.error) throw new Error(`[Step 5] ${data.error.message}`);
  if (!data.id) throw new Error('[Step 5] Publish call succeeded but no post ID returned.');

  return data.id; // e.g. "1028026590391757_122104756065264372"
}
```

### Response shape

```json
{
  "id": "1028026590391757_122104756065264372"
}
```

---

## 10. Step 6 — Verify Live Post

### Goal
Confirm the post is live and publicly accessible. Acts as a publication receipt before showing success to the user.

### Code

```javascript
// api.js
export async function verifyLivePost(postId, pageToken) {
  const url = new URL(`https://graph.facebook.com/v21.0/${postId}`);
  url.searchParams.set('access_token', pageToken);
  url.searchParams.set('fields', 'effective_object_story_id');

  const response = await fetch(url.toString());
  const data = await response.json();

  if (data.error) throw new Error(`[Step 6] ${data.error.message}`);

  return {
    postId: data.id,
    storyId: data.effective_object_story_id,
    liveUrl: `https://www.facebook.com/${data.effective_object_story_id?.replace('_', '/posts/')}`
  };
}
```

### Response shape

```json
{
  "effective_object_story_id": "1028026590391757_122104756065264372",
  "id": "1028026590391757_122104756065264372"
}
```

---

## 11. Putting It All Together

### Complete orchestration function

```javascript
// app.js
import { fetchAdAccounts } from './api.js';
import { fetchManagedPages } from './api.js';
import { createAdCreative } from './api.js';
import { pollForStoryId } from './api.js';
import { publishToFeed } from './api.js';
import { verifyLivePost } from './api.js';
import { uploadAdImage } from './upload.js';

export async function publishOrganicAdPost(userToken, imageFile, postData) {
  console.log('🚀 Starting organic ad post workflow...');

  // ── Step 1a: Fetch Ad Accounts ──────────────────────────────────────────
  console.log('📋 Step 1a: Fetching ad accounts...');
  const accounts = await fetchAdAccounts(userToken);
  const activeAccount = accounts.find(a => a.account_status === 1);
  if (!activeAccount) throw new Error('No active ad account found.');
  const adAccountId = activeAccount.id;
  console.log(`✅ Ad Account: ${adAccountId}`);

  // ── Step 1b: Fetch Managed Pages ────────────────────────────────────────
  console.log('📋 Step 1b: Fetching managed pages...');
  const pages = await fetchManagedPages(userToken);
  const selectedPage = pages.find(p => p.id === postData.pageId) || pages[0];
  const pageId = selectedPage.id;
  const pageToken = selectedPage.access_token;  // ← switch to page token here
  console.log(`✅ Page: ${selectedPage.name} (${pageId})`);

  // ── Step 2: Upload Image ─────────────────────────────────────────────────
  console.log('🖼️  Step 2: Uploading image to ad library...');
  const imageHash = await uploadAdImage(adAccountId, imageFile, pageToken);
  console.log(`✅ Image hash: ${imageHash}`);

  // ── Step 3: Create Ad Creative ───────────────────────────────────────────
  console.log('🎨 Step 3: Building ad creative...');
  const { creativeId } = await createAdCreative(
    adAccountId, pageId, imageHash, postData, pageToken
  );
  console.log(`✅ Creative ID: ${creativeId}`);

  // ── Step 4: Poll for Story ID ────────────────────────────────────────────
  console.log('🔄 Step 4: Waiting for story ID...');
  const storyId = await pollForStoryId(creativeId, pageToken);
  console.log(`✅ Story ID: ${storyId}`);

  // ── Step 5: Publish to Feed ──────────────────────────────────────────────
  console.log('📤 Step 5: Publishing to page feed...');
  const postId = await publishToFeed(pageId, creativeId, pageToken);
  console.log(`✅ Post ID: ${postId}`);

  // ── Step 6: Verify Live Post ─────────────────────────────────────────────
  console.log('✔️  Step 6: Verifying live post...');
  const result = await verifyLivePost(postId, pageToken);
  console.log(`✅ Post is live: ${result.liveUrl}`);

  return result;
}
```

### Calling it from your UI

```javascript
// Example usage
const imageInput = document.getElementById('imageInput');
const imageFile = imageInput.files[0];

const postData = {
  pageId: '1028026590391757',   // optional — defaults to first page
  destinationUrl: 'https://yoursite.com',
  headline: 'Your Custom Headline',
  caption: 'Caption text shown above the post.',
  ctaType: 'LEARN_MORE'
};

try {
  const result = await publishOrganicAdPost(USER_TOKEN, imageFile, postData);
  alert(`✅ Published! View at: ${result.liveUrl}`);
} catch (err) {
  console.error('❌ Failed:', err.message);
  alert(`Error: ${err.message}`);
}
```

---

## 12. Error Reference

### Common Facebook API errors and how to handle them

| Error Code | Message | Cause | Fix |
|---|---|---|---|
| `100` | Invalid parameter | Missing or wrong field in request body | Check request payload against the guide |
| `190` | Invalid OAuth access token | Token expired or wrong token used | Re-authenticate, get a new token |
| `200` | Permission error | Token missing required permission | Re-login with `ads_management` scope |
| `273` | Ad account is restricted | Account is disabled or unsettled | Use a different ad account |
| `1487390` | Creative not yet available | `effective_object_story_id` not ready | Keep polling in Step 4 |
| `368` | Blocked from posting | Page restricted by Facebook | Check page status in Meta Business Suite |
| `506` | Duplicate post | Same content already posted recently | Change the content slightly |

### Error handling wrapper

```javascript
async function apiCall(fn, stepLabel) {
  try {
    return await fn();
  } catch (err) {
    const message = err.message || 'Unknown error';

    // Token expired
    if (message.includes('190') || message.includes('OAuth')) {
      throw new Error(`${stepLabel}: Your token has expired. Please log in again.`);
    }
    // Permission missing
    if (message.includes('200') || message.includes('permission')) {
      throw new Error(`${stepLabel}: Missing permissions. Re-connect with ads_management scope.`);
    }
    // Ad account issue
    if (message.includes('273')) {
      throw new Error(`${stepLabel}: Ad account is restricted. Check your Business Manager.`);
    }

    throw new Error(`${stepLabel}: ${message}`);
  }
}

// Usage:
const accounts = await apiCall(() => fetchAdAccounts(userToken), 'Step 1a');
```

---

## 13. Security Checklist

Before shipping any implementation, verify the following:

- [ ] **User token never stored in plaintext** — use `sessionStorage` at most; clear on logout
- [ ] **Page token never logged to console** in production builds
- [ ] **No tokens committed to Git** — add a `.env` file to `.gitignore`
- [ ] **Image files validated client-side** before upload — check type and size
- [ ] **Destination URL validated** — ensure it's a real URL before sending to creative
- [ ] **API calls made over HTTPS only** — never HTTP
- [ ] **Error messages shown to users** do not expose raw token values
- [ ] **Rate limits respected** — Meta allows ~200 API calls per hour per token; add delays if batching

---

<div align="center">

← Back to [README.md](./README.md) for the full system overview

</div>
