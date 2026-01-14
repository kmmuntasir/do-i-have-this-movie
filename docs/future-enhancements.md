# Future Enhancements

This document outlines planned and potential future enhancements for the "Do I Have This Movie?" Chrome extension.

## Table of Contents

- [Short-Term Enhancements](#short-term-enhancements)
- [Medium-Term Enhancements](#medium-term-enhancements)
- [Long-Term Enhancements](#long-term-enhancements)
- [Community Suggestions](#community-suggestions)
- [Technical Debt](#technical-debt)
- [Research Areas](#research-areas)

## Short-Term Enhancements

### 1. Error Handling UI

**Priority:** High
**Estimated Effort:** 4-6 hours

Currently, all errors are logged to the console only. Users have no visual feedback when issues occur.

**Planned Features:**
- User-friendly error notifications
- Connection status indicator in popup
- Error messages with actionable solutions
- Retry mechanism for failed API calls

**Implementation:**
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
```

**Benefits:**
- Better user experience
- Easier troubleshooting
- Reduced support requests

### 2. Rate Limiting and Caching

**Priority:** High
**Estimated Effort:** 6-8 hours

No rate limiting or caching is currently implemented, which could lead to excessive API calls.

**Planned Features:**
- Request rate limiting (e.g., max 10 requests per minute)
- Response caching with TTL (Time To Live)
- Cache invalidation on library changes
- Cache statistics display

**Implementation:**
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
```

**Benefits:**
- Reduced API load on Jellyfin server
- Faster response times
- Better performance on large libraries

### 3. Complete Letterboxd Support

**Priority:** Medium
**Estimated Effort:** 4-6 hours

Letterboxd is listed as a supported site but not fully implemented.

**Planned Features:**
- Full adapter implementation for Letterboxd
- Support for film listings
- Support for watchlist
- Support for user reviews

**Implementation:**
Create [`adapters/letterboxd-adapter.js`](../adapters/letterboxd-adapter.js):
```javascript
import BaseAdapter from './base-adapter.js';

class LetterboxdAdapter extends BaseAdapter {
  canHandle(hostname) {
    return hostname.includes('letterboxd.com');
  }

  getTargetSelectors() {
    return ['.film-poster', '.poster-container'];
  }

  extractTitle(element) {
    return element.querySelector('.film-title')?.textContent ||
           element.getAttribute('data-film-name') ||
           '';
  }

  extractYear(element) {
    const year = element.querySelector('.film-year')?.textContent;
    return year ? parseInt(year) : null;
  }
}

export default new LetterboxdAdapter();
```

**Benefits:**
- Complete support for listed platform
- Expanded user base
- Consistent experience across all sites

### 4. Settings Sync Across Devices

**Priority:** Medium
**Estimated Effort:** 6-8 hours

Settings are currently stored locally and don't sync across devices.

**Planned Features:**
- Chrome storage sync for settings
- Automatic sync when user signs in to Chrome
- Conflict resolution for multiple devices
- Sync status indicator

**Implementation:**
```javascript
// Use chrome.storage.sync instead of chrome.storage.local
chrome.storage.sync.set({
  jellyfinUrl: url,
  apiKey: key
}, () => {
  console.log('Settings synced across devices');
});
```

**Benefits:**
- Seamless experience across devices
- No need to reconfigure on each device
- Automatic backup of settings

### 5. Customizable Badge Appearance

**Priority:** Low
**Estimated Effort:** 4-6 hours

Users may want to customize the badge appearance to match their preferences.

**Planned Features:**
- Badge color picker
- Badge size options
- Badge position options
- Badge text customization
- Theme presets (light/dark)

**Implementation:**
```javascript
// Add to popup.html
<input type="color" id="badge-color" value="#4CAF50">
<select id="badge-size">
  <option value="small">Small</option>
  <option value="medium" selected>Medium</option>
  <option value="large">Large</option>
</select>

// Apply custom styles
function applyCustomBadgeStyles(styles) {
  const badge = document.querySelector('.jellyfin-badge');
  if (badge) {
    badge.style.backgroundColor = styles.color;
    badge.style.fontSize = styles.size;
  }
}
```

**Benefits:**
- Personalized user experience
- Better visibility on different websites
- Accessibility improvements

## Medium-Term Enhancements

### 6. Multiple Jellyfin Server Support

**Priority:** Medium
**Estimated Effort:** 8-12 hours

Currently, only one Jellyfin server can be configured.

**Planned Features:**
- Support for multiple server configurations
- Server selection in popup
- Automatic server selection based on library content
- Server health monitoring

**Implementation:**
```javascript
// Store multiple servers
const servers = [
  { name: 'Home', url: 'http://localhost:8096', apiKey: '...' },
  { name: 'Remote', url: 'https://jellyfin.example.com', apiKey: '...' }
];

// Query all servers
async function checkAllServers(title, year) {
  const results = await Promise.all(
    servers.map(server => checkServer(server, title, year))
  );
  return results.find(r => r.found) || null;
}
```

**Benefits:**
- Support for users with multiple servers
- Better coverage of media libraries
- Flexibility for different use cases

### 7. Advanced Matching Options

**Priority:** Medium
**Estimated Effort:** 8-10 hours

Current matching is basic (title + year). More sophisticated matching could improve accuracy.

**Planned Features:**
- Fuzzy matching with configurable threshold
- Alternative title matching
- Director/actor matching
- Genre matching
- Matching confidence score display

**Implementation:**
```javascript
// Use string similarity library
import { similarity } from 'string-similarity';

function fuzzyMatch(title1, title2, threshold = 0.8) {
  const score = similarity(title1.toLowerCase(), title2.toLowerCase());
  return score >= threshold;
}

// Check alternative titles
function checkAlternativeTitles(title, item) {
  const alternatives = [
    item.OriginalTitle,
    item.SortName,
    ...item.ProductionYear
  ];
  return alternatives.some(alt => fuzzyMatch(title, alt));
}
```

**Benefits:**
- Improved matching accuracy
- Better handling of title variations
- Reduced false negatives

### 8. Library Statistics Dashboard

**Priority:** Low
**Estimated Effort:** 10-12 hours

Provide users with insights about their library and extension usage.

**Planned Features:**
- Total movies/shows in library
- Most frequently matched items
- Extension usage statistics
- Library growth over time
- Genre distribution

**Implementation:**
```javascript
// Collect statistics
function collectStatistics() {
  return {
    totalItems: library.length,
    matchedItems: matchedCount,
    topMatches: getTopMatches(10),
    usageBySite: getUsageBySite(),
    lastSync: lastSyncTime
  };
}

// Display in popup
function showStatistics(stats) {
  document.getElementById('stats-total').textContent = stats.totalItems;
  document.getElementById('stats-matched').textContent = stats.matchedItems;
  // ... more stats
}
```

**Benefits:**
- Better understanding of library
- Insights into extension usage
- Data-driven improvements

### 9. Batch Processing Optimization

**Priority:** Medium
**Estimated Effort:** 6-8 hours

Currently, each movie is checked individually. Batch processing could improve performance.

**Planned Features:**
- Batch API requests to Jellyfin
- Parallel processing of multiple items
- Intelligent batching based on page load
- Progress indicator for batch operations

**Implementation:**
```javascript
// Batch processing
async function batchCheck(items) {
  const batchSize = 10;
  const results = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(item => checkLibrary(item.title, item.year))
    );
    results.push(...batchResults);
  }

  return results;
}
```

**Benefits:**
- Faster processing on pages with many items
- Reduced API calls
- Better user experience

### 10. Offline Mode

**Priority:** Low
**Estimated Effort:** 8-10 hours

Allow the extension to work offline with cached library data.

**Planned Features:**
- Full library caching
- Offline indicator
- Automatic sync when online
- Manual sync trigger

**Implementation:**
```javascript
// Cache entire library
async function cacheLibrary() {
  const library = await fetchLibrary();
  chrome.storage.local.set({ cachedLibrary: library });
}

// Use cached library when offline
async function checkLibraryOffline(title, year) {
  const { cachedLibrary } = await chrome.storage.local.get('cachedLibrary');
  if (!cachedLibrary) return null;

  return findInLibrary(cachedLibrary, title, year);
}
```

**Benefits:**
- Works without internet connection
- Faster response times
- Reduced server load

## Long-Term Enhancements

### 11. Support for Additional Media Servers

**Priority:** Low
**Estimated Effort:** 20-30 hours

Extend support beyond Jellyfin to other media servers.

**Planned Servers:**
- Plex
- Emby
- Kodi (via JSON-RPC)
- Universal Media Server

**Implementation:**
Create abstract server interface:
```javascript
class MediaServerAdapter {
  async connect(config) { /* ... */ }
  async getLibrary() { /* ... */ }
  async search(title, year) { /* ... */ }
  async disconnect() { /* ... */ }
}

class PlexAdapter extends MediaServerAdapter { /* ... */ }
class EmbyAdapter extends MediaServerAdapter { /* ... */ }
```

**Benefits:**
- Larger user base
- Flexibility for different setups
- Competitive advantage

### 12. Mobile Browser Support

**Priority:** Low
**Estimated Effort:** 15-20 hours

Support mobile browsers (Chrome for Android, Safari for iOS).

**Planned Features:**
- Responsive badge design
- Touch-optimized interactions
- Mobile-specific UI adjustments
- Performance optimizations for mobile

**Implementation:**
```css
/* Mobile-specific styles */
@media (max-width: 768px) {
  .jellyfin-badge {
    font-size: 12px;
    padding: 4px 8px;
  }
}
```

**Benefits:**
- Mobile users can use the extension
- Expanded user base
- Consistent experience across devices

### 13. Machine Learning for Title Matching

**Priority:** Low
**Estimated Effort:** 30-40 hours

Use ML to improve title matching accuracy.

**Planned Features:**
- Train model on title variations
- Handle international titles
- Learn from user corrections
- Continuous improvement

**Implementation:**
```javascript
// Use TensorFlow.js for ML
import * as tf from '@tensorflow/tfjs';

const model = await tf.loadLayersModel('model.json');

function predictMatch(title1, title2) {
  const input = preprocessTitles(title1, title2);
  const prediction = model.predict(input);
  return prediction.dataSync()[0];
}
```

**Benefits:**
- Superior matching accuracy
- Handles edge cases better
- Adapts to user's library

### 14. Social Features

**Priority:** Low
**Estimated Effort:** 20-25 hours

Add social features to share and discover content.

**Planned Features:**
- Share library with friends
- See what friends have
- Recommendations based on friends' libraries
- Social badges (e.g., "3 friends have this")

**Implementation:**
```javascript
// Share library
async function shareLibrary(friendId) {
  const library = await getLibrary();
  await api.shareLibrary(friendId, library);
}

// Get friends' libraries
async function getFriendsLibraries() {
  const friends = await api.getFriends();
  return Promise.all(friends.map(f => api.getLibrary(f.id)));
}
```

**Benefits:**
- Social engagement
- Content discovery
- Community building

### 15. Advanced Filtering and Search

**Priority:** Low
**Estimated Effort:** 12-15 hours

Provide advanced filtering options for library matching.

**Planned Features:**
- Filter by media type (movie, TV show)
- Filter by quality/resolution
- Filter by watched status
- Filter by genre
- Custom filter presets

**Implementation:**
```javascript
// Advanced filtering
function filterLibrary(library, filters) {
  return library.filter(item => {
    if (filters.mediaType && item.Type !== filters.mediaType) return false;
    if (filters.genre && !item.Genres.includes(filters.genre)) return false;
    if (filters.watched !== undefined && item.Played !== filters.watched) return false;
    return true;
  });
}
```

**Benefits:**
- More precise matching
- Better user control
- Improved relevance

## Community Suggestions

### 16. Dark Mode Support

**Priority:** Low
**Estimated Effort:** 4-6 hours

Support dark mode for the badge and popup.

**Planned Features:**
- Automatic dark mode detection
- Light/dark badge themes
- Sync with system preferences

### 17. Export/Import Settings

**Priority:** Low
**Estimated Effort:** 3-4 hours

Allow users to export and import their settings.

**Planned Features:**
- Export settings to JSON
- Import settings from JSON
- Backup and restore functionality

### 18. Keyboard Shortcuts

**Priority:** Low
**Estimated Effort:** 2-3 hours

Add keyboard shortcuts for common actions.

**Planned Features:**
- Toggle extension on/off
- Refresh library
- Open settings

### 19. Context Menu Integration

**Priority:** Low
**Estimated Effort:** 4-5 hours

Add context menu options for quick actions.

**Planned Features:**
- Check if selected text is in library
- Add selected title to watchlist
- Search library for selected text

### 20. Notification Preferences

**Priority:** Low
**Estimated Effort:** 3-4 hours

Allow users to customize notification behavior.

**Planned Features:**
- Enable/disable notifications
- Notification sound options
- Quiet hours

## Technical Debt

### 21. Comprehensive Testing Suite

**Priority:** High
**Estimated Effort:** 20-30 hours

Add unit tests, integration tests, and E2E tests.

**Planned Features:**
- Unit tests for all adapters
- Integration tests for content script
- E2E tests with Puppeteer
- Test coverage reporting

**Implementation:**
```javascript
// Example unit test
describe('NetflixAdapter', () => {
  it('should handle netflix.com hostname', () => {
    expect(adapter.canHandle('www.netflix.com')).toBe(true);
    expect(adapter.canHandle('www.imdb.com')).toBe(false);
  });

  it('should extract title correctly', () => {
    const element = createMockElement('.fallback-text', 'Test Movie');
    expect(adapter.extractTitle(element)).toBe('Test Movie');
  });
});
```

### 22. Code Refactoring

**Priority:** Medium
**Estimated Effort:** 10-15 hours

Improve code quality and maintainability.

**Planned Improvements:**
- Extract constants to config file
- Improve error handling
- Add TypeScript support
- Better code organization

### 23. Performance Profiling

**Priority:** Medium
**Estimated Effort:** 6-8 hours

Profile and optimize performance.

**Planned Activities:**
- Identify performance bottlenecks
- Optimize DOM queries
- Reduce memory usage
- Improve bundle size

### 24. Accessibility Improvements

**Priority:** Medium
**Estimated Effort:** 8-10 hours

Improve accessibility for all users.

**Planned Features:**
- ARIA labels for badges
- Keyboard navigation support
- Screen reader compatibility
- High contrast mode

### 25. Security Hardening

**Priority:** High
**Estimated Effort:** 10-12 hours

Improve security posture.

**Planned Features:**
- Input validation and sanitization
- Secure API key storage
- CORS configuration validation
- Security audit

## Research Areas

### 26. WebAssembly for Performance

**Priority:** Low
**Estimated Effort:** 20-30 hours

Investigate using WebAssembly for performance-critical operations.

**Potential Use Cases:**
- Fuzzy matching algorithms
- String similarity calculations
- Data processing

### 27. Service Worker Improvements

**Priority:** Low
**Estimated Effort:** 10-15 hours

Leverage new Service Worker features for better performance.

**Potential Improvements:**
- Background sync
- Cache API integration
- Push notifications

### 28. Browser Extension Standards

**Priority:** Low
**Estimated Effort:** 5-10 hours

Investigate cross-browser compatibility.

**Potential Browsers:**
- Firefox
- Edge
- Safari

### 29. Analytics and Telemetry

**Priority:** Low
**Estimated Effort:** 15-20 hours

Add anonymous analytics to improve the extension.

**Planned Metrics:**
- Usage statistics
- Performance metrics
- Error tracking
- Feature usage

**Note:** Must be opt-in and privacy-focused.

### 30. Plugin System

**Priority:** Low
**Estimated Effort:** 25-35 hours

Create a plugin system for community contributions.

**Planned Features:**
- Plugin API
- Plugin marketplace
- Plugin installation UI
- Plugin management

## Prioritization Matrix

| Enhancement | Impact | Effort | Priority |
|-------------|--------|--------|----------|
| Error Handling UI | High | Medium | High |
| Rate Limiting & Caching | High | Medium | High |
| Letterboxd Support | Medium | Medium | Medium |
| Settings Sync | Medium | Medium | Medium |
| Custom Badge Appearance | Low | Medium | Low |
| Multiple Servers | Medium | High | Medium |
| Advanced Matching | High | High | Medium |
| Statistics Dashboard | Low | High | Low |
| Batch Processing | Medium | Medium | Medium |
| Offline Mode | Medium | High | Low |
| Other Media Servers | High | Very High | Low |
| Mobile Support | Medium | High | Low |
| ML Matching | High | Very High | Low |
| Social Features | Medium | High | Low |
| Testing Suite | High | High | High |

## Contribution Guidelines

We welcome contributions for any of these enhancements! Here's how to help:

1. **Check the issue tracker** - See if someone is already working on it
2. **Create an issue** - Discuss your approach before starting
3. **Follow coding standards** - Maintain consistency with existing code
4. **Add tests** - Ensure your changes are well-tested
5. **Update documentation** - Document new features and changes

See [Adding New Websites](./adding-new-websites.md) for adapter-specific contributions.

## Roadmap

### Q1 2026
- [ ] Error Handling UI
- [ ] Rate Limiting & Caching
- [ ] Complete Letterboxd Support

### Q2 2026
- [ ] Settings Sync Across Devices
- [ ] Customizable Badge Appearance
- [ ] Comprehensive Testing Suite

### Q3 2026
- [ ] Multiple Jellyfin Server Support
- [ ] Advanced Matching Options
- [ ] Batch Processing Optimization

### Q4 2026
- [ ] Library Statistics Dashboard
- [ ] Offline Mode
- [ ] Accessibility Improvements

### 2027+
- [ ] Support for Additional Media Servers
- [ ] Mobile Browser Support
- [ ] Machine Learning for Title Matching

---

**Last Updated:** 2026-01-14
**Next Review:** 2026-04-01
