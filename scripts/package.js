// Zips only what Chrome needs at runtime (content script is bundled in dist/).
const { execFileSync } = require('child_process');
const { version } = require('../manifest.json');
const out = `do-i-have-this-movie-${version}.zip`;
const files = ['manifest.json', 'background.js', 'content.css', 'options.html', 'options.css', 'options.js',
  'popup.html', 'popup.css', 'popup.js', 'icons', 'dist', 'sources'];
execFileSync('rm', ['-f', out]);
execFileSync('zip', ['-rq', out, ...files, '-x', '*.DS_Store'], { stdio: 'inherit' });
console.log('Created', out);
