function addProgressBar(video) {
  // 1. Initial check to prevent adding a progress bar more than once.
  if (video.dataset.progressBarAdded) return;
  video.dataset.progressBarAdded = 'true';

  // --- NEW: Create a hidden video element for seeking frames ---
  const previewVideo = document.createElement('video');
  previewVideo.muted = true;
  previewVideo.style.position = 'fixed'; // Position off-screen
  previewVideo.style.top = '-10000px';
  previewVideo.style.left = '-10000px';
  // IMPORTANT: This is required to allow drawing a video from another domain onto the canvas.
  // The video server must also send the correct CORS headers.
  previewVideo.crossOrigin = 'anonymous'; 
  previewVideo.src = video.currentSrc || video.src;
  document.body.appendChild(previewVideo);

  // --- Create bar container (no changes here) ---
  const barContainer = document.createElement('div');
  barContainer.style.position = 'absolute';
  barContainer.style.left = '0';
  barContainer.style.right = '0';
  barContainer.style.bottom = '0';
  barContainer.style.height = '6px';
  barContainer.style.background = 'rgba(255, 255, 255, 0.2)';
  barContainer.style.zIndex = '9999';
  barContainer.style.cursor = 'pointer';
  barContainer.style.pointerEvents = 'auto';

  // --- Progress fill (no changes here) ---
  const progress = document.createElement('div');
  progress.style.height = '100%';
  progress.style.width = '0%';
  progress.style.background = '#0095f6';
  progress.style.transition = 'width 0.1s linear';
  barContainer.appendChild(progress);

  // --- Tooltip (no changes here) ---
  const tooltip = document.createElement('div');
  tooltip.style.position = 'fixed';
  // ... (all other tooltip styles are the same)
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
  
  // --- MODIFIED: Thumbnail container and canvas setup ---
  const thumbnail = document.createElement('div');
  thumbnail.style.position = 'fixed';
  thumbnail.style.border = '1px solid #fff'; // Added border for better visibility
  thumbnail.style.background = '#000';
  thumbnail.style.borderRadius = '4px';
  thumbnail.style.pointerEvents = 'none';
  thumbnail.style.display = 'none';
  thumbnail.style.zIndex = '10000';
  thumbnail.style.overflow = 'hidden';
  thumbnail.style.width = '160px';  // Set a fixed width
  thumbnail.style.height = '90px'; // Set a fixed height

  // --- NEW: Canvas for drawing the frames ---
  const thumbnailCanvas = document.createElement('canvas');
  thumbnailCanvas.style.width = '100%';
  thumbnailCanvas.style.height = '100%';
  thumbnail.appendChild(thumbnailCanvas);
  document.body.appendChild(thumbnail);

  // --- Ensure parent is positioned (no changes here) ---
  const parent = video.parentElement;
  if (getComputedStyle(parent).position === 'static') {
    parent.style.position = 'relative';
  }
  parent.appendChild(barContainer);

  // --- Event Listeners ---

  // Update progress bar (no changes here)
  video.addEventListener('timeupdate', () => {
    if (isNaN(video.duration)) return;
    const percent = (video.currentTime / video.duration) * 100;
    progress.style.width = `${percent}%`;
  });

  // Seek on click (no changes here)
  barContainer.addEventListener('click', (e) => {
    const rect = barContainer.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    video.currentTime = percent * video.duration;
  });

  // MODIFIED: Tooltip and thumbnail on hover
  barContainer.addEventListener('mousemove', (e) => {
    const rect = barContainer.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const seconds = percent * video.duration;

    if (!isFinite(seconds)) return;

    // Trigger the seek on the hidden video
    previewVideo.currentTime = seconds;

    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60).toString().padStart(2, '0');

    // Position tooltip
    tooltip.textContent = `${mins}:${secs}`;
    tooltip.style.left = `${e.clientX - tooltip.offsetWidth / 2}px`;
    tooltip.style.top = `${rect.top - 30}px`;
    tooltip.style.display = 'block';

    // Position thumbnail
    const thumbnailWidth = thumbnail.offsetWidth;
    thumbnail.style.left = `${e.clientX - thumbnailWidth / 2}px`;
    thumbnail.style.top = `${rect.top - thumbnail.offsetHeight - 35}px`;
    thumbnail.style.display = 'block';
  });

  barContainer.addEventListener('mouseleave', () => {
    tooltip.style.display = 'none';
    thumbnail.style.display = 'none';
  });
  
  // NEW: Listen for the 'seeked' event on the preview video to draw the frame
  previewVideo.addEventListener('seeked', () => {
      const ctx = thumbnailCanvas.getContext('2d');

      // Set canvas dimensions to match the video's intrinsic aspect ratio
      thumbnailCanvas.width = previewVideo.videoWidth;
      thumbnailCanvas.height = previewVideo.videoHeight;

      // Draw the current frame of the preview video onto the canvas
      ctx.drawImage(previewVideo, 0, 0, thumbnailCanvas.width, thumbnailCanvas.height);
  });
}

// --- These functions remain the same ---

function enhanceVideos() {
  document.querySelectorAll('video').forEach(video => {
    // We listen for the 'loadedmetadata' event to ensure the video's duration
    // and dimensions are known before we try to add our enhancements.
    if (video.readyState >= 1) { // 1 means HAVE_METADATA
         addProgressBar(video);
    } else {
         video.addEventListener('loadedmetadata', () => addProgressBar(video), { once: true });
    }
  });
}

// Initial run
enhanceVideos();

// Watch for future videos
const observer = new MutationObserver(enhanceVideos);
observer.observe(document.body, { childList: true, subtree: true });