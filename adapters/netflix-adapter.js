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
    // .title-card/.jawBoneContent: signed-in browse UI. The rest: public title
    // pages (netflix.com/title/<id>), whose "More like this" cards are
    // a[data-uia="titleId-..."] and whose main title is a hero billboard.
    return ['.title-card', '.jawBoneContent', 'a[data-uia^="titleId-"]', '[data-uia="hero"]'];
  }

  /**
   * Extracts the movie title from a card element
   * @param {HTMLElement} element - The movie card element
   * @returns {string} - The movie title
   */
  extractTitle(element) {
    if (element.matches('[data-uia="hero"]')) return document.querySelector('h1')?.textContent;
    if (element.matches('a[data-uia^="titleId-"]')) {
      return element.getAttribute('aria-label')?.replace(/^Go to /, '') || element.textContent;
    }
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
  extractYear(element) {
    // Public title pages list the year right after the title in the metadata block.
    if (!element.matches('[data-uia="hero"]')) return null;
    // Drop the title first so "Blade Runner 2049" is not read as a year.
    const title = document.querySelector('h1')?.textContent || '';
    const text = document.querySelector('[data-uia="metadata"]')?.textContent.replace(title, '');
    const year = text?.match(/\b(?:19|20)\d{2}\b/)?.[0];
    return year ? parseInt(year) : null;
  }

  getBadgeParent(element) {
    if (element.matches('a[data-uia^="titleId-"]') || element.matches('[data-uia="hero"]')) return element;
    return element.querySelector('.boxart-container, .jawBoneContent');
  }
}

export default new NetflixAdapter();
