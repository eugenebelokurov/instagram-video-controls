chrome.webNavigation.onHistoryStateUpdated.addListener(details => {
  chrome.tabs.sendMessage(
    details.tabId,
    { type: 'reapply-toggles' },
    response => {
      if (chrome.runtime.lastError) {
        // Content script not ready yet, ignore
        console.debug('Content script not ready:', chrome.runtime.lastError.message);
      }
    }
  );
}, {
  url: [{ hostContains: 'instagram.com' }]
});