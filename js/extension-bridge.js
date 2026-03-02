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

  async sendMessage(type, data = {}) {
    if (!this.extensionId) {
      throw new Error('Extension ID is missing. Please enter it in the banner at the top of the page.');
    }

    return new Promise((resolve, reject) => {
      try {
        chrome.runtime.sendMessage(
          this.extensionId,
          { type, ...data },
          (response) => {
            // Check for generic Chrome errors
            if (chrome.runtime.lastError) {
              console.error('Chrome Runtime Error:', chrome.runtime.lastError.message);
              reject(new Error('Extension Error: ' + chrome.runtime.lastError.message));
            } else if (!response) {
              console.error('No response received');
              reject(new Error('No response. Extension might be disabled or ID is wrong.'));
            } else {
              console.log('Extension Response:', response); // Log success
              resolve(response);
            }
          }
        );
      } catch (e) {
        console.error('Send Message Crash:', e);
        reject(e);
      }
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
    alert('FB Tools: Please enter your Chrome Extension ID in the banner below.');
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

  // 2. Set the ID
  window.FBExtension.extensionId = storedId;

  // 3. Test connection
  try {
    console.log('Testing connection with ID:', storedId);
    const response = await window.FBExtension.sendMessage('PING');
    if (response && response.success) {
      console.log('Extension connected successfully');
      banner.classList.add('hidden');
    } else {
      throw new Error('Invalid PING response');
    }
  } catch (e) {
    console.error('Connection Test Failed:', e);
    banner.classList.remove('hidden');
    // Show specific error in banner
    const p = banner.querySelector('p');
    if (p) p.innerHTML = `<strong style="color:red">Connection Failed:</strong> ${e.message}. <br>Check if Extension ID is correct and if you reloaded the extension after updating manifest.json.`;
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
