// FB Advanced Posting Tools v2 — extension-bridge.js (FIXED)

// *** PASTE YOUR CHROME EXTENSION ID HERE ***
const EXTENSION_ID = "eaaoimekgoiflccnjaepjlkhmckoaebo";

class FBToolsExtension {
  constructor() {
    this.available = false;
    this.msgIdCounter = 0;
    this._listeners = {};
    this._readyCallbacks = [];
    this._init();
  }

  _init() {
    window.addEventListener("message", (event) => {
      if (event.source !== window) return;

      // Catch the READY signal sent by content.js (fires multiple times)
      if (event.data?.type === "FB_TOOLS_EXTENSION_READY") {
        if (!this.available) {
          this.available = true;
          console.log("[FBTools] Extension detected ✅");
          document.getElementById("ext-warning")?.remove();
          this._readyCallbacks.forEach(cb => cb());
        }
        return;
      }

      // Catch responses forwarded back from content.js
      if (event.data?.type === "FB_TOOLS_RESPONSE") {
        const { _msgId, response } = event.data;
        if (this._listeners[_msgId]) {
          this._listeners[_msgId](response);
          delete this._listeners[_msgId];
        }
      }
    });

    // Show warning after 3 seconds if still not detected
    setTimeout(() => {
      if (!this.available) {
        this._showWarning();
      }
    }, 3000);
  }

  onReady(cb) {
    if (this.available) cb();
    else this._readyCallbacks.push(cb);
  }

  _sendMessage(payload) {
    return new Promise((resolve) => {
      const _msgId = ++this.msgIdCounter;
      this._listeners[_msgId] = resolve;

      window.postMessage({ ...payload, _msgId }, "*");

      // Timeout after 8 seconds
      setTimeout(() => {
        if (this._listeners[_msgId]) {
          delete this._listeners[_msgId];
          resolve({ error: "Extension response timeout — make sure extension is enabled and page is reloaded." });
        }
      }, 8000);
    });
  }

  async getFbCookies() {
    if (!this.available) {
      return { error: "Extension not detected. Please install the extension and refresh the page." };
    }
    return this._sendMessage({ type: "GET_FB_COOKIE" });
  }

  async getUserId() {
    if (!this.available) {
      return { error: "Extension not detected." };
    }
    return this._sendMessage({ type: "GET_USER_ID" });
  }

  _showWarning() {
    if (document.getElementById("ext-warning")) return;
    const bar = document.createElement("div");
    bar.id = "ext-warning";
    bar.style.cssText = `
      position:fixed;top:0;left:0;right:0;z-index:9999;
      background:#fff8e1;border-bottom:2px solid #f59e0b;
      padding:10px 20px;font-family:sans-serif;font-size:13px;
      display:flex;align-items:center;justify-content:space-between;gap:12px;
    `;
    bar.innerHTML = `
      <span>⚠️ <strong>FB Tools Extension not detected.</strong>
        Make sure it's loaded at <code style="background:#fff;padding:2px 6px;border-radius:4px;">chrome://extensions</code>
        and that you've reloaded the extension after updating manifest.json. Then <strong>refresh this page</strong>.
      </span>
      <button onclick="this.parentElement.remove()"
        style="background:none;border:none;cursor:pointer;font-size:18px;color:#92400e;">✕</button>
    `;
    document.body.prepend(bar);
  }
}

window.FBExtension = new FBToolsExtension();
