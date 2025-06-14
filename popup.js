// IDs in popup.html map to new "show" storage keys
const toggleKeys = {
  'toggle-stories':   'showStories',
  'toggle-explore': 'showExplore',
  'toggle-reels':   'showReels',
};

// When popup loads, populate checkboxes
document.addEventListener('DOMContentLoaded', () => {
  // Use the new "show" keys
  chrome.storage.sync.get(Object.values(toggleKeys), stored => {
    for (const checkboxId in toggleKeys) {
      const storageKey = toggleKeys[checkboxId];
      const checkbox = document.getElementById(checkboxId);
      if (checkbox) {
        // If stored[storageKey] is true, check the box. Otherwise, it remains unchecked (false or undefined).
        checkbox.checked = !!stored[storageKey]; 
      }
      // listen for changes
      checkbox.addEventListener('change', onToggleChange);
    }
  });
});

/**
 * Handle a toggle being clicked in the popup
 */
function onToggleChange(event) {
  const checkbox = event.target;
  const storageKey = toggleKeys[checkbox.id];
  const value = checkbox.checked;

  // Save preference (e.g., { showStories: true })
  chrome.storage.sync.set({ [storageKey]: value });

  // Inform content script
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    if (tab.id) {
      chrome.tabs.sendMessage(tab.id, {
        type: 'toggle-update',
        key: storageKey,
        value: value
      });
    }
  });
}