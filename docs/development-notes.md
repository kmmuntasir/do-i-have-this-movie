# Development Notes

This document provides notes and considerations for developers contributing to the "Do I Have This Movie?" Chrome extension.

## Table of Contents

- [Project Status](#project-status)
- [Known Issues](#known-issues)
- [Technical Stack](#technical-stack)
- [Development Guidelines](#development-guidelines)
- [Code Style](#code-style)
- [Testing](#testing)
- [Contributing](#contributing)
- [Release Process](#release-process)

## Project Status

This project is **actively under development**. While the core functionality works, there are several areas that need improvement and completion.

### Current Status

| Component | Status | Notes |
|-----------|--------|-------|
| Core Functionality | ✅ Working | Badge injection and matching works |
| Netflix Adapter | ✅ Complete | Fully implemented |
| IMDb Adapter | ✅ Complete | Fully implemented |
| YTS Adapter | ✅ Complete | Fully implemented |
| Letterboxd Adapter | ⚠️ Partial | Listed but not fully implemented |
| Error Handling UI | ❌ Missing | All errors logged to console only |
| Rate Limiting | ❌ Missing | No rate limiting implemented |
| Caching | ❌ Missing | No response caching |
| Unit Tests | ❌ Missing | No test suite exists |

### Development Priorities

1. **High Priority:**
   - Remove mock code from [`background.js`](../background.js)
   - Implement error handling UI
   - Add rate limiting and caching
   - Complete Letterboxd support

2. **Medium Priority:**
   - Add comprehensive error handling
   - Implement settings sync across devices
   - Add unit and integration tests
   - Improve badge customization options

3. **Low Priority:**
   - Add statistics dashboard
   - Implement offline mode
   - Support for additional media servers
   - Mobile browser support

## Known Issues

### 1. Mock Code in Background Script

**Location:** [`background.js`](../background.js) lines 48-54

**Issue:** Temporary mock code exists that should be removed before production use.

**Impact:** The extension may return mock data instead of actual Jellyfin library data.

**Solution:**
```javascript
// Remove this mock code:
// const mockLibrary = [
//   { Name: 'The Matrix', ProductionYear: 1999 },
//   { Name: 'Inception', ProductionYear: 2010 }
// ];

// Replace with actual API call:
async function getLibrary() {
  const response = await fetch(`${serverUrl}/Users/${userId}/Items`);
  return await response.json();
}
```

**Status:** ⚠️ Needs to be removed before production release

### 2. Letterboxd Support

**Location:** Listed in README but not fully implemented

**Issue:** Letterboxd is listed as a supported site but the adapter is not complete.

**Impact:** Badges will not appear on Letterboxd.com

**Solution:** Create [`adapters/letterboxd-adapter.js`](../adapters/letterboxd-adapter.js) with full implementation. See [Adding New Websites](./adding-new-websites.md) for guidance.

**Status:** ⚠️ Partially implemented, needs completion

### 3. No UI for Error Handling

**Issue:** All errors are logged to console only. Users have no visual feedback when issues occur.

**Impact:** Users may not know when something goes wrong.

**Solution:** Implement user-friendly error notifications:
- Show error messages in popup
- Display connection status
- Provide actionable error messages
- Add retry mechanism

**Example Implementation:**
```javascript
// Show error notification
function showError(message, details) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon_48x48.png',
    title: 'Do I Have This Movie?',
    message: message
  });
}

// Update popup with error status
function updatePopupStatus(status) {
  const statusElement = document.getElementById('status');
  statusElement.textContent = status.message;
  statusElement.className = status.type; // 'error', 'success', 'warning'
}
```

**Status:** ❌ Not implemented

### 4. No Rate Limiting

**Issue:** No rate limiting or throttling is implemented for API calls.

**Impact:** Could overwhelm Jellyfin server with requests, especially on pages with many movie cards.

**Solution:** Implement rate limiting:
```javascript
class RateLimiter {
  constructor(maxRequests, timeWindow) {
    this.maxRequests = maxRequests;
    this.timeWindow = timeWindow;
    this.requests = [];
  }

  async acquire() {
    const now = Date.now();
    this.requests = this.requests.filter(t => now - t < this.timeWindow);

    if (this.requests.length >= this.maxRequests) {
      const waitTime = this.timeWindow - (now - this.requests[0]);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return this.acquire();
    }

    this.requests.push(now);
  }
}

// Usage
const limiter = new RateLimiter(10, 60000); // 10 requests per minute
await limiter.acquire();
// Make API call
```

**Status:** ❌ Not implemented

### 5. No Response Caching

**Issue:** No caching is implemented for API responses.

**Impact:** Repeated API calls for the same items, unnecessary server load.

**Solution:** Implement response caching:
```javascript
class CacheManager {
  constructor(ttl = 300000) { // 5 minutes default
    this.cache = new Map();
    this.ttl = ttl;
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    return item.value;
  }

  set(key, value) {
    this.cache.set(key, {
      value,
      expiry: Date.now() + this.ttl
    });
  }
}

// Usage
const cache = new CacheManager(300000);
const cached = cache.get('movie:123');
if (cached) {
  return cached;
}
const result = await fetchMovie('123');
cache.set('movie:123', result);
```

**Status:** ❌ Not implemented

## Technical Stack

### Core Technologies

| Technology | Version | Purpose |
|------------|----------|---------|
| **Manifest V3** | Latest | Chrome extension manifest format |
| **Vanilla JavaScript** | ES6+ | Extension logic, no frameworks |
| **Chrome Extension APIs** | - | Storage, Messaging, Content Scripts, Notifications |
| **Rollup** | 4.55.1 | Module bundler for content scripts |
| **@rollup/plugin-node-resolve** | 16.0.3 | Node module resolution |

### Dependencies

**Dev Dependencies:**
```json
{
  "@rollup/plugin-node-resolve": "^16.0.3",
  "rollup": "^4.55.1"
}
```

### Browser Compatibility

- **Chrome:** ✅ Full support (Manifest V3)
- **Chromium-based browsers:** ✅ Should work (Edge, Brave, Opera)
- **Firefox:** ⚠️ Not tested (may need manifest adjustments)
- **Safari:** ❌ Not supported (different extension API)

## Development Guidelines

### Code Organization

The extension follows a modular architecture with clear separation of concerns:

```
adapters/              # Site-specific implementations
  ├── base-adapter.js         # Abstract base class
  ├── adapter-registry.js     # Adapter registry (singleton)
  ├── netflix-adapter.js      # Netflix implementation
  ├── imdb-adapter.js         # IMDb implementation
  └── yts-adapter.js          # YTS.bz implementation

background.js         # Background service worker (API communication)
content.js            # Main content script (DOM scanning, badge injection)
content.css           # Badge styles
popup.html            # Settings popup UI
popup.js              # Popup logic
manifest.json         # Extension manifest
```

### Design Patterns Used

1. **Adapter Pattern:** Site-specific implementations extend [`BaseAdapter`](../adapters/base-adapter.js)
2. **Registry Pattern:** [`AdapterRegistry`](../adapters/adapter-registry.js) manages adapters
3. **Singleton Pattern:** AdapterRegistry is a singleton
4. **Observer Pattern:** MutationObserver for DOM changes
5. **Message Passing Pattern:** Chrome messaging API for component communication

### Extension Architecture

See [Architecture Overview](./architecture.md) for detailed architecture documentation.

## Code Style

### JavaScript Style Guide

Follow these conventions for consistent code style:

#### Naming Conventions

- **Classes:** PascalCase (`NetflixAdapter`)
- **Functions/Methods:** camelCase (`extractTitle`)
- **Constants:** UPPER_SNAKE_CASE (`MAX_REQUESTS`)
- **Variables:** camelCase (`movieTitle`)
- **Private members:** Prefix with underscore (`_privateMethod`)

#### File Organization

```javascript
// 1. Imports
import BaseAdapter from './base-adapter.js';

// 2. Class definition
class MyAdapter extends BaseAdapter {
  // 3. Constructor (if needed)
  constructor() {
    super();
    this._property = value;
  }

  // 4. Public methods
  canHandle(hostname) {
    // implementation
  }

  // 5. Private methods
  _helperMethod() {
    // implementation
  }
}

// 6. Export
export default new MyAdapter();
```

#### Comments

- Use JSDoc for function documentation:
```javascript
/**
 * Extracts the movie title from a card element
 * @param {HTMLElement} element - The movie card element
 * @returns {string} - The movie title
 */
extractTitle(element) {
  return element.querySelector('.title')?.textContent || '';
}
```

- Use inline comments for complex logic:
```javascript
// Netflix uses different selectors for small cards vs. detailed views
const cardTitle = element.querySelector('.fallback-text')?.textContent;
const detailTitle = element.querySelector('.title-logo')?.alt;
return cardTitle || detailTitle;
```

#### Error Handling

- Always handle potential errors:
```javascript
try {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json();
} catch (error) {
  console.error('Failed to fetch data:', error);
  return null;
}
```

- Use optional chaining for safe property access:
```javascript
const title = element.querySelector('.title')?.textContent || '';
```

#### Async/Await

- Prefer async/await over promises:
```javascript
// Good
async function getLibrary() {
  const response = await fetch(url);
  return await response.json();
}

// Avoid
function getLibrary() {
  return fetch(url).then(response => response.json());
}
```

### CSS Style Guide

- Use BEM-like naming for classes:
```css
.jellyfin-badge { /* ... */ }
.jellyfin-badge--success { /* ... */ }
.jellyfin-badge__icon { /* ... */ }
```

- Use CSS variables for theming:
```css
:root {
  --badge-bg-color: #4CAF50;
  --badge-text-color: #fff;
}

.jellyfin-badge {
  background-color: var(--badge-bg-color);
  color: var(--badge-text-color);
}
```

## Testing

### Current Testing Status

| Test Type | Status | Notes |
|-----------|--------|-------|
| Unit Tests | ❌ None | No test suite exists |
| Integration Tests | ❌ None | No integration tests |
| E2E Tests | ❌ None | No E2E tests |
| Manual Testing | ✅ Done | Tested on supported websites |

### Manual Testing Checklist

When making changes, test on all supported websites:

#### Netflix
- [ ] Grid view (browse page)
- [ ] Individual title page
- [ ] Search results
- [ ] SPA navigation
- [ ] Badges appear on owned items
- [ ] Badges don't appear on non-owned items

#### IMDb
- [ ] Movie listings
- [ ] Individual movie page
- [ ] Search results
- [ ] Top rated page
- [ ] Year extraction works

#### YTS.bz
- [ ] Browse page
- [ ] Individual movie page
- [ ] Related movies section
- [ ] Similar movies section
- [ ] Year extraction works

### Future Testing Plans

See [Future Enhancements](./future-enhancements.md) for testing roadmap.

## Contributing

### How to Contribute

We welcome contributions! Here's how to help:

1. **Fork the repository**
   ```bash
   git clone https://github.com/kmmuntasir/do-i-have-this-movie.git
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes**
   - Follow the code style guidelines
   - Add comments for complex logic
   - Update documentation as needed

4. **Test your changes**
   - Test on all supported websites
   - Check browser console for errors
   - Verify no regressions

5. **Submit a pull request**
   - Provide a clear description of changes
   - Reference related issues
   - Include screenshots if applicable

### Contribution Areas

We need help in these areas:

- **Adding new website adapters** - See [Adding New Websites](./adding-new-websites.md)
- **Completing Letterboxd support** - Implement full adapter
- **Error handling UI** - Add user-friendly error notifications
- **Rate limiting and caching** - Implement performance optimizations
- **Testing** - Add unit and integration tests
- **Documentation** - Improve existing docs
- **Bug fixes** - Fix reported issues

### Pull Request Guidelines

When submitting a pull request:

1. **Title:** Use a clear, descriptive title
   - Good: "Add support for Prime Video"
   - Bad: "Update files"

2. **Description:** Include:
   - What changes were made
   - Why the changes are needed
   - How to test the changes
   - Related issues or PRs

3. **Code Review:**
   - Address all review comments
   - Keep commits clean (squash if needed)
   - Update documentation

4. **Testing:**
   - Describe testing performed
   - List browsers/versions tested
   - Note any known limitations

## Release Process

### Version Bumping

When preparing a release:

1. **Update version numbers:**
   - [`package.json`](../package.json): `"version": "1.0.0"`
   - [`manifest.json`](../manifest.json): `"version": "1.0.0"`

2. **Update CHANGELOG.md** (if exists):
   ```markdown
   ## [1.0.0] - 2026-01-14
   
   ### Added
   - New feature description
   
   ### Fixed
   - Bug fix description
   
   ### Changed
   - Change description
   ```

3. **Create git tag:**
   ```bash
   git tag -a v1.0.0 -m "Release version 1.0.0"
   git push origin v1.0.0
   ```

### Pre-Release Checklist

Before releasing:

- [ ] All tests passing
- [ ] No console errors on supported websites
- [ ] Documentation updated
- [ ] CHANGELOG updated
- [ ] Version numbers updated
- [ ] Mock code removed
- [ ] Tested on all supported websites
- [ ] Performance acceptable

### Release Channels

1. **Development Release:**
   - Tagged with `-dev` suffix
   - For testing new features
   - Not published to Chrome Web Store

2. **Beta Release:**
   - Tagged with `-beta` suffix
   - For wider testing
   - May have known issues

3. **Stable Release:**
   - No suffix
   - Fully tested
   - Published to Chrome Web Store

## Development Environment

### Setting Up Development Environment

1. **Clone the repository:**
   ```bash
   git clone https://github.com/kmmuntasir/do-i-have-this-movie.git
   cd do-i-have-this-movie
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Build the extension:**
   ```bash
   npm run build
   ```

4. **Load in Chrome:**
   - Open `chrome://extensions/`
   - Enable Developer Mode
   - Click "Load unpacked"
   - Select the project directory

### Development Workflow

1. **Make changes** to source files
2. **Rebuild:** `npm run build`
3. **Reload extension** in Chrome
4. **Test changes** on supported websites
5. **Debug** using browser console (F12)

### Useful Development Tools

- **Chrome DevTools:** For debugging and inspecting
- **React Developer Tools:** Not needed (no React)
- **Redux DevTools:** Not needed (no Redux)
- **Postman:** For testing Jellyfin API

### Debugging Tips

1. **Enable verbose logging:**
   ```javascript
   console.log('[Do I Have This Movie?]', message);
   ```

2. **Use breakpoints:**
   - Open DevTools (F12)
   - Go to Sources tab
   - Find `dist/content-bundled.js`
   - Set breakpoints on lines of interest

3. **Monitor network requests:**
   - Open DevTools (F12)
   - Go to Network tab
   - Filter by XHR/Fetch
   - Look for API calls to Jellyfin

## Security Considerations

### API Key Storage

- API keys are stored in Chrome's secure storage API
- Keys are never logged or exposed in console
- Keys are only sent to the user's configured Jellyfin server

### CORS Configuration

- Jellyfin server must be configured to allow CORS requests
- Add `chrome-extension://*` to allowed origins if needed
- Use HTTPS for remote access

### Content Script Isolation

- Content scripts run in an isolated world
- This prevents conflicts with page scripts
- Improves security and stability

### Input Validation

- Always validate user input (server URL, API key)
- Sanitize data before displaying
- Use Content Security Policy (CSP)

## Performance Considerations

### Optimization Strategies

1. **Debounce DOM scanning:**
   ```javascript
   function debounce(func, wait) {
     let timeout;
     return function(...args) {
       clearTimeout(timeout);
       timeout = setTimeout(() => func.apply(this, args), wait);
     };
   }
   ```

2. **Use efficient selectors:**
   - Prefer ID selectors over class selectors
   - Avoid complex selectors
   - Use `querySelectorAll` sparingly

3. **Batch API requests:**
   - Group multiple requests
   - Use Promise.all for parallel requests
   - Implement rate limiting

4. **Cache responses:**
   - Store API responses locally
   - Use appropriate TTL
   - Implement cache invalidation

### Performance Metrics

Monitor these metrics during development:

- **Page load time:** Should be < 100ms impact
- **Badge injection time:** Should be < 50ms
- **API response time:** Depends on Jellyfin server
- **Memory usage:** Should be stable, no leaks

## Additional Resources

### Documentation

- [Installation Guide](./installation.md) - Installation instructions
- [Setup Guide](./setup-guide.md) - Configuration help
- [Architecture Overview](./architecture.md) - Understanding the extension
- [Adding New Websites](./adding-new-websites.md) - Creating adapters
- [Migration Checklist](./migration-checklist.md) - Refactoring guide
- [Future Enhancements](./future-enhancements.md) - Planned improvements
- [Build Process](./build-process.md) - Build and development
- [Troubleshooting](./troubleshooting.md) - Resolving issues

### External Resources

- [Chrome Extension Documentation](https://developer.chrome.com/docs/extensions/)
- [Manifest V3 Migration Guide](https://developer.chrome.com/docs/extensions/mv3/intro/)
- [Jellyfin API Documentation](https://api.jellyfin.org/)
- [MDN Web Docs - JavaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
- [Rollup Documentation](https://rollupjs.org/)

### Community

- [GitHub Repository](https://github.com/kmmuntasir/do-i-have-this-movie)
- [GitHub Issues](https://github.com/kmmuntasir/do-i-have-this-movie/issues)
- [GitHub Discussions](https://github.com/kmmuntasir/do-i-have-this-movie/discussions)

---

**Last Updated:** 2026-01-14
**Version:** 1.0.0
**Status:** Active Development
