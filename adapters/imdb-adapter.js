import BaseAdapter from './base-adapter.js';

/**
 * IMDBAdapter - Handles movie detection on IMDB.com
 */
class IMDBAdapter extends BaseAdapter {
  /**
   * Determines if this adapter can handle the given hostname
   * @param {string} hostname - The hostname of the current page
   * @returns {boolean} - True if this adapter can handle the hostname
   */
  canHandle(hostname) {
    return hostname.includes('imdb.com');
  }

  /**
   * Returns CSS selectors for movie card elements
   * @returns {string[]} - Array of CSS selectors
   */
  getTargetSelectors() {
    return ['[data-testid="hero__primary-text"]', '.ipc-poster-card'];
  }

  /**
   * Extracts the movie title from a card element
   * @param {HTMLElement} element - The movie card element
   * @returns {string} - The movie title
   */
  extractTitle(element) {
    if (element.dataset.testid === 'hero__primary-text') return element.textContent;
    return element.querySelector('.ipc-poster-card__title')?.textContent;
  }

  /**
   * Extracts the movie year from a card element
   * @param {HTMLElement} element - The movie card element
   * @returns {number|null} - The movie year, or null if not available
   */
  extractYear(element) {
    // Cards show no year; the hero year would be the page movie's, not the card's.
    if (element.dataset.testid !== 'hero__primary-text') return null;
    // The year link sits in a list after the <h1> that wraps the title span.
    const year = document.querySelector('a[href*="/releaseinfo"]')?.textContent;
    return year ? parseInt(year) : null;
  }

  /**
   * Returns the parent element for badge injection
   * @param {HTMLElement} element - The movie card element
   * @returns {HTMLElement} - The parent element to inject the badge into
   */
  getBadgeParent(element) {
    // Title page: badge the poster, not the <h1>, where it would sit on the text.
    if (element.dataset.testid === 'hero__primary-text') {
      return document.querySelector('[data-testid="hero-media__poster"]') || element;
    }
    return element;
  }
}

export default new IMDBAdapter();
