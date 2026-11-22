# Chrome Web Store listing text

Copy each block into the matching dashboard field. Keep brand names to a minimum: a description that lists many of them was rejected as keyword spam.

## Description

Do I Have This Movie? shows a small badge on movie posters when the movie is already in your own media library.

Browse Netflix, IMDb or YTS as usual. Titles you already own get a badge, on browse pages, detail pages and "similar movies" lists. No more searching your library by hand.

FEATURES
- Works with Jellyfin, Emby and Plex, and with a local movie folder you pick in settings
- Matches by title and year, tolerating punctuation and naming differences
- Handles pages that load content as you scroll
- Your server address and API key stay in your browser. Optional: sync settings through your own Chrome account (off by default)
- Open source (GPL-3.0): https://github.com/kmmuntasir/do-i-have-this-movie

SETUP
Open the extension's settings, enable a source, enter its server URL and API key, click Test, then Save. Chrome asks once to allow access to your server's address.

This is a convenience tool for organizing a personal media collection. It does not download, stream, host or link to any content, and does not promote piracy. Not affiliated with any of those mentioned websites or tools.

## Single purpose

Show a badge on movies on Netflix, IMDb and YTS pages that are already in the user's own Jellyfin, Emby, Plex or local library.

## Permission justifications

- storage: saves the user's media server settings and the local movie file-name index.
- Host permission: requested only for the media server address the user enters, to query it for matching titles. The address is chosen by the user and can be any host or LAN IP, so it cannot be listed in advance.
- Content scripts (Netflix, IMDb, YTS domains): read movie titles on the page and show the badge.
- Remote code: No. All code is in the package.

## Data usage (Privacy practices)

- Authentication information: yes (API keys). Stored in the browser, optionally in the user's Chrome sync. Sent only to the user's own media server. Never sent to the developer.
- Everything else: not collected.
- Certify: not sold or transferred to third parties; not used for unrelated purposes; not used for creditworthiness or lending.

## Links

- Privacy policy: https://github.com/kmmuntasir/do-i-have-this-movie/blob/main/PRIVACY.md
- Homepage: https://github.com/kmmuntasir/do-i-have-this-movie
- Support: https://github.com/kmmuntasir/do-i-have-this-movie/issues
- Category: Lifestyle > Entertainment. Language: English.
