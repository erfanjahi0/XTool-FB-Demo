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

  async sendMessage(type, data = {}) {
    if (!this.extensionId) throw new Error('Extension ID not set');
    
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(this.extensionId, { type, ...data }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    });
  }

  async getFbCookies() { return this.sendMessage('GET_FB_COOKIE'); }
  async getCsrfToken(cookieString) { return this.sendMessage('GET_CSRF_TOKEN', { cookieString }); }
}

window.FBExtension = new FBToolsExtension();

// UI Logic
document.addEventListener('DOMContentLoaded', async () => {
  const banner = document.getElementById('extension-warning');
  if (!banner) return;

  const idInput = document.getElementById('extension-id-input');
  const idButton = document.getElementById('extension-id-save');
  const storedId = window.FBExtension.getStoredExtensionId();

  // 1. If no ID stored, show banner immediately
  if (!storedId) {
    banner.classList.remove('hidden');
    if (idButton && idInput) {
      idButton.onclick = () => {
        const newId = idInput.value.trim();
        if (newId) {
          window.FBExtension.setExtensionId(newId);
          location.reload();
        }
      };
    }
    return;
  }

  // 2. Set ID and Test Connection
  window.FBExtension.extensionId = storedId;

  try {
    const response = await window.FBExtension.sendMessage('PING');
    if (response && response.success) {
      console.log('Extension connected successfully');
      banner.classList.add('hidden');
    } else {
      throw new Error('Invalid response');
    }
  } catch (e) {
    console.error('Connection failed:', e);
    banner.classList.remove('hidden');
    const p = banner.querySelector('p');
    if (p) p.innerHTML = `<strong>Connection Failed.</strong> Check Extension ID.`;
    if (idInput) idInput.value = storedId;
    if (idButton) {
      idButton.onclick = () => {
        const newId = idInput.value.trim();
        if (newId) {
          window.FBExtension.setExtensionId(newId);
          location.reload();
        }
      };
    }
  }
});
