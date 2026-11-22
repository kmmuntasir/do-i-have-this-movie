# Changelog

All notable changes to this project are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/).

## [1.1.0] - 2026-11-22

### Added
- opt-in settings sync through Chrome account

### Fixed
- update Netflix selectors for public title pages; add Netflix screenshot
- place IMDb title-page badge on the poster; add IMDb screenshot
- wait for source activation before answering movie checks
- IMDb year extraction (hero selector broke, cards used the page movie's year)

### Changed
- add disclaimer

## [1.0.0] - 2026-11-22

First public release.

### Added
- Badges on movies already in your library, on Netflix, IMDb and YTS.
- Media source adapters for Jellyfin, Emby and Plex, queried in parallel.
- Options page to enable sources, enter credentials and test connections.
- Fuzzy title and year matching.
- Local Files source: choose a movie folder in settings; file names are indexed in your browser and matched by title and year.
- Screenshots in `docs/screenshots/`.
- YTS support for `yts.pw` and `yts-official.am`, which uses a different page layout from other YTS mirrors.

### Changed
- Site detection is split into per-site adapters.
- Host access is requested per media server when you save it, instead of for all sites at install. Removed the unused `activeTab` permission.
