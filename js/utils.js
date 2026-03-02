// FB Advanced Posting Tools v2 — utils.js

function humanDelay(min = 800, max = 2000) {
  return new Promise(r => setTimeout(r, Math.floor(Math.random() * (max - min + 1)) + min));
}

function formatFileSize(bytes) {
  if (!bytes) return "0 B";
  const u = ["B","KB","MB","GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${u[i]}`;
}

function validateVideo(file) {
  if (!file) return { valid: false, error: "No file selected." };
  if (!file.type.startsWith("video/"))
    return { valid: false, error: `"${file.name}" is not a video file. Please select an MP4.` };
  if (file.size > 1 * 1024 * 1024 * 1024)
    return { valid: false, error: `"${file.name}" exceeds 1 GB limit (${formatFileSize(file.size)}).` };
  return { valid: true };
}

function validateImage(file) {
  if (!file) return { valid: false, error: "No file selected." };
  if (!file.type.startsWith("image/"))
    return { valid: false, error: `"${file.name}" is not an image file.` };
  if (file.size > 30 * 1024 * 1024)
    return { valid: false, error: `"${file.name}" exceeds 30 MB limit.` };
  return { valid: true };
}

function showProgress(text, percent) {
  const s = document.getElementById("progress-section");
  const t = document.getElementById("progress-text");
  const b = document.getElementById("progress-bar");
  if (s) s.classList.add("visible");
  if (t) t.textContent = text;
  if (b) b.value = percent;
}

function hideProgress() {
  document.getElementById("progress-section")?.classList.remove("visible");
}

function showSuccess(postUrl, message = "Post created successfully!") {
  hideProgress();
  document.getElementById("error-box")?.classList.remove("visible");
  const box = document.getElementById("success-box");
  if (!box) return;
  box.innerHTML = `
    <span class="status-box-icon">✅</span>
    <div>
      <strong>${message}</strong>
      ${postUrl ? `<br><a href="${postUrl}" target="_blank" rel="noopener">View post on Facebook →</a>` : ""}
    </div>`;
  box.classList.add("visible");
  box.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function showError(message) {
  hideProgress();
  const box = document.getElementById("error-box");
  if (!box) return;
  box.innerHTML = `<span class="status-box-icon">❌</span><div>${message}</div>`;
  box.classList.add("visible");
  box.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function clearMessages() {
  document.getElementById("success-box")?.classList.remove("visible");
  document.getElementById("error-box")?.classList.remove("visible");
  hideProgress();
}

function parseFBError(err) {
  const msg = err?.message || String(err);
  const errData = err?.response || {};
  if (msg.includes("not logged in") || msg.includes("OAuthException") || msg.includes("190"))
    return "You're not logged into Facebook, or your session expired. Please log in at facebook.com and try again.";
  if (msg.includes("Extension not") || msg.includes("timeout"))
    return "The FB Tools Chrome Extension is not responding. Make sure it's installed and enabled, then refresh.";
  if (msg.includes("No active ad account") || msg.includes("ad account"))
    return "No active Facebook Ad Account found. Visit <a href='https://www.facebook.com/adsmanager' target='_blank'>Ads Manager</a> to create one (no payment method required).";
  if (msg.includes("video") && msg.includes("process"))
    return "Your video is still processing on Facebook. Please wait a few minutes.";
  if (msg.includes("permission") || msg.includes("403"))
    return "Permission denied. Make sure your account has Page admin access.";
  if (msg.includes("rate limit") || msg.includes("429"))
    return "You've hit Facebook's rate limit. Please wait a few minutes before retrying.";
  if (errData?.error?.message)
    return `Facebook API error: ${errData.error.message} (code ${errData.error.code || "?"})`;
  return msg || "An unexpected error occurred. Please try again.";
}
