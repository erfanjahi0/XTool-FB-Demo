// FB Tools v3 — account-manager.js

class AccountManager {
  constructor() {
    this.connected    = false;
    this.userId       = null;
    this.pages        = [];
    this.adAccounts   = [];
    this.selectedPage = null;
    this.selectedAd   = null;
    this._cbs         = [];
  }

  onConnect(cb) { this._cbs.push(cb); }

  async connect(opts = {}) {
    const btn = document.getElementById("btn-connect");
    const stTx = document.getElementById("account-status-text");
    const stEl = document.getElementById("account-status");

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Connecting…';

    try {
      // Single call — extension gets cookies, pages, and ad accounts all at once
      const result = await Bridge.call("init");

      this.userId     = result.userId;
      this.pages      = result.pages || [];
      this.adAccounts = result.adAccounts || [];

      if (!this.pages.length) throw new Error("No Facebook Pages found on your account. Make sure you are an admin of at least one Page.");

      this.selectedPage = this.pages[0];
      if (this.adAccounts.length) this.selectedAd = this.adAccounts[0];

      this.connected = true;

      // Update status UI
      if (stEl) { stEl.className = "account-status connected mt-12"; stEl.querySelector(".status-dot")?.classList.add("live"); }
      if (stTx) stTx.textContent = `Connected — User ID: ${this.userId}`;
      btn.innerHTML = "✅ Connected";
      btn.style.background = "linear-gradient(135deg,#36a420,#2d8a18)";

      // Render selectors
      this._renderPages();
      if (opts.needAdAccount) this._renderAds();

      this._cbs.forEach(cb => cb());

    } catch (err) {
      btn.disabled = false;
      btn.innerHTML = "Connect My Facebook Account";
      btn.style.background = "";
      showError("❌ " + err.message);
    }
  }

  _renderPages() {
    const wrap = document.getElementById("page-selector-wrap");
    if (!wrap) return;
    wrap.innerHTML = `
      <div class="auto-select-row">
        <div class="auto-selected-badge">
          <span class="auto-dot">●</span>
          <span id="lbl-page">Auto-selected: <strong>${this._t(this.selectedPage.name)}</strong></span>
        </div>
        ${this.pages.length > 1 ? `<button class="btn-override" id="btn-pg" onclick="AM._tog('pg-panel','btn-pg')">Change ▾</button>` : ""}
      </div>
      ${this.pages.length > 1 ? `
      <div id="pg-panel" class="override-panel hidden">
        <select onchange="AM._setPage(this.value)">
          ${this.pages.map((p,i) => `<option value="${i}">${p.name}</option>`).join("")}
        </select>
        <p style="font-size:.78rem;color:var(--text-muted);margin-top:6px;">${this.pages.length} pages found</p>
      </div>` : ""}`;
    const card = document.getElementById("page-card") || document.getElementById("accounts-card");
    if (card) card.style.display = "block";
  }

  _renderAds() {
    const wrap = document.getElementById("adaccount-selector-wrap");
    if (!wrap) return;
    if (!this.adAccounts.length) {
      wrap.innerHTML = `<div class="status-box warning-box visible" style="margin-top:8px;"><span class="status-box-icon">⚠️</span><div>No active Ad Account found. <a href="https://www.facebook.com/adsmanager" target="_blank">Create one free at Ads Manager</a> — no payment needed.</div></div>`;
      return;
    }
    wrap.innerHTML = `
      <div class="auto-select-row">
        <div class="auto-selected-badge">
          <span class="auto-dot">●</span>
          <span id="lbl-ad">Auto-selected: <strong>${this._t(this.selectedAd.name || this.selectedAd.id)}</strong></span>
        </div>
        ${this.adAccounts.length > 1 ? `<button class="btn-override" id="btn-ad" onclick="AM._tog('ad-panel','btn-ad')">Change ▾</button>` : ""}
      </div>
      ${this.adAccounts.length > 1 ? `
      <div id="ad-panel" class="override-panel hidden">
        <select onchange="AM._setAd(this.value)">
          ${this.adAccounts.map((a,i) => `<option value="${i}">${a.name || a.id}</option>`).join("")}
        </select>
        <p style="font-size:.78rem;color:var(--text-muted);margin-top:6px;">${this.adAccounts.length} ad accounts found</p>
      </div>` : ""}`;
    document.getElementById("accounts-card")?.style.setProperty("display","block");
  }

  _tog(panelId, btnId) {
    const p = document.getElementById(panelId);
    const b = document.getElementById(btnId);
    if (!p) return;
    const wasHidden = p.classList.contains("hidden");
    p.classList.toggle("hidden", !wasHidden);
    if (b) b.textContent = wasHidden ? "Close ▴" : "Change ▾";
  }

  _setPage(idx) {
    this.selectedPage = this.pages[parseInt(idx)];
    const l = document.getElementById("lbl-page");
    if (l) l.innerHTML = `Selected: <strong>${this._t(this.selectedPage.name)}</strong>`;
    document.dispatchEvent(new CustomEvent("am:update"));
  }

  _setAd(idx) {
    this.selectedAd = this.adAccounts[parseInt(idx)];
    const l = document.getElementById("lbl-ad");
    if (l) l.innerHTML = `Selected: <strong>${this._t(this.selectedAd.name || this.selectedAd.id)}</strong>`;
    document.dispatchEvent(new CustomEvent("am:update"));
  }

  getPageId()    { return this.selectedPage?.id || null; }
  getPageToken() { return this.selectedPage?.access_token || null; }
  getAdId()      { return (this.selectedAd?.id || "").replace("act_",""); }
  _t(s)          { return s?.length > 32 ? s.slice(0,32)+"…" : (s||""); }
}

window.AM = new AccountManager();
