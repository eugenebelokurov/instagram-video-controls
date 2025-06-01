function addProgressBar(video) {
  if (video.dataset.progressBarAdded) return;
  video.dataset.progressBarAdded = 'true';

  // Create bar container
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

  // Progress fill
  const progress = document.createElement('div');
  progress.style.height = '100%';
  progress.style.width = '0%';
  progress.style.background = '#0095f6';
  progress.style.transition = 'width 0.1s linear';
  barContainer.appendChild(progress);

  // Tooltip
  const tooltip = document.createElement('div');
  tooltip.style.position = 'fixed'; // use fixed so it’s always relative to viewport
  tooltip.style.padding = '2px 6px';
  tooltip.style.background = '#000';
  tooltip.style.color = '#fff';
  tooltip.style.borderRadius = '4px';
  tooltip.style.fontSize = '12px';
  tooltip.style.whiteSpace = 'nowrap';
  tooltip.style.pointerEvents = 'none';
  tooltip.style.display = 'none';
  tooltip.style.zIndex = '10000'; // make sure it's on top
  document.body.appendChild(tooltip); // attach to body, not inside the bar

  // Ensure parent is positioned
  const parent = video.parentElement;
  if (getComputedStyle(parent).position === 'static') {
    parent.style.position = 'relative';
  }

  parent.appendChild(barContainer);

  // Update progress bar
  video.addEventListener('timeupdate', () => {
    const percent = (video.currentTime / video.duration) * 100;
    progress.style.width = `${percent}%`;
  });

  // Seek on click
  barContainer.addEventListener('click', (e) => {
    const rect = barContainer.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    video.currentTime = percent * video.duration;
  });

  // Tooltip on hover
  barContainer.addEventListener('mousemove', (e) => {
    const rect = barContainer.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const seconds = percent * video.duration;
    if (!isFinite(seconds)) return;

    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
    tooltip.textContent = `${mins}:${secs}`;

    tooltip.style.left = `${e.clientX}px`;
    tooltip.style.top = `${rect.top - 30}px`;
    tooltip.style.display = 'block';
  });

  barContainer.addEventListener('mouseleave', () => {
    tooltip.style.display = 'none';
  });
}


function enhanceVideos() {
  document.querySelectorAll('video').forEach(video => {
    addProgressBar(video);
  });
}

// Initial run
enhanceVideos();

// Watch for future videos
const observer = new MutationObserver(enhanceVideos);
observer.observe(document.body, { childList: true, subtree: true });