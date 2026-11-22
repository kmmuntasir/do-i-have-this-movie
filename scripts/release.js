// Usage: node scripts/release.js <patch|minor|major|x.y.z>
// Bumps manifest.json + package.json, adds a CHANGELOG.md section built from
// commit subjects since the last tag (unless that version already has one),
// and writes the section to release-notes.md.
const fs = require('fs');
const { execSync } = require('child_process');

const arg = process.argv[2];
if (!arg) throw new Error('Usage: node scripts/release.js <patch|minor|major|x.y.z>');

const sh = (c) => execSync(c, { encoding: 'utf8' }).trim();
const read = (f) => fs.readFileSync(f, 'utf8');
const manifest = JSON.parse(read('manifest.json'));

let version = arg;
if (['patch', 'minor', 'major'].includes(arg)) {
  const [maj, min, pat] = manifest.version.split('.').map(Number);
  version = arg === 'major' ? `${maj + 1}.0.0` : arg === 'minor' ? `${maj}.${min + 1}.0` : `${maj}.${min}.${pat + 1}`;
}
if (!/^\d+\.\d+\.\d+$/.test(version)) throw new Error(`Bad version: ${version}`);

let changelog = read('CHANGELOG.md');
if (!changelog.includes(`## [${version}]`)) {
  let range = '';
  try { range = `${sh('git describe --tags --abbrev=0')}..HEAD`; } catch { /* no tags yet */ }
  const subjects = sh(`git log ${range} --no-merges --pretty=format:%s`).split('\n')
    .filter((s) => s && !s.startsWith('chore(release)'));
  const groups = { Added: [], Fixed: [], Changed: [] };
  for (const s of subjects) {
    const m = s.match(/^(\w+)(?:\([^)]*\))?!?:\s*(.+)$/);
    const [type, text] = m ? [m[1].toLowerCase(), m[2]] : ['', s];
    (type === 'feat' ? groups.Added : type === 'fix' ? groups.Fixed : groups.Changed).push(text);
  }
  const date = new Date().toISOString().slice(0, 10);
  const body = Object.entries(groups).filter(([, v]) => v.length)
    .map(([k, v]) => `### ${k}\n${v.map((t) => `- ${t}`).join('\n')}`).join('\n\n');
  const section = `## [${version}] - ${date}\n\n${body || '- Maintenance release.'}\n\n`;
  changelog = changelog.replace(/(^## \[)/m, `${section}$1`);
  if (!changelog.includes(`## [${version}]`)) changelog = `${changelog.trimEnd()}\n\n${section}`;
  fs.writeFileSync('CHANGELOG.md', changelog);
}

manifest.version = version;
fs.writeFileSync('manifest.json', `${JSON.stringify(manifest, null, 2)}\n`);
const pkg = JSON.parse(read('package.json'));
pkg.version = version;
fs.writeFileSync('package.json', `${JSON.stringify(pkg, null, 2)}\n`);

const notes = changelog.split(/^## \[/m).find((s) => s.startsWith(`${version}]`));
fs.writeFileSync('release-notes.md', notes.replace(/^[^\n]*\n/, '').trim() + '\n');
console.log(`Release ${version} prepared`);
