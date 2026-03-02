// Shows generic error
function showError(msg) {
  const box = document.getElementById("error-box");
  box.style.display = "flex";
  box.className = "status-box error-box visible";
  box.innerHTML = `<span class="status-box-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg></span><div>${msg}</div>`;
  setTimeout(() => box.style.display="none", 5000);
}

// Shows generic success
function showSuccess(id, msg) {
  const box = document.getElementById("success-box");
  box.style.display = "flex";
  box.className = "status-box success-box visible";
  box.innerHTML = `<span class="status-box-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></span><div><strong>Success!</strong> ${msg}</div>`;
}

function showProgress(txt, val) {
  const sec = document.getElementById("progress-section");
  sec.style.display = "block";
  document.getElementById("progress-text").textContent = txt;
  document.getElementById("progress-bar").value = val;
}

function formatFileSize(bytes) {
  if(bytes === 0) return '0 Bytes';
  const k = 1024, dm = 2, sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function validateVideo(file) {
  if(!file.type.startsWith("video/")) return {valid:false, error:"Not a video file"};
  if(file.size > 1024 * 1024 * 1024) return {valid:false, error:"File too large (Max 1GB)"};
  return {valid:true};
}

function validateImage(file) {
  if(!file.type.startsWith("image/")) return {valid:false, error:"Not an image file"};
  if(file.size > 30 * 1024 * 1024) return {valid:false, error:"File too large"};
  return {valid:true};
}

// Important: Convert File to Base64 to send to Extension
function serializeFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve({
      name: file.name,
      type: file.type,
      dataUrl: reader.result
    });
    reader.onerror = error => reject(error);
  });
}

function clearMessages() {
  document.getElementById("error-box").style.display="none";
  document.getElementById("success-box").style.display="none";
  document.getElementById("progress-section").style.display="none";
}
