import BaseSourceAdapter from './base-source-adapter.js';
import { fuzzyMatch } from './utils/fuzzy-search.js';

class PlexSourceAdapter extends BaseSourceAdapter {
  constructor() {
    super();
    this.config = null;
  }

  getName() {
    return 'Plex';
  }

  getType() {
    return 'api';
  }

  getRequiredFields() {
    return [
      { key: 'serverUrl', label: 'Server URL', type: 'url', required: true },
      { key: 'token', label: 'Plex Token', type: 'password', required: true }
    ];
  }

  validateCredentials(config) {
    const errors = [];
    
    if (!config.serverUrl) {
      errors.push('Server URL is required');
    } else {
      try {
        new URL(config.serverUrl);
      } catch (e) {
        errors.push('Invalid Server URL');
      }
    }
    
    if (!config.token) {
      errors.push('Plex Token is required');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  async configure(credentials) {
    const validation = this.validateCredentials(credentials);
    if (!validation.valid) {
      throw new Error(`Invalid credentials: ${validation.errors.join(', ')}`);
    }
    
    this.config = {
      ...credentials,
      serverUrl: credentials.serverUrl.trim().replace(/\/$/, '')
    };
  }

  async testConnection() {
    try {
      const response = await fetch(
        `${this.config.serverUrl}/?X-Plex-Token=${this.config.token}`,
        {
          headers: {
            'Accept': 'application/json'
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.MediaContainer) {
          return { success: true };
        }
        return { success: false, error: 'Invalid Plex server response' };
      } else {
        return { 
          success: false, 
          error: `HTTP ${response.status}: ${response.statusText}` 
        };
      }
    } catch (error) {
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  async checkMovie(title, year) {
    try {
      const searchTerm = title.toLowerCase().trim();
      
      // Plex uses /library/sections to get library IDs, then search
      const searchParams = new URLSearchParams({
        query: title,
        type: '1', // 1 = Movie
        X_Plex_Token: this.config.token
      });
      
      const response = await fetch(
        `${this.config.serverUrl}/search?${searchParams}`,
        {
          headers: {
            'Accept': 'application/json',
            'X-Plex-Token': this.config.token
          }
        }
      );
      
      const data = await response.json();
      const items = data.MediaContainer?.Metadata || [];
      
      // Fuzzy matching
      const match = items.find(item => {
        const itemTitle = item.title || '';
        const itemYear = item.year;
        return fuzzyMatch(searchTerm, itemTitle, year, itemYear);
      });
      
      if (match) {
        return {
          found: true,
          movie: {
            id: match.ratingKey,
            name: match.title,
            year: match.year
          }
        };
      }
      
      return { found: false };
    } catch (error) {
      console.error('Plex check error:', error);
      return { found: false };
    }
  }
}

export default PlexSourceAdapter;
