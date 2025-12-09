async function loadKeys() {
  const { geminiKey = '', serpKey = '' } = await chrome.storage.sync.get(['geminiKey', 'serpKey']);
  document.getElementById('geminiKey').value = geminiKey;
  document.getElementById('serpKey').value = serpKey;
}

async function saveKeys(e) {
  e.preventDefault();
  const geminiKey = document.getElementById('geminiKey').value.trim();
  const serpKey = document.getElementById('serpKey').value.trim();
  await chrome.storage.sync.set({ geminiKey, serpKey });
  const status = document.getElementById('status');
  status.textContent = 'Saved!';
  setTimeout(() => (status.textContent = ''), 1500);
}

document.getElementById('keys-form').addEventListener('submit', saveKeys);
loadKeys();


