// Basic background script to handle Jellyfin API requests

import sourceRegistry from './sources/source-registry.js';
import JellyfinSourceAdapter from './sources/jellyfin-source-adapter.js';
import EmbySourceAdapter from './sources/emby-source-adapter.js';
import PlexSourceAdapter from './sources/plex-source-adapter.js';
import LocalSourceAdapter from './sources/local-source-adapter.js';
import { pullSources } from './sources/sync.js';

// Register the Jellyfin adapter
const jellyfinAdapter = new JellyfinSourceAdapter();
sourceRegistry.register('jellyfin', jellyfinAdapter);

// Register the Emby adapter
const embyAdapter = new EmbySourceAdapter();
sourceRegistry.register('emby', embyAdapter);

// Register the Plex adapter
const plexAdapter = new PlexSourceAdapter();
sourceRegistry.register('plex', plexAdapter);

// Register the Local Files adapter
const localAdapter = new LocalSourceAdapter();
sourceRegistry.register('local', localAdapter);

// Initialize with migration
(async function initialize() {
  await migrateJellyfinSettings();
  await pullSources().catch(() => {});
  await syncSourcesFromStorage();
})();

/**
 * Re-enable/disable registered sources so the in-memory registry matches the
 * `sources` object in storage. Called on SW startup and whenever storage
 * changes, so saving credentials in the options page takes effect immediately
 * instead of waiting for the service worker to be recycled.
 */
async function syncSourcesFromStorage() {
  const data = await chrome.storage.local.get(['sources']);
  const sources = data.sources || {};

  for (const [id, config] of Object.entries(sources)) {
    try {
      if (config.enabled) {
        await sourceRegistry.enableSource(id);
      } else {
        await sourceRegistry.disableSource(id);
      }
    } catch (error) {
      console.error(`Failed to configure source ${id}:`, error);
    }
  }

  // Deactivate sources that were removed from storage entirely.
  for (const { id } of sourceRegistry.getAllAdapters()) {
    if (!(id in sources)) {
      sourceRegistry.disableSource(id);
    }
  }
}

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.sources) {
    syncSourcesFromStorage();
  }
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && changes.sources) {
    pullSources().catch(e => console.warn('Settings pull failed:', e));
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'CHECK_MOVIE') {
    checkAllSources(request.title, request.year)
      .then(result => sendResponse(result))
      .catch(error => {
        console.error('Error checking movie:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep the message channel open for async response
  }
});

/**
 * Check all active sources for a movie
 * @param {string} title - Movie title
 * @param {number|string} year - Movie year
 * @returns {Promise<Object>} Aggregated results from all sources
 */
async function checkAllSources(title, year) {
  const activeSources = sourceRegistry.getActiveSources();
  
  if (activeSources.length === 0) {
    return {
      success: true,
      results: [],
      found: false
    };
  }
  
  // Check all sources simultaneously
  const promises = activeSources.map(async ({ id, adapter }) => {
    try {
      const result = await adapter.checkMovie(title, year);
      return {
        sourceId: id,
        sourceName: adapter.getName(),
        found: result.found,
        movie: result.movie || null
      };
    } catch (error) {
      console.error(`Error checking ${id}:`, error);
      return {
        sourceId: id,
        sourceName: adapter.getName(),
        found: false,
        error: error.message
      };
    }
  });
  
  const sourceResults = await Promise.all(promises);
  
  // Return aggregated results
  return {
    success: true,
    results: sourceResults,
    found: sourceResults.some(r => r.found)
  };
}

/**
 * Migrate old Jellyfin settings to new source format
 */
/**
 * Migrate old Jellyfin settings to new source format
 */
async function migrateJellyfinSettings() {
  const oldData = await chrome.storage.local.get([
    'serverUrl',
    'apiKey',
    'migrationComplete'
  ]);
  
  // Skip if already migrated
  if (oldData.migrationComplete) return;
  
  if (oldData.serverUrl && oldData.apiKey) {
    const newData = {
      sources: {
        jellyfin: {
          serverUrl: oldData.serverUrl,
          apiKey: oldData.apiKey,
          enabled: true
        }
      },
      migrationComplete: true
    };
    
    await chrome.storage.local.set(newData);
    
    // Optionally remove old keys after successful migration
    await chrome.storage.local.remove([
      'serverUrl',
      'apiKey',
      'activeSource'
    ]);
  }
}

