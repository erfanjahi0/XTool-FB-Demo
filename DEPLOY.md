# 🚀 Deploy FB Advanced Posting Tools to Vercel via GitHub

This guide walks you through hosting the website part on Vercel (free tier) using a GitHub repository.
The Chrome extension stays local — it never gets deployed anywhere.

---

## ✅ Prerequisites

- A [GitHub](https://github.com) account (free)
- A [Vercel](https://vercel.com) account (free — sign up with GitHub)
- Chrome with Developer Mode enabled
- Git installed locally (or use GitHub's web interface)

---

## Step 1 — Create a GitHub Repository

### Option A: GitHub Web UI (no Git needed)
1. Go to [github.com](https://github.com) → click **New repository**
2. Name it: `fb-posting-tools` (or anything you like)
3. Set it to **Private** (recommended — this is a personal tool)
4. Click **Create repository**
5. In the repo page, click **uploading an existing file**
6. Drag and drop the entire `website/` folder and `vercel.json` into the uploader
7. Click **Commit changes**

### Option B: Git CLI
```bash
# Inside the fb-tools-v2/ folder:
git init
git add .
git commit -m "Initial commit: FB Advanced Posting Tools v2"

# Create repo on GitHub first, then:
git remote add origin https://github.com/YOUR_USERNAME/fb-posting-tools.git
git branch -M main
git push -u origin main
```

---

## Step 2 — Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) and click **Sign Up** → **Continue with GitHub**
2. After signing in, click **Add New Project**
3. Find and select your `fb-posting-tools` repository → click **Import**
4. In the **Configure Project** screen:
   - **Framework Preset:** `Other` (it's a static site)
   - **Root Directory:** Leave blank (the `vercel.json` handles routing)
   - **Build Command:** Leave blank
   - **Output Directory:** Leave blank
5. Click **Deploy**

Vercel will deploy in ~30 seconds. You'll get a URL like:
```
https://fb-posting-tools-abc123.vercel.app
```

---

## Step 3 — Update the Chrome Extension for Your Vercel URL

Since your site is now on Vercel (not just localhost), you need to update the extension to allow your domain.

### 3a — Update manifest.json

Open `extension/manifest.json` and add your Vercel URL to:
- `host_permissions`
- `externally_connectable.matches`
- `content_scripts[0].matches`

```json
"host_permissions": [
  "*://*.facebook.com/*",
  "http://localhost/*",
  "http://127.0.0.1/*",
  "https://fb-posting-tools-abc123.vercel.app/*"
],
"externally_connectable": {
  "matches": [
    "http://localhost/*",
    "http://127.0.0.1/*",
    "https://fb-posting-tools-abc123.vercel.app/*"
  ]
},
"content_scripts": [{
  "matches": [
    "http://localhost/*",
    "http://127.0.0.1/*",
    "https://fb-posting-tools-abc123.vercel.app/*"
  ],
  ...
}]
```

> **Tip:** If you set up a custom domain (e.g. `https://fbtools.yourdomain.com`), use that URL instead.

### 3b — Reload the Extension
1. Open `chrome://extensions`
2. Find **FB Advanced Posting Tools**
3. Click the **refresh icon** (↺) to reload it with the updated manifest

---

## Step 4 — Set Your Extension ID in the Website Code

1. Go to `chrome://extensions`
2. Copy the **Extension ID** (long string of letters like `abcdefghijklmnopqrstuvwxyz123456`)
3. Open `website/js/extension-bridge.js`
4. Replace `"YOUR_EXTENSION_ID_HERE"` with your actual ID:
   ```js
   const EXTENSION_ID = "abcdefghijklmnopqrstuvwxyz123456";
   ```
5. Commit and push this change to GitHub — Vercel will automatically redeploy

```bash
git add website/js/extension-bridge.js
git commit -m "Set extension ID"
git push
```

Vercel auto-deploys every time you push to `main`. ✅

---

## Step 5 — Test It

1. Open your Vercel URL in Chrome
2. You should see the **FB Tools Extension detected** green banner
3. Navigate to any tool → click **Connect My Facebook Account**
4. Your Page and Ad Account will be auto-selected!

---

## 🔒 Custom Domain (Optional)

1. In Vercel → your project → **Settings → Domains**
2. Add your custom domain (e.g. `fbtools.yourdomain.com`)
3. Update your DNS records as instructed by Vercel
4. Update the extension manifest with the custom domain (Step 3a)
5. Reload the extension

---

## 🔄 Updating the Tools

Whenever you make changes to the website files:

```bash
git add .
git commit -m "Update: description of change"
git push
```

Vercel automatically deploys the update — usually live within 30 seconds.

---

## 🛠️ Troubleshooting

| Problem | Solution |
|---|---|
| "Extension not detected" on Vercel URL | Make sure you added the Vercel URL to `manifest.json` and reloaded the extension |
| "Origin not allowed" error | Double-check the Vercel URL in manifest exactly matches (no trailing slash issues) |
| Pages not loading | Make sure you're logged in to facebook.com in the same Chrome window |
| Vercel 404 on tool pages | Make sure `vercel.json` is in the repo root (not inside `website/`) |
| Extension ID not working | Re-copy from chrome://extensions — IDs change if you delete and re-install |

---

## 📁 Repository Structure for GitHub

Your GitHub repo should look like this:
```
fb-posting-tools/         ← repo root
├── vercel.json           ← Vercel config (MUST be here)
├── DEPLOY.md             ← This file
└── website/
    ├── index.html
    ├── css/
    │   └── style.css
    ├── js/
    │   ├── facebook-api.js
    │   ├── extension-bridge.js
    │   ├── account-manager.js
    │   └── utils.js
    └── tools/
        ├── video-carousel.html
        ├── swipe-up.html
        ├── two-card.html
        └── one-card-v2.html
```

> The `extension/` folder stays on your local machine only — never commit it to a public repo.

---

That's it! Your FB Advanced Posting Tools are now live on Vercel. 🎉
