# Build Process Documentation

This document explains the build process for the "Do I Have This Movie?" Chrome extension, including the Rollup bundler configuration, build commands, and development workflow.

## Table of Contents

- [Overview](#overview)
- [Why Rollup?](#why-rollup)
- [Build Configuration](#build-configuration)
- [Build Commands](#build-commands)
- [Development Workflow](#development-workflow)
- [Output Structure](#output-structure)
- [Troubleshooting Builds](#troubleshooting-builds)
- [Advanced Configuration](#advanced-configuration)

## Overview

The extension uses **Rollup** as a module bundler to combine multiple JavaScript files into a single bundled file that can be loaded by Chrome as a content script. This approach:

- Enables the use of ES6 modules and imports
- Allows code organization across multiple files
- Supports the adapter pattern architecture
- Produces a single IIFE (Immediately Invoked Function Expression) for content script injection

### Build Pipeline

```
Source Files (ES6 Modules)
    ↓
Rollup Bundler
    ↓
Node Resolution Plugin
    ↓
IIFE Bundle
    ↓
dist/content-bundled.js
    ↓
Chrome Extension
```

## Why Rollup?

Rollup was chosen for this project because:

1. **Tree Shaking:** Automatically removes unused code
2. **Small Bundle Size:** Produces minimal output
3. **ES6 Support:** Native support for ES6 modules
4. **Simple Configuration:** Easy to set up and maintain
5. **Chrome Extension Compatible:** Outputs IIFE format suitable for content scripts

### Alternatives Considered

| Tool | Pros | Cons | Decision |
|------|------|------|----------|
| **Rollup** | Tree shaking, small bundles, simple config | Less plugin ecosystem than Webpack | ✅ Chosen |
| Webpack | Powerful, large plugin ecosystem | Complex config, larger bundles | Not needed |
| Parcel | Zero-config, fast | Less control over output | Too simple |
| esbuild | Extremely fast | Less mature, fewer features | Not necessary |

## Build Configuration

### Rollup Config File

The build configuration is defined in [`rollup.config.mjs`](../rollup.config.mjs):

```javascript
import resolve from '@rollup/plugin-node-resolve';

export default {
    input: 'content.js',
    output: {
        file: 'dist/content-bundled.js',
        format: 'iife',
        name: 'ContentScript'
    },
    plugins: [
        resolve()
    ]
};
```

### Configuration Breakdown

#### Input

```javascript
input: 'content.js'
```

- **Purpose:** Specifies the entry point for the bundle
- **File:** [`content.js`](../content.js) - the main content script
- **Role:** This file imports all adapters and initializes the extension

#### Output

```javascript
output: {
    file: 'dist/content-bundled.js',
    format: 'iife',
    name: 'ContentScript'
}
```

- **file:** Output file path (`dist/content-bundled.js`)
- **format:** IIFE (Immediately Invoked Function Expression) format
  - Required for Chrome content scripts
  - Wraps code in a function to avoid global namespace pollution
- **name:** Global variable name for the IIFE

#### Plugins

```javascript
plugins: [
    resolve()
]
```

- **@rollup/plugin-node-resolve:** Resolves module imports
  - Allows importing from `node_modules`
  - Resolves relative imports
  - Handles file extensions

### Package.json Scripts

Build scripts are defined in [`package.json`](../package.json):

```json
{
  "scripts": {
    "build": "rollup -c",
    "test": "echo \"Error: no test specified\" && exit 1"
  }
}
```

## Build Commands

### Install Dependencies

Before building, install the required dependencies:

```bash
npm install
```

This installs:
- `rollup` - The bundler
- `@rollup/plugin-node-resolve` - Module resolution plugin

### Development Build

Build the extension for development:

```bash
npm run build
```

This command:
1. Reads [`rollup.config.mjs`](../rollup.config.mjs)
2. Bundles [`content.js`](../content.js) and all imports
3. Outputs to `dist/content-bundled.js`

### Watch Mode (Planned)

For development, watch mode automatically rebuilds on file changes:

```bash
# Add to package.json scripts
"watch": "rollup -c -w"

# Then run
npm run watch
```

### Production Build (Planned)

For production builds with minification:

```bash
# Add to package.json scripts
"build:prod": "rollup -c --environment NODE_ENV:production"

# Update rollup.config.mjs to include terser
import terser from '@rollup/plugin-terser';

export default {
    // ... config
    plugins: [
        resolve(),
        terser()
    ]
};
```

## Development Workflow

### Initial Setup

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

### Development Cycle

1. **Make changes to source files**
   - Edit adapters in `adapters/`
   - Modify [`content.js`](../content.js)
   - Update styles in [`content.css`](../content.css)

2. **Rebuild the extension:**
   ```bash
   npm run build
   ```

3. **Reload the extension in Chrome:**
   - Go to `chrome://extensions/`
   - Click the refresh button on the extension card

4. **Test changes:**
   - Visit a supported website
   - Check browser console for errors (F12)
   - Verify functionality

### Adding a New Adapter

1. **Create the adapter file:**
   ```bash
   # Create new adapter
   touch adapters/mysite-adapter.js
   ```

2. **Implement the adapter:**
   ```javascript
   import BaseAdapter from './base-adapter.js';

   class MySiteAdapter extends BaseAdapter {
     canHandle(hostname) {
       return hostname.includes('mysite.com');
     }

     getTargetSelectors() {
       return ['.movie-card'];
     }

     extractTitle(element) {
       return element.querySelector('.title')?.textContent || '';
     }
   }

   export default new MySiteAdapter();
   ```

3. **Register the adapter in content.js:**
   ```javascript
   import mySiteAdapter from './adapters/mysite-adapter.js';
   registry.register(mySiteAdapter);
   ```

4. **Rebuild:**
   ```bash
   npm run build
   ```

5. **Reload and test**

## Output Structure

### Directory Structure After Build

```
do-i-have-this-movie/
├── adapters/              # Source adapters
│   ├── base-adapter.js
│   ├── adapter-registry.js
│   ├── netflix-adapter.js
│   ├── imdb-adapter.js
│   └── yts-adapter.js
├── dist/                 # Build output
│   └── content-bundled.js  # Bundled content script
├── docs/                 # Documentation
├── icons/                # Extension icons
├── background.js         # Background script (not bundled)
├── content.css           # Styles (not bundled)
├── content.js            # Main content script (entry point)
├── popup.html            # Popup UI
├── popup.js              # Popup logic
├── manifest.json         # Extension manifest
├── package.json          # Node.js configuration
├── rollup.config.mjs     # Rollup configuration
└── LICENSE               # License file
```

### Bundle Contents

The `dist/content-bundled.js` file contains:

1. **BaseAdapter class** - Abstract base for all adapters
2. **AdapterRegistry** - Singleton registry for adapter management
3. **Site-specific adapters:**
   - NetflixAdapter
   - IMDBAdapter
   - YTSAdapter
4. **Main content script logic** - DOM scanning, badge injection, etc.

### Bundle Format

The output is an IIFE (Immediately Invoked Function Expression):

```javascript
(function ContentScript() {
  'use strict';

  // All bundled code here
  // Wrapped in a function to avoid global namespace pollution

})();
```

This format is required for Chrome content scripts and ensures:
- No global variable conflicts
- Proper isolation from page scripts
- Clean execution environment

## Troubleshooting Builds

### Common Build Issues

#### Issue: Module Not Found

**Error:**
```
[!] Error: Could not resolve './adapters/mysite-adapter.js'
```

**Solution:**
- Check file path is correct
- Ensure file exists
- Verify file extension is `.js`

#### Issue: Import Statement Outside Module

**Error:**
```
SyntaxError: Cannot use import statement outside a module
```

**Solution:**
- Ensure [`content.js`](../content.js) uses ES6 imports
- Check that [`rollup.config.mjs`](../rollup.config.mjs) is configured correctly
- Verify file extensions are `.js` or `.mjs`

#### Issue: Output File Not Created

**Symptom:** `dist/content-bundled.js` is not created after running `npm run build`

**Solutions:**
1. Check if `dist/` directory exists:
   ```bash
   mkdir dist
   ```

2. Verify Rollup is installed:
   ```bash
   npm list rollup
   ```

3. Check build output for errors:
   ```bash
   npm run build 2>&1 | tee build.log
   ```

#### Issue: Manifest Reference Error

**Symptom:** Extension fails to load in Chrome

**Solution:**
- Verify [`manifest.json`](../manifest.json) references the correct path:
  ```json
  {
    "content_scripts": [
      {
        "js": ["dist/content-bundled.js"]
      }
    ]
  }
  ```
- Ensure `dist/content-bundled.js` exists
- Rebuild the extension

#### Issue: Build Works But Extension Fails

**Symptom:** Build succeeds but extension doesn't work in Chrome

**Solutions:**
1. Check browser console for errors (F12)
2. Verify all imports are resolved
3. Check for runtime errors in bundled code
4. Ensure adapters are properly registered
5. Test with a simple adapter first

### Debugging Builds

#### Verbose Output

Run Rollup with verbose output for detailed information:

```bash
rollup -c -v
```

#### Source Maps

Generate source maps for easier debugging:

```javascript
// Update rollup.config.mjs
export default {
    input: 'content.js',
    output: {
        file: 'dist/content-bundled.js',
        format: 'iife',
        name: 'ContentScript',
        sourcemap: true  // Add this line
    },
    plugins: [
        resolve()
    ]
};
```

#### Analyze Bundle Size

Check bundle size and composition:

```bash
# Install rollup-plugin-visualizer
npm install --save-dev rollup-plugin-visualizer

# Update rollup.config.mjs
import { visualizer } from 'rollup-plugin-visualizer';

export default {
    // ... config
    plugins: [
        resolve(),
        visualizer({ open: true })
    ]
};
```

## Advanced Configuration

### Multiple Entry Points

If you need multiple bundled files:

```javascript
export default [
    {
        input: 'content.js',
        output: {
            file: 'dist/content-bundled.js',
            format: 'iife',
            name: 'ContentScript'
        }
    },
    {
        input: 'popup.js',
        output: {
            file: 'dist/popup-bundled.js',
            format: 'iife',
            name: 'PopupScript'
        }
    }
];
```

### Environment Variables

Use environment variables for different builds:

```javascript
import { defineConfig } from 'rollup';

const isProduction = process.env.NODE_ENV === 'production';

export default defineConfig({
    input: 'content.js',
    output: {
        file: 'dist/content-bundled.js',
        format: 'iife',
        name: 'ContentScript',
        sourcemap: !isProduction
    },
    plugins: [
        resolve(),
        isProduction && terser()
    ]
});
```

### Custom Plugins

Add custom Rollup plugins:

```javascript
import replace from '@rollup/plugin-replace';

export default {
    input: 'content.js',
    output: {
        file: 'dist/content-bundled.js',
        format: 'iife',
        name: 'ContentScript'
    },
    plugins: [
        resolve(),
        replace({
            'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
            preventAssignment: true
        })
    ]
};
```

### Code Splitting

For larger projects, consider code splitting:

```javascript
export default {
    input: 'content.js',
    output: {
        dir: 'dist',
        format: 'iife',
        manualChunks: {
            adapters: ['adapters/netflix-adapter.js', 'adapters/imdb-adapter.js']
        }
    },
    plugins: [
        resolve()
    ]
};
```

### TypeScript Support

Add TypeScript support:

```bash
npm install --save-dev typescript rollup-plugin-typescript2
```

```javascript
import typescript from 'rollup-plugin-typescript2';

export default {
    input: 'content.ts',
    output: {
        file: 'dist/content-bundled.js',
        format: 'iife',
        name: 'ContentScript'
    },
    plugins: [
        resolve(),
        typescript()
    ]
};
```

## Best Practices

### 1. Keep Bundle Small

- Use tree shaking (automatic with Rollup)
- Avoid importing entire libraries
- Use specific imports instead of wildcard imports

### 2. Source Maps in Development

Always generate source maps during development for easier debugging:

```javascript
sourcemap: !isProduction
```

### 3. Minify in Production

Use terser for production builds:

```javascript
import terser from '@rollup/plugin-terser';

plugins: [
    resolve(),
    isProduction && terser()
]
```

### 4. Clean Build Directory

Clean the `dist/` directory before each build:

```bash
# Add to package.json
"clean": "rm -rf dist",
"prebuild": "npm run clean"
```

### 5. Version Control

Add `dist/` to `.gitignore`:

```
dist/
```

But commit `dist/content-bundled.js` for releases:

```bash
# Build and commit for release
npm run build
git add dist/content-bundled.js
git commit -m "Build: Release v1.0.0"
```

## CI/CD Integration

### GitHub Actions

Create `.github/workflows/build.yml`:

```yaml
name: Build Extension

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'

    - name: Install dependencies
      run: npm install

    - name: Build extension
      run: npm run build

    - name: Upload build artifacts
      uses: actions/upload-artifact@v3
      with:
        name: extension-build
        path: dist/
```

## Additional Resources

- [Rollup Documentation](https://rollupjs.org/)
- [@rollup/plugin-node-resolve](https://github.com/rollup/plugins/tree/master/packages/node-resolve)
- [Chrome Extension Documentation](https://developer.chrome.com/docs/extensions/)
- [IIFE Pattern](https://developer.mozilla.org/en-US/docs/Glossary/IIFE)

## Related Documentation

- [Architecture Overview](./architecture.md) - Understanding the extension architecture
- [Adding New Websites](./adding-new-websites.md) - Creating new adapters
- [Troubleshooting](./troubleshooting.md) - Resolving common issues
- [Development Notes](./development-notes.md) - Development considerations

---

**Last Updated:** 2026-01-14
**Rollup Version:** 4.55.1
