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

            if (response && response.found) {
                injectBadge(item, adapter.getBadgeParent(item));
            }
        }
    }
}

function injectBadge(item, parent) {
    if (!parent) return;

    const badge = document.createElement('div');
    badge.className = 'jellyfin-badge';

    const badgeUrl = chrome.runtime.getURL('icons/badge.svg');
    
    fetch(badgeUrl)
        .then(response => response.text())
        .then(svgContent => {
            badge.innerHTML = svgContent;
            parent.style.position = 'relative';
            parent.appendChild(badge);
        })
        .catch(error => {
            console.error('Failed to load badge SVG:', error);
        });
}

init();
