// srcore#956 — guard shipped JS against parser-time errors.
//
// Brew #953: duplicate top-level `const formatDate` inside the page-bootstrap
// IIFE raised `SyntaxError: Identifier 'formatDate' has already been
// declared` at parse time. The whole IIFE body then never ran; the page was
// silently dead. CI was green because no test parsed the file.
//
// `node --check <file>` parses without executing — any duplicate identifier,
// mismatched brace, or invalid token surfaces here as a non-zero exit.
import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

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

describe('srcore#956 — shipped JS parses cleanly', () => {
  it('finds at least one shipped JS file', () => {
    expect(found.length).toBeGreaterThan(0);
  });

  it.each(found)('node --check %s', (file) => {
    expect(() => execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' })).not.toThrow();
  });
});
