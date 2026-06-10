/**
 * Bumps the version in manifest.json, commits, tags, and pushes.
 * Usage: npm run release -- 1.2.3
 */
import { readFile, writeFile } from 'node:fs/promises';
import { execSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = path.join(repoRoot, 'manifest.json');

const version = process.argv[2];
if (!version || !/^\d+\.\d+\.\d+$/.test(version)) {
  console.error('Usage: npm run release -- <major.minor.patch>');
  process.exit(1);
}

const runOutput = (cmd) => execSync(cmd, { cwd: repoRoot, encoding: 'utf8' }).trim();

const branch = runOutput('git rev-parse --abbrev-ref HEAD');
if (branch !== 'main') {
  console.error(`Must be on main branch (currently on "${branch}").`);
  process.exit(1);
}

execSync('git fetch origin main', { cwd: repoRoot, stdio: 'inherit' });
const local = runOutput('git rev-parse HEAD');
const remote = runOutput('git rev-parse origin/main');
if (local !== remote) {
  console.error('Branch is not up-to-date with origin/main. Pull or push first.');
  process.exit(1);
}

const packagePath = path.join(repoRoot, 'package.json');

const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
manifest.version = version;
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`manifest.json → ${version}`);

const pkg = JSON.parse(await readFile(packagePath, 'utf8'));
pkg.version = version;
await writeFile(packagePath, `${JSON.stringify(pkg, null, 2)}\n`);
console.log(`package.json → ${version}`);

const run = (cmd) => execSync(cmd, { cwd: repoRoot, stdio: 'inherit' });

run(`git add manifest.json package.json`);
run(`git commit -m "chore(release): ${version}"`);
run(`git tag ${version}`);
run(`git push origin main --tags`);
console.log(`\nTag ${version} pushed — GitHub Actions will create the release.`);
