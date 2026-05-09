import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const root = join(import.meta.dirname, '..');

describe('oscilloscope project structure', () => {
  it('index.html exists', () => {
    expect(existsSync(join(root, 'index.html'))).toBe(true);
  });

  it('version.json has correct shape', () => {
    const raw = readFileSync(join(root, 'version.json'), 'utf8');
    const v = JSON.parse(raw);
    expect(v.app).toBe('oscilloscope');
    expect(v.version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(v.classification).toBeTruthy();
  });

  it('version.json classification matches expected', () => {
    const raw = readFileSync(join(root, 'version.json'), 'utf8');
    const v = JSON.parse(raw);
    expect(v.classification).toBe('tool/public/active');
  });

  it('VERSION file matches version.json', () => {
    const version = readFileSync(join(root, 'VERSION'), 'utf8').trim();
    const vJson = JSON.parse(readFileSync(join(root, 'version.json'), 'utf8'));
    expect(version).toBe(vJson.version);
  });

  it('Caddyfile has /healthz handler', () => {
    const caddyfile = readFileSync(join(root, 'Caddyfile'), 'utf8');
    expect(caddyfile).toContain('handle /healthz');
  });

  it('Caddyfile has /version handler', () => {
    const caddyfile = readFileSync(join(root, 'Caddyfile'), 'utf8');
    expect(caddyfile).toContain('handle /version');
  });

  it('Caddyfile /version handler references oscilloscope app name', () => {
    const caddyfile = readFileSync(join(root, 'Caddyfile'), 'utf8');
    expect(caddyfile).toContain('"app":"oscilloscope"');
  });
});
