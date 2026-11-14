import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const fromRoot = createRequire(new URL('../package.json', import.meta.url));

test('patched matching dependency preserves Expo fingerprint ignore behavior', () => {
  const fromExpo = createRequire(fromRoot.resolve('expo/package.json'));
  const fromFingerprint = createRequire(fromExpo.resolve('@expo/fingerprint'));
  // Resolve the real consumer's dependency, including a nested npm installation.
  const { isIgnoredPath } = fromFingerprint('./utils/Path.js');
  const patterns = ['**/node_modules/**', '!**/node_modules/keep/**'];
  assert.equal(isIgnoredPath('node_modules/package/index.js', patterns), true);
  assert.equal(isIgnoredPath('node_modules/keep/index.js', patterns), false);
  assert.equal(isIgnoredPath('src/screens/feed.tsx', patterns), false);
  assert.equal(isIgnoredPath('.expo/types/router.d.ts', ['**/.expo/**']), true);
  assert.equal(isIgnoredPath('../node_modules/package/index.js', patterns), true);
});

test('patched matching dependency retains the ESLint parser project-filter API', () => {
  const fromConfig = createRequire(fromRoot.resolve('eslint-config-expo'));
  const fromParser = createRequire(fromConfig.resolve('@typescript-eslint/parser'));
  const fromEstree = createRequire(fromParser.resolve('@typescript-eslint/typescript-estree'));
  const { minimatch } = fromEstree('minimatch');
  assert.equal(minimatch('eslint.config.js', '*.js', { dot: true }), true);
  assert.equal(minimatch('.config.js', '*.js', { dot: true }), true);
  assert.equal(minimatch('src/screens/feed.tsx', 'src/**/*.{ts,tsx}', { dot: true }), true);
  assert.equal(minimatch('node_modules/package/index.js', 'src/**/*.{ts,tsx}', { dot: true }), false);
});
