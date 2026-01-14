import BaseSourceAdapter from './base-source-adapter.js';
import { fuzzyMatch } from './utils/fuzzy-search.js';

class EmbySourceAdapter extends BaseSourceAdapter {
  constructor() {
    super();
    this.config = null;
    this.userId = null;
  }

  getName() {
    return 'Emby';
  }

  getType() {
    return 'api';
  }

  getRequiredFields() {
    return [
      { key: 'serverUrl', label: 'Server URL', type: 'url', required: true },
      { key: 'apiKey', label: 'API Key', type: 'password', required: true }
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
    
    if (!config.apiKey) {
      errors.push('API Key is required');
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
        `${this.config.serverUrl}/Users`,
        {
          headers: {
            'X-MediaBrowser-Token': this.config.apiKey
          }
        }
      );
      
      if (response.ok) {
        return { success: true };
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
      const userId = await this.getUserId();
      const searchTerm = title.toLowerCase().trim();
      
      const searchParams = new URLSearchParams({
        searchTerm: title,
        IncludeItemTypes: 'Movie',
        Recursive: true,
        Fields: 'ProviderIds,UserData'
      });
      
      const response = await fetch(
        `${this.config.serverUrl}/Users/${userId}/Items?${searchParams}`,
        {
          headers: {
            'X-MediaBrowser-Token': this.config.apiKey
          }
        }
      );
      
      const data = await response.json();
      const items = data.Items || [];
      
      // Fuzzy matching
      const match = items.find(item => {
        return fuzzyMatch(searchTerm, item.Name, year, item.ProductionYear);
      });
      
      if (match) {
        return {
          found: true,
          movie: {
            id: match.Id,
            name: match.Name,
            year: match.ProductionYear
          }
        };
      }
      
      return { found: false };
    } catch (error) {
      console.error('Emby check error:', error);
      return { found: false };
    }
  }

  async getUserId() {
    if (this.userId) return this.userId;
    
    const response = await fetch(
      `${this.config.serverUrl}/Users`,
      {
        headers: {
          'X-MediaBrowser-Token': this.config.apiKey
        }
      }
    );
    
    const users = await response.json();
    this.userId = users[0]?.Id;
    return this.userId;
  }
}

export default EmbySourceAdapter;
