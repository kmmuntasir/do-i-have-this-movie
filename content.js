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

    // document.body can be null if the script is injected before the body exists
    if (!document.body) {
        document.addEventListener('DOMContentLoaded', () => start(adapter), { once: true });
        return;
    }

    start(adapter);
}

function start(adapter) {
    // Scan immediately. Without this the page is only scanned on later DOM
    // mutations, so already-rendered cards on static pages are never processed.
    processItems(adapter);

    const observer = new MutationObserver(() => {
        processItems(adapter);
    });

    observer.observe(document.body, { childList: true, subtree: true });
}

async function processItems(adapter) {
    const selectors = adapter.getTargetSelectors();
    let warnedNoSources = false;

    for (const selector of selectors) {
        const items = document.querySelectorAll(selector);

        for (const item of items) {
            // Mark the item synchronously, before any `await`. The
            // MutationObserver re-enters this function on every DOM change --
            // including the badge insertions we make ourselves -- so an
            // un-marked item is picked up again by a concurrent pass while its
            // lookup is still in flight, which injected duplicate badges.
            if (item.dataset.jellyfinChecked) continue;
            item.dataset.jellyfinChecked = 'pending';

            const title = adapter.extractTitle(item);
            const year = adapter.extractYear(item);
            if (!title) {
                item.dataset.jellyfinChecked = 'done';
                continue;
            }

            let response;
            try {
                response = await chrome.runtime.sendMessage({
                    type: 'CHECK_MOVIE',
                    title: title.trim(),
                    year: year
                });
            } catch (error) {
                // Clear the in-flight mark so a later pass can retry.
                delete item.dataset.jellyfinChecked;
                console.warn('[Do I Have This Movie] lookup failed:', error);
                continue;
            }

            item.dataset.jellyfinChecked = 'done';

            if (!response || !response.success) continue;

            if (!response.results || response.results.length === 0) {
                if (!warnedNoSources) {
                    warnedNoSources = true;
                    console.warn(
                        '[Do I Have This Movie] No library sources are enabled. ' +
                        'Configure Jellyfin/Emby/Plex/Local folders in the extension options.'
                    );
                }
                continue;
            }

            const foundSources = response.results.filter(r => r.found);
            if (foundSources.length > 0) {
                injectBadge(item, adapter.getBadgeParent(item), foundSources);
            }
        }
    }
}

function injectBadge(item, parent, foundSources) {
    if (!parent) return;

    // Never badge the same parent twice.
    if (parent.querySelector('.jellyfin-badge')) return;

    const badge = document.createElement('div');
    badge.className = 'jellyfin-badge';
    pinStyle(badge, {
        position: 'absolute', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        boxSizing: 'border-box', overflow: 'visible', flex: '0 0 auto'
    });

    const sourceNames = foundSources.map(s => s.sourceName).join(', ');

    // The badge is the extension logo. The source list lives in the tooltip and
    // the accessible name instead of the visible text -- the badge is a 24px
    // circle, so a text label would not fit. icons/badge.svg is declared in
    // web_accessible_resources, which is required to load it from a page.
    badge.title = `Found in: ${sourceNames}`;
    badge.setAttribute('role', 'img');
    badge.setAttribute('aria-label', `In your library: ${sourceNames}`);

    const logo = document.createElement('img');
    logo.className = 'jellyfin-badge__logo';
    logo.src = chrome.runtime.getURL('icons/badge.svg');
    logo.alt = ''; // decorative; the badge already carries the label

    // Host page CSS out-specifies content script CSS -- yts.gg ships
    // `#movie-related img { width: 92px; height: 138px }`, which stretched the
    // logo across the whole tile. Inline !important is the only thing a page
    // stylesheet cannot override, so the badge geometry is pinned here.
    pinStyle(logo, {
        width: '70%', height: '70%', display: 'block', boxSizing: 'content-box',
        minWidth: '0', minHeight: '0', maxWidth: 'none', maxHeight: 'none',
        margin: '0', padding: '0', border: '0', objectFit: 'contain',
        flex: '0 0 auto', filter: 'none'
    });

    badge.appendChild(logo);

    parent.style.position = 'relative';
    parent.appendChild(badge);
}

/**
 * Applies styles as inline !important declarations so host page stylesheets
 * cannot override them. An inline !important declaration wins over every
 * stylesheet rule regardless of specificity, which is the only reliable way for
 * a content script to hold its geometry on a host page.
 * @param {HTMLElement} element - Element to style
 * @param {Object} styles - Map of CSS property names to values
 */
function pinStyle(element, styles) {
    for (const [property, value] of Object.entries(styles)) {
        element.style.setProperty(property, value, 'important');
    }
}

init();
