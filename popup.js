// Popup logic: load last explanation and allow copy

const STORAGE_KEY_LAST_EXPLANATION = "lastExplanation";
const STORAGE_KEY_LAST_ERROR = "lastError";
const STORAGE_KEY_LAST_INPUT = "lastInput";
const STORAGE_KEY_IS_LOADING = "isLoading";

const explanationEl = document.getElementById('explanation');
const statusEl = document.getElementById('status');
const copyBtn = document.getElementById('copyBtn');
const openTabBtn = document.getElementById('openTabBtn');

function setStatus(message, { loading = false } = {}) {
  statusEl.innerHTML = '';
  if (loading) {
    const spinner = document.createElement('span');
    spinner.className = 'spinner';
    statusEl.appendChild(spinner);
  }
  const text = document.createElement('span');
  text.textContent = message || '';
  statusEl.appendChild(text);
}

function setDisabled(isDisabled) {
  copyBtn.disabled = !!isDisabled;
  openTabBtn.disabled = !!isDisabled;
}

function render({ input, explanation, error, isLoading }) {
  if (isLoading) {
    setStatus('Analyzing code…', { loading: true });
    setDisabled(true);
    return;
  }

  setDisabled(false);

  if (error) {
    setStatus(error);
    explanationEl.textContent = '';
    return;
  }
  if (explanation) {
    setStatus(input ? 'Based on your last selection' : '');
    explanationEl.textContent = explanation;
  } else {
    setStatus('Use the context menu on a selection to generate an explanation.');
    explanationEl.textContent = '';
  }
}

async function loadData() {
  const store = await chrome.storage.local.get([
    STORAGE_KEY_LAST_EXPLANATION,
    STORAGE_KEY_LAST_ERROR,
    STORAGE_KEY_LAST_INPUT,
    STORAGE_KEY_IS_LOADING
  ]);
  const explanation = store[STORAGE_KEY_LAST_EXPLANATION];
  const error = store[STORAGE_KEY_LAST_ERROR];
  const input = store[STORAGE_KEY_LAST_INPUT];
  const isLoading = Boolean(store[STORAGE_KEY_IS_LOADING]);
  render({ input, explanation, error, isLoading });
}

copyBtn.addEventListener('click', async () => {
  const text = explanationEl.textContent.trim();
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    setStatus('Explanation copied to clipboard.');
  } catch (e) {
    setStatus('Failed to copy.');
  }
});

openTabBtn.addEventListener('click', async () => {
  try {
    const url = chrome.runtime.getURL('viewer.html');
    await chrome.tabs.create({ url });
  } catch (e) {
    setStatus('Failed to open new tab.');
  }
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local') return;
  if (changes[STORAGE_KEY_IS_LOADING] || changes[STORAGE_KEY_LAST_EXPLANATION] || changes[STORAGE_KEY_LAST_ERROR] || changes[STORAGE_KEY_LAST_INPUT]) {
    loadData();
  }
});

loadData();
