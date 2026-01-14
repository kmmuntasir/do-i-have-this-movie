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

## 📚 Documentation

For detailed information about the extension, please refer to the following documentation:

- [Installation Guide](docs/installation.md) - Step-by-step installation instructions
- [Setup Guide](docs/setup-guide.md) - Configure Jellyfin server and API key
- [Architecture](docs/architecture.md) - Technical architecture and design patterns
- [Adding New Websites](docs/adding-new-websites.md) - Guide for adding support for new websites
- [Migration Checklist](docs/migration-checklist.md) - Checklist for migrating to adapter-based architecture
- [Future Enhancements](docs/future-enhancements.md) - Roadmap and planned features
- [Build Process](docs/build-process.md) - Build process and development workflow
- [Troubleshooting](docs/troubleshooting.md) - Common issues and solutions
- [Development Notes](docs/development-notes.md) - Development guidelines and notes

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
