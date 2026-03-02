# FB Advanced Posting Tools v2

A Chrome Extension + static website toolset for creating advanced Facebook posts on your own Pages.

## Tools
| Tool | Description |
|---|---|
| Video Carousel | Post 3–10 videos as a swipeable carousel |
| Swipe Up Video | Mobile video with swipe-up CTA link overlay |
| 2-Card Carousel | 2 videos, larger mobile card layout |
| One Card V2 | Single image with fake album count badge |

## What's New in v2
- ✅ **Auto Page selection** — your first/only Page is selected instantly on connect
- ✅ **Auto Ad Account selection** — same for Ad Accounts on Tool 4
- ✅ **Manual override** — click "Change" to pick a different Page or Ad Account
- ✅ **Corrected Ad Account info** — no payment method required, just an active account
- ✅ **Vercel deploy support** — manifest updated for HTTPS origins
- ✅ `account-manager.js` — new dedicated class for all account logic

## Quick Start

1. Load `extension/` as unpacked in `chrome://extensions`
2. Copy Extension ID → paste into `website/js/extension-bridge.js`
3. Serve locally: `cd website && python3 -m http.server 8000`
4. Or deploy to Vercel — see **DEPLOY.md**

## Tech Stack
- Plain HTML + CSS + Vanilla JS (no frameworks, no build step)
- Chrome Extension Manifest V3
- Facebook Graph API v18.0 (page token)
- Facebook Ads API (adimages + adcreatives for Tool 4)

## For Personal Use Only
This tool uses your own Facebook session cookies for authenticated API calls.
Use only on accounts and Pages you own or admin.
