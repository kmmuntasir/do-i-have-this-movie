import sourceRegistry from './sources/source-registry.js';
import { extractMovieInfo, isMovieFile } from './sources/utils/file-matcher.js';

// Source configuration
const sourceConfigs = {
  jellyfin: {
    fields: ['serverUrl', 'apiKey'],
    adapter: () => import('./sources/jellyfin-source-adapter.js')
  },
  emby: {
    fields: ['serverUrl', 'apiKey'],
    adapter: () => import('./sources/emby-source-adapter.js')
  },
  plex: {
    fields: ['serverUrl', 'token'],
    adapter: () => import('./sources/plex-source-adapter.js')
  },
  local: {
    fields: ['recursive'],
    adapter: () => import('./sources/local-source-adapter.js')
  }
};

// Initialize
async function init() {
  await loadAllSourceConfigs();
  setupEventListeners();
  await setupLocalFolder();
}

// Load all source configurations
async function loadAllSourceConfigs() {
  const data = await chrome.storage.local.get(['sources']);
  const sources = data.sources || {};
  
  for (const [sourceId, config] of Object.entries(sources)) {
    loadSourceConfig(sourceId, config);
  }
}

// Load a single source configuration
function loadSourceConfig(sourceId, config) {
  const enabledCheckbox = document.getElementById(`${sourceId}-enabled`);
  if (enabledCheckbox) {
    enabledCheckbox.checked = config.enabled || false;
  }
  
  const configData = sourceConfigs[sourceId];
  if (configData) {
    configData.fields.forEach(field => {
      const input = document.getElementById(`${sourceId}-${field}`);
      if (input) {
        if (input.type === 'checkbox') {
          input.checked = config[field] || false;
        } else {
          input.value = config[field] || '';
        }
      }
    });
  }
}

// Collect configuration for a source
function collectSourceConfig(sourceId) {
  const configData = sourceConfigs[sourceId];
  const config = {};
  
  const enabledCheckbox = document.getElementById(`${sourceId}-enabled`);
  config.enabled = enabledCheckbox ? enabledCheckbox.checked : false;
  
  if (configData) {
    configData.fields.forEach(field => {
      const input = document.getElementById(`${sourceId}-${field}`);
      if (input) {
        if (input.type === 'checkbox') {
          config[field] = input.checked;
        } else {
          config[field] = input.value.trim();
        }
      }
    });
  }
  
  return config;
}

// Test connection for a source
async function testConnection(sourceId) {
  if (!(await ensureHostPermission(sourceId))) return;
  const config = collectSourceConfig(sourceId);
  const configData = sourceConfigs[sourceId];
  
  if (!configData) {
    showStatus(sourceId, 'Source not found', 'error');
    return;
  }
  
  const adapterModule = await configData.adapter();
  const AdapterClass = adapterModule.default;
  const adapter = new AdapterClass();
  
  // Validate credentials
  const validation = adapter.validateCredentials(config);
  if (!validation.valid) {
    showStatus(sourceId, `Validation failed: ${validation.errors.join(', ')}`, 'error');
    return;
  }
  
  showStatus(sourceId, 'Testing connection...', 'info');
  
  try {
    await adapter.configure(config);
    const result = await adapter.testConnection();
    
    if (result.success) {
      showStatus(sourceId, 'Connection successful!', 'success');
    } else {
      showStatus(sourceId, `Connection failed: ${result.error}`, 'error');
    }
  } catch (error) {
    showStatus(sourceId, `Error: ${error.message}`, 'error');
  }
}

// Save configuration for a source
async function saveSourceConfig(sourceId) {
  if (!(await ensureHostPermission(sourceId))) return;
  const config = collectSourceConfig(sourceId);
  const configData = sourceConfigs[sourceId];
  
  if (!configData) {
    showStatus(sourceId, 'Source not found', 'error');
    return;
  }
  
  const adapterModule = await configData.adapter();
  const AdapterClass = adapterModule.default;
  const adapter = new AdapterClass();
  
  // Validate credentials
  const validation = adapter.validateCredentials(config);
  if (!validation.valid) {
    showStatus(sourceId, `Validation failed: ${validation.errors.join(', ')}`, 'error');
    return;
  }
  
  try {
    // Save credentials to storage. The background service worker listens for
    // changes to `sources` and activates/deactivates the source itself -- the
    // options page has its own SourceRegistry instance whose adapters are
    // never registered, so calling enableSource() here would always throw
    // `Source "jellyfin" not found`.
    await sourceRegistry.saveSourceCredentials(sourceId, config, config.enabled);

    showStatus(sourceId, 'Settings saved successfully!', 'success');
  } catch (error) {
    showStatus(sourceId, `Error saving settings: ${error.message}`, 'error');
  }
}

/**
 * Request access to the media server's host. Host permissions are optional in
 * the manifest, so Chrome shows a prompt the first time a server is saved.
 * Must run first in a click handler so the user gesture is still valid.
 */
async function ensureHostPermission(sourceId) {
  const input = document.getElementById(`${sourceId}-serverUrl`);
  if (!input || !input.value.trim()) return true; // validation reports the empty field
  let url;
  try {
    url = new URL(input.value.trim());
  } catch {
    return true; // validation reports the bad URL
  }
  const origins = [`${url.protocol}//${url.hostname}/*`];
  if (await chrome.permissions.contains({ origins })) return true;
  if (await chrome.permissions.request({ origins })) return true;
  showStatus(sourceId, `Permission to access ${url.hostname} was denied.`, 'error');
  return false;
}

// ---- Local files: folder picked here, file names indexed into storage ----

const DB_NAME = 'dihtm';
const openDb = () => new Promise((resolve, reject) => {
  const req = indexedDB.open(DB_NAME, 1);
  req.onupgradeneeded = () => req.result.createObjectStore('handles');
  req.onsuccess = () => resolve(req.result);
  req.onerror = () => reject(req.error);
});
async function idb(mode, fn) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const req = fn(db.transaction('handles', mode).objectStore('handles'));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function collectVideoNames(dir, recursive, out = []) {
  for await (const entry of dir.values()) {
    if (entry.kind === 'directory') {
      if (recursive) await collectVideoNames(entry, recursive, out);
    } else if (isMovieFile(entry.name)) {
      // Release files often lack a year the folder name has ("Movie (2009)/movie.mkv").
      const ext = entry.name.slice(entry.name.lastIndexOf('.'));
      const fromFile = extractMovieInfo(entry.name);
      const fromDir = extractMovieInfo(dir.name);
      out.push(!fromFile.year && fromDir.year ? dir.name + ext : entry.name);
    }
  }
  return out;
}

async function scanFolder(handle) {
  const recursive = document.getElementById('local-recursive').checked;
  showLocalInfo('Scanning…');
  const files = await collectVideoNames(handle, recursive);
  const localIndex = { folderName: handle.name, files, scannedAt: Date.now() };
  await chrome.storage.local.set({ localIndex });
  showLocalInfo(localIndex);
}

function showLocalInfo(index) {
  const el = document.getElementById('local-folder-info');
  el.textContent = typeof index === 'string' ? index
    : `${index.folderName}: ${index.files.length} movie files (scanned ${new Date(index.scannedAt).toLocaleString()})`;
}

async function setupLocalFolder() {
  const choose = document.getElementById('local-choose-btn');
  const rescan = document.getElementById('local-rescan-btn');
  const { localIndex } = await chrome.storage.local.get('localIndex');
  if (localIndex) showLocalInfo(localIndex);
  if (!window.showDirectoryPicker) {
    choose.disabled = true;
    showLocalInfo('This browser does not support folder access.');
    return;
  }
  const saved = await idb('readonly', s => s.get('movies')).catch(() => null);
  rescan.disabled = !saved;

  choose.addEventListener('click', async () => {
    try {
      const handle = await window.showDirectoryPicker({ mode: 'read' });
      await idb('readwrite', s => s.put(handle, 'movies'));
      rescan.disabled = false;
      await scanFolder(handle);
    } catch (error) {
      if (error.name !== 'AbortError') showStatus('local', `Error: ${error.message}`, 'error');
    }
  });

  rescan.addEventListener('click', async () => {
    try {
      const handle = await idb('readonly', s => s.get('movies'));
      if ((await handle.requestPermission({ mode: 'read' })) !== 'granted') {
        showStatus('local', 'Folder access was denied.', 'error');
        return;
      }
      await scanFolder(handle);
    } catch (error) {
      showStatus('local', `Error: ${error.message}`, 'error');
    }
  });
}

// Show status message
function showStatus(sourceId, text, type) {
  const status = document.getElementById(`${sourceId}-status`);
  if (status) {
    status.textContent = text;
    status.className = `status ${type}`;
    
    if (type === 'success' || type === 'error') {
      setTimeout(() => {
        status.textContent = '';
        status.className = 'status';
      }, 3000);
    }
  }
}

// Setup event listeners
function setupEventListeners() {
  // Test connection buttons
  document.querySelectorAll('.test-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const sourceId = btn.dataset.source;
      testConnection(sourceId);
    });
  });
  
  // Save buttons
  document.querySelectorAll('.save-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const sourceId = btn.dataset.source;
      saveSourceConfig(sourceId);
    });
  });
}

// Initialize on load
init();
