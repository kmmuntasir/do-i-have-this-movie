# Source Adapter Architecture Plan

## Overview

This document outlines a comprehensive architecture for implementing a pluggable source adapter system that allows the extension to check movie availability across multiple media sources including media servers (Jellyfin, Emby, Plex), local file systems, and network protocols (SMB, FTP).

---

## Current Implementation Analysis

### Existing Architecture

The extension currently has a hardcoded Jellyfin-only implementation in [`background.js`](../background.js):

#### Data Flow

1. Content script extracts movie info (title, year) using website adapters
2. Sends `CHECK_MOVIE` message to background script
3. Background script retrieves credentials from `chrome.storage.local` (serverUrl, apiKey)
4. Queries Jellyfin API at `/Items` endpoint with search parameters
5. Performs fuzzy matching (title comparison + year within 1 year)
6. Returns `{ success: true, found: boolean, movie: { id, name, year } | null }`
7. Content script injects badge if found

#### Key Findings

- **No abstraction layer for sources** - Jellyfin logic is hardcoded
- **Credentials stored as flat key-value pairs** in `chrome.storage.local`
- **Error handling exists but is basic**
- **Temporary mock code for testing** still present
- **Only one authentication method supported** (API key)

---

## Proposed Source Adapter Architecture

### 1. BaseSourceAdapter Interface

```javascript
/**
 * Abstract base class for all source adapters
 */
class BaseSourceAdapter {
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
```

### 2. SourceRegistry Pattern

```javascript
/**
 * Singleton registry to manage all source adapters
 */
class SourceRegistry {
  constructor() {
    if (SourceRegistry.instance) {
      return SourceRegistry.instance;
    }
    this.adapters = new Map();
    this.activeSource = null;
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
   * Set the active source from storage
   * @param {string} id - Source identifier
   */
  async setActiveSource(id) {
    const adapter = this.getAdapter(id);
    if (!adapter) {
      throw new Error(`Source "${id}" not found`);
    }
    
    const credentials = await this.getSourceCredentials(id);
    await adapter.configure(credentials);
    this.activeSource = id;
  }

  /**
   * Get the currently active source
   * @returns {BaseSourceAdapter|null}
   */
  getActiveSource() {
    if (!this.activeSource) return null;
    return this.getAdapter(this.activeSource);
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
   */
  async saveSourceCredentials(id, credentials) {
    const data = await chrome.storage.local.get(['sources']);
    const sources = data.sources || {};
    sources[id] = credentials;
    await chrome.storage.local.set({ sources });
  }
}

// Export singleton instance
const sourceRegistry = new SourceRegistry();
```

---

## 3. File Structure

```
sources/
├── base-source-adapter.js      # Abstract base class
├── source-registry.js          # Source registry (singleton)
├── jellyfin-source-adapter.js  # Jellyfin API implementation
├── emby-source-adapter.js      # Emby API implementation
├── plex-source-adapter.js      # Plex API implementation
├── smb-source-adapter.js       # Windows SMB shares
├── ftp-source-adapter.js       # FTP servers
├── local-source-adapter.js     # Local file system
└── utils/
    ├── file-matcher.js         # File name matching utilities
    ├── fuzzy-search.js         # Fuzzy search algorithms
    └── cache-manager.js        # Result caching
```

---

## 4. Authentication Support

### API Keys
- **Jellyfin**: API key from server settings
- **Emby**: API key from server settings
- **Plex**: X-Plex-Token

### Username/Password
- **FTP**: Standard FTP authentication
- **SMB**: Windows domain credentials

### Token-based Auth
- **Plex OAuth**: OAuth token flow

### No Auth
- **Local filesystem**: Direct file system access

---

## 5. Query Methods

### HTTP API (Media Servers)
- RESTful API endpoints
- JSON response parsing
- Search by title/year

### File System Scanning (Local)
- Directory traversal
- Pattern matching
- File metadata extraction

### Network Protocols (SMB, FTP)
- Protocol-specific clients
- Directory listing
- File download/streaming

### Directory Traversal with Pattern Matching
- Recursive directory search
- Regex-based file name matching
- Year extraction from file names

---

## 6. UI Design

### Source Selector Dropdown
- List all available sources
- Show currently active source
- Indicate connection status

### Dynamic Configuration Forms
- Auto-generated based on source type
- Field validation
- Secure password input

### Connection Test Button
- Verify credentials
- Test network connectivity
- Show success/error feedback

### Multiple Source Support
- Priority ordering
- Per-source enable/disable toggles
- Source-specific settings

---

## 7. Key Challenges & Solutions

### Challenge 1: Different Authentication Methods

**Solution**: Credential schema with validation per source type
```javascript
const credentialSchemas = {
  jellyfin: {
    serverUrl: { type: 'url', required: true },
    apiKey: { type: 'string', required: true, secret: true }
  },
  plex: {
    token: { type: 'string', required: true, secret: true },
    serverUrl: { type: 'url', required: true }
  },
  ftp: {
    host: { type: 'string', required: true },
    port: { type: 'number', default: 21 },
    username: { type: 'string', required: true },
    password: { type: 'string', required: true, secret: true }
  }
};
```

**Solution**: Secure storage with encryption for sensitive data
- Use `chrome.storage.local` (not sync)
- Never log credentials
- Mask sensitive fields in UI

### Challenge 2: Network Protocol Limitations

**Solution**: Chrome native messaging for SMB/FTP (requires native app)
- Native host application handles protocol-specific logic
- Extension communicates via message passing
- Cross-platform support

**Solution**: WebDAV protocol as alternative to SMB
- HTTP-based protocol
- No native app required
- Browser-native support

**Solution**: Server-side proxy for cross-origin requests
- CORS-compliant proxy server
- Optional for advanced users
- Maintains security

### Challenge 3: Performance with File Systems

**Solution**: Result caching with TTL
```javascript
class CacheManager {
  constructor(ttl = 300000) { // 5 minutes default
    this.cache = new Map();
    this.ttl = ttl;
  }

  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }

  set(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
}
```

**Solution**: Indexed file database
- IndexedDB for persistent storage
- Background indexing service
- Incremental updates

**Solution**: Debounced queries
- Prevent rapid successive queries
- Batch multiple checks
- User-configurable delay

**Solution**: Background indexing
- Periodic file system scans
- Maintain search index
- Update on file changes

### Challenge 4: UI Complexity

**Solution**: Dynamic form generation based on source schema
```javascript
function generateConfigForm(sourceType) {
  const schema = credentialSchemas[sourceType];
  const form = document.createElement('form');
  
  Object.entries(schema).forEach(([key, config]) => {
    const field = createField(key, config);
    form.appendChild(field);
  });
  
  return form;
}
```

**Solution**: Progressive disclosure for advanced options
- Show basic fields by default
- "Advanced" toggle for additional settings
- Remember user preferences

**Solution**: Preset configurations for common setups
- Quick setup templates
- Common server configurations
- Community-contributed presets

### Challenge 5: Security

**Solution**: Never log credentials
- Strip credentials from error messages
- Sanitize debug output
- No credential storage in logs

**Solution**: Use `chrome.storage.local` (not sync)
- Data stays on device
- Not synced to cloud
- Encrypted at rest

**Solution**: Validate all inputs
- Server-side validation
- Client-side validation
- Sanitize URLs and paths

**Solution**: HTTPS only for API sources
- Enforce HTTPS for API endpoints
- Warn on HTTP connections
- Certificate validation

---

## 8. Implementation Phases

### Phase 1: Foundation (Core Architecture)

**Tasks:**
- [ ] Create `BaseSourceAdapter` interface in [`sources/base-source-adapter.js`](../sources/base-source-adapter.js)
- [ ] Implement `SourceRegistry` singleton in [`sources/source-registry.js`](../sources/source-registry.js)
- [ ] Refactor existing Jellyfin code to adapter pattern
- [ ] Update [`background.js`](../background.js) to use registry
- [ ] Add basic error handling and logging

**Deliverables:**
- Working adapter interface
- Registry with Jellyfin adapter
- Backward compatibility with existing users

### Phase 2: Media Server Sources (API-based)

**Tasks:**
- [ ] Create [`sources/jellyfin-source-adapter.js`](../sources/jellyfin-source-adapter.js) (migrate existing)
- [ ] Create [`sources/emby-source-adapter.js`](../sources/emby-source-adapter.js)
- [ ] Create [`sources/plex-source-adapter.js`](../sources/plex-source-adapter.js)
- [ ] Implement UI for API configuration
- [ ] Add connection testing

**Deliverables:**
- Three working media server adapters
- Configuration UI
- Connection status indicators

### Phase 3: File System Sources (Local/Network)

**Tasks:**
- [ ] Create [`sources/local-source-adapter.js`](../sources/local-source-adapter.js)
- [ ] Create [`sources/smb-source-adapter.js`](../sources/smb-source-adapter.js)
- [ ] Create [`sources/ftp-source-adapter.js`](../sources/ftp-source-adapter.js)
- [ ] Implement file matching utilities in [`sources/utils/file-matcher.js`](../sources/utils/file-matcher.js)
- [ ] Create native messaging host for SMB/FTP

**Deliverables:**
- Local filesystem adapter
- SMB and FTP adapters with native host
- File name matching utilities

### Phase 4: Advanced Features

**Tasks:**
- [ ] Implement multiple active sources
- [ ] Add source priority system
- [ ] Implement advanced caching in [`sources/utils/cache-manager.js`](../sources/utils/cache-manager.js)
- [ ] Add background indexing
- [ ] Performance optimizations

**Deliverables:**
- Multi-source support
- Priority-based querying
- Background indexing service

### Phase 5: Polish & Testing

**Tasks:**
- [ ] Comprehensive error handling
- [ ] User documentation
- [ ] Migration guide for existing users
- [ ] Testing across all sources
- [ ] Performance benchmarks

**Deliverables:**
- Production-ready extension
- Complete documentation
- Migration tools

---

## 9. Benefits of This Architecture

### Extensibility
- Add new sources without modifying core code
- Plugin-like architecture
- Community contributions welcome

### Maintainability
- Isolate source-specific logic
- Clear separation of concerns
- Easier debugging and updates

### Testability
- Test adapters independently
- Mock sources for unit testing
- Integration testing simplified

### Flexibility
- Support multiple authentication methods
- Various query strategies
- Customizable per source

### User Choice
- Users can choose their preferred media source
- Switch between sources easily
- Use multiple sources simultaneously

### Future-Proof
- Easy to add new media servers or protocols
- Adaptable to changing APIs
- Scalable architecture

---

## 10. Migration Strategy

### Step-by-Step Migration

1. **Create new architecture alongside existing code**
   - New files in `sources/` directory
   - No breaking changes to existing functionality

2. **Migrate Jellyfin implementation to adapter pattern**
   - Extract Jellyfin logic to adapter
   - Maintain backward compatibility

3. **Update [`background.js`](../background.js) to use SourceRegistry**
   - Gradual transition
   - Fallback to old implementation if needed

4. **Update popup UI for source selection**
   - Add source selector dropdown
   - Configuration forms
   - Migration wizard for existing users

5. **Migrate existing user settings to new format**
   - Automatic conversion on upgrade
   - Backup old settings
   - Validation after migration

6. **Remove old hardcoded Jellyfin code**
   - After successful migration
   - Deprecation period
   - Clear communication to users

7. **Add new source adapters incrementally**
   - One source at a time
   - Thorough testing each
   - User feedback integration

### Data Migration Example

```javascript
async function migrateJellyfinSettings() {
  const oldData = await chrome.storage.local.get([
    'jellyfinServerUrl',
    'jellyfinApiKey'
  ]);
  
  if (oldData.jellyfinServerUrl && oldData.jellyfinApiKey) {
    const newData = {
      sources: {
        jellyfin: {
          serverUrl: oldData.jellyfinServerUrl,
          apiKey: oldData.jellyfinApiKey
        }
      },
      activeSource: 'jellyfin'
    };
    
    await chrome.storage.local.set(newData);
    
    // Optionally remove old keys
    await chrome.storage.local.remove([
      'jellyfinServerUrl',
      'jellyfinApiKey'
    ]);
  }
}
```

---

## 11. Example Adapter Implementation

### Jellyfin Source Adapter

```javascript
import BaseSourceAdapter from './base-source-adapter.js';

class JellyfinSourceAdapter extends BaseSourceAdapter {
  constructor() {
    super();
    this.config = null;
  }

  getName() {
    return 'Jellyfin';
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
    
    this.config = credentials;
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
      const searchParams = new URLSearchParams({
        searchTerm: title,
        IncludeItemTypes: 'Movie',
        Recursive: true,
        Fields: 'ProviderIds,UserData'
      });
      
      const response = await fetch(
        `${this.config.serverUrl}/Users/${await this.getUserId()}/Items?${searchParams}`,
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
        const titleMatch = this.fuzzyMatch(title, item.Name);
        const yearMatch = Math.abs(item.ProductionYear - year) <= 1;
        return titleMatch && yearMatch;
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
      console.error('Jellyfin check error:', error);
      return { found: false };
    }
  }

  async getUserId() {
    // Cache user ID or fetch from API
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

  fuzzyMatch(str1, str2) {
    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();
    return s1.includes(s2) || s2.includes(s1);
  }
}

export default JellyfinSourceAdapter;
```

---

## 12. Data Flow Diagram

```
┌─────────────────┐
│  Content Script │
│  (website)      │
└────────┬────────┘
         │ Extract movie info
         │ (title, year)
         ↓
┌─────────────────┐
│  Background     │
│  Script         │
└────────┬────────┘
         │ CHECK_MOVIE message
         ↓
┌─────────────────────────────┐
│  SourceRegistry             │
│  - Get active source        │
│  - Retrieve credentials     │
└────────┬────────────────────┘
         │
         ↓
┌─────────────────────────────┐
│  BaseSourceAdapter          │
│  - configure(credentials)   │
│  - checkMovie(title, year)  │
└────────┬────────────────────┘
         │
         ├──────────────────────────────────────┐
         │                                      │
         ↓                                      ↓
┌─────────────────┐                   ┌─────────────────┐
│  API Sources    │                   │  File Sources    │
│  (Jellyfin,     │                   │  (Local, SMB,    │
│   Emby, Plex)   │                   │   FTP)           │
└────────┬────────┘                   └────────┬────────┘
         │                                      │
         │ HTTP API calls                      │ File system ops
         │                                      │
         ↓                                      ↓
┌─────────────────┐                   ┌─────────────────┐
│  Media Server   │                   │  File System    │
│  API            │                   │  / Network      │
└────────┬────────┘                   └────────┬────────┘
         │                                      │
         └──────────────┬───────────────────────┘
                        ↓
               ┌─────────────────┐
               │  Result         │
               │  {found, movie} │
               └────────┬────────┘
                        │
                        ↓
               ┌─────────────────┐
               │  Content Script │
               │  Inject badge   │
               └─────────────────┘
```

---

## 13. Configuration Schema

```javascript
// Storage structure in chrome.storage.local
{
  "sources": {
    "jellyfin": {
      "serverUrl": "https://media.example.com",
      "apiKey": "abc123..."
    },
    "plex": {
      "serverUrl": "https://plex.example.com",
      "token": "xyz789..."
    },
    "local": {
      "paths": [
        "C:/Movies",
        "D:/Videos/HD"
      ],
      "recursive": true
    }
  },
  "activeSource": "jellyfin",
  "sourcePriority": ["jellyfin", "plex", "local"],
  "cacheEnabled": true,
  "cacheTTL": 300000
}
```

---

## 14. Testing Strategy

### Unit Tests
- Test each adapter independently
- Mock external dependencies
- Validate credential formats
- Test fuzzy matching algorithms

### Integration Tests
- Test full data flow
- Test with real media servers
- Test error scenarios
- Test migration paths

### Manual Testing Checklist
- [ ] Connect to Jellyfin server
- [ ] Connect to Emby server
- [ ] Connect to Plex server
- [ ] Scan local directories
- [ ] Connect to SMB share
- [ ] Connect to FTP server
- [ ] Test with various movie titles
- [ ] Test with edge cases (special characters, years)
- [ ] Test error handling (invalid credentials, offline)
- [ ] Test migration from old settings

---

## 15. Documentation Requirements

### User Documentation
- Setup guide for each source type
- Troubleshooting common issues
- Migration instructions
- FAQ

### Developer Documentation
- Adapter interface specification
- Adding new sources guide
- Testing guidelines
- Code examples

### API Documentation
- SourceRegistry API
- BaseSourceAdapter interface
- Utility functions

---

## Conclusion

This architecture provides a robust, extensible foundation for supporting multiple media sources. The adapter pattern ensures that adding new sources doesn't require changes to core functionality, while the registry pattern provides centralized management. The phased implementation approach allows for incremental delivery and user feedback integration.

The architecture mirrors the successful website adapter pattern already used in the extension, ensuring consistency and maintainability across the codebase.
