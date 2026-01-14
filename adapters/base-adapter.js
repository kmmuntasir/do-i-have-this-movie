/**
 * BaseAdapter - Abstract base class for all site adapters
 * 
 * Site adapters extend this class to provide site-specific logic for:
 * - Detecting if they can handle a given hostname
 * - Finding movie card elements on the page
 * - Extracting movie metadata (title, year)
 * - Determining where to inject badges
 * - Providing custom badge styles
 */
export default class BaseAdapter {
  /**
   * Determines if this adapter can handle the given hostname
   * @param {string} hostname - The hostname of the current page
   * @returns {boolean} - True if this adapter can handle the hostname
   */
  canHandle(hostname) {
    throw new Error('canHandle() must be implemented by subclass');
  }

  /**
   * Returns CSS selectors for movie card elements
   * @returns {string[]} - Array of CSS selectors
   */
  getTargetSelectors() {
    throw new Error('getTargetSelectors() must be implemented by subclass');
  }

  /**
   * Extracts the movie title from a card element
   * @param {HTMLElement} element - The movie card element
   * @returns {string} - The movie title
   */
  extractTitle(element) {
    throw new Error('extractTitle() must be implemented by subclass');
  }

  /**
   * Extracts the movie year from a card element
   * @param {HTMLElement} element - The movie card element
   * @returns {string|null} - The movie year, or null if not available
   */
  extractYear(element) {
    return null;
  }

  /**
   * Returns the parent element for badge injection
   * @param {HTMLElement} element - The movie card element
   * @returns {HTMLElement} - The parent element to inject the badge into
   */
  getBadgeParent(element) {
    return element;
  }

  /**
   * Returns custom CSS styles for the badge
   * @returns {Object|null} - Custom styles object, or null for default styles
   */
  getBadgeStyles() {
    return null;
  }

  /**
   * Filters elements before processing
   * @param {HTMLElement} element - The movie card element
   * @returns {boolean} - True if the element should be processed
   */
  shouldProcessElement(element) {
    return true;
  }
}
