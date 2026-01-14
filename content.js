// Content script to detect movies and add badges

// Import adapter registry and all website adapters
import registry from './adapters/adapter-registry.js';
import netflixAdapter from './adapters/netflix-adapter.js';
import imdbAdapter from './adapters/imdb-adapter.js';
import ytsAdapter from './adapters/yts-adapter.js';

// Register all adapters
registry.register(netflixAdapter);
registry.register(imdbAdapter);
registry.register(ytsAdapter);

function init() {
    const hostname = window.location.hostname;
    const adapter = registry.getAdapter(hostname);

    if (!adapter) return;

    const observer = new MutationObserver(() => {
        processItems(adapter);
    });

    observer.observe(document.body, { childList: true, subtree: true });
}

async function processItems(adapter) {
    const selectors = adapter.getTargetSelectors();

    for (const selector of selectors) {
        const items = document.querySelectorAll(selector);

        for (const item of items) {
            if (item.dataset.jellyfinChecked) continue;
            item.dataset.jellyfinChecked = 'true';

            const title = adapter.extractTitle(item);
            const year = adapter.extractYear(item);
            if (!title) continue;

            const response = await chrome.runtime.sendMessage({
                type: 'CHECK_MOVIE',
                title: title.trim(),
                year: year
            });

            if (response && response.success && response.results) {
                const foundSources = response.results.filter(r => r.found);
                if (foundSources.length > 0) {
                    injectBadge(item, adapter.getBadgeParent(item), foundSources);
                }
            }
        }
    }
}

function injectBadge(item, parent, foundSources) {
    if (!parent) return;

    const badge = document.createElement('div');
    badge.className = 'jellyfin-badge';
    
    // Show count or list of sources
    const sourceNames = foundSources.map(s => s.sourceName).join(', ');
    badge.textContent = `✓ ${foundSources.length > 1 ? foundSources.length + ' sources' : sourceNames}`;
    badge.title = `Found in: ${sourceNames}`;
    
    parent.style.position = 'relative';
    parent.appendChild(badge);
}

init();
