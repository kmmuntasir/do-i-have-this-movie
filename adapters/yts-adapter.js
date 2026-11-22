import BaseAdapter from './base-adapter.js';

/**
 * Known YTS mirror domains. YTS rotates its primary domain frequently, so we
 * match the whole family instead of a single hardcoded host. Last verified:
 * yts.pw. yts-official.am is a separate clone with a different DOM.
 */
const YTS_DOMAINS = ['yts.pw', 'yts-official.am', 'yts.gg', 'yts.bz', 'yts.mx', 'yts.lt', 'yts.am', 'yts.rs'];

/**
 * YTSAdapter - Handles movie detection on YTS (yts.pw, yts-official.am)
 */
class YTSAdapter extends BaseAdapter {
  /**
   * Determines if this adapter can handle the given hostname
   * @param {string} hostname - The hostname of the current page
   * @returns {boolean} - True if this adapter can handle the hostname
   */
  canHandle(hostname) {
    return YTS_DOMAINS.some(
      (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
    );
  }

  /**
   * Returns CSS selectors for movie card elements
   * @returns {string[]} - Array of CSS selectors
   */
  getTargetSelectors() {
    return ['.browse-movie-wrap', '#movie-poster', '#similar-movies a', '#movie-related a',
      // yts-official.am: cards are bare links, poster is .box-img
      '.full > .browse-movie-link', '.box-img'];
  }

  /**
   * Extracts the movie title from a card element
   * @param {HTMLElement} element - The movie card element
   * @returns {string} - The movie title
   */
  extractTitle(element) {
    if (element.matches('.box-img')) return document.querySelector('.title-year h1')?.textContent;
    if (element.matches('.full > .browse-movie-link')) return element.querySelector('.product_name')?.textContent;
    if (element.id === 'movie-poster' || element.closest('#movie-poster')) {
      return document.querySelector('#movie-info h1')?.textContent;
    }
    if (element.closest('#similar-movies') || element.closest('#movie-related')) {
      const titleAttr = element.getAttribute('title') || '';
      return titleAttr.replace(/\(\d{4}\)$/, '').trim();
    }
    return element.querySelector('.browse-movie-title')?.textContent;
  }

  /**
   * Extracts the movie year from a card element
   * @param {HTMLElement} element - The movie card element
   * @returns {number|null} - The movie year, or null if not available
   */
  extractYear(element) {
    if (element.matches('.box-img')) {
      const t = document.querySelector('.movie-year-header-row')?.textContent;
      return t ? parseInt(t) : null;
    }
    if (element.matches('.full > .browse-movie-link')) {
      const t = element.querySelector('.product_year')?.textContent;
      return t ? parseInt(t) : null;
    }
    if (element.id === 'movie-poster' || element.closest('#movie-poster')) {
      const yearText = document.querySelector('#movie-info h2')?.textContent;
      return yearText ? parseInt(yearText) : null;
    }
    if (element.closest('#similar-movies') || element.closest('#movie-related')) {
      const titleAttr = element.getAttribute('title') || '';
      const match = titleAttr.match(/\((\d{4})\)$/);
      return match ? parseInt(match[1]) : null;
    }
    const yearText = element.querySelector('.browse-movie-year')?.textContent;
    return yearText ? parseInt(yearText) : null;
  }

  /**
   * Returns the parent element for badge injection
   * @param {HTMLElement} element - The movie card element
   * @returns {HTMLElement} - The parent element to inject the badge into
   */
  getBadgeParent(element) {
    if (element.matches('.box-img')) return element;
    if (element.matches('.full > .browse-movie-link')) {
      return element.querySelector('.product_img') || element;
    }
    if (element.id === 'movie-poster' || element.closest('#movie-poster')) {
      return element;
    }
    if (element.closest('#similar-movies') || element.closest('#movie-related')) {
      return element;
    }
    return element.querySelector('.browse-movie-link') || element;
  }
}

export default new YTSAdapter();
