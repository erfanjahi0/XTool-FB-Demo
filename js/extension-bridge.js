// FB Advanced Posting Tools v2 — extension-bridge.js

const EXTENSION_ID = "aafdmgmpcimldcldniphkhagjankmfmd";

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
      if (event.data?.type === "FB_TOOLS_EXTENSION_READY") {
        this.available = true;
        document.getElementById("ext-warning")?.remove();
        this._readyCallbacks.forEach(cb => cb());
      }
      if (event.data?.type === "FB_TOOLS_RESPONSE") {
        const { _msgId, response } = event.data;
        if (this._listeners[_msgId]) {
          this._listeners[_msgId](response);
          delete this._listeners[_msgId];
        }
      }
    });

    setTimeout(() => {
      if (!this.available) this._showWarning();
    }, 1800);
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
      setTimeout(() => {
        if (this._listeners[_msgId]) {
          delete this._listeners[_msgId];
          resolve({ error: "Extension response timeout" });
        }
      }, 6000);
    });
  }

  async getFbCookies() {
    if (this.available) return this._sendMessage({ type: "GET_FB_COOKIE" });
    return this._directMessage({ type: "GET_FB_COOKIE" });
  }

  _directMessage(payload) {
    return new Promise((resolve) => {
      if (typeof chrome === "undefined" || !chrome.runtime) {
        resolve({ error: "Extension not available" });
        return;
      }
      try {
        chrome.runtime.sendMessage(EXTENSION_ID, payload, (response) => {
          if (chrome.runtime.lastError) resolve({ error: chrome.runtime.lastError.message });
          else resolve(response);
        });
      } catch (e) {
        resolve({ error: e.message });
      }
    });
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
        Install it via <code style="background:#fff;padding:2px 6px;border-radius:4px;">chrome://extensions</code> → Load unpacked → select the <code>extension/</code> folder. Then refresh.
      </span>
      <button onclick="this.parentElement.remove()" style="background:none;border:none;cursor:pointer;font-size:18px;color:#92400e;">✕</button>
    `;
    document.body.prepend(bar);
  }
}

window.FBExtension = new FBToolsExtension();
