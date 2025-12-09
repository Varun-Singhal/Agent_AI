async function loadSettings() {
  const { geminiKey = '' } = await chrome.storage.sync.get(['geminiKey']);
  document.getElementById('geminiKey').value = geminiKey;
}

async function saveSettings(e) {
  e.preventDefault();
  const geminiKey = document.getElementById('geminiKey').value.trim();
  
  if (!geminiKey) {
    showStatus('Please enter your Gemini API key.', 'error');
    return;
  }
  
  if (!geminiKey.startsWith('AIza')) {
    showStatus('Invalid API key format. Should start with "AIza"', 'error');
    return;
  }
  
  await chrome.storage.sync.set({ geminiKey });
  showStatus('✅ Settings saved successfully!', 'success');
}

function showStatus(message, type = 'info') {
  const status = document.getElementById('status');
  status.textContent = message;
  status.className = `status ${type}`;
  setTimeout(() => {
    status.textContent = '';
    status.className = 'status';
  }, 3000);
}

document.getElementById('api-form').addEventListener('submit', saveSettings);
loadSettings();




