import BaseSourceAdapter from './base-source-adapter.js';
import { searchMovieFiles } from './utils/file-matcher.js';

class LocalSourceAdapter extends BaseSourceAdapter {
  constructor() {
    super();
    this.config = null;
    this.fileCache = new Map();
  }

  getName() {
    return 'Local Files';
  }

  getType() {
    return 'filesystem';
  }

  getRequiredFields() {
    return [
      { 
        key: 'paths', 
        label: 'Movie Directories (one per line)', 
        type: 'textarea', 
        required: true 
      },
      { 
        key: 'recursive', 
        label: 'Search Subdirectories', 
        type: 'checkbox', 
        required: false 
      }
    ];
  }

  validateCredentials(config) {
    const errors = [];
    
    if (!config.paths || config.paths.trim() === '') {
      errors.push('At least one directory path is required');
    } else {
      const paths = config.paths.split('\n').map(p => p.trim()).filter(p => p);
      if (paths.length === 0) {
        errors.push('At least one directory path is required');
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  async configure(credentials) {
    const validation = this.validateCredentials(credentials);
    if (!validation.valid) {
      throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`);
    }
    
    this.config = {
      paths: credentials.paths.split('\n').map(p => p.trim()).filter(p => p),
      recursive: credentials.recursive === true || credentials.recursive === 'true'
    };
    
    // Clear cache on reconfiguration
    this.fileCache.clear();
  }

  async testConnection() {
    try {
      // For local files, we just verify the paths exist
      // Note: Chrome extensions have limited access to local file system
      // This is a placeholder - actual implementation may need File System Access API
      // or a native host application
      
      return { 
        success: true,
        warning: 'Local file system access requires user permission'
      };
    } catch (error) {
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  async checkMovie(title, year) {
    try {
      const allFiles = await this.getAllMovieFiles();
      const result = searchMovieFiles(title, year, allFiles);
      
      if (result.found) {
        return {
          found: true,
          movie: {
            id: result.fileName,
            name: result.title,
            year: result.year
          }
        };
      }
      
      return { found: false };
    } catch (error) {
      console.error('Local file check error:', error);
      return { found: false };
    }
  }

  /**
   * Get all movie files from configured directories
   * Note: This is a simplified implementation. In a real Chrome extension,
   * you would need to use the File System Access API or a native host
   * to access local files. This implementation returns a placeholder response.
   */
  async getAllMovieFiles() {
    // Check cache first
    const cacheKey = JSON.stringify(this.config.paths);
    if (this.fileCache.has(cacheKey)) {
      return this.fileCache.get(cacheKey);
    }
    
    // Placeholder: In a real implementation, this would:
    // 1. Use File System Access API to request directory access
    // 2. Scan directories for movie files
    // 3. Return list of file names
    
    // For now, return empty array
    const files = [];
    this.fileCache.set(cacheKey, files);
    return files;
  }
}

export default LocalSourceAdapter;
