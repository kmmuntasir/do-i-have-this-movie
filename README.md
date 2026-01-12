# Do I Have This Movie?

![License](https://img.shields.io/badge/License-GPL--3.0-blue.svg)
![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-green.svg)
![Manifest V3](https://img.shields.io/badge/Manifest-V3-orange.svg)

## 🔗 Repository

**GitHub:** [Do I Have This Movie?](https://github.com/kmmuntasir/do-i-have-this-movie)

## 📖 Description

**Do I Have This Movie?** is a Chrome browser extension that helps you quickly check if movies and TV shows you encounter on streaming platforms and media databases are already in your personal Jellyfin media server library.

Perfect for media enthusiasts who maintain a personal media collection, this extension eliminates the need to manually search your library when browsing Netflix, IMDb, or other media platforms. Simply browse as usual, and the extension will automatically display visual indicators on movies and TV shows you already own.

## ✨ Features

- **Real-time Media Detection** - Automatically identifies movies and TV shows on supported websites as you browse
- **Visual Badges** - Instant recognition with clear "✓ In Library" badges on movies and TV shows you own
- **Fuzzy Matching** - Smart title and year matching that handles variations in naming conventions
- **Dynamic Content Detection** - Handles Single Page Application (SPA) navigation seamlessly
- **Site-specific Optimizations** - Custom detection logic for different website layouts
- **Non-intrusive Design** - Minimal visual impact that enhances rather than disrupts browsing
- **Secure Credential Storage** - Safely stores your Jellyfin server URL and API key

## 🌐 Supported Websites

| Website | URL | Status |
|---------|-----|--------|
| Netflix | netflix.com | ✅ Fully Supported |
| IMDb | imdb.com | ✅ Fully Supported |
| Letterboxd | letterboxd.com | ⚠️ Partially Implemented |
| YTS.bz | yts.bz | ✅ Fully Supported |

> **Note:** All supported platforms work for both movies and TV shows.

## 📋 Prerequisites

Before installing the extension, ensure you have:

- **Jellyfin Media Server** - A running instance of Jellyfin with your media library configured
- **API Key** - A valid API key generated from your Jellyfin dashboard
- **Chrome Browser** - Google Chrome (or Chromium-based browser) with Manifest V3 support

## 🚀 Installation Instructions

### Step 1: Clone or Download the Repository

```bash
git clone https://github.com/yourusername/do-i-have-this-movie.git
```

Or download and extract the ZIP file from the repository.

### Step 2: Load the Extension in Chrome

1. Open Google Chrome and navigate to `chrome://extensions/`
2. Enable **Developer Mode** using the toggle switch in the top-right corner
3. Click the **"Load unpacked"** button that appears
4. Navigate to the directory where you cloned/downloaded the extension
5. Select the folder and click **"Select Folder"**

The extension should now appear in your extensions list and is ready to use!

## ⚙️ Setup Guide

### Step 1: Get Your Jellyfin Server URL

Your Jellyfin server URL typically looks like:
- `http://localhost:8096` (if running locally)
- `http://192.168.x.x:8096` (if on your local network)
- `https://your-jellyfin-domain.com` (if accessible via internet)

**Important:** Ensure your Jellyfin server is accessible from the browser where you're using the extension. If running locally, you may need to configure network access or use a reverse proxy.

### Step 2: Generate an API Key

1. Log in to your Jellyfin web dashboard
2. Navigate to **Settings** → **API Keys** (or **Dashboard** → **API Keys**)
3. Click **"Add API Key"**
4. Enter a name (e.g., "Chrome Extension") and click **"Save"**
5. Copy the generated API key - you'll need it for the next step

### Step 3: Configure the Extension

1. Click the extension icon in your Chrome toolbar
2. Enter your **Jellyfin Server URL** in the first field
3. Enter your **API Key** in the second field
4. Click **"Save Settings"**

The extension will now query your Jellyfin library and start displaying badges on supported websites!

## 🔧 How It Works

The extension uses a three-tier architecture:

1. **Content Scripts** (`content.js`) - Run on supported web pages to detect movie and TV show titles and years from the DOM
2. **Background Script** (`background.js`) - Receives media data from content scripts and queries your Jellyfin API
3. **Badge Injection** - When a match is found, the content script injects a visual badge next to the movie or TV show title

The extension leverages Chrome's messaging API to communicate between content scripts and the background script, ensuring efficient and secure data handling.

## 📱 Usage

Once configured, using the extension is completely automatic:

1. **Browse** - Visit any supported website (Netflix, IMDb, YTS.bz, etc.)
2. **Discover** - Navigate through movie and TV show listings and individual pages
3. **Identify** - Look for the **"✓ In Library"** badge next to movie and TV show titles you own
4. **Enjoy** - No manual interaction required - the extension works silently in the background

The badge appears automatically as you browse, even when navigating within Single Page Applications (SPAs) that don't trigger full page reloads.

## 🐛 Troubleshooting

### Badges Not Appearing

**Possible Causes:**
- Extension not properly configured
- Jellyfin server not accessible
- API key invalid or expired
- Website structure changed

**Solutions:**
1. Check that your Jellyfin server URL is correct and accessible
2. Verify your API key is valid by testing it with a REST client
3. Open the browser console (F12) and check for error messages
4. Try refreshing the page or navigating to a different movie

### API Connection Failures

**Possible Causes:**
- Incorrect server URL format
- CORS restrictions
- Network/firewall blocking

**Solutions:**
1. Ensure your server URL includes the protocol (http:// or https://)
2. Check that your Jellyfin server allows CORS requests from Chrome extensions
3. Verify your firewall isn't blocking connections to your Jellyfin server
4. If using a reverse proxy, ensure it's properly configured

### Incorrect Server URL Format

**Common Mistakes:**
- Missing protocol: `localhost:8096` ❌
- Trailing slashes: `http://localhost:8096/` ❌
- Using IP without port: `192.168.1.100` ❌

**Correct Format:**
- `http://localhost:8096` ✅
- `http://192.168.1.100:8096` ✅
- `https://jellyfin.example.com` ✅

### Permission Issues

**Symptoms:**
- Extension can't access website content
- Console shows permission errors

**Solutions:**
1. Ensure the extension has proper permissions in `manifest.json`
2. Check that you're not in Incognito mode (unless extension is allowed)
3. Verify the website is listed in the `host_permissions` section

## 👨‍💻 Development Notes

This project is actively under development. Here are some notes for contributors:

### Known Issues

- **Mock Code**: Temporary mock code exists in [`background.js`](background.js:48-54) that should be removed before production use
- **Letterboxd Support**: Listed as a supported site but not fully implemented - needs completion
- **Error Handling**: No UI for error handling - all errors are logged to console only
- **Rate Limiting**: No rate limiting or caching implemented for API calls

### Technical Stack

- **Manifest V3** - Latest Chrome extension manifest format
- **Vanilla JavaScript** - No frameworks, keeping it lightweight
- **Chrome Extension APIs** - Storage, Messaging, and Content Scripts

### Future Improvements

- Add comprehensive error handling with user-friendly notifications
- Implement rate limiting and response caching
- Complete Letterboxd support
- Add support for additional streaming platforms
- Implement settings sync across devices
- Add option to customize badge appearance

## 📄 License

This project is licensed under the **GNU General Public License v3.0** - see the [`LICENSE`](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! If you'd like to help improve this extension, please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

For bug reports or feature requests, please open an issue on GitHub.

---

**Made with ❤️ for media enthusiasts who love their personal movie and TV show libraries**
