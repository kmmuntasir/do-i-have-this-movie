/**
 * Singleton registry to manage all source adapters
 */
class SourceRegistry {
  constructor() {
    if (SourceRegistry.instance) {
      return SourceRegistry.instance;
    }
    this.adapters = new Map();
    this.activeSources = new Set();
    SourceRegistry.instance = this;
  }

  /**
   * Register a new source adapter
   * @param {string} id - Unique identifier for the source
   * @param {BaseSourceAdapter} adapter - Adapter instance
   */
  register(id, adapter) {
    this.adapters.set(id, adapter);
  }

  /**
   * Unregister a source adapter
   * @param {string} id - Source identifier
   */
  unregister(id) {
    this.adapters.delete(id);
  }

  /**
   * Get a registered adapter by ID
   * @param {string} id - Source identifier
   * @returns {BaseSourceAdapter|null}
   */
  getAdapter(id) {
    return this.adapters.get(id) || null;
  }

  /**
   * Get all registered adapters
   * @returns {Array<{id: string, adapter: BaseSourceAdapter}>}
   */
  getAllAdapters() {
    return Array.from(this.adapters.entries()).map(([id, adapter]) => ({
      id,
      adapter
    }));
  }

  /**
   * Enable a source and configure it
   * @param {string} id - Source identifier
   */
  async enableSource(id) {
    const adapter = this.getAdapter(id);
    if (!adapter) throw new Error(`Source "${id}" not found`);
    
    const credentials = await this.getSourceCredentials(id);
    await adapter.configure(credentials);
    this.activeSources.add(id);
  }

  /**
   * Disable a source
   * @param {string} id - Source identifier
   */
  async disableSource(id) {
    this.activeSources.delete(id);
  }

  /**
   * Get all active sources
   * @returns {Array<{id: string, adapter: BaseSourceAdapter}>}
   */
  getActiveSources() {
    return Array.from(this.activeSources).map(id => ({
      id,
      adapter: this.getAdapter(id)
    }));
  }

  /**
   * Get the currently active source (legacy method for backward compatibility)
   * @returns {BaseSourceAdapter|null}
   * @deprecated Use getActiveSources() instead
   */
  getActiveSource() {
    if (this.activeSources.size === 0) return null;
    const firstId = this.activeSources.values().next().value;
    return this.getAdapter(firstId);
  }

  /**
   * Retrieve credentials from storage
   * @param {string} id - Source identifier
   * @returns {Promise<Object>}
   */
  async getSourceCredentials(id) {
    const data = await chrome.storage.local.get(['sources']);
    return data.sources?.[id] || {};
  }

  /**
   * Save credentials to storage
   * @param {string} id - Source identifier
   * @param {Object} credentials - Credentials to save
   * @param {boolean} enabled - Whether the source is enabled
   */
  async saveSourceCredentials(id, credentials, enabled = false) {
    const data = await chrome.storage.local.get(['sources']);
    const sources = data.sources || {};
    sources[id] = { ...credentials, enabled };
    await chrome.storage.local.set({ sources });
  }
}

// Export singleton instance
const sourceRegistry = new SourceRegistry();
export default sourceRegistry;
