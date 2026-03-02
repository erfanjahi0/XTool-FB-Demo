// FB Advanced Posting Tools v2 — account-manager.js
// Handles connecting, auto-selecting pages & ad accounts, with manual override UI

class AccountManager {
  constructor() {
    this.pages       = [];   // [{ id, name, access_token }]
    this.adAccounts  = [];   // [{ id, name, account_status }]
    this.selectedPage       = null;  // { id, name, access_token }
    this.selectedAdAccount  = null;  // { id, name }
    this.connected   = false;
    this._onConnectCallbacks = [];
  }

  onConnect(cb) { this._onConnectCallbacks.push(cb); }

  // ── MAIN CONNECT FLOW ─────────────────────────────────────────────────
  async connect(opts = {}) {
    const { needAdAccount = false } = opts;
    const btn        = document.getElementById("btn-connect");
    const statusEl   = document.getElementById("account-status");
    const statusText = document.getElementById("account-status-text");

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Connecting…';

    try {
      const result = await window.FB_API.initialize();

      // Mark connected
      this.connected = true;
      if (statusEl) {
        statusEl.className = "account-status connected mt-12";
        statusEl.querySelector?.(".status-dot")?.classList.add("live");
      }
      if (statusText) statusText.textContent = `Connected — User ID: ${result.userId}`;
      btn.innerHTML = "✅ Connected";
      btn.style.background = "linear-gradient(135deg,#36a420,#2d8a18)";

      // Load pages
      await this._loadPages();

      // Load ad accounts if needed
      if (needAdAccount) await this._loadAdAccounts();

      this._onConnectCallbacks.forEach(cb => cb());

    } catch (err) {
      btn.disabled = false;
      btn.innerHTML = "Connect My Facebook Account";
      btn.style.background = "";
      showError(parseFBError(err));
    }
  }

  // ── LOAD PAGES ────────────────────────────────────────────────────────
  async _loadPages() {
    try {
      const data = await window.FB_API.getMyPages();
      this.pages = data?.data || [];
      this._renderPageSelector();
    } catch (err) {
      showError("Failed to load pages: " + parseFBError(err));
    }
  }

  // ── LOAD AD ACCOUNTS ─────────────────────────────────────────────────
  async _loadAdAccounts() {
    try {
      this.adAccounts = await window.FB_API.getAdAccounts();
      this._renderAdAccountSelector();
    } catch (err) {
      showError("Failed to load ad accounts: " + parseFBError(err));
    }
  }

  // ── PAGE SELECTOR RENDER ──────────────────────────────────────────────
  _renderPageSelector() {
    const container = document.getElementById("page-selector-wrap");
    if (!container) return;

    if (!this.pages.length) {
      container.innerHTML = `
        <div class="status-box error-box visible" style="margin-top:8px;">
          <span class="status-box-icon">❌</span>
          <div>No Facebook Pages found on your account. You need to be an admin of at least one Page.</div>
        </div>`;
      return;
    }

    // Auto-select first page
    this.selectedPage = this.pages[0];

    container.innerHTML = `
      <div class="auto-select-row">
        <div class="auto-selected-badge">
          <span class="auto-dot">●</span>
          <span id="auto-page-label">Auto-selected: <strong>${this._truncate(this.pages[0].name, 28)}</strong></span>
        </div>
        <button class="btn-override" id="btn-override-page" onclick="window.AM._togglePageOverride()">
          Change ▾
        </button>
      </div>
      <div id="page-override-panel" class="override-panel hidden">
        <label style="font-size:.82rem;font-weight:500;color:var(--text-muted);margin-bottom:6px;display:block;">
          Select a different Page:
        </label>
        <select id="page-select-override" onchange="window.AM._onPageOverride(this)">
          ${this.pages.map((p, i) =>
            `<option value="${i}" ${i === 0 ? "selected" : ""}>${p.name}</option>`
          ).join("")}
        </select>
        <p style="font-size:.78rem;color:var(--text-muted);margin-top:6px;">
          ${this.pages.length} page${this.pages.length !== 1 ? "s" : ""} found on your account.
        </p>
      </div>
    `;
  }

  _togglePageOverride() {
    const panel = document.getElementById("page-override-panel");
    const btn   = document.getElementById("btn-override-page");
    if (!panel) return;
    const open = !panel.classList.contains("hidden");
    panel.classList.toggle("hidden", open);
    btn.textContent = open ? "Change ▾" : "Close ▴";
  }

  _onPageOverride(sel) {
    const idx = parseInt(sel.value);
    this.selectedPage = this.pages[idx];
    const label = document.getElementById("auto-page-label");
    if (label) label.innerHTML = `Selected: <strong>${this._truncate(this.selectedPage.name, 28)}</strong>`;
    this._triggerUpdate();
  }

  // ── AD ACCOUNT SELECTOR RENDER ────────────────────────────────────────
  _renderAdAccountSelector() {
    const container = document.getElementById("adaccount-selector-wrap");
    if (!container) return;

    if (!this.adAccounts.length) {
      container.innerHTML = `
        <div class="status-box warning-box visible" style="margin-top:8px;">
          <span class="status-box-icon">⚠️</span>
          <div>
            No active Ad Account found. This tool needs one.<br>
            <a href="https://www.facebook.com/adsmanager" target="_blank">Create an Ad Account at Ads Manager</a>
            — no payment method required to create the account.
          </div>
        </div>`;
      return;
    }

    // Auto-select first account
    this.selectedAdAccount = this.adAccounts[0];

    container.innerHTML = `
      <div class="auto-select-row">
        <div class="auto-selected-badge">
          <span class="auto-dot">●</span>
          <span id="auto-adacct-label">Auto-selected: <strong>${this._truncate(this.adAccounts[0].name || this.adAccounts[0].id, 28)}</strong></span>
        </div>
        <button class="btn-override" id="btn-override-adacct" onclick="window.AM._toggleAdAccountOverride()">
          Change ▾
        </button>
      </div>
      <div id="adaccount-override-panel" class="override-panel hidden">
        <label style="font-size:.82rem;font-weight:500;color:var(--text-muted);margin-bottom:6px;display:block;">
          Select a different Ad Account:
        </label>
        <select id="adaccount-select-override" onchange="window.AM._onAdAccountOverride(this)">
          ${this.adAccounts.map((a, i) =>
            `<option value="${i}" ${i === 0 ? "selected" : ""}>${a.name || a.id} (${a.id})</option>`
          ).join("")}
        </select>
        <p style="font-size:.78rem;color:var(--text-muted);margin-top:6px;">
          ${this.adAccounts.length} active account${this.adAccounts.length !== 1 ? "s" : ""} found.
        </p>
      </div>
    `;
  }

  _toggleAdAccountOverride() {
    const panel = document.getElementById("adaccount-override-panel");
    const btn   = document.getElementById("btn-override-adacct");
    if (!panel) return;
    const open = !panel.classList.contains("hidden");
    panel.classList.toggle("hidden", open);
    btn.textContent = open ? "Change ▾" : "Close ▴";
  }

  _onAdAccountOverride(sel) {
    const idx = parseInt(sel.value);
    this.selectedAdAccount = this.adAccounts[idx];
    const label = document.getElementById("auto-adacct-label");
    if (label) label.innerHTML = `Selected: <strong>${this._truncate(this.selectedAdAccount.name || this.selectedAdAccount.id, 28)}</strong>`;
    this._triggerUpdate();
  }

  // ── GETTERS ───────────────────────────────────────────────────────────
  getPageId()      { return this.selectedPage?.id || null; }
  getPageToken()   { return this.selectedPage?.access_token || null; }
  getAdAccountId() {
    const id = this.selectedAdAccount?.id || "";
    return id.replace("act_", "");
  }

  // ── HELPERS ───────────────────────────────────────────────────────────
  _truncate(str, max) {
    return str?.length > max ? str.slice(0, max) + "…" : str;
  }

  _triggerUpdate() {
    // Fire a custom event so each tool page can re-validate its post button
    document.dispatchEvent(new CustomEvent("am:updated"));
  }
}

// Global singleton
window.AM = new AccountManager();
