# 🗂️ Development Reference Guide — FB Organic Ad-Style Post Tool

> **This guide provides the technical data a developer needs to implement the workflow documented in [README.md](./README.md). It covers API details, exact request parameters, real response shapes, error codes, and behavioral notes. How you build it is entirely up to you.**

---

## 📋 Table of Contents

1. [Required Permissions](#1-required-permissions)
2. [Token Types & When to Use Each](#2-token-types--when-to-use-each)
3. [Step 1a — Ad Accounts Endpoint](#3-step-1a--ad-accounts-endpoint)
4. [Step 1b — Managed Pages Endpoint](#4-step-1b--managed-pages-endpoint)
5. [Step 2 — Image Upload Endpoint](#5-step-2--image-upload-endpoint)
6. [Step 3 — Ad Creative Endpoint](#6-step-3--ad-creative-endpoint)
7. [Step 4 — Creative Polling Endpoint](#7-step-4--creative-polling-endpoint)
8. [Step 5 — Page Feed Endpoint](#8-step-5--page-feed-endpoint)
9. [Step 6 — Post Verification Endpoint](#9-step-6--post-verification-endpoint)
10. [CTA Button Reference](#10-cta-button-reference)
11. [Error Code Reference](#11-error-code-reference)
12. [Rate Limits & Quotas](#12-rate-limits--quotas)
13. [Image Specifications](#13-image-specifications)
14. [Security Notes](#14-security-notes)

---

## 1. Required Permissions

The User Access Token must include all three of the following permissions before any API call will succeed:

| Permission | Purpose |
|---|---|
| `ads_management` | Access to ad accounts, adimages, and adcreatives endpoints |
| `pages_manage_posts` | Permission to publish posts to a Page feed |
| `pages_read_engagement` | Read access to Page data and post metadata |

> Missing even one of these permissions will cause a `200` permission error at the relevant step. All three must be requested together during the OAuth login flow.

---

## 2. Token Types & When to Use Each

Two different tokens are used across the 6 steps. Using the wrong token at any step will result in a permission error.

| Token Type | Format | Used In |
|---|---|---|
| **User Access Token** | `EAAB...` (long string) | Steps 1a and 1b only |
| **Page-scoped Access Token** | `EAAB...` (different value, returned in Step 1b) | Steps 2, 3, 4, 5, and 6 |

The Page-scoped token is returned inside the Step 1b response (`access_token` field per page). After Step 1b, the User token is no longer needed and should not be used for subsequent calls.

> Both tokens share the same `EAAB...` prefix format but are different values with different scopes. Do not confuse them.

---

## 3. Step 1a — Ad Accounts Endpoint

**Endpoint:**
```
GET https://graph.facebook.com/v21.0/me/adaccounts
```

**Query parameters:**

| Parameter | Value | Required |
|---|---|---|
| `access_token` | User Access Token | ✅ |
| `fields` | `account_status,account_id` | ✅ |

**Response:**

```json
{
  "data": [
    {
      "account_id": "936983582027090",
      "account_status": 1,
      "id": "act_936983582027090"
    }
  ],
  "paging": {
    "cursors": {
      "before": "before_cursor_string",
      "after": "after_cursor_string"
    }
  }
}
```

**`account_status` value meanings:**

| Value | Meaning |
|---|---|
| `1` | ✅ Active — safe to proceed |
| `2` | ❌ Disabled |
| `3` | ❌ Unsettled (billing issue) |
| `7` | ⏳ Pending Review |
| `9` | ⚠️ In Grace Period |
| `100` | ⏳ Temporarily Unavailable |
| `101` | ❌ Closed |

**Key output:** The `id` field — formatted as `act_<number>` (e.g. `act_936983582027090`). This is used as the Ad Account identifier in Steps 2 and 3.

> Only accounts with `account_status: 1` should be used in subsequent steps.

---

## 4. Step 1b — Managed Pages Endpoint

**Endpoint:**
```
GET https://graph.facebook.com/v21.0/me/accounts
```

**Query parameters:**

| Parameter | Value | Required |
|---|---|---|
| `access_token` | User Access Token | ✅ |
| `fields` | `access_token,id,name,picture,is_published` | ✅ |
| `limit` | `100` | ✅ |

**Response:**

```json
{
  "data": [
    {
      "access_token": "EAABsbCS1iHgBQ...<PAGE_SCOPED_TOKEN>",
      "id": "1028026590391757",
      "name": "My Facebook Page",
      "picture": {
        "data": {
          "url": "https://scontent.xx.fbcdn.net/v/page_picture.jpg"
        }
      },
      "is_published": true
    }
  ],
  "paging": {
    "cursors": {
      "before": "before_cursor_string",
      "after": "after_cursor_string"
    }
  }
}
```

**Key outputs:**
- `id` — the Page ID, used in Steps 3, 5, and 6
- `access_token` — the **Page-scoped token**, used in all remaining steps
- `is_published` — should be `true` before proceeding; posting to an unpublished page will fail

> If the user manages multiple pages, this endpoint returns all of them as an array. The implementation should handle page selection accordingly.

---

## 5. Step 2 — Image Upload Endpoint

**Endpoint:**
```
POST https://graph.facebook.com/v21.0/act_<AD_ACCOUNT_ID>/adimages/
```

**Query parameters:**

| Parameter | Value | Required |
|---|---|---|
| `access_token` | Page-scoped Token | ✅ |
| `method` | `post` | ✅ |
| `__cppo` | `1` | ✅ |
| `fields` | `url` | ✅ |

**Request format:** `multipart/form-data`

**Multipart body structure:**
```
------WebKitFormBoundaryXxXxXxXxXxXx
Content-Disposition: form-data; name="photo.jpg"; filename="photo.jpg"
Content-Type: image/jpeg

<binary image data>
------WebKitFormBoundaryXxXxXxXxXxXx--
```

**⚠️ Critical multipart rule:**
The `name` attribute in `Content-Disposition` must be set to the **exact filename of the image file** (e.g. `photo.jpg`). Facebook's `adimages` endpoint uses this filename as the form field identifier — not a generic label like `file`, `image`, or `source`. Using any other name will result in a successful HTTP 200 response but no `image_hash` in the return data.

**Response:**

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

**Key output:** `hash` — found nested under the filename key inside `images`. This value is the `image_hash` required in Step 3.

> The boundary string in the `Content-Type` header is auto-generated by the browser or HTTP client. Do not set the `Content-Type` header manually — let the library or browser set it with the correct boundary value.

---

## 6. Step 3 — Ad Creative Endpoint

**Endpoint:**
```
POST https://graph.facebook.com/v21.0/act_<AD_ACCOUNT_ID>/adcreatives
```

**Query parameters:**

| Parameter | Value | Required |
|---|---|---|
| `access_token` | Page-scoped Token | ✅ |
| `fields` | `effective_object_story_id` | ✅ |

**Request format:** `application/json`

**Request body:**

```json
{
  "name": "Organic_Ad_Format_Post",
  "object_story_spec": {
    "page_id": "<PAGE_ID>",
    "link_data": {
      "link": "https://your-destination-url.com",
      "image_hash": "<IMAGE_HASH_FROM_STEP_2>",
      "name": "Your Custom Headline Text",
      "message": "Caption text displayed above the post.",
      "call_to_action": {
        "type": "LEARN_MORE"
      }
    }
  }
}
```

**Field descriptions:**

| Field | Description | Notes |
|---|---|---|
| `name` | Internal creative name | Not shown publicly. Can be any string. |
| `page_id` | The Page ID from Step 1b | Must match the token's Page |
| `link` | Destination URL when CTA is clicked | Must be a valid, reachable URL |
| `image_hash` | Hash from Step 2 | Must belong to the same Ad Account |
| `name` (link_data) | The headline shown under the image | Displayed in bold |
| `message` | Post caption shown above the image | Supports line breaks |
| `call_to_action.type` | CTA button label | See Section 10 for all options |

**Response:**

```json
{
  "id": "1296466215730627",
  "effective_object_story_id": "1028026590391757_122104756065264372"
}
```

**Key outputs:**
- `id` — the `creative_id`, used in Steps 4 and 5
- `effective_object_story_id` — may be present immediately, or may be `null` / absent. Step 4 handles the case where it is not yet ready.

---

## 7. Step 4 — Creative Polling Endpoint

**Endpoint:**
```
GET https://graph.facebook.com/v21.0/<CREATIVE_ID>
```

**Query parameters:**

| Parameter | Value | Required |
|---|---|---|
| `access_token` | Page-scoped Token | ✅ |
| `fields` | `effective_object_story_id` | ✅ |

**Why polling is needed:**
Meta processes creatives asynchronously on the backend. The `effective_object_story_id` field is populated only after Meta confirms the creative is ready to be published. This process typically completes within 2–14 seconds but is not guaranteed to be immediate.

**Response — not ready (keep polling):**

```json
{
  "id": "1296466215730627"
}
```

**Response — ready (proceed to Step 5):**

```json
{
  "id": "1296466215730627",
  "effective_object_story_id": "1028026590391757_122104756065264372"
}
```

**Polling behavior observed from Fewfeed traffic:**
- Typically resolves within **2–7 attempts**
- Recommended interval between attempts: **2–3 seconds**
- Recommended maximum attempts before aborting: **10–15**
- If the field is still absent after max attempts, the creative likely failed silently — check the Ad Account in Meta Business Suite

**Key output:** `effective_object_story_id` in `{PAGE_ID}_{POST_ID}` format — used in Step 6 for verification.

---

## 8. Step 5 — Page Feed Endpoint

**Endpoint:**
```
POST https://graph.facebook.com/v21.0/<PAGE_ID>/feed
```

**Query parameters:**

| Parameter | Value | Required |
|---|---|---|
| `access_token` | Page-scoped Token | ✅ |

**Request format:** `application/json`

**Request body:**

```json
{
  "creative": {
    "creative_id": "<CREATIVE_ID_FROM_STEP_3>"
  }
}
```

**Response:**

```json
{
  "id": "1028026590391757_122104756065264372"
}
```

**Key output:** `id` — the published post's composite ID in `{PAGE_ID}_{POST_ID}` format. Used in Step 6.

> At this point the post is live on the Page timeline. There is no undo via API — to remove it you must delete the post separately using the `DELETE /{post-id}` endpoint.

---

## 9. Step 6 — Post Verification Endpoint

**Endpoint:**
```
GET https://graph.facebook.com/v21.0/<PAGE_ID>_<POST_ID>
```

**Query parameters:**

| Parameter | Value | Required |
|---|---|---|
| `access_token` | Page-scoped Token | ✅ |
| `fields` | `effective_object_story_id` | ✅ |

**Response:**

```json
{
  "effective_object_story_id": "1028026590391757_122104756065264372",
  "id": "1028026590391757_122104756065264372"
}
```

**Purpose:** Confirms the post is publicly accessible. A successful response here means the post is live and indexed. This is the final confirmation step before showing success to the user.

> The live post URL follows this pattern:
> `https://www.facebook.com/{PAGE_ID}/posts/{POST_ID}`
> where `POST_ID` is the second part of the composite ID after the underscore.

---

## 10. CTA Button Reference

The `call_to_action.type` field in Step 3 accepts the following values:

| Type | Button Label |
|---|---|
| `LEARN_MORE` | Learn More |
| `SHOP_NOW` | Shop Now |
| `SIGN_UP` | Sign Up |
| `CONTACT_US` | Contact Us |
| `WATCH_MORE` | Watch More |
| `BOOK_TRAVEL` | Book Now |
| `DOWNLOAD` | Download |
| `GET_OFFER` | Get Offer |
| `SUBSCRIBE` | Subscribe |
| `APPLY_NOW` | Apply Now |
| `GET_QUOTE` | Get Quote |
| `WATCH_VIDEO` | Watch Video |
| `OPEN_LINK` | Open Link |

> Not all CTA types are compatible with all destination URLs. For example, `BOOK_TRAVEL` is optimized for travel-related landing pages. `LEARN_MORE` is the most universally compatible option.

---

## 11. Error Code Reference

### Facebook API error structure

All errors follow this shape:

```json
{
  "error": {
    "message": "Human-readable message",
    "type": "OAuthException",
    "code": 190,
    "fbtrace_id": "AbCdEfGhIjKl"
  }
}
```

### Common errors by step

| Code | Type | Message (example) | Cause | Resolution |
|---|---|---|---|---|
| `190` | `OAuthException` | Invalid OAuth access token | Token expired or malformed | Re-authenticate and get a fresh token |
| `200` | `OAuthException` | Permission error | Token missing required permission | Re-login with all 3 required scopes |
| `100` | `GraphMethodException` | Invalid parameter | Missing or incorrect field in request | Check the request body against this guide |
| `273` | `OAuthException` | Ad account is restricted | Account disabled or unsettled | Use a different ad account or resolve billing |
| `368` | `GraphMethodException` | Blocked from posting | Page posting restricted by Facebook | Check Page status in Meta Business Suite |
| `506` | `GraphMethodException` | Duplicate post | Identical content posted recently | Modify the headline, caption, or image |
| `1487390` | `GraphMethodException` | Creative not yet ready | `effective_object_story_id` not populated | Continue polling in Step 4 |
| `2` | `GraphMethodException` | Service temporarily unavailable | Meta server error | Retry the request after a short delay |
| `4` | `GraphMethodException` | Application request limit reached | Too many API calls in a short window | Back off and retry after the rate limit window |

### Step-specific error notes

**Step 2 (Image Upload):**
- A `200 OK` response with no `hash` in the body usually means the multipart field name was wrong. Check the `name` attribute in `Content-Disposition`.
- Image too large (>30MB) returns a `100` error with message about file size.

**Step 3 (Ad Creative):**
- If `image_hash` does not belong to the Ad Account used in the URL, returns `100` with an invalid parameter message.
- If `page_id` does not match the token's associated page, returns `200` permission error.

**Step 4 (Polling):**
- Error code `1487390` during polling means the creative failed processing. This is different from the field simply being absent — if this code appears, do not continue polling; the creative must be recreated.

---

## 12. Rate Limits & Quotas

Meta enforces rate limits on the Graph API. Exceeding them returns error code `4` or `32`.

| Limit Type | Details |
|---|---|
| **App-level** | 200 calls per hour per User token |
| **Ad Account-level** | Tracked via `x-ad-account-usage` response header |
| **Page-level** | 4,800 calls per 24 hours per Page token |
| **Burst** | Short bursts beyond the limit are tolerated briefly, then throttled |

The `x-ad-account-usage` header is returned on every Ad Account API call and shows current usage:

```json
{
  "acc_id_util_pct": 0,
  "reset_time_duration": 0,
  "ads_api_access_tier": "standard_access"
}
```

> `acc_id_util_pct` is the percentage of the Ad Account's API quota currently used. Stay well below 100 to avoid throttling.

---

## 13. Image Specifications

| Property | Requirement |
|---|---|
| **Recommended dimensions** | 1080 × 1080 px |
| **Minimum dimensions** | 600 × 600 px |
| **Aspect ratio** | 1:1 (square) for this workflow |
| **Supported formats** | JPG, PNG |
| **Maximum file size** | 30 MB |
| **Color space** | sRGB recommended |
| **Text overlay** | Facebook limits text to less than 20% of the image area for best delivery |

> Using the `adimages` endpoint with `__cppo=1` is what preserves the 1:1 ratio. If uploaded through the standard Page media endpoint instead, Facebook will crop to 1.91:1 regardless of the original dimensions.

---

## 14. Security Notes

These are data-level considerations, not implementation advice. Developers should factor them into whatever design they choose.

**Token sensitivity:**
- User Access Tokens grant access to all Ad Accounts, Pages, and advertising data associated with the user.
- Page-scoped tokens grant narrower access but are still sensitive — they can post on behalf of a Page.
- Short-lived tokens expire after approximately 1–2 hours. Long-lived tokens last up to 60 days.

**Token exposure risks:**
- Tokens embedded in client-side JavaScript are visible to anyone who inspects the page source.
- Tokens included in URL query parameters are logged by servers, browsers, and proxies.
- Tokens committed to public version control repositories are considered fully compromised.

**`fbtrace_id`:**
- Every API error response includes a `fbtrace_id`. This ID can be provided to Meta developer support to trace a specific failed request. Keep these IDs accessible in logs for debugging.

---

<div align="center">

← Back to [README.md](./README.md) for the full system overview and API workflow

</div>
