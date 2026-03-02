const Utils = {
  humanDelay: (min, max) => new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * (max - min + 1)) + min)),
  
  formatFileSize: (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  validateVideo: (file) => {
    const errors = [];
    if (!file.type.startsWith('video/')) errors.push('File must be a video');
    if (file.size > 1 * 1024 * 1024 * 1024) errors.push('Video must be under 1GB');
    return { valid: errors.length === 0, errors };
  },

  validateImage: (file) => {
    const errors = [];
    if (!file.type.startsWith('image/')) errors.push('File must be an image');
    if (file.size > 30 * 1024 * 1024) errors.push('Image must be under 30MB');
    return { valid: errors.length === 0, errors };
  },

  showProgress: (text, percent) => {
    const progressSection = document.getElementById('progress-section');
    const progressText = document.getElementById('progress-text');
    const progressBar = document.getElementById('progress-bar');
    if (progressSection) progressSection.classList.remove('hidden');
    if (progressText) progressText.textContent = text;
    if (progressBar) progressBar.value = percent;
  },

  showSuccess: (postUrl) => {
    document.getElementById('error-box')?.classList.add('hidden');
    const successBox = document.getElementById('success-box');
    const successLink = document.getElementById('success-link');
    if (successBox) successBox.classList.remove('hidden');
    if (successLink) { successLink.href = postUrl; successLink.textContent = postUrl; }
  },

  showError: (message) => {
    document.getElementById('success-box')?.classList.add('hidden');
    const errorBox = document.getElementById('error-box');
    const errorText = document.getElementById('error-text');
    if (errorBox) errorBox.classList.remove('hidden');
    if (errorText) errorText.textContent = message;
  },

  hideStatus: () => {
    document.getElementById('success-box')?.classList.add('hidden');
    document.getElementById('error-box')?.classList.add('hidden');
    document.getElementById('progress-section')?.classList.add('hidden');
  },

  escapeHtml: (text) => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};
window.Utils = Utils;
