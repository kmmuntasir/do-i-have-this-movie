import BaseAdapter from './base-adapter.js';

/**
 * YTSAdapter - Handles movie detection on YTS.bz
 */
class YTSAdapter extends BaseAdapter {
  /**
   * Determines if this adapter can handle the given hostname
   * @param {string} hostname - The hostname of the current page
   * @returns {boolean} - True if this adapter can handle the hostname
   */
  canHandle(hostname) {
    return hostname.includes('yts.bz');
  }

  /**
   * Returns CSS selectors for movie card elements
   * @returns {string[]} - Array of CSS selectors
   */
  getTargetSelectors() {
    return ['.browse-movie-wrap', '#movie-poster', '#similar-movies a', '#movie-related a'];
  }

  /**
   * Extracts the movie title from a card element
   * @param {HTMLElement} element - The movie card element
   * @returns {string} - The movie title
   */
  extractTitle(element) {
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
