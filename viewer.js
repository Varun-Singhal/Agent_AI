const STORAGE_KEY_LAST_EXPLANATION = "lastExplanation";
const STORAGE_KEY_LAST_ERROR = "lastError";
const STORAGE_KEY_LAST_INPUT = "lastInput";
const STORAGE_KEY_IS_LOADING = "isLoading";

const renderedEl = document.getElementById('rendered');
const metaEl = document.getElementById('meta');

function setMeta(text, { loading = false } = {}) {
  metaEl.innerHTML = '';
  if (loading) {
    const spinner = document.createElement('span');
    spinner.className = 'spinner';
    metaEl.appendChild(spinner);
  }
  const span = document.createElement('span');
  span.textContent = text || '';
  metaEl.appendChild(span);
}

function sanitizeHtml(html) {
  // Very basic sanitation: strip <script> tags entirely
  try {
    const div = document.createElement('div');
    div.innerHTML = html || '';
    div.querySelectorAll('script').forEach(n => n.remove());
    return div.innerHTML;
  } catch (_) {
    return '';
  }
}

function render({ input, explanation, error, isLoading }) {
  if (isLoading) {
    setMeta('Analyzing code…', { loading: true });
    return;
  }
  if (error) {
    setMeta(error);
    renderedEl.innerHTML = '';
    return;
  }
  if (explanation) {
    setMeta(input ? 'Based on your last selection' : '');
    renderedEl.innerHTML = sanitizeHtml(explanation);
  } else {
    setMeta('No explanation available. Use the context menu on a selection first.');
    renderedEl.innerHTML = '';
  }
}

async function load() {
  try {
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
  } catch (e) {
    setMeta('Failed to load explanation.');
  }
}

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local') return;
  if (
    changes[STORAGE_KEY_IS_LOADING] ||
    changes[STORAGE_KEY_LAST_EXPLANATION] ||
    changes[STORAGE_KEY_LAST_ERROR] ||
    changes[STORAGE_KEY_LAST_INPUT]
  ) {
    load();
  }
});

load();
