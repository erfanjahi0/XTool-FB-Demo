/* ============================================================
   preview.js — Renders a pixel-accurate Facebook post preview
   from a normalized creative object.
   ============================================================ */

const Preview = {

  container: null,

  init(containerId) {
    this.container = document.getElementById(containerId);
  },

  clear() {
    if (this.container) this.container.innerHTML = "";
  },

  render(creative) {
    this.clear();
    if (!creative) return;

    const wrapper = document.createElement("div");
    wrapper.className = "fb-preview-post";

    // Post header
    wrapper.innerHTML = `
      <div class="fb-post-header">
        <div class="fb-page-avatar-placeholder">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V10h2v6zm4 0h-2v-4c0-.55-.45-1-1-1s-1 .45-1 1v4H9.5"/></svg>
        </div>
        <div class="fb-post-meta">
          <div class="fb-page-name">Your Page</div>
          <div class="fb-post-time">Just now · <span class="fb-globe-icon">🌐</span></div>
        </div>
        <div class="fb-post-more">···</div>
      </div>
    `;

    // Message/caption
    if (creative.message) {
      const msg = document.createElement("div");
      msg.className = "fb-post-message";
      msg.textContent = creative.message;
      wrapper.appendChild(msg);
    }

    // Creative body
    const body = this.renderBody(creative);
    if (body) wrapper.appendChild(body);

    // Reactions bar
    wrapper.insertAdjacentHTML("beforeend", `
      <div class="fb-reactions-bar">
        <div class="fb-reactions-left">
          <span class="fb-react-btn">👍 Like</span>
          <span class="fb-react-btn">💬 Comment</span>
          <span class="fb-react-btn">↗️ Share</span>
        </div>
      </div>
    `);

    // Type badge
    const badge = document.createElement("div");
    badge.className = `fb-type-badge fb-type-${creative.type}`;
    badge.textContent = this.typeLabel(creative.type);
    wrapper.appendChild(badge);

    this.container.appendChild(wrapper);

    // Unsupported types
    if (["dynamic", "instant_experience", "collection", "unknown"].includes(creative.type)) {
      this.renderUnsupported(creative.type);
    }
  },

  renderBody(creative) {
    switch (creative.type) {
      case "link":    return this.renderLinkCard(creative);
      case "carousel": return this.renderCarousel(creative);
      case "video":   return this.renderVideoCard(creative);
      case "photo":   return this.renderPhotoCard(creative);
      case "collection": return this.renderUnsupportedCard("Collection / Canvas");
      case "dynamic": return this.renderUnsupportedCard("Dynamic Creative");
      case "instant_experience": return this.renderUnsupportedCard("Instant Experience");
      default: return this.renderUnsupportedCard("Unknown Format");
    }
  },

  renderLinkCard(creative) {
    const el = document.createElement("div");
    el.className = "fb-link-card";

    // Image
    if (creative.imageUrl) {
      el.innerHTML += `<div class="fb-link-image"><img src="${this.escHtml(creative.imageUrl)}" alt="" onerror="this.parentElement.innerHTML='<div class=fb-img-placeholder>🖼</div>'"/></div>`;
    } else {
      el.innerHTML += `<div class="fb-link-image fb-img-placeholder">🖼</div>`;
    }

    // Meta
    const ctaLabel = this.ctaLabel(creative.ctaType);
    el.innerHTML += `
      <div class="fb-link-meta">
        <div class="fb-link-domain">${this.extractDomain(creative.displayUrl || creative.link)}</div>
        <div class="fb-link-headline">${this.escHtml(creative.headline || "")}</div>
        <div class="fb-link-desc">${this.escHtml(creative.description || "")}</div>
        ${ctaLabel ? `<div class="fb-cta-btn">${ctaLabel}</div>` : ""}
      </div>
    `;
    return el;
  },

  renderCarousel(creative) {
    const el = document.createElement("div");
    el.className = "fb-carousel";

    const track = document.createElement("div");
    track.className = "fb-carousel-track";

    creative.cards.forEach((card, i) => {
      const cardEl = document.createElement("div");
      cardEl.className = "fb-carousel-card";

      const img = card.imageUrl
        ? `<img src="${this.escHtml(card.imageUrl)}" alt="" onerror="this.parentElement.innerHTML='<div class=fb-img-placeholder>🖼</div>'"/>`
        : `<div class="fb-img-placeholder">🖼</div>`;

      cardEl.innerHTML = `
        <div class="fb-carousel-img">${img}</div>
        <div class="fb-carousel-meta">
          <div class="fb-carousel-domain">${this.extractDomain(card.displayUrl || card.link)}</div>
          <div class="fb-carousel-headline">${this.escHtml(card.headline || "")}</div>
          <div class="fb-carousel-desc">${this.escHtml(card.description || "")}</div>
          ${card.ctaType ? `<div class="fb-cta-btn fb-cta-small">${this.ctaLabel(card.ctaType)}</div>` : ""}
        </div>
      `;
      track.appendChild(cardEl);
    });

    el.appendChild(track);

    // Nav arrows
    if (creative.cards.length > 1) {
      let current = 0;
      const total = creative.cards.length;
      const cardWidth = 220;

      const prev = document.createElement("button");
      prev.className = "fb-carousel-nav fb-carousel-prev";
      prev.innerHTML = "‹";
      prev.onclick = () => {
        current = Math.max(0, current - 1);
        track.style.transform = `translateX(-${current * cardWidth}px)`;
      };

      const next = document.createElement("button");
      next.className = "fb-carousel-nav fb-carousel-next";
      next.innerHTML = "›";
      next.onclick = () => {
        current = Math.min(total - 1, current + 1);
        track.style.transform = `translateX(-${current * cardWidth}px)`;
      };

      el.appendChild(prev);
      el.appendChild(next);

      // Dots
      const dots = document.createElement("div");
      dots.className = "fb-carousel-dots";
      for (let i = 0; i < total; i++) {
        const dot = document.createElement("span");
        dot.className = `fb-dot${i === 0 ? " active" : ""}`;
        dots.appendChild(dot);
      }
      el.appendChild(dots);
    }

    return el;
  },

  renderVideoCard(creative) {
    const el = document.createElement("div");
    el.className = "fb-video-card";

    const thumb = creative.thumbnailUrl || creative.imageUrl;
    if (thumb) {
      el.innerHTML = `
        <div class="fb-video-thumb">
          <img src="${this.escHtml(thumb)}" alt="" onerror="this.parentElement.innerHTML='<div class=fb-video-placeholder>▶</div>'"/>
          <div class="fb-play-btn">▶</div>
        </div>
      `;
    } else {
      el.innerHTML = `<div class="fb-video-placeholder">▶ Video</div>`;
    }

    if (creative.headline || creative.link) {
      const ctaLabel = this.ctaLabel(creative.ctaType);
      el.innerHTML += `
        <div class="fb-link-meta">
          <div class="fb-link-domain">${this.extractDomain(creative.displayUrl || creative.link)}</div>
          <div class="fb-link-headline">${this.escHtml(creative.headline || "")}</div>
          <div class="fb-link-desc">${this.escHtml(creative.description || "")}</div>
          ${ctaLabel ? `<div class="fb-cta-btn">${ctaLabel}</div>` : ""}
        </div>
      `;
    }
    return el;
  },

  renderPhotoCard(creative) {
    const el = document.createElement("div");
    el.className = "fb-photo-card";
    if (creative.imageUrl) {
      el.innerHTML = `<img src="${this.escHtml(creative.imageUrl)}" alt="" onerror="this.parentElement.innerHTML='<div class=fb-img-placeholder style=height:300px>🖼</div>'"/>`;
    } else {
      el.innerHTML = `<div class="fb-img-placeholder" style="height:300px">🖼</div>`;
    }
    return el;
  },

  renderUnsupportedCard(label) {
    const el = document.createElement("div");
    el.className = "fb-unsupported-card";
    el.innerHTML = `
      <div class="fb-unsupported-icon">⚠️</div>
      <div class="fb-unsupported-label">${label}</div>
      <div class="fb-unsupported-msg">This creative type cannot be posted organically to a Page feed.</div>
    `;
    return el;
  },

  renderUnsupported(type) {
    const notice = document.createElement("div");
    notice.className = "preview-unsupported-notice";
    notice.innerHTML = `<strong>⚠️ Cannot post organically</strong><br>
      ${this.unsupportedReason(type)}`;
    this.container.appendChild(notice);
  },

  // ── HELPERS ───────────────────────────────────────────────

  ctaLabel(type) {
    const map = {
      LEARN_MORE: "Learn More",
      SHOP_NOW: "Shop Now",
      SIGN_UP: "Sign Up",
      BOOK_NOW: "Book Now",
      WATCH_MORE: "Watch More",
      CONTACT_US: "Contact Us",
      DOWNLOAD: "Download",
      GET_OFFER: "Get Offer",
      CALL_NOW: "Call Now",
      GET_DIRECTIONS: "Get Directions",
      MESSAGE_PAGE: "Send Message",
      APPLY_NOW: "Apply Now",
      GET_QUOTE: "Get Quote",
      SUBSCRIBE: "Subscribe",
      WATCH_VIDEO: "Watch Video",
      LISTEN_MUSIC: "Listen Now",
      OPEN_LINK: "Open Link",
      ORDER_NOW: "Order Now",
      REQUEST_TIME: "Request Time",
      SEE_MENU: "See Menu",
      SEND_GIFT: "Send Gift",
      SELL_NOW: "Sell Now",
      DONATE_NOW: "Donate Now",
    };
    return map[type] || (type ? type.replace(/_/g, " ") : "");
  },

  typeLabel(type) {
    const map = {
      link: "Link Post",
      carousel: "Carousel",
      video: "Video",
      photo: "Photo",
      collection: "Collection",
      dynamic: "Dynamic",
      instant_experience: "Instant Experience",
    };
    return map[type] || type || "Unknown";
  },

  unsupportedReason(type) {
    const map = {
      dynamic: "Dynamic creatives use multiple asset variations that can't be replicated as a single organic post.",
      instant_experience: "Instant Experience / Canvas posts are rendered server-side by Facebook and cannot be published organically.",
      collection: "Collection ads use a product catalog grid that has no organic equivalent in Page feed posts.",
    };
    return map[type] || "This format is not supported for organic posting.";
  },

  extractDomain(url) {
    if (!url) return "";
    try {
      return new URL(url.startsWith("http") ? url : "https://" + url).hostname.replace(/^www\./, "");
    } catch {
      return url;
    }
  },

  escHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
};
