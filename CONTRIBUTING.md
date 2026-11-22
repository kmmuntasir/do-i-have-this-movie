# Contributing

Thanks for helping.

## Setup

```bash
git clone https://github.com/kmmuntasir/do-i-have-this-movie.git
cd do-i-have-this-movie
npm install
npm run build
```

Load the folder as an unpacked extension (`chrome://extensions`, Developer mode). Run `npm run build` and reload the extension after every change to a content-script file.

## Adding a website

Create `adapters/<site>-adapter.js` extending `BaseAdapter`, register it in `content.js`, and add its domains to `content_scripts.matches` and `web_accessible_resources.matches` in `manifest.json`. Walkthrough: [docs/adding-new-websites.md](docs/adding-new-websites.md).

## Adding a media source

Extend `BaseSourceAdapter` in `sources/`, register it in `background.js`, and add a section to `options.html`. See [docs/architecture.md](docs/architecture.md).

## Pull requests

- Keep each PR focused on one change.
- Run `npm run build`; CI must pass.
- Use `feat:` or `fix:` commit prefixes; the release workflow builds the changelog from them.
- For site adapters, say which pages you checked (list, detail, related).
- Never commit API keys or server addresses.

By contributing you agree your work is licensed under GPL-3.0.

## Releases

Maintainers: Actions → **Release** → Run workflow, with `patch`, `minor`, `major` or `x.y.z`. Commit subjects like `feat: ...` and `fix: ...` become changelog entries. A version already present in `CHANGELOG.md` is used as written.
