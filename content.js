// Content script: exposes a helper to return current selection when asked
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message && message.type === 'GET_SELECTION') {
    try {
      const selected = String(window.getSelection ? window.getSelection() : '') || '';
      sendResponse({ ok: true, selection: selected.trim() });
    } catch (e) {
      sendResponse({ ok: false, error: String(e) });
    }
    return true; // async response allowed
  }
});
