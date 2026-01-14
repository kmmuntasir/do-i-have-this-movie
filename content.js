// Content script to detect movies and add badges

const siteConfigs = {
    'netflix.com': {
        target: '.title-card, .jawBoneContent',
        getTitle: (el) => {
            // Small card title
            const cardTitle = el.querySelector('.fallback-text')?.textContent;
            // Detailed view title
            const detailTitle = el.querySelector('.title-logo')?.alt || el.querySelector('.title-title')?.textContent;
            return cardTitle || detailTitle;
        },
        badgeParent: (el) => el.querySelector('.boxart-container, .jawBoneContent')
    },
    'imdb.com': {
        target: '[data-testid="hero__primary-text"], .ipc-poster-card',
        getTitle: (el) => {
            if (el.dataset.testid === 'hero__primary-text') return el.textContent;
            return el.querySelector('.ipc-poster-card__title')?.textContent;
        },
        getYear: (el) => {
            // Hero section year
            const heroYear = document.querySelector('[data-testid="hero__primary-text"] + ul li a')?.textContent;
            return heroYear ? parseInt(heroYear) : null;
        },
        badgeParent: (el) => el
    },
    'yts.bz': {
        target: '.browse-movie-wrap, #movie-poster, #similar-movies a, #movie-related a',
        getTitle: (el) => {
            if (el.id === 'movie-poster' || el.closest('#movie-poster')) return document.querySelector('#movie-info h1')?.textContent;
            if (el.closest('#similar-movies') || el.closest('#movie-related')) {
                const titleAttr = el.getAttribute('title') || '';
                return titleAttr.replace(/\(\d{4}\)$/, '').trim();
            }
            return el.querySelector('.browse-movie-title')?.textContent;
        },
        getYear: (el) => {
            if (el.id === 'movie-poster' || el.closest('#movie-poster')) {
                const yearText = document.querySelector('#movie-info h2')?.textContent;
                return yearText ? parseInt(yearText) : null;
            }
            if (el.closest('#similar-movies') || el.closest('#movie-related')) {
                const titleAttr = el.getAttribute('title') || '';
                const match = titleAttr.match(/\((\d{4})\)$/);
                return match ? parseInt(match[1]) : null;
            }
            const yearText = el.querySelector('.browse-movie-year')?.textContent;
            return yearText ? parseInt(yearText) : null;
        },
        badgeParent: (el) => {
            if (el.id === 'movie-poster' || el.closest('#movie-poster')) return el;
            if (el.closest('#similar-movies') || el.closest('#movie-related')) return el;
            return el.querySelector('.browse-movie-link') || el;
        }
    }
};

function init() {
    const hostname = window.location.hostname;
    const config = Object.values(siteConfigs).find((_, i) => hostname.includes(Object.keys(siteConfigs)[i]));

    if (!config) return;

    const observer = new MutationObserver(() => {
        processItems(config);
    });

    observer.observe(document.body, { childList: true, subtree: true });
}

async function processItems(config) {
    const items = document.querySelectorAll(config.target);

    for (const item of items) {
        if (item.dataset.jellyfinChecked) continue;
        item.dataset.jellyfinChecked = 'true';

        const title = config.getTitle(item);
        const year = config.getYear ? config.getYear(item) : null;
        if (!title) continue;

        const response = await chrome.runtime.sendMessage({
            type: 'CHECK_MOVIE',
            title: title.trim(),
            year: year
        });

        if (response && response.found) {
            injectBadge(item, config.badgeParent(item));
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
