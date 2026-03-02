// FB Tools v3 — bridge.js
// REPLACE "YOUR_EXTENSION_ID_HERE" with your actual extension ID from chrome://extensions

const EXTENSION_ID = "YOUR_EXTENSION_ID_HERE";

class FBBridge {
  constructor() {
    this.ready    = false;
    this._pending = {};
    this._counter = 0;
    this._cbs     = [];
    this._listen();
  }

  _listen() {
    window.addEventListener("message", (e) => {
      if (e.source !== window) return;

      if (e.data?.type === "FB_TOOLS_READY") {
        if (!this.ready) {
          this.ready = true;
          this._cbs.forEach(cb => cb());
          document.getElementById("ext-warning")?.remove();
        }
        return;
      }

      if (e.data?._fbtools && e.data?._response) {
        const resolve = this._pending[e.data._msgId];
        if (resolve) {
          resolve(e.data.response);
          delete this._pending[e.data._msgId];
        }
      }
    });

    setTimeout(() => { if (!this.ready) this._warn(); }, 3000);
  }

  onReady(cb) { if (this.ready) cb(); else this._cbs.push(cb); }

  _sendViaContentScript(payload) {
    return new Promise((resolve) => {
      const _msgId = ++this._counter;
      this._pending[_msgId] = resolve;
      window.postMessage({ _fbtools: true, _msgId, ...payload }, "*");
      setTimeout(() => {
        if (this._pending[_msgId]) {
          delete this._pending[_msgId];
          resolve(null); // will trigger direct fallback
        }
      }, 10000);
    });
  }

  _sendDirect(payload) {
    return new Promise((resolve) => {
      if (typeof chrome === "undefined" || !chrome?.runtime?.sendMessage) {
        resolve({ ok: false, error: "chrome.runtime not available" });
        return;
      }
      try {
        chrome.runtime.sendMessage(EXTENSION_ID, { _fbtools: true, ...payload }, (r) => {
          if (chrome.runtime.lastError) resolve({ ok: false, error: chrome.runtime.lastError.message });
          else resolve(r);
        });
      } catch(e) { resolve({ ok: false, error: e.message }); }
    });
  }

  async call(action, params = {}) {
    if (!this.ready) throw new Error("Extension not detected. Please install the FB Tools extension and refresh this page.");

    let res = await this._sendViaContentScript({ action, ...params });

    // If content script relay timed out, try direct
    if (!res) {
      res = await this._sendDirect({ action, ...params });
    }

    if (!res) throw new Error("No response from extension. Try refreshing the page.");
    if (res.ok === false) throw new Error(res.error || "Extension returned an error.");
    return res.result;
  }

  _warn() {
    if (document.getElementById("ext-warning")) return;
    const b = document.createElement("div");
    b.id = "ext-warning";
    b.style.cssText = "position:fixed;top:0;left:0;right:0;z-index:9999;background:#fff8e1;border-bottom:2px solid #f59e0b;padding:10px 20px;font-size:13px;font-family:sans-serif;display:flex;align-items:center;justify-content:space-between;gap:12px;";
    b.innerHTML = `<span>⚠️ <strong>FB Tools Extension not detected.</strong> Open <code>chrome://extensions</code> → Load unpacked → select the <code>extension/</code> folder → then <strong>refresh this page</strong>.</span><button onclick="this.parentElement.remove()" style="background:none;border:none;font-size:18px;cursor:pointer;color:#92400e;">✕</button>`;
    document.body.prepend(b);
  }
}

window.Bridge = new FBBridge();
