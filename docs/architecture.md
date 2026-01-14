# Architecture Overview

This document provides a comprehensive overview of the "Do I Have This Movie?" Chrome extension architecture, including design patterns, component interactions, and data flow.

## Table of Contents

- [High-Level Architecture](#high-level-architecture)
- [Component Overview](#component-overview)
- [Adapter Pattern](#adapter-pattern)
- [Data Flow](#data-flow)
- [Design Patterns](#design-patterns)
- [File Structure](#file-structure)
- [Extension Manifest](#extension-manifest)

## High-Level Architecture

The extension follows a modular, three-tier architecture designed for extensibility and maintainability:

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser Layer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Netflix    │  │    IMDb     │  │    YTS.bz    │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                 │                 │              │
│         └─────────────────┴─────────────────┘              │
│                           │                                 │
│                   ┌───────▼────────┐                        │
│                   │   Content JS   │                        │
│                   │   + Adapters   │                        │
│                   └───────┬────────┘                        │
│                           │                                 │
│                   ┌───────▼────────┐                        │
│                   │  Background JS │                        │
│                   │   (Service)    │                        │
│                   └───────┬────────┘                        │
│                           │                                 │
│                   ┌───────▼────────┐                        │
│                   │  Jellyfin API  │                        │
│                   └────────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

## Component Overview

### 1. Content Script (`content.js`)

**Purpose:** Runs on supported web pages to detect and process movie/TV show elements.

**Responsibilities:**
- Initialize the adapter registry
- Detect the current website and select the appropriate adapter
- Scan the DOM for movie/TV show cards
- Extract metadata (title, year) from detected elements
- Query the background script for library matches
- Inject visual badges on matching items
- Handle dynamic content updates (SPA navigation)

**Key Features:**
- MutationObserver for dynamic content detection
- Debounced processing to optimize performance
- Fuzzy matching for title and year comparisons
- Badge injection with site-specific positioning

### 2. Background Script (`background.js`)

**Purpose:** Acts as the service layer, handling API communication and state management.

**Responsibilities:**
- Receive media queries from content scripts
- Query the Jellyfin API for library matches
- Cache library data for performance
- Manage extension settings (server URL, API key)
- Handle cross-origin requests to Jellyfin server
- Provide error handling and logging

**Key Features:**
- Chrome storage API for persistent settings
- Fetch API for HTTP requests
- Message passing for inter-component communication
- Response caching to reduce API calls

### 3. Adapter System (`adapters/`)

**Purpose:** Provides site-specific logic for different websites, enabling easy addition of new platforms.

**Components:**

#### BaseAdapter (`adapters/base-adapter.js`)

Abstract base class that defines the interface all adapters must implement:

```javascript
class BaseAdapter {
  canHandle(hostname)           // Check if adapter handles this site
  getTargetSelectors()          // Return CSS selectors for movie cards
  extractTitle(element)         // Extract movie title from element
  extractYear(element)          // Extract movie year (optional)
  getBadgeParent(element)       // Get parent for badge injection
  getBadgeStyles()              // Get custom badge styles (optional)
  shouldProcessElement(element) // Filter elements before processing
}
```

#### AdapterRegistry (`adapters/adapter-registry.js`)

Singleton registry that manages all registered adapters:

- Registers new adapters
- Finds the appropriate adapter for a given hostname
- Provides access to all registered adapters

#### Site-Specific Adapters

- **NetflixAdapter** ([`adapters/netflix-adapter.js`](../adapters/netflix-adapter.js)) - Handles Netflix.com
- **IMDBAdapter** ([`adapters/imdb-adapter.js`](../adapters/imdb-adapter.js)) - Handles IMDb.com
- **YTSAdapter** ([`adapters/yts-adapter.js`](../adapters/yts-adapter.js)) - Handles YTS.bz

### 4. Popup Interface (`popup.html` + `popup.js`)

**Purpose:** Provides user interface for configuration and settings.

**Responsibilities:**
- Display extension status
- Input fields for Jellyfin server URL and API key
- Save and retrieve settings from Chrome storage
- Show connection status and error messages

### 5. Styles (`content.css`)

**Purpose:** Defines the visual appearance of injected badges.

**Features:**
- Default badge styling
- Responsive design
- Non-intrusive appearance
- Site-specific overrides (via adapter styles)

## Adapter Pattern

The adapter pattern is the core architectural pattern used in this extension, enabling:

### Benefits

1. **Extensibility:** Add new websites without modifying core logic
2. **Maintainability:** Isolate site-specific code in dedicated adapters
3. **Testability:** Test adapters independently
4. **Flexibility:** Customize behavior per website

### Implementation Flow

```
1. Content Script Loads
   ↓
2. AdapterRegistry Initialized
   ↓
3. All Adapters Registered
   ↓
4. Current Page Hostname Detected
   ↓
5. AdapterRegistry.getAdapter(hostname)
   ↓
6. Appropriate Adapter Returned
   ↓
7. Adapter Methods Used:
   - getTargetSelectors() → Find movie cards
   - extractTitle() → Get title
   - extractYear() → Get year
   - getBadgeParent() → Inject badge
```

### Adapter Lifecycle

```javascript
// Registration (happens at startup)
import netflixAdapter from './netflix-adapter.js';
import imdbAdapter from './imdb-adapter.js';
import ytsAdapter from './yts-adapter.js';

registry.register(netflixAdapter);
registry.register(imdbAdapter);
registry.register(ytsAdapter);

// Usage (happens on each page)
const hostname = window.location.hostname;
const adapter = registry.getAdapter(hostname);

if (adapter) {
  const selectors = adapter.getTargetSelectors();
  // Process elements using adapter methods
}
```

## Data Flow

### Initialization Flow

```
User visits supported website
    ↓
Chrome loads content.js
    ↓
Content script initializes adapters
    ↓
AdapterRegistry registers all adapters
    ↓
Content script detects hostname
    ↓
Appropriate adapter selected
    ↓
DOM scanning begins
```

### Detection and Matching Flow

```
1. DOM Mutation Detected
    ↓
2. Content Script Scans for Movie Cards
    ↓
3. Adapter.getTargetSelectors() returns selectors
    ↓
4. For Each Found Element:
    a. adapter.shouldProcessElement(element)
    b. adapter.extractTitle(element) → title
    c. adapter.extractYear(element) → year
    ↓
5. Send Query to Background Script:
    chrome.runtime.sendMessage({
      type: 'CHECK_LIBRARY',
      title: title,
      year: year
    })
    ↓
6. Background Script Queries Jellyfin API
    ↓
7. Background Script Returns Result:
    { found: true/false, item: {...} }
    ↓
8. If Found:
    a. adapter.getBadgeParent(element) → parent
    b. adapter.getBadgeStyles() → styles
    c. Inject badge into parent
```

### Settings Management Flow

```
User Opens Popup
    ↓
Popup.js Loads Settings from Chrome Storage
    ↓
User Enters/Updates Settings
    ↓
User Clicks "Save Settings"
    ↓
Popup.js Saves to Chrome Storage
    ↓
Background Script Listens for Storage Changes
    ↓
Background Script Updates Internal State
    ↓
Content Scripts Notified (if needed)
```

## Design Patterns

### 1. Adapter Pattern

**Used for:** Site-specific implementations

**Implementation:** Each website has its own adapter extending [`BaseAdapter`](../adapters/base-adapter.js)

### 2. Registry Pattern

**Used for:** Managing adapters

**Implementation:** [`AdapterRegistry`](../adapters/adapter-registry.js) maintains a collection of adapters and provides lookup functionality

### 3. Singleton Pattern

**Used for:** AdapterRegistry instance

**Implementation:** Ensures only one registry instance exists throughout the extension lifecycle

### 4. Observer Pattern

**Used for:** DOM change detection

**Implementation:** MutationObserver watches for dynamic content changes and triggers re-processing

### 5. Message Passing Pattern

**Used for:** Communication between content scripts and background script

**Implementation:** Chrome's `chrome.runtime.sendMessage` and `chrome.runtime.onMessage`

## File Structure

```
do-i-have-this-movie/
├── adapters/                    # Adapter system
│   ├── base-adapter.js         # Abstract base class
│   ├── adapter-registry.js     # Adapter registry (singleton)
│   ├── netflix-adapter.js      # Netflix implementation
│   ├── imdb-adapter.js         # IMDb implementation
│   └── yts-adapter.js          # YTS.bz implementation
├── docs/                       # Documentation
│   ├── installation.md
│   ├── setup-guide.md
│   ├── architecture.md        # This file
│   ├── adding-new-websites.md
│   ├── migration-checklist.md
│   ├── future-enhancements.md
│   ├── build-process.md
│   ├── troubleshooting.md
│   └── development-notes.md
├── icons/                      # Extension icons
│   ├── badge.svg
│   ├── icon_16x16.png
│   ├── icon_48x48.png
│   └── icon_128x128.png
├── background.js               # Background service worker
├── content.css                 # Badge styles
├── content.js                  # Main content script
├── popup.html                  # Settings popup UI
├── popup.js                    # Popup logic
├── manifest.json               # Extension manifest
├── package.json                # Node.js dependencies
├── rollup.config.mjs          # Rollup bundler config
└── LICENSE                     # GPL-3.0 license
```

## Extension Manifest

The extension uses **Manifest V3**, the latest Chrome extension format. Key configurations in [`manifest.json`](../manifest.json):

### Permissions

```json
{
  "permissions": [
    "storage",
    "activeTab"
  ],
  "host_permissions": [
    "https://www.netflix.com/*",
    "https://www.imdb.com/*",
    "https://yts.bz/*"
  ]
}
```

### Content Scripts

```json
{
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["dist/content-bundled.js"],
      "css": ["content.css"],
      "run_at": "document_idle"
    }
  ]
}
```

### Background Script

```json
{
  "background": {
    "service_worker": "background.js"
  }
}
```

### Action (Popup)

```json
{
  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "icons/icon_16x16.png",
      "48": "icons/icon_48x48.png",
      "128": "icons/icon_128x128.png"
    }
  }
}
```

## Security Considerations

### API Key Storage

- API keys are stored in Chrome's secure storage API
- Keys are never logged or exposed in console output
- Keys are only sent to the user's configured Jellyfin server

### CORS Handling

- Jellyfin server must be configured to allow CORS requests from Chrome extensions
- All API requests use HTTPS when available

### Content Script Isolation

- Content scripts run in an isolated world, separate from the page's JavaScript
- This prevents conflicts with website scripts and improves security

### Host Permissions

- Extension only requests permissions for supported websites
- Minimal permissions are requested (storage, activeTab, specific hosts)

## Performance Optimizations

1. **Debouncing:** DOM scanning is debounced to avoid excessive processing
2. **Caching:** Library data is cached to reduce API calls
3. **Lazy Loading:** Adapters are only loaded when needed
4. **Efficient Selectors:** CSS selectors are optimized for performance
5. **MutationObserver:** Only processes changed DOM nodes, not the entire page

## Testing Strategy

### Unit Testing (Planned)

- Test individual adapter methods
- Test registry functionality
- Test fuzzy matching logic
- Test API communication

### Integration Testing (Planned)

- Test end-to-end flow on supported websites
- Test badge injection and positioning
- Test settings persistence
- Test error handling

### Manual Testing

- Test on actual supported websites
- Verify badge appearance and accuracy
- Test with various library sizes
- Test SPA navigation

## Future Architecture Improvements

See [Future Enhancements](./future-enhancements.md) for planned architectural improvements.
