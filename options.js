import sourceRegistry from './sources/source-registry.js';

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
    fields: ['paths', 'recursive'],
    adapter: () => import('./sources/local-source-adapter.js')
  }
};

// Initialize
async function init() {
  await loadAllSourceConfigs();
  setupEventListeners();
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
    // Save credentials
    await sourceRegistry.saveSourceCredentials(sourceId, config, config.enabled);
    
    // Enable or disable the source
    if (config.enabled) {
      await sourceRegistry.enableSource(sourceId);
    } else {
      await sourceRegistry.disableSource(sourceId);
    }
    
    showStatus(sourceId, 'Settings saved successfully!', 'success');
  } catch (error) {
    showStatus(sourceId, `Error saving settings: ${error.message}`, 'error');
  }
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
