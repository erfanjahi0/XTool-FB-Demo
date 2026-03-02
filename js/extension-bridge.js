class FBToolsExtension {
  constructor() {
    this.extensionId = null;
    this.available = false;
  }

  setExtensionId(id) {
    this.extensionId = id;
    localStorage.setItem('fb_tools_extension_id', id);
  }

  getStoredExtensionId() {
    return localStorage.getItem('fb_tools_extension_id');
  }

  async checkAvailability() {
    const storedId = this.getStoredExtensionId();
    if (storedId) {
      this.extensionId = storedId;
      try {
        const response = await this.sendMessageExternal('PING');
        if (response && response.success) {
          this.available = true;
          return true;
        }
      } catch (e) { /* Ignore */ }
    }
    // Fallback to content script check
    return new Promise((resolve) => {
      const handleMessage = (event) => {
        if (event.data.type === 'FB_TOOLS_EXTENSION_READY') {
          window.removeEventListener('message', handleMessage);
          this.available = true;
          resolve(true);
        }
      };
      window.addEventListener('message', handleMessage);
      window.postMessage({ type: 'FB_TOOLS_CHECK_EXTENSION' }, '*');
      setTimeout(() => { window.removeEventListener('message', handleMessage); resolve(false); }, 2000);
    });
  }

  async sendMessageExternal(type, data = {}) {
    if (!this.extensionId) throw new Error('Extension ID not set');
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(this.extensionId, { type, ...data }, (response) => {
        if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
        else resolve(response);
      });
    });
  }

  async sendMessageViaContent(type, data = {}) {
    return new Promise((resolve, reject) => {
      const responseType = type + '_RESPONSE';
      const handleMessage = (event) => {
        if (event.data.type === responseType) {
          window.removeEventListener('message', handleMessage);
          if (event.data.error) reject(new Error(event.data.error));
          else resolve(event.data.response);
        }
      };
      window.addEventListener('message', handleMessage);
      window.postMessage({ type, ...data }, '*');
      setTimeout(() => { window.removeEventListener('message', handleMessage); reject(new Error('Timeout')); }, 30000);
    });
  }

  async sendMessage(type, data = {}) {
    if (this.extensionId && typeof chrome !== 'undefined' && chrome.runtime) {
      try { return await this.sendMessageExternal(type, data); } catch (e) { /* fallback */ }
    }
    return this.sendMessageViaContent(type, data);
  }

  async getFbCookies() { return this.sendMessage('GET_FB_COOKIE'); }
  async getCsrfToken(cookieString) { return this.sendMessage('GET_CSRF_TOKEN', { cookieString }); }
}

window.FBExtension = new FBToolsExtension();

document.addEventListener('DOMContentLoaded', async () => {
  const banner = document.getElementById('extension-warning');
  if (!banner) return;
  const storedId = window.FBExtension.getStoredExtensionId();
  if (storedId) window.FBExtension.extensionId = storedId;
  const available = await window.FBExtension.checkAvailability();
  if (!available) {
    banner.classList.remove('hidden');
    const idInput = document.getElementById('extension-id-input');
    const idButton = document.getElementById('extension-id-save');
    if (idInput && idButton) {
      idInput.value = storedId || '';
      idButton.addEventListener('click', () => {
        const newId = idInput.value.trim();
        if (newId) { window.FBExtension.setExtensionId(newId); location.reload(); }
      });
    }
  } else {
    banner.classList.add('hidden');
  }
});
