/**
 * Abstract base class for all source adapters
 */
export default class BaseSourceAdapter {
  /**
   * Return the display name of this source
   * @returns {string}
   */
  getName() {
    throw new Error('getName() must be implemented by subclass');
  }

  /**
   * Return the source type (api, filesystem, network)
   * @returns {'api' | 'filesystem' | 'network'}
   */
  getType() {
    throw new Error('getType() must be implemented by subclass');
  }

  /**
   * Configure the adapter with credentials
   * @param {Object} credentials - Source-specific credentials
   * @returns {Promise<void>}
   */
  async configure(credentials) {
    throw new Error('configure() must be implemented by subclass');
  }

  /**
   * Test if the source is accessible
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async testConnection() {
    throw new Error('testConnection() must be implemented by subclass');
  }

  /**
   * Check if a movie exists in the source
   * @param {string} title - Movie title
   * @param {number} year - Movie release year
   * @returns {Promise<{found: boolean, movie?: Object}>}
   */
  async checkMovie(title, year) {
    throw new Error('checkMovie() must be implemented by subclass');
  }

  /**
   * Return required credential fields for this source
   * @returns {Array<{key: string, label: string, type: string, required: boolean}>}
   */
  getRequiredFields() {
    throw new Error('getRequiredFields() must be implemented by subclass');
  }

  /**
   * Validate credential format before storage
   * @param {Object} config - Credentials to validate
   * @returns {{valid: boolean, errors: string[]}}
   */
  validateCredentials(config) {
    throw new Error('validateCredentials() must be implemented by subclass');
  }
}
