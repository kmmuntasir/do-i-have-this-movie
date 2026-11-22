# Privacy Policy

_Last updated: 2026-11-22_

**Do I Have This Movie?** does not collect, transmit or sell any personal data to the developer or any third party.

## What the extension stores

- The server URLs and API keys or tokens you enter on the settings page.
- Your source settings (which sources are enabled).

This data is stored locally in your browser using `chrome.storage`, together with the list of movie file names if you use Local Files. It never leaves your device except as described below.

## What the extension sends

- On supported websites (Netflix, IMDb, YTS), the extension reads movie titles and years from the page.
- It sends those titles and years, with your API key, **only to the media servers you configured** (Jellyfin, Emby, Plex) to check whether the movie exists in your library.

No analytics, telemetry, advertising or remote code are used.

## Disclaimer

This extension is a convenience tool that compares movie titles on a web page with your own media library. It does not download, stream, host or link to any content and does not promote piracy.

## Permissions

- `storage`: save your settings.
- Optional host access: requested only for the media server address you save, so the extension can query it. No broad site access is requested at install.
- Local Files: you pick a folder; only video file names are read and stored in the browser. File contents are never read.
- Content scripts on Netflix, IMDb and YTS domains: read titles and show badges.

## Contact

Open an issue at https://github.com/kmmuntasir/do-i-have-this-movie/issues.
