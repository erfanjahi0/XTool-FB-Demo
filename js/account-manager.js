const AM = {
  connected: false,
  token: null,
  user: null,
  pageId: null,
  adId: null,

  init() {
    const saved = localStorage.getItem("fb_tool_session");
    if (saved) {
      const s = JSON.parse(saved);
      this.token = s.token;
      this.user = s.user;
      this.connected = true;
      this.updateUI();
      this.notify();
    }
  },

  async connect(opts = {}) {
    showProgress("Connecting to Facebook...", 10);
    try {
      // 1. Ask Extension to get Token
      const response = await Bridge.call("connect");
      
      this.token = response.token;
      this.user = response.user;
      this.connected = true;
      
      // Save session
      localStorage.setItem("fb_tool_session", JSON.stringify({ token: this.token, user: this.user }));
      
      // 2. Fetch Pages automatically
      await this.fetchPages();
      
      if (opts.needAdAccount) {
        await this.fetchAdAccounts();
      }

      this.updateUI();
      this.notify();
      showSuccess(null, "Connected as " + this.user.name);
    } catch (err) {
      showError(err.message);
    }
  },

  async fetchPages() {
    // Ask extension to fetch pages
    const res = await Bridge.call("apiCall", {
      endpoint: "/me/accounts",
      token: this.token
    });
    
    const pages = res.data;
    if (pages.length > 0) {
      this.pageId = pages[0].id; // Default to first
      this.renderPageSelect(pages);
    } else {
      showError("No Facebook Pages found.");
    }
  },

  async fetchAdAccounts() {
    const res = await Bridge.call("apiCall", {
      endpoint: "/me/adaccounts",
      params: { fields: "name,id,account_status" },
      token: this.token
    });
    
    const ads = res.data;
    if (ads.length > 0) {
      this.adId = ads[0].id;
      this.renderAdSelect(ads);
    }
  },

  renderPageSelect(pages) {
    const wrap = document.getElementById("page-selector-wrap");
    if(!wrap) return;
    
    // Premium UI for selector
    let html = `
      <div class="custom-select-wrapper">
        <select id="sel-page" onchange="AM.pageId=this.value" class="premium-select">
          ${pages.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
        </select>
        <div class="select-icon">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </div>
      </div>
    `;
    wrap.innerHTML = html;
    document.getElementById("page-card").style.display = "block";
  },

  renderAdSelect(ads) {
    const wrap = document.getElementById("adaccount-selector-wrap");
    if(!wrap) return;
    let html = `
      <div class="custom-select-wrapper">
        <select id="sel-ad" onchange="AM.adId=this.value" class="premium-select">
          ${ads.map(a => `<option value="${a.id}">${a.name} (${a.id})</option>`).join('')}
        </select>
        <div class="select-icon"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="6 9 12 15 18 9"></polyline></svg></div>
      </div>
    `;
    wrap.innerHTML = html;
    document.getElementById("accounts-card").style.display = "block";
  },

  updateUI() {
    const dot = document.querySelector(".status-dot");
    const txt = document.getElementById("account-status-text");
    const btn = document.getElementById("btn-connect");
    
    if (this.connected) {
      if(dot) { dot.classList.add("live"); }
      if(txt) { txt.innerHTML = `Connected: <strong>${this.user.name}</strong>`; }
      if(btn) { btn.style.display = 'none'; }
    }
  },

  getPageId() { return this.pageId; },
  getPageToken() { return this.token; }, // Using user token is often sufficient for Page tasks if admin
  getAdId() { return this.adId; },

  onConnect(cb) { this._cb = cb; },
  notify() { if(this._cb) this._cb(); document.dispatchEvent(new CustomEvent("am:update")); }
};

// Initialize on load
document.addEventListener("DOMContentLoaded", () => AM.init());
