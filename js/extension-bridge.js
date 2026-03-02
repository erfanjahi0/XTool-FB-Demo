// extension-bridge.js
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

  // We only use External Messaging (requires ID) for stability
  async sendMessage(type, data = {}) {
    if (!this.extensionId) {
      throw new Error('Extension ID not set. Please enter it in the warning banner.');
    }

    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        this.extensionId,
        { type, ...data },
        (response) => {
          // Check for generic Chrome errors
          if (chrome.runtime.lastError) {
            reject(new Error('Extension communication failed: ' + chrome.runtime.lastError.message));
          } else if (!response) {
            reject(new Error('No response received. Ensure you are logged into Facebook.'));
          } else {
            resolve(response);
          }
        }
      );
    });
  }

  async getFbCookies() { return this.sendMessage('GET_FB_COOKIE'); }
  async getCsrfToken(cookieString) { return this.sendMessage('GET_CSRF_TOKEN', { cookieString }); }
}

window.FBExtension = new FBToolsExtension();

// UI Logic for the Warning Banner
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

  // 2. If ID stored, set it
  window.FBExtension.extensionId = storedId;

  // 3. Try a test connection
  try {
    const response = await window.FBExtension.sendMessage('PING');
    if (response && response.success) {
      console.log('Extension connected successfully');
      banner.classList.add('hidden');
    } else {
      throw new Error('Invalid response');
    }
  } catch (e) {
    console.error('Extension connection failed:', e);
    banner.classList.remove('hidden');
    if (idInput) idInput.value = storedId; // Keep the old ID in input
    // Add error text to banner
    const p = banner.querySelector('p');
    if (p && !p.textContent.includes('Connection failed')) {
        p.innerHTML = `<strong>Connection failed.</strong> Check Extension ID or reload the extension.`;
    }
  }
});
