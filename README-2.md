# 📘 FB Organic Ad-Style Post Research

> **A complete technical breakdown of how tools like *Fewfeed* publish professional Ad-format posts organically to Facebook Pages — using the Meta Graph API, at zero ad spend.**

---

<div align="center">

![Meta Graph API](https://img.shields.io/badge/Meta%20Graph%20API-v21.0-blue?style=for-the-badge&logo=meta&logoColor=white)
![Ad Creative](https://img.shields.io/badge/Technique-Dark%20Post-orange?style=for-the-badge)
![Steps](https://img.shields.io/badge/API%20Steps-6%20Calls-purple?style=for-the-badge)
![Cost](https://img.shields.io/badge/Ad%20Spend-%240.00-brightgreen?style=for-the-badge)
![Purpose](https://img.shields.io/badge/Purpose-Research%20%2F%20Educational-lightgrey?style=for-the-badge)

</div>

---

## 📌 Overview

Facebook's standard organic link sharing enforces a **1.91:1** rectangular crop on images. Tools like **Fewfeed** bypass this restriction by leveraging the **Facebook Marketing API** — allowing Page owners to post **1:1 square images** with a fully customizable headline and a **Call-to-Action (CTA) button** directly on their Page timeline, without running or funding an actual advertisement.

This technique is known as publishing an **Unpublished Ad Post** (also called a **Dark Post**). This repository documents the **exact, complete API workflow** behind this approach, including hidden polling and verification steps not publicly documented elsewhere.

---

## ⚡ What You Get vs. Standard Posts

| Feature | Standard Organic Post | Fewfeed-Style (Ad API) |
|---|---|---|
| 🖼️ **Image Ratio** | 1.91:1 (auto-cropped) | **1:1 Full Square** |
| ✏️ **Headline** | Restricted / auto-generated | **Fully Customizable** |
| 🔘 **CTA Button** | ❌ Not available | ✅ Learn More, Shop Now, Sign Up… |
| 🔑 **Token Used** | User token | **Page-scoped token** (fetched dynamically) |
| 💰 **Cost** | Free | **Free** (API only, no ad spend) |
| 🔧 **Complexity** | Low | High (6-step API chain) |

---

## 🛠️ Prerequisites

Before you begin, make sure you have the following:

- **Facebook Page** — You must have **Admin** or **Editor** access.
- **Ad Account** — An active Ad Account linked to the Page (does not need to be funded). Required to access the `adimages` and `adcreatives` endpoints.
- **User Access Token** — A token (typically prefixed with `EAAB...`) with the following permissions:
  - `ads_management`
  - `pages_manage_posts`
  - `pages_read_engagement`

> 💡 You can generate and inspect tokens via the [Meta Graph API Explorer](https://developers.facebook.com/tools/explorer/).

---

## 🚀 The Complete 6-Step API Workflow

> ⚠️ **Note:** All `access_token` values and numeric IDs below are placeholders. Never expose real tokens in code or documentation.

---

### Step 1a — Fetch Ad Accounts

Retrieve the list of Ad Accounts the user can manage, including their **status** and **account ID**.

```http
GET https://graph.facebook.com/v21.0/me/adaccounts
  ?access_token=<USER_TOKEN>
  &fields=account_status,account_id
```

| Field | Description |
|---|---|
| `account_id` | The numeric Ad Account ID (without `act_` prefix) |
| `account_status` | `1` = Active, `2` = Disabled, `3` = Unsettled, `7` = Pending Review |

**Key output:** `act_<AD_ACCOUNT_ID>` — used in Steps 2 and 3.

---

### Step 1b — Fetch Managed Pages

Retrieve all Facebook Pages the user manages, including the **Page-scoped access token** used for all publishing calls.

```http
GET https://graph.facebook.com/v21.0/me/accounts
  ?access_token=<USER_TOKEN>
  &fields=access_token,id,name,picture,is_published
  &limit=100
  &fewfeedcors=0
```

| Field | Description |
|---|---|
| `access_token` | **Page-scoped token** — used for all subsequent Page operations |
| `id` | The Page ID |
| `name` | Display name of the Page |
| `picture` | Page profile picture URL |
| `is_published` | Whether the Page is publicly published |

> 🔑 **Important:** Fewfeed switches from the **User token** to the **Page-scoped token** returned here for all remaining API calls. This is a critical detail often missed in reverse-engineering attempts.

> 🔍 **Note on `fewfeedcors=0`:** This parameter appears on every Fewfeed request. It is a **custom client-side flag** — not a Meta API parameter — used to signal Fewfeed's backend proxy to bypass CORS restrictions when calling the Graph API from a browser context. Facebook's servers silently ignore it.

**Key outputs:** `<PAGE_ID>` and `<PAGE_ACCESS_TOKEN>` — used in Steps 2 through 6.

---

### Step 2 — Image Upload (Ad Image Ingestion)

Upload the image to the **Ad Account's image library** instead of the Page. This is what preserves the original **1080×1080** square dimensions.

```http
POST https://graph.facebook.com/v21.0/act_<AD_ACCOUNT_ID>/adimages/
  ?access_token=<PAGE_ACCESS_TOKEN>
  &method=post
  &__cppo=1
  &fields=url
  &fewfeedcors=0
Content-Type: multipart/form-data
```

| Parameter | Description |
|---|---|
| `method=post` | Explicitly declares the HTTP method (used by Fewfeed's proxy routing layer) |
| `__cppo=1` | Internal Meta parameter: **C**reative **P**ost **P**roxy **O**verride — forces the Ad image CDN to serve the image at its original resolution without cropping |
| `fields=url` | Returns the public CDN URL of the uploaded image alongside the hash |

**Key output:** `image_hash` — a unique fingerprint of the uploaded image, required in Step 3.

---

### Step 3 — Creative Construction (The "One Card" Logic)

Build the Ad creative shell. This defines the square image, custom headline, caption, CTA button, and destination URL — without launching an actual campaign.

```http
POST https://graph.facebook.com/v21.0/act_<AD_ACCOUNT_ID>/adcreatives
  ?access_token=<PAGE_ACCESS_TOKEN>
  &fields=effective_object_story_id
  &fewfeedcors=0
```

**Request body:**

```json
{
  "name": "Organic_Ad_Format_Post",
  "object_story_spec": {
    "page_id": "<PAGE_ID>",
    "link_data": {
      "link": "https://your-destination-link.com",
      "image_hash": "<IMAGE_HASH_FROM_STEP_2>",
      "name": "Your Custom Headline Text",
      "message": "The caption text that appears above the post.",
      "call_to_action": {
        "type": "LEARN_MORE"
      }
    }
  }
}
```

> 🔁 Supported CTA types: `LEARN_MORE`, `SHOP_NOW`, `SIGN_UP`, `CONTACT_US`, `WATCH_MORE`, `BOOK_TRAVEL`, `DOWNLOAD`, and more.

**Key outputs:**
- `creative_id` — the ID of the newly created Ad Creative
- `effective_object_story_id` — a reference in `{PAGE_ID}_{POST_ID}` format (may not be immediately populated — see Step 4)

---

### Step 4 — Creative Polling (Retrieve the Story ID)

After the creative is created, Fewfeed **polls the creative object directly** to retrieve the `effective_object_story_id`. This hidden verification step is necessary because the story ID is **not always synchronously available** after Step 3.

```http
GET https://graph.facebook.com/v21.0/<CREATIVE_ID>
  ?access_token=<PAGE_ACCESS_TOKEN>
  &fields=effective_object_story_id
  &fewfeedcors=0
```

> 🔄 This call is retried multiple times (typically 2–7 attempts) until `effective_object_story_id` is populated. It confirms the Ad Creative has been fully processed by Meta's backend before proceeding to publish. Skipping this step and jumping directly to Step 5 can result in an incomplete or failed publish.

**Key output:** `effective_object_story_id` in the format `{PAGE_ID}_{POST_ID}`.

---

### Step 5 — Organic Bridge (Publishing to the Page Feed)

Push the unpublished Ad creative to the **Page's public timeline**. The post appears as a standard organic post — but retains the full Ad layout intact.

```http
POST https://graph.facebook.com/v21.0/<PAGE_ID>/feed
  ?access_token=<PAGE_ACCESS_TOKEN>
Content-Type: application/json

{
  "creative": {
    "creative_id": "<CREATIVE_ID_FROM_STEP_3>"
  }
}
```

✅ **Result:** The post goes live on the Page timeline as an organic post, retaining the 1:1 square image, custom headline, and CTA button — no ad spend required.

---

### Step 6 — Post Verification (Confirm Live Status)

The final step fetches the **published post object** using the `effective_object_story_id` to confirm successful publication and retrieve the live post data.

```http
GET https://graph.facebook.com/v21.0/<PAGE_ID>_<POST_ID>
  ?access_token=<PAGE_ACCESS_TOKEN>
  &fields=effective_object_story_id
  &fewfeedcors=0
```

> The `{PAGE_ID}_{POST_ID}` composite format is Facebook's standard post identifier. This call serves as a **publication receipt** — confirming the post is live and accessible before Fewfeed presents a success state to the user.

---

## 🗺️ Full Flow Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                      USER ACCESS TOKEN (EAAB...)                 │
└──────────────────────────────┬───────────────────────────────────┘
                               │
               ┌───────────────┴───────────────┐
               ▼                               ▼
  ┌─────────────────────────┐   ┌──────────────────────────────┐
  │  STEP 1a: Ad Accounts   │   │  STEP 1b: Managed Pages      │
  │  /me/adaccounts         │   │  /me/accounts                │
  │  fields: account_status │   │  fields: access_token, id,   │
  │          account_id     │   │          name, picture,      │
  │                         │   │          is_published        │
  │  → act_<AD_ACCOUNT_ID>  │   │  → PAGE_ID                   │
  └────────────┬────────────┘   │  → PAGE_ACCESS_TOKEN ★       │
               │                └──────────────┬───────────────┘
               │                               │
               └───────────────┬───────────────┘
                               │  (switch to PAGE_ACCESS_TOKEN)
                               ▼
              ┌────────────────────────────────┐
              │  STEP 2: Image Upload          │
              │  /act_ID/adimages/             │
              │  method=post, __cppo=1         │
              │  fields=url                    │
              │  [multipart/form-data]         │
              │                                │
              │  → image_hash                  │
              └───────────────┬────────────────┘
                              │
                              ▼
              ┌────────────────────────────────┐
              │  STEP 3: Ad Creative           │
              │  /act_ID/adcreatives           │
              │  fields=effective_object_      │
              │         story_id               │
              │  [headline, CTA, image_hash]   │
              │                                │
              │  → creative_id                 │
              └───────────────┬────────────────┘
                              │
                              ▼
              ┌────────────────────────────────┐
              │  STEP 4: Poll Creative ★       │
              │  GET /<creative_id>            │
              │  fields=effective_object_      │
              │         story_id               │
              │  [retry until populated]       │
              │                                │
              │  → PAGE_ID_POST_ID             │
              └───────────────┬────────────────┘
                              │
                              ▼
              ┌────────────────────────────────┐
              │  STEP 5: Publish to Feed       │
              │  POST /PAGE_ID/feed            │
              │  { creative_id: "..." }        │
              │                                │
              │  → Post is LIVE ✅             │
              └───────────────┬────────────────┘
                              │
                              ▼
              ┌────────────────────────────────┐
              │  STEP 6: Verify Live Post ★    │
              │  GET /PAGE_ID_POST_ID          │
              │  fields=effective_object_      │
              │         story_id               │
              │                                │
              │  → Confirmed receipt ✅        │
              └────────────────────────────────┘

★ = Steps not publicly documented; discovered via traffic analysis
```

---

## 📑 Technical Notes

### 🖼️ Aspect Ratio Control
Using the `adcreatives` endpoint instructs Meta's CDN to respect the **1080×1080** square format. The standard `/feed` link endpoint forces a **1200×628** crop regardless of source image dimensions. The `__cppo=1` flag on the image upload reinforces this by preventing server-side resolution overrides.

### 🔑 Page-Scoped vs. User Token
A critical implementation detail: after Step 1b, Fewfeed **discards the User token** and switches to the **Page-scoped `access_token`** returned in the accounts response. This Page token has narrower but sufficient permissions for all subsequent calls and reduces the risk of exposing the broader User token.

### 🔄 Polling Behavior (Step 4)
The `effective_object_story_id` is not always immediately available after the creative is created in Step 3. Fewfeed polls the creative endpoint repeatedly until the field is populated. Skipping this polling step and proceeding directly to Step 5 can result in an incomplete or failed publish.

### 🔘 CTA Buttons
Organic Page posts do **not** natively support CTA buttons. The Ad API bridge documented here is the only known method to attach a CTA button to an organic timeline post without an active paid campaign.

### 🔍 The `fewfeedcors=0` Parameter
Appended to every Fewfeed API call, this is **not** a Meta API parameter — Facebook's servers silently ignore it. It is a client-side routing flag instructing the Fewfeed backend proxy to forward requests directly to the Graph API without adding CORS headers, enabling browser-based API calls that would otherwise be blocked by same-origin policy.

### 🔐 Token Security

> ⚠️ **Warning:** `EAAB...` User Access Tokens grant **full access** to your advertising identity, Pages, and ad accounts.
>
> - **Never** commit tokens to a public repository.
> - **Never** share tokens with untrusted third-party scripts or services.
> - Use environment variables or a secrets manager in any implementation.
> - Page-scoped tokens (from Step 1b) are safer for scoped operations but should still be treated as secrets.

### 🔄 API Versioning
This documentation is based on **Graph API v21.0**. Meta releases new API versions frequently. Always check the [Meta API Changelog](https://developers.facebook.com/docs/graph-api/changelog) to ensure endpoint and image rendering compatibility.

---

## 📊 Complete Endpoint Reference

| Step | Method | Endpoint | Key Parameters | Output |
|---|---|---|---|---|
| 1a | `GET` | `/me/adaccounts` | `fields=account_status,account_id` | `act_<ID>` |
| 1b | `GET` | `/me/accounts` | `fields=access_token,id,name,picture,is_published&limit=100` | `page_id`, `page_token` |
| 2 | `POST` | `/act_<ID>/adimages/` | `method=post`, `__cppo=1`, `fields=url` | `image_hash` |
| 3 | `POST` | `/act_<ID>/adcreatives` | `fields=effective_object_story_id` | `creative_id` |
| 4 | `GET` | `/<creative_id>` | `fields=effective_object_story_id` | `page_id_post_id` |
| 5 | `POST` | `/<page_id>/feed` | `{ creative: { creative_id } }` | Live post ✅ |
| 6 | `GET` | `/<page_id>_<post_id>` | `fields=effective_object_story_id` | Confirmation ✅ |

---

## 📚 References

- [Meta Graph API — Ad Images](https://developers.facebook.com/docs/marketing-api/reference/ad-image/)
- [Meta Graph API — Ad Creatives](https://developers.facebook.com/docs/marketing-api/reference/ad-creative/)
- [Meta Graph API — Page Feed](https://developers.facebook.com/docs/graph-api/reference/page/feed/)
- [Meta Graph API — Ad Accounts](https://developers.facebook.com/docs/marketing-api/reference/ad-account/)
- [Meta Graph API Explorer](https://developers.facebook.com/tools/explorer/)
- [Meta API Changelog](https://developers.facebook.com/docs/graph-api/changelog)

---

## ⚖️ Disclaimer

This documentation is provided **for educational and research purposes only**. It represents a technical analysis of observable API behavior for the purpose of understanding how third-party tools interact with the Meta platform.

Always ensure your usage complies with:
- [Meta's Platform Policy](https://developers.facebook.com/policy/)
- [Meta's Terms of Service](https://www.facebook.com/terms.php)
- The advertising and content policies applicable to your region and use case.

---

<div align="center">

Made with 🔍 research curiosity · Not affiliated with Meta or Fewfeed

</div>
