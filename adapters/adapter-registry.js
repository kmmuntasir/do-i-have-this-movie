/**
 * AdapterRegistry - Manages registration and retrieval of site adapters
 * 
 * This registry maintains a collection of adapters and provides methods to:
 * - Register new adapters
 * - Find the appropriate adapter for a given hostname
 * - Retrieve all registered adapters
 */

// Singleton instance
let registryInstance = null;

/**
 * AdapterRegistry class for managing site adapters
 */
class AdapterRegistry {
  constructor() {
    if (registryInstance) {
      return registryInstance;
    }
    this.adapters = [];
    registryInstance = this;
  }

  /**
   * Registers a new adapter
   * @param {BaseAdapter} adapter - The adapter instance to register
   * @throws {Error} - If adapter is not an instance of BaseAdapter
   */
  register(adapter) {
    if (!adapter || typeof adapter.canHandle !== 'function') {
      throw new Error('Adapter must be a valid adapter instance');
    }
    this.adapters.push(adapter);
  }

  /**
   * Returns the matching adapter for the given hostname
   * @param {string} hostname - The hostname to find an adapter for
   * @returns {BaseAdapter|null} - The matching adapter, or null if none found
   */
  getAdapter(hostname) {
    if (!hostname) {
      return null;
    }
    return this.adapters.find(adapter => adapter.canHandle(hostname)) || null;
  }

  /**
   * Returns all registered adapters
   * @returns {BaseAdapter[]} - Array of all registered adapters
   */
  getAllAdapters() {
    return [...this.adapters];
  }
}

// Create and export singleton instance
const registry = new AdapterRegistry();
export default registry;
