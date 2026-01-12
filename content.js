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
    badge.innerHTML = `
      <svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" fill-rule="evenodd" clip-rule="evenodd" stroke-linejoin="round" stroke-miterlimit="2">
        <path d="M24.711 49.158c-1.552-3.116 8.626-21.57 11.788-21.57 3.167.002 13.323 18.488 11.788 21.57-1.535 3.081-22.025 3.115-23.577 0h.001z"
              fill="url(#prefix___Linear1)" fill-rule="nonzero"
              transform="matrix(6.94432 0 0 6.94432 2.538 6.006)"/>
        <path d="M.98 64.996C-3.695 55.606 26.977.001 36.5.001c9.533 0 40.153 55.713 35.527 64.995-4.626 9.282-66.368 9.391-71.045 0
                 m12.255-8.148c3.065 6.152 43.518 6.084 46.548 0
                 3.03-6.086-17.033-42.587-23.275-42.587
                 -6.242 0-26.34 36.434-23.276 42.587h.003z"
              fill="url(#prefix___Linear2)"
              transform="matrix(6.94432 0 0 6.94432 2.538 6.006)"/>
        <g>
          <circle cx="420" cy="92" r="48" fill="#22c55e"/>
          <path d="M395 92l18 18 32-36"
                fill="none"
                stroke="#ffffff"
                stroke-width="12"
                stroke-linecap="round"
                stroke-linejoin="round"/>
        </g>
        <defs>
          <linearGradient id="prefix___Linear1" x1="0" y1="0" x2="1" y2="0"
                          gradientUnits="userSpaceOnUse"
                          gradientTransform="matrix(60 33 -33 60 12.499 30)">
            <stop offset="0" stop-color="#aa5cc3"/>
            <stop offset="1" stop-color="#00a4dc"/>
          </linearGradient>
          <linearGradient id="prefix___Linear2" x1="0" y1="0" x2="1" y2="0"
                          gradientUnits="userSpaceOnUse"
                          gradientTransform="matrix(60 33 -33 60 12.499 30)">
            <stop offset="0" stop-color="#aa5cc3"/>
            <stop offset="1" stop-color="#00a4dc"/>
          </linearGradient>
        </defs>
      </svg>
  `;

    parent.style.position = 'relative';
    parent.appendChild(badge);
}

init();
