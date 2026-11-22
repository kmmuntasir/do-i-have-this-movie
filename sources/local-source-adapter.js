import BaseSourceAdapter from './base-source-adapter.js';
import { searchMovieFiles } from './utils/file-matcher.js';

class LocalSourceAdapter extends BaseSourceAdapter {
  constructor() {
    super();
    this.config = null;
  }

  getName() {
    return 'Local Files';
  }

  getType() {
    return 'filesystem';
  }

  getRequiredFields() {
    return [
      { key: 'recursive', label: 'Search subdirectories', type: 'checkbox', required: false }
    ];
  }

  validateCredentials() {
    return { valid: true, errors: [] };
  }

  async configure(credentials) {
    this.config = { recursive: credentials.recursive === true || credentials.recursive === 'true' };
      }

  /** Reads the file-name index the options page builds from the chosen folder. */
  async getAllMovieFiles() {
    const { localIndex } = await chrome.storage.local.get('localIndex');
    return localIndex?.files || [];
  }

  async testConnection() {
    const files = await this.getAllMovieFiles();
    if (files.length === 0) {
      return { success: false, error: 'No movie files indexed. Choose a folder first.' };
    }
    return { success: true };
  }

  async checkMovie(title, year) {
    const result = searchMovieFiles(title, year, await this.getAllMovieFiles());
    if (!result.found) return { found: false };
    return { found: true, movie: { id: result.fileName, name: result.title, year: result.year } };
  }
}

export default LocalSourceAdapter;
