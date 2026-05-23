// srcore#956 — guard shipped JS against parser-time errors.
//
// Brew #953 root cause: a duplicate top-level `const formatDate` inside the
// page-bootstrap IIFE raised `SyntaxError: Identifier 'formatDate' has
// already been declared` at parse time. The whole IIFE body then never ran;
// the mobile menu / opening-hours / reservation form silently died. CI was
// green because no test exercised the file.
//
// `node --check <file>` is the cheap structural guard: it parses the script
// without executing it. Any duplicate identifier, mismatched brace, or
// invalid token surfaces here as a non-zero exit.
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import assert from 'node:assert/strict';

const root = fileURLToPath(new URL('../', import.meta.url)).replace(/\/$/, '');

const candidates = [
  'js/app.js',
  'public/js/app.js',
  'public/app.js',
  'script.js',
  'public/script.js',
];

const found = candidates
  .map((rel) => join(root, rel))
  .filter((abs) => existsSync(abs));

assert.ok(
  found.length > 0,
  `no shipped JS file found — looked for ${candidates.join(', ')}`,
);

for (const file of found) {
  assert.doesNotThrow(
    () => execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' }),
    `node --check failed for ${file}. Likely a SyntaxError such as a duplicate top-level identifier inside an IIFE. See srcore#956.`,
  );
}
