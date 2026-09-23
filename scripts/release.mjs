import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const NPMJS_REGISTRY = 'https://registry.npmjs.org/';
const releaseType = process.argv[2] ?? 'patch';
const allowedReleaseTypes = new Set(['patch', 'minor', 'major']);

function run(command) {
  console.log(`\n$ ${command}`);
  execSync(command, { stdio: 'inherit' });
}

function runCapture(command) {
  return execSync(command, {
    stdio: ['ignore', 'pipe', 'pipe'],
    encoding: 'utf8'
  }).trim();
}

function verifyNpmAuthentication() {
  return runCapture(`npm whoami --registry=${NPMJS_REGISTRY}`);
}

function ensureNpmAuthentication() {
  try {
    console.log(`\nAuthenticated to npmjs as ${verifyNpmAuthentication()}.`);
  } catch {
    console.log(`\nStarting interactive login: npm login --registry=${NPMJS_REGISTRY}`);
    run(`npm login --registry=${NPMJS_REGISTRY}`);
    console.log(`\nAuthenticated to npmjs as ${verifyNpmAuthentication()}.`);
  }
}

if (!allowedReleaseTypes.has(releaseType)) {
  console.error(`Invalid release type: "${releaseType}"`);
  console.error('Usage: npm run release -- [patch|minor|major]');
  process.exit(1);
}

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const packageName = pkg.name;

ensureNpmAuthentication();
run('npm run release:check');
run(`npm version ${releaseType} --no-git-tag-version`);
run(`npm publish --registry=${NPMJS_REGISTRY}`);

const releasedVersion = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).version;
console.log(`\nReleased ${packageName}@${releasedVersion} to npm.`);
