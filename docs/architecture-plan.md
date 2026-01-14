# Architecture Plan: Interface-Based Website Adapter System

## Overview

This document outlines the proposed refactoring of the "Do I Have This Movie" browser extension to use an interface-based architecture for supporting multiple websites. Currently, all website-specific logic is consolidated in a single `siteConfigs` object in `content.js`. This refactoring will make the codebase more maintainable, testable, and extensible.

## Current Implementation Analysis

### Supported Websites
- Netflix
- IMDB
- YTS.bz
- Letterboxd (listed but not fully implemented)

### Current Structure
All website-specific logic is in a single `siteConfigs` object in `content.js` (approximately 115 lines).

### Key Characteristics
- Simple hostname matching using `includes()` for website detection
- Varying complexity across sites (YTS.bz is significantly more complex than Netflix/IMDB)
- Shared functionality: MutationObserver, badge injection, background communication
- Website-specific: DOM selectors, data extraction methods, badge positioning

### Problems with Current Approach
1. **Monolithic Code** - All logic in one file makes it hard to maintain
2. **Coupling** - Changes to one website could affect others
3. **Testing** - Difficult to test individual website implementations
4. **Extensibility** - Adding new websites requires modifying the main content script
5. **Readability** - 115+ lines of configuration mixed with logic

## Proposed Architecture

### File Structure

```
adapters/
├── base-adapter.js          # Interface definition
├── adapter-registry.js      # Adapter management
├── netflix-adapter.js       # Netflix implementation
├── imdb-adapter.js          # IMDB implementation
├── yts-adapter.js           # YTS.bz implementation
└── letterboxd-adapter.js    # Letterboxd implementation
```

### Core Components

#### 1. BaseAdapter Interface

The `BaseAdapter` class defines the contract that all website adapters must implement. It serves as an abstract base class with the following methods:

```javascript
class BaseAdapter {
  /**
   * Determines if this adapter can handle the current website
   * @param {string} hostname - The current page's hostname
   * @returns {boolean} - True if this adapter handles the site
   */
  canHandle(hostname) {
    throw new Error('canHandle() must be implemented');
  }

  /**
   * Returns CSS selectors for finding movie card elements
   * @returns {string[]} - Array of CSS selectors
   */
  getTargetSelectors() {
    throw new Error('getTargetSelectors() must be implemented');
  }

  /**
   * Extracts the movie title from a DOM element
   * @param {HTMLElement} element - The movie card element
   * @returns {string|null} - The movie title or null if not found
   */
  extractTitle(element) {
    throw new Error('extractTitle() must be implemented');
  }

  /**
   * Extracts the movie year from a DOM element
   * @param {HTMLElement} element - The movie card element
   * @returns {string|null} - The movie year or null if not found
   */
  extractYear(element) {
    return null; // Optional - default implementation
  }

  /**
   * Determines the parent element for badge injection
   * @param {HTMLElement} element - The movie card element
   * @returns {HTMLElement} - The parent element for badge placement
   */
  getBadgeParent(element) {
    return element; // Default implementation
  }

  /**
   * Optional: Custom styles for the badge on this site
   * @returns {Object|null} - CSS styles object or null
   */
  getBadgeStyles() {
    return null; // Optional
  }

  /**
   * Optional: Filter elements before processing
   * @param {HTMLElement} element - The movie card element
   * @returns {boolean} - True if element should be processed
   */
  shouldProcessElement(element) {
    return true; // Default implementation
  }
}
```

#### 2. Adapter Registry

The `AdapterRegistry` manages adapter registration and selection:

```javascript
class AdapterRegistry {
  constructor() {
    this.adapters = [];
  }

  /**
   * Registers a new adapter
   * @param {BaseAdapter} adapter - The adapter to register
   */
  register(adapter) {
    this.adapters.push(adapter);
  }

  /**
   * Gets the appropriate adapter for the current hostname
   * @param {string} hostname - The current page's hostname
   * @returns {BaseAdapter|null} - The matching adapter or null
   */
  getAdapter(hostname) {
    return this.adapters.find(adapter => adapter.canHandle(hostname)) || null;
  }

  /**
   * Gets all registered adapters
   * @returns {BaseAdapter[]} - Array of all adapters
   */
  getAllAdapters() {
    return [...this.adapters];
  }
}

// Create singleton instance
const registry = new AdapterRegistry();
export default registry;
```

#### 3. Website Adapters

Each website has its own adapter file implementing the `BaseAdapter` interface.

**Example: IMDB Adapter**

```javascript
import BaseAdapter from './base-adapter.js';

class IMDBAdapter extends BaseAdapter {
  canHandle(hostname) {
    return hostname.includes('imdb.com');
  }

  getTargetSelectors() {
    return [
      '.ipc-poster',              // New IMDB design
      '.titleColumn',             // Classic IMDB design
      '.lister-item-image'        // Alternative selector
    ];
  }

  extractTitle(element) {
    const link = element.querySelector('a');
    return link?.textContent?.trim() || null;
  }

  extractYear(element) {
    const yearElement = element.querySelector('.secondaryInfo');
    return yearElement?.textContent?.replace(/[()]/g, '') || null;
  }

  getBadgeParent(element) {
    // Inject badge after the poster image
    return element.querySelector('a') || element;
  }
}

export default new IMDBAdapter();
```

**Example: Netflix Adapter**

```javascript
import BaseAdapter from './base-adapter.js';

class NetflixAdapter extends BaseAdapter {
  canHandle(hostname) {
    return hostname.includes('netflix.com');
  }

  getTargetSelectors() {
    return [
      '.slider-item',
      '.lolomo',
      '[data-uia="poster"]'
    ];
  }

  extractTitle(element) {
    const titleElement = element.querySelector('[data-uia="video-title"]');
    return titleElement?.textContent?.trim() || null;
  }

  extractYear(element) {
    // Netflix doesn't always show year in card
    return null;
  }

  getBadgeParent(element) {
    return element;
  }
}

export default new NetflixAdapter();
```

#### 4. Refactored content.js

The main content script delegates to the adapter registry:

```javascript
import registry from './adapters/adapter-registry.js';
import imdbAdapter from './adapters/imdb-adapter.js';
import netflixAdapter from './adapters/netflix-adapter.js';
import ytsAdapter from './adapters/yts-adapter.js';

// Register all adapters
registry.register(imdbAdapter);
registry.register(netflixAdapter);
registry.register(ytsAdapter);

// Get current adapter
const hostname = window.location.hostname;
const adapter = registry.getAdapter(hostname);

if (!adapter) {
  console.log('No adapter found for:', hostname);
  return;
}

// Use adapter methods
const selectors = adapter.getTargetSelectors();
const elements = document.querySelectorAll(selectors.join(', '));

elements.forEach(element => {
  if (!adapter.shouldProcessElement(element)) {
    return;
  }

  const title = adapter.extractTitle(element);
  const year = adapter.extractYear(element);

  if (title) {
    // Check if movie exists in Jellyfin
    checkMovieInLibrary(title, year).then(exists => {
      if (exists) {
        const parent = adapter.getBadgeParent(element);
        injectBadge(parent);
      }
    });
  }
});
```

## Implementation Steps

### Phase 1: Create Base Infrastructure
1. Create `adapters/` folder
2. Create `base-adapter.js` with interface definition
3. Create `adapter-registry.js` with registry implementation

### Phase 2: Migrate Existing Websites
1. Create `netflix-adapter.js` with Netflix implementation
2. Create `imdb-adapter.js` with IMDB implementation
3. Create `yts-adapter.js` with YTS.bz implementation
4. Create `letterboxd-adapter.js` with Letterboxd implementation

### Phase 3: Refactor Main Script
1. Update `content.js` to use adapter registry
2. Remove old `siteConfigs` object
3. Test on all supported websites

### Phase 4: Update Manifest
1. Ensure all required host permissions are in `manifest.json`
2. Update `web_accessible_resources` if needed

## Adding New Websites

To add support for a new website:

### Step 1: Create Adapter File

Create a new file in the `adapters/` folder (e.g., `rotten-tomatoes-adapter.js`):

```javascript
import BaseAdapter from './base-adapter.js';

class RottenTomatoesAdapter extends BaseAdapter {
  canHandle(hostname) {
    return hostname.includes('rottentomatoes.com');
  }

  getTargetSelectors() {
    return [
      'div.movie-row',
      'a.movie-link'
    ];
  }

  extractTitle(element) {
    const titleElement = element.querySelector('h3, a');
    return titleElement?.textContent?.trim() || null;
  }

  extractYear(element) {
    const yearElement = element.querySelector('.year, .release-date');
    return yearElement?.textContent?.trim() || null;
  }
}

export default new RottenTomatoesAdapter();
```

### Step 2: Register Adapter

In `content.js`, import and register the new adapter:

```javascript
import rottenTomatoesAdapter from './adapters/rotten-tomatoes-adapter.js';

registry.register(rottenTomatoesAdapter);
```

### Step 3: Update Manifest

Add the new website to `manifest.json` host permissions:

```json
"host_permissions": [
  "*://*.rottentomatoes.com/*"
]
```

### Step 4: Test

Test the implementation on the new website to ensure:
- Movie cards are detected correctly
- Title extraction works
- Year extraction works (if applicable)
- Badge appears in the correct position
- No console errors

## Benefits

### 1. Isolation
- Changes to one website won't affect others
- Each adapter is self-contained
- Easy to disable specific websites

### 2. Organization
- ~50-80 lines per adapter vs 115 lines combined
- Clear file structure
- Logical separation of concerns

### 3. Testability
- Each adapter can be tested independently
- Mock DOM elements for unit testing
- Integration testing per website

### 4. Maintainability
- Clear boundaries make debugging easier
- Easy to understand which code belongs to which site
- Reduced cognitive load when working on specific websites

### 5. Extensibility
- Adding new websites is straightforward
- No need to modify existing code
- Clear pattern to follow

### 6. Scalability
- Easy to support dozens of websites
- Each website is isolated and independent
- Performance impact minimal

## Migration Checklist

- [ ] Create `adapters/` folder structure
- [ ] Implement `BaseAdapter` interface
- [ ] Implement `AdapterRegistry`
- [ ] Create `NetflixAdapter`
- [ ] Create `IMDBAdapter`
- [ ] Create `YTSAdapter`
- [ ] Create `LetterboxdAdapter`
- [ ] Refactor `content.js` to use adapters
- [ ] Remove old `siteConfigs` object
- [ ] Test on Netflix
- [ ] Test on IMDB
- [ ] Test on YTS.bz
- [ ] Test on Letterboxd
- [ ] Update documentation
- [ ] Create adapter template for future use

## Future Enhancements

### 1. Configuration-Based Adapters
Some adapters could be configuration-driven instead of code-driven:

```javascript
const config = {
  hostname: 'rottentomatoes.com',
  selectors: ['div.movie-row', 'a.movie-link'],
  titleSelector: 'h3, a',
  yearSelector: '.year, .release-date'
};
```

### 2. Dynamic Adapter Loading
Load adapters only when needed to reduce initial load time.

### 3. Adapter Auto-Discovery
Automatically discover and load adapter files from the `adapters/` folder.

### 4. Per-Site Settings
Allow users to enable/disable specific websites via settings.

### 5. Adapter Health Monitoring
Track which adapters are working and which need updates.

## Conclusion

This interface-based architecture provides a clean, maintainable foundation for supporting multiple websites with minimal code duplication and maximum flexibility for future additions. The refactoring will significantly improve the codebase's quality and make it easier to maintain and extend.
