# Installation Instructions

This guide will help you install the "Do I Have This Movie?" Chrome extension on your browser.

## Prerequisites

Before installing the extension, ensure you have:

- **Jellyfin Media Server** - A running instance of Jellyfin with your media library configured
- **API Key** - A valid API key generated from your Jellyfin dashboard
- **Chrome Browser** - Google Chrome (or Chromium-based browser) with Manifest V3 support

## Step 1: Clone or Download the Repository

### Option A: Using Git

```bash
git clone https://github.com/kmmuntasir/do-i-have-this-movie.git
```

### Option B: Download ZIP

1. Visit the [GitHub repository](https://github.com/kmmuntasir/do-i-have-this-movie)
2. Click the **"Code"** button
3. Select **"Download ZIP"**
4. Extract the downloaded ZIP file to a location of your choice

## Step 2: Load the Extension in Chrome

1. Open Google Chrome and navigate to `chrome://extensions/`
2. Enable **Developer Mode** using the toggle switch in the top-right corner
3. Click the **"Load unpacked"** button that appears
4. Navigate to the directory where you cloned/downloaded the extension
5. Select the folder and click **"Select Folder"`

The extension should now appear in your extensions list and is ready to use!

## Step 3: Verify Installation

After loading the extension, you should see:

- The extension icon in your Chrome toolbar
- "Do I Have This Movie?" listed in your extensions page
- The extension enabled status (toggle switch should be on)

## Troubleshooting Installation

### Extension Not Appearing

If the extension doesn't appear in your list:

1. Ensure you selected the correct folder (the root directory containing `manifest.json`)
2. Check that Developer Mode is enabled
3. Try refreshing the extensions page (`chrome://extensions/`)
4. Check the browser console for any error messages

### Permission Warnings

Chrome may show permission warnings during installation. These are normal and necessary for the extension to:

- Access content on supported websites (Netflix, IMDb, YTS.bz, etc.)
- Communicate with your Jellyfin server
- Store your configuration settings

### Manifest V3 Compatibility

This extension uses Manifest V3, which is the latest Chrome extension format. Ensure your Chrome browser is up-to-date for full compatibility.

## Next Steps

After installation, proceed to the [Setup Guide](./setup-guide.md) to configure your Jellyfin server connection.
