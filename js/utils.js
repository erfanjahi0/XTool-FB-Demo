// FB Tools v3 — utils.js

function formatFileSize(b) {
  if (!b) return "0 B";
  const u = ["B","KB","MB","GB"];
  const i = Math.floor(Math.log(b)/Math.log(1024));
  return `${(b/Math.pow(1024,i)).toFixed(1)} ${u[i]}`;
}

function validateVideo(file) {
  if (!file) return { valid:false, error:"No file selected." };
  if (!file.type.startsWith("video/")) return { valid:false, error:`"${file.name}" is not a video file.` };
  if (file.size > 1*1024*1024*1024) return { valid:false, error:`"${file.name}" exceeds 1 GB.` };
  return { valid:true };
}

function validateImage(file) {
  if (!file) return { valid:false, error:"No file selected." };
  if (!file.type.startsWith("image/")) return { valid:false, error:`"${file.name}" is not an image.` };
  if (file.size > 30*1024*1024) return { valid:false, error:`"${file.name}" exceeds 30 MB.` };
  return { valid:true };
}

// Convert a File to base64 string for sending to extension
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Serialize a File into a plain object the extension can handle
async function serializeFile(file) {
  const base64 = await fileToBase64(file);
  return { _base64: base64, _name: file.name, _type: file.type, _size: file.size };
}

function showProgress(text, pct) {
  const s = document.getElementById("progress-section");
  const t = document.getElementById("progress-text");
  const b = document.getElementById("progress-bar");
  if (s) s.classList.add("visible");
  if (t) t.textContent = text;
  if (b) b.value = pct;
}

function hideProgress() {
  document.getElementById("progress-section")?.classList.remove("visible");
}

function showSuccess(postId, msg = "Post created!") {
  hideProgress();
  document.getElementById("error-box")?.classList.remove("visible");
  const box = document.getElementById("success-box");
  if (!box) return;
  const url = postId ? `https://www.facebook.com/${postId}` : null;
  box.innerHTML = `<span class="status-box-icon">✅</span><div><strong>${msg}</strong>${url ? `<br><a href="${url}" target="_blank">View post on Facebook →</a>` : ""}</div>`;
  box.classList.add("visible");
  box.scrollIntoView({ behavior:"smooth", block:"nearest" });
}

function showError(msg) {
  hideProgress();
  const box = document.getElementById("error-box");
  if (!box) return;
  box.innerHTML = `<span class="status-box-icon">❌</span><div>${msg}</div>`;
  box.classList.add("visible");
  box.scrollIntoView({ behavior:"smooth", block:"nearest" });
}

function clearMessages() {
  document.getElementById("success-box")?.classList.remove("visible");
  document.getElementById("error-box")?.classList.remove("visible");
  hideProgress();
}
