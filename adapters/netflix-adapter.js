import BaseAdapter from './base-adapter.js';

/**
 * NetflixAdapter - Handles movie detection on Netflix.com
 */
class NetflixAdapter extends BaseAdapter {
  /**
   * Determines if this adapter can handle the given hostname
   * @param {string} hostname - The hostname of the current page
   * @returns {boolean} - True if this adapter can handle the hostname
   */
  canHandle(hostname) {
    return hostname.includes('netflix.com');
  }

  /**
   * Returns CSS selectors for movie card elements
   * @returns {string[]} - Array of CSS selectors
   */
  getTargetSelectors() {
    return ['.title-card', '.jawBoneContent'];
  }

  /**
   * Extracts the movie title from a card element
   * @param {HTMLElement} element - The movie card element
   * @returns {string} - The movie title
   */
  extractTitle(element) {
    // Small card title
    const cardTitle = element.querySelector('.fallback-text')?.textContent;
    // Detailed view title
    const detailTitle = element.querySelector('.title-logo')?.alt || element.querySelector('.title-title')?.textContent;
    return cardTitle || detailTitle;
  }

  /**
   * Returns the parent element for badge injection
   * @param {HTMLElement} element - The movie card element
   * @returns {HTMLElement} - The parent element to inject the badge into
   */
  getBadgeParent(element) {
    return element.querySelector('.boxart-container, .jawBoneContent');
  }
}

export default new NetflixAdapter();
