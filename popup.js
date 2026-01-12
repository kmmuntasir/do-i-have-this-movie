document.addEventListener('DOMContentLoaded', () => {
  const serverUrlInput = document.getElementById('serverUrl');
  const apiKeyInput = document.getElementById('apiKey');
  const saveBtn = document.getElementById('saveBtn');
  const statusEl = document.getElementById('status');

  // Load saved settings
  chrome.storage.local.get(['serverUrl', 'apiKey'], (result) => {
    if (result.serverUrl) serverUrlInput.value = result.serverUrl;
    if (result.apiKey) apiKeyInput.value = result.apiKey;
  });

  // Save settings
  saveBtn.addEventListener('click', () => {
    const serverUrl = serverUrlInput.value.trim().replace(/\/$/, ""); // Remove trailing slash
    const apiKey = apiKeyInput.value.trim();

    if (!serverUrl || !apiKey) {
      showStatus('Please fill in both fields.', 'error');
      return;
    }

    chrome.storage.local.set({ serverUrl, apiKey }, () => {
      showStatus('Settings saved!', 'success');
      setTimeout(() => {
        statusEl.className = 'status';
        statusEl.style.display = 'none';
      }, 2000);
    });
  });

  function showStatus(text, type) {
    statusEl.textContent = text;
    statusEl.className = `status ${type}`;
    statusEl.style.display = 'block';
  }
});
