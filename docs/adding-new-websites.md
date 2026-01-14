# Adding New Website Adapters

This guide provides step-by-step instructions for adding support for new websites to the "Do I Have This Movie?" Chrome extension.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Understanding the Adapter Pattern](#understanding-the-adapter-pattern)
- [Step-by-Step Guide](#step-by-step-guide)
- [Adapter Methods Reference](#adapter-methods-reference)
- [Best Practices](#best-practices)
- [Examples](#examples)
- [Testing Your Adapter](#testing-your-adapter)
- [Common Patterns](#common-patterns)
- [Troubleshooting](#troubleshooting)

## Overview

The extension uses an adapter pattern to support multiple websites. Each website has its own adapter that implements site-specific logic for:

1. Detecting if it can handle a given hostname
2. Finding movie/TV show elements on the page
3. Extracting metadata (title, year)
4. Determining where to inject badges
5. Providing custom badge styles

By creating a new adapter, you can extend the extension to work with any website that displays movies or TV shows.

## Prerequisites

Before creating a new adapter, ensure you have:

- Familiarity with JavaScript ES6+ classes
- Understanding of CSS selectors
- Knowledge of DOM manipulation
- Access to the target website for testing
- Basic understanding of Chrome extension architecture

## Understanding the Adapter Pattern

All adapters extend the [`BaseAdapter`](../adapters/base-adapter.js) class, which defines the interface that must be implemented:

```javascript
import BaseAdapter from './base-adapter.js';

class MySiteAdapter extends BaseAdapter {
  // Implement required methods
}

export default new MySiteAdapter();
```

The adapter is then registered in the [`AdapterRegistry`](../adapters/adapter-registry.js) within [`content.js`](../content.js).

## Step-by-Step Guide

### Step 1: Analyze the Target Website

Before writing code, analyze the website structure:

1. **Identify Movie/TV Show Elements**
   - Open the website in your browser
   - Use DevTools (F12) to inspect movie cards or listings
   - Find the CSS selectors for these elements

2. **Locate Title and Year Information**
   - Determine where the title is stored within the element
   - Check if year information is available
   - Note any variations in element structure

3. **Determine Badge Placement**
   - Identify the best location to inject the badge
   - Consider the website's layout and design
   - Ensure the badge doesn't break the layout

4. **Check for Dynamic Content**
   - Determine if the site uses client-side navigation (SPA)
   - Check if content loads dynamically (infinite scroll, etc.)
   - Note any specific DOM events to observe

### Step 2: Create the Adapter File

Create a new file in the `adapters/` directory:

```bash
adapters/mysite-adapter.js
```

### Step 3: Implement the Adapter

Here's a template for a new adapter:

```javascript
import BaseAdapter from './base-adapter.js';

/**
 * MySiteAdapter - Handles movie detection on mysite.com
 */
class MySiteAdapter extends BaseAdapter {
  /**
   * Determines if this adapter can handle the given hostname
   * @param {string} hostname - The hostname of the current page
   * @returns {boolean} - True if this adapter can handle the hostname
   */
  canHandle(hostname) {
    return hostname.includes('mysite.com');
  }

  /**
   * Returns CSS selectors for movie card elements
   * @returns {string[]} - Array of CSS selectors
   */
  getTargetSelectors() {
    return [
      '.movie-card',
      '.tv-show-card',
      '.media-item'
    ];
  }

  /**
   * Extracts the movie title from a card element
   * @param {HTMLElement} element - The movie card element
   * @returns {string} - The movie title
   */
  extractTitle(element) {
    // Try multiple selectors for title
    return element.querySelector('.title')?.textContent ||
           element.querySelector('.name')?.textContent ||
           element.querySelector('h3')?.textContent ||
           '';
  }

  /**
   * Extracts the movie year from a card element
   * @param {HTMLElement} element - The movie card element
   * @returns {number|null} - The movie year, or null if not available
   */
  extractYear(element) {
    const yearText = element.querySelector('.year')?.textContent;
    if (yearText) {
      const match = yearText.match(/\d{4}/);
      return match ? parseInt(match[0]) : null;
    }
    return null;
  }

  /**
   * Returns the parent element for badge injection
   * @param {HTMLElement} element - The movie card element
   * @returns {HTMLElement} - The parent element to inject the badge into
   */
  getBadgeParent(element) {
    // Return the element itself or a specific child
    return element.querySelector('.card-content') || element;
  }

  /**
   * Returns custom CSS styles for the badge
   * @returns {Object|null} - Custom styles object, or null for default styles
   */
  getBadgeStyles() {
    // Return custom styles if needed
    return {
      position: 'absolute',
      top: '10px',
      right: '10px',
      backgroundColor: '#4CAF50',
      color: '#fff'
    };
  }

  /**
   * Filters elements before processing
   * @param {HTMLElement} element - The movie card element
   * @returns {boolean} - True if the element should be processed
   */
  shouldProcessElement(element) {
    // Filter out elements that shouldn't be processed
    return !element.classList.contains('ad') &&
           !element.classList.contains('sponsored');
  }
}

export default new MySiteAdapter();
```

### Step 4: Register the Adapter

Open [`content.js`](../content.js) and register your new adapter:

```javascript
import mySiteAdapter from './adapters/mysite-adapter.js';

// Register the adapter
registry.register(mySiteAdapter);
```

### Step 5: Update Manifest Permissions

If the new website requires host permissions, update [`manifest.json`](../manifest.json):

```json
{
  "host_permissions": [
    "https://www.mysite.com/*"
  ]
}
```

### Step 6: Build and Test

1. Build the extension:
   ```bash
   npm run build
   ```

2. Reload the extension in Chrome:
   - Go to `chrome://extensions/`
   - Click the refresh button on the extension card

3. Test on the target website:
   - Visit the website
   - Check the browser console for errors
   - Verify badges appear correctly

## Adapter Methods Reference

### Required Methods

#### `canHandle(hostname)`

Determines if this adapter can handle the given hostname.

**Parameters:**
- `hostname` (string) - The hostname of the current page

**Returns:** `boolean` - True if this adapter can handle the hostname

**Example:**
```javascript
canHandle(hostname) {
  return hostname.includes('imdb.com');
}
```

#### `getTargetSelectors()`

Returns CSS selectors for movie card elements.

**Returns:** `string[]` - Array of CSS selectors

**Example:**
```javascript
getTargetSelectors() {
  return ['.movie-card', '.tv-show'];
}
```

#### `extractTitle(element)`

Extracts the movie title from a card element.

**Parameters:**
- `element` (HTMLElement) - The movie card element

**Returns:** `string` - The movie title

**Example:**
```javascript
extractTitle(element) {
  return element.querySelector('.title')?.textContent || '';
}
```

### Optional Methods

#### `extractYear(element)`

Extracts the movie year from a card element.

**Parameters:**
- `element` (HTMLElement) - The movie card element

**Returns:** `number|null` - The movie year, or null if not available

**Example:**
```javascript
extractYear(element) {
  const yearText = element.querySelector('.year')?.textContent;
  return yearText ? parseInt(yearText) : null;
}
```

#### `getBadgeParent(element)`

Returns the parent element for badge injection.

**Parameters:**
- `element` (HTMLElement) - The movie card element

**Returns:** `HTMLElement` - The parent element to inject the badge into

**Default:** Returns the element itself

**Example:**
```javascript
getBadgeParent(element) {
  return element.querySelector('.card-content') || element;
}
```

#### `getBadgeStyles()`

Returns custom CSS styles for the badge.

**Returns:** `Object|null` - Custom styles object, or null for default styles

**Default:** Returns null (uses default styles)

**Example:**
```javascript
getBadgeStyles() {
  return {
    backgroundColor: '#ff5722',
    color: '#fff'
  };
}
```

#### `shouldProcessElement(element)`

Filters elements before processing.

**Parameters:**
- `element` (HTMLElement) - The movie card element

**Returns:** `boolean` - True if the element should be processed

**Default:** Returns true

**Example:**
```javascript
shouldProcessElement(element) {
  return !element.classList.contains('sponsored');
}
```

## Best Practices

### 1. Use Specific Selectors

Prefer specific selectors over generic ones:

```javascript
// Good - specific
getTargetSelectors() {
  return ['.movie-card[data-type="movie"]'];
}

// Avoid - too generic
getTargetSelectors() {
  return ['div', 'span'];
}
```

### 2. Handle Edge Cases

Always handle cases where elements might not exist:

```javascript
extractTitle(element) {
  const title = element.querySelector('.title')?.textContent;
  return title?.trim() || '';
}
```

### 3. Validate Data

Validate extracted data before returning:

```javascript
extractYear(element) {
  const yearText = element.querySelector('.year')?.textContent;
  if (!yearText) return null;

  const year = parseInt(yearText);
  return (year >= 1900 && year <= new Date().getFullYear()) ? year : null;
}
```

### 4. Use Multiple Fallbacks

Provide fallback selectors for robustness:

```javascript
extractTitle(element) {
  return element.querySelector('.title')?.textContent ||
         element.querySelector('.name')?.textContent ||
         element.querySelector('h3')?.textContent ||
         element.getAttribute('data-title') ||
         '';
}
```

### 5. Consider Performance

Optimize selectors for performance:

```javascript
// Good - efficient
getTargetSelectors() {
  return ['.movie-card[data-id]'];
}

// Avoid - complex selectors
getTargetSelectors() {
  return ['div > div > div > span > a > img + div'];
}
```

### 6. Document Your Code

Add clear comments explaining complex logic:

```javascript
/**
 * Extracts the title from Netflix cards
 * Netflix uses different selectors for small cards vs. detailed views
 */
extractTitle(element) {
  // Small card title
  const cardTitle = element.querySelector('.fallback-text')?.textContent;
  // Detailed view title
  const detailTitle = element.querySelector('.title-logo')?.alt;
  return cardTitle || detailTitle;
}
```

## Examples

### Example 1: Simple Adapter

```javascript
import BaseAdapter from './base-adapter.js';

class SimpleSiteAdapter extends BaseAdapter {
  canHandle(hostname) {
    return hostname.includes('simplesite.com');
  }

  getTargetSelectors() {
    return ['.movie-item'];
  }

  extractTitle(element) {
    return element.querySelector('h3')?.textContent || '';
  }

  extractYear(element) {
    const year = element.querySelector('.year')?.textContent;
    return year ? parseInt(year) : null;
  }
}

export default new SimpleSiteAdapter();
```

### Example 2: Complex Adapter with Multiple Selectors

```javascript
import BaseAdapter from './base-adapter.js';

class ComplexSiteAdapter extends BaseAdapter {
  canHandle(hostname) {
    return hostname.includes('complexsite.com');
  }

  getTargetSelectors() {
    return [
      '.movie-card',           // Grid view
      '.movie-list-item',      // List view
      '.featured-movie',       // Featured section
      '.related-movie'         // Related movies
    ];
  }

  extractTitle(element) {
    // Different selectors for different card types
    if (element.classList.contains('featured-movie')) {
      return element.querySelector('.featured-title')?.textContent;
    }
    if (element.classList.contains('movie-list-item')) {
      return element.querySelector('.list-title')?.textContent;
    }
    return element.querySelector('.card-title')?.textContent || '';
  }

  extractYear(element) {
    const yearElement = element.querySelector('.year, .release-date');
    if (!yearElement) return null;

    const yearText = yearElement.textContent;
    const match = yearText.match(/\d{4}/);
    return match ? parseInt(match[0]) : null;
  }

  getBadgeParent(element) {
    // Different placement for different card types
    if (element.classList.contains('featured-movie')) {
      return element.querySelector('.featured-content');
    }
    return element.querySelector('.card-content') || element;
  }

  shouldProcessElement(element) {
    // Skip ads and sponsored content
    return !element.classList.contains('ad') &&
           !element.classList.contains('sponsored') &&
           !element.classList.contains('promo');
  }
}

export default new ComplexSiteAdapter();
```

### Example 3: Adapter with Custom Styles

```javascript
import BaseAdapter from './base-adapter.js';

class StyledSiteAdapter extends BaseAdapter {
  canHandle(hostname) {
    return hostname.includes('styledsite.com');
  }

  getTargetSelectors() {
    return ['.media-card'];
  }

  extractTitle(element) {
    return element.querySelector('.title')?.textContent || '';
  }

  getBadgeStyles() {
    // Custom styles to match the site's design
    return {
      position: 'absolute',
      top: '8px',
      right: '8px',
      padding: '4px 8px',
      borderRadius: '4px',
      fontSize: '12px',
      fontWeight: 'bold',
      backgroundColor: '#E50914',  // Netflix-like red
      color: '#FFFFFF',
      zIndex: '100',
      boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
    };
  }

  getBadgeParent(element) {
    return element.querySelector('.card-image') || element;
  }
}

export default new StyledSiteAdapter();
```

## Testing Your Adapter

### Manual Testing

1. **Basic Functionality**
   - Visit the target website
   - Navigate to movie/TV show listings
   - Verify badges appear on items in your library
   - Verify badges don't appear on items not in your library

2. **Different Page Types**
   - Test on grid views
   - Test on list views
   - Test on detail pages
   - Test on search results

3. **Dynamic Content**
   - Test infinite scroll
   - Test SPA navigation
   - Test filter/sort changes

4. **Edge Cases**
   - Test with titles containing special characters
   - Test with missing year information
   - Test with sponsored/ad content

### Debugging

Use the browser console to debug your adapter:

```javascript
// Test your adapter methods
const element = document.querySelector('.movie-card');
console.log('Title:', adapter.extractTitle(element));
console.log('Year:', adapter.extractYear(element));
console.log('Parent:', adapter.getBadgeParent(element));
```

### Common Issues

**Issue: Badges not appearing**

- Check if selectors are correct
- Verify elements exist on the page
- Check console for errors
- Ensure adapter is registered

**Issue: Wrong titles extracted**

- Inspect the DOM structure
- Verify selector specificity
- Check for dynamic content loading
- Use multiple fallback selectors

**Issue: Badges in wrong position**

- Adjust `getBadgeParent()` method
- Consider CSS specificity
- Test with different page layouts

## Common Patterns

### Pattern 1: Handling Multiple Card Types

```javascript
extractTitle(element) {
  // Check for different card types
  if (element.classList.contains('card-type-a')) {
    return element.querySelector('.title-a')?.textContent;
  }
  if (element.classList.contains('card-type-b')) {
    return element.querySelector('.title-b')?.textContent;
  }
  return element.querySelector('.default-title')?.textContent;
}
```

### Pattern 2: Extracting Data from Attributes

```javascript
extractTitle(element) {
  // Try data attribute first
  return element.getAttribute('data-title') ||
         element.querySelector('.title')?.textContent ||
         '';
}

extractYear(element) {
  const yearAttr = element.getAttribute('data-year');
  if (yearAttr) return parseInt(yearAttr);

  const yearText = element.querySelector('.year')?.textContent;
  return yearText ? parseInt(yearText) : null;
}
```

### Pattern 3: Handling Nested Elements

```javascript
getBadgeParent(element) {
  // Navigate to the correct parent for badge injection
  return element.closest('.card-container')?.querySelector('.card-overlay') ||
         element.querySelector('.card-content') ||
         element;
}
```

### Pattern 4: Filtering by Content

```javascript
shouldProcessElement(element) {
  const title = this.extractTitle(element);
  // Skip elements without titles
  if (!title || title.trim() === '') return false;

  // Skip specific content types
  if (element.classList.contains('trailer')) return false;
  if (element.classList.contains('clip')) return false;

  return true;
}
```

## Troubleshooting

### Selector Not Matching Elements

**Problem:** `getTargetSelectors()` returns elements, but they're not movie cards

**Solution:**
- Use more specific selectors
- Add data attributes to filter
- Implement `shouldProcessElement()` to filter

### Title Extraction Fails

**Problem:** `extractTitle()` returns empty or incorrect titles

**Solution:**
- Inspect the DOM structure
- Use multiple fallback selectors
- Check for dynamic content loading
- Consider textContent vs. innerText

### Year Parsing Errors

**Problem:** `extractYear()` returns null or incorrect years

**Solution:**
- Validate year format before parsing
- Handle different year formats (e.g., "2023", "Released 2023")
- Use regex for flexible matching
- Return null for invalid years

### Badge Position Issues

**Problem:** Badge appears in wrong location or breaks layout

**Solution:**
- Adjust `getBadgeParent()` to return correct element
- Use custom styles via `getBadgeStyles()`
- Consider CSS specificity and z-index
- Test with different page layouts

### Performance Issues

**Problem:** Page becomes slow with many elements

**Solution:**
- Use more specific selectors
- Implement `shouldProcessElement()` to filter
- Add debouncing to processing
- Consider lazy loading for large pages

## Contributing Your Adapter

Once your adapter is complete and tested:

1. **Update Documentation**
   - Add the website to the supported sites list in README.md
   - Document any special considerations

2. **Add Tests** (if applicable)
   - Write unit tests for adapter methods
   - Add integration tests

3. **Submit Pull Request**
   - Include a clear description of the adapter
   - Provide screenshots of the adapter in action
   - Document any limitations or known issues

## Additional Resources

- [Chrome Extension Documentation](https://developer.chrome.com/docs/extensions/)
- [MDN Web Docs - CSS Selectors](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors)
- [MDN Web Docs - DOM API](https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model)
- [Jellyfin API Documentation](https://api.jellyfin.org/)

## Next Steps

After creating your adapter, see:

- [Build Process](./build-process.md) - Learn how to build the extension
- [Troubleshooting](./troubleshooting.md) - Resolve common issues
- [Development Notes](./development-notes.md) - Additional development considerations
