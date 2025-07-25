// ============= VIDEO ENHANCEMENT =============
// This entire section is unchanged.
function addProgressBar(video) {
  if (video.dataset.progressBarAdded) return;
  video.dataset.progressBarAdded = 'true';

  // --- Create bar container ---
  const barContainer = document.createElement('div');
  barContainer.style.position = 'absolute';
  barContainer.style.left = '0';
  barContainer.style.right = '0';
  barContainer.style.bottom = '0';
  barContainer.style.height = '4px';
  barContainer.style.background = 'rgba(255, 255, 255, 0.2)';
  barContainer.style.zIndex = '9999';
  barContainer.style.cursor = 'pointer';
  barContainer.style.pointerEvents = 'auto';

  // --- Create buffer container ---
  const barBufferContainer = document.createElement('div');
  barBufferContainer.style.position = 'absolute';
  barBufferContainer.style.left = '0';
  barBufferContainer.style.right = '0';
  barBufferContainer.style.bottom = '16px';
  barBufferContainer.style.height = '6px';
  barBufferContainer.style.background = 'rgba(255, 255, 255, 0.2)';
  barBufferContainer.style.zIndex = '9999';
  barBufferContainer.style.cursor = 'pointer';
  barBufferContainer.style.pointerEvents = 'auto';

  // --- Progress fill ---
  const progress = document.createElement('div');
  progress.style.height = '100%';
  progress.style.width = '0%';
  progress.style.background = '#ffffff';
  progress.style.transition = 'width 0.1s linear';
  barContainer.appendChild(progress);

  // --- Tooltip ---
  const tooltip = document.createElement('div');
  tooltip.style.position = 'fixed';
  tooltip.style.padding = '2px 6px';
  tooltip.style.background = '#000';
  tooltip.style.color = '#fff';
  tooltip.style.borderRadius = '4px';
  tooltip.style.fontSize = '12px';
  tooltip.style.whiteSpace = 'nowrap';
  tooltip.style.pointerEvents = 'none';
  tooltip.style.display = 'none';
  tooltip.style.zIndex = '10000';
  document.body.appendChild(tooltip);

  // --- Thumbnail preview ---
  const thumbnail = document.createElement('div');
  thumbnail.style.position = 'fixed';
  thumbnail.style.border = '1px solid #fff';
  thumbnail.style.background = '#000';
  thumbnail.style.borderRadius = '4px';
  thumbnail.style.pointerEvents = 'none';
  thumbnail.style.display = 'none';
  thumbnail.style.zIndex = '10000';
  thumbnail.style.overflow = 'hidden';
  thumbnail.style.width = '90px';
  thumbnail.style.height = '160px';

  const thumbnailCanvas = document.createElement('canvas');
  thumbnailCanvas.style.width = '100%';
  thumbnailCanvas.style.height = '100%';
  thumbnail.appendChild(thumbnailCanvas);
  document.body.appendChild(thumbnail);

  // --- Buffer canvas ---
  const bufferCanvas = document.createElement('canvas');
  bufferCanvas.style.width = '100%';
  bufferCanvas.style.height = '100%';
  bufferCanvas.width = barBufferContainer.offsetWidth || 300;
  bufferCanvas.height = barBufferContainer.offsetHeight || 6;
  barBufferContainer.appendChild(bufferCanvas);

  function updateBufferCanvas() {
    bufferCanvas.width = barBufferContainer.offsetWidth;
    bufferCanvas.height = barBufferContainer.offsetHeight;
    const ctx = bufferCanvas.getContext('2d');
    ctx.clearRect(0, 0, bufferCanvas.width, bufferCanvas.height);
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(0, 0, bufferCanvas.width, bufferCanvas.height);

    if (!isFinite(video.duration) || video.duration === 0) return;
    const inc = bufferCanvas.width / video.duration;

    ctx.fillStyle = '#4caf50';
    ctx.strokeStyle = '#fff';
    for (let i = 0; i < video.buffered.length; i++) {
      const startX = video.buffered.start(i) * inc;
      const endX = video.buffered.end(i) * inc;
      const width = endX - startX;
      ctx.fillRect(startX, 0, width, bufferCanvas.height);
      ctx.beginPath();
      ctx.rect(startX, 0, width, bufferCanvas.height);
      ctx.stroke();
    }
  }

  const parent = video.parentElement;
  if (getComputedStyle(parent).position === 'static') {
    parent.style.position = 'relative';
  }
  parent.appendChild(barContainer);

  // --- Caching setup ---
  if (!video._keyFrameCanvases) video._keyFrameCanvases = {};

  function captureCurrentFrame() {
    const sec = Math.floor(video.currentTime);
    if (video._keyFrameCanvases[sec]) return;

    if (!video.videoWidth || !video.videoHeight) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    video._keyFrameCanvases[sec] = canvas;
  }

  function cacheFramesDuringPlayback() {
    if (video._frameCaptureBound) return;
    video._frameCaptureBound = true;

    video.addEventListener('timeupdate', () => {
      captureCurrentFrame();
    });

    if ('requestVideoFrameCallback' in video) {
      const step = () => {
        captureCurrentFrame();
        video.requestVideoFrameCallback(step);
      };
      video.requestVideoFrameCallback(step);
    }
  }

  cacheFramesDuringPlayback();

  // --- Event Listeners ---
  video.addEventListener('timeupdate', () => {
    if (isNaN(video.duration)) return;
    const percent = (video.currentTime / video.duration) * 100;
    progress.style.width = `${percent}%`;
  });

  barContainer.addEventListener('click', (e) => {
    const rect = barContainer.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    video.currentTime = percent * video.duration;
  });

  barContainer.addEventListener('mousemove', (e) => {
    const rect = barContainer.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const seconds = percent * video.duration;
    if (!isFinite(seconds)) return;

    // Tooltip
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
    tooltip.textContent = `${mins}:${secs}`;
    tooltip.style.left = `${e.clientX - tooltip.offsetWidth / 2}px`;
    tooltip.style.top = `${rect.top - 30}px`;
    tooltip.style.display = 'block';

    // Thumbnail
    const sec = Math.floor(seconds);
    const cachedCanvas = video._keyFrameCanvases[sec];
    const ctx = thumbnailCanvas.getContext('2d');
    const thumbWidth = thumbnail.offsetWidth;
    const thumbHeight = thumbnail.offsetHeight;
    thumbnail.style.left = `${e.clientX - thumbWidth / 2}px`;
    thumbnail.style.top = `${rect.top - thumbHeight - 35}px`;
    thumbnail.style.display = 'block';

    if (cachedCanvas) {
      thumbnailCanvas.width = cachedCanvas.width;
      thumbnailCanvas.height = cachedCanvas.height;
      ctx.drawImage(cachedCanvas, 0, 0, thumbnailCanvas.width, thumbnailCanvas.height);
    } else {
      thumbnailCanvas.width = 160;
      thumbnailCanvas.height = 90;
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, 160, 90);
    }
  });

  barContainer.addEventListener('mouseleave', () => {
    tooltip.style.display = 'none';
    thumbnail.style.display = 'none';
  });

  // Make the bar slightly taller on hover for easier interaction
  barContainer.addEventListener('mouseenter', () => { barContainer.style.height = '8px'; });
  barContainer.addEventListener('mouseleave', () => { barContainer.style.height = '4px'; });
}

function enhanceVideos() {
  document.querySelectorAll('video').forEach(video => {
    if (video.readyState >= 1) {
      addProgressBar(video);
    } else {
      video.addEventListener('loadedmetadata', () => addProgressBar(video), { once: true });
    }
  });
}

function initializeVideoEnhancement() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      enhanceVideos();
      const videoObserver = new MutationObserver(enhanceVideos);
      videoObserver.observe(document.body, { childList: true, subtree: true });
    });
  } else {
    enhanceVideos();
    const videoObserver = new MutationObserver(enhanceVideos);
    videoObserver.observe(document.body, { childList: true, subtree: true });
  }
}

// ============= INSTAGRAM ELEMENT HIDING (LOGIC INVERTED) =============

let hideStyleSheet = null;

function injectHidingCSS() {
  if (hideStyleSheet) return hideStyleSheet;
  
  const style = document.createElement('style');
  style.id = 'instagram-hider-styles';
  document.head.appendChild(style);
  hideStyleSheet = style.sheet;
  
  return hideStyleSheet;
}

function updateHidingCSS(rules) {
  const sheet = injectHidingCSS();
  
  while (sheet.cssRules.length > 0) {
    sheet.deleteRule(0);
  }
  
  rules.forEach(rule => {
    try {
      sheet.insertRule(rule, sheet.cssRules.length);
    } catch (e) {
      console.warn('Failed to insert CSS rule:', rule, e);
    }
  });
}

// *** LOGIC IS INVERTED HERE ***
// This function generates CSS rules to hide elements when their toggle is OFF.
function applyCSSToggles(prefs) {
  const rules = [];
  
  // If showExplore is NOT true, hide it. It will be hidden if the value is false or undefined.
  if (!prefs.showExplore) {
    rules.push('div:has(> a[href="/explore/"]) { display: none !important; }');
  }
  
  // If showReels is NOT true, hide it.
  if (!prefs.showReels) {
    rules.push('div:has(> a[href="/reels/"]) { display: none !important; }');
  }
  
  // If showStories is NOT true, hide it.
  if (!prefs.showStories) {
    rules.push('div[data-pagelet="story_tray"] { display: none !important; }');
  }
  
  updateHidingCSS(rules);
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function reapplyToggles() {
  // The keys here must match the NEW keys used in popup.js
  const prefKeys = ['showStories', 'showExplore', 'showReels'];
  
  chrome.storage.sync.get(prefKeys, prefs => {
    applyCSSToggles(prefs);
  });
}

const debouncedReapply = debounce(reapplyToggles, 100);

function initializeToggles() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', reapplyToggles);
  } else {
    reapplyToggles();
  }
}

// --- INITIALIZATION ---
initializeVideoEnhancement();
initializeToggles();

// --- LISTENERS ---

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'toggle-update' || msg.type === 'reapply-toggles') {
    reapplyToggles();
    sendResponse({ success: true });
  }
});

let currentUrl = location.href;

function handleNavigation() {
  if (location.href !== currentUrl) {
    currentUrl = location.href;
    setTimeout(debouncedReapply, 300);
  }
}

const originalPushState = history.pushState;
history.pushState = function(...args) {
  originalPushState.apply(history, args);
  handleNavigation();
};

const originalReplaceState = history.replaceState;
history.replaceState = function(...args) {
  originalReplaceState.apply(history, args);
  handleNavigation();
};

window.addEventListener('popstate', handleNavigation);

const navObserver = new MutationObserver(debouncedReapply);

function startNavObserver() {
  const mainContent = document.querySelector('main') || document.body;
  navObserver.observe(mainContent, {
    childList: true,
    subtree: true
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startNavObserver);
} else {
  startNavObserver();
}