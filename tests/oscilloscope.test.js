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

  it('index.html has no inline <style> block', () => {
    const html = readFileSync(join(root, 'index.html'), 'utf8');
    expect(html).not.toMatch(/<style[\s>]/i);
  });

  it('index.html has no inline <script> body content (only src attribute allowed)', () => {
    const html = readFileSync(join(root, 'index.html'), 'utf8');
    // Script tags must have src attribute and no body content
    const scriptMatches = html.match(/<script([^>]*)>([\s\S]*?)<\/script>/gi) || [];
    for (const tag of scriptMatches) {
      const bodyMatch = tag.match(/<script[^>]*>([\s\S]*?)<\/script>/i);
      const body = bodyMatch ? bodyMatch[1].trim() : '';
      expect(body).toBe('');
    }
  });

  it('index.html links to external css/app.css', () => {
    const html = readFileSync(join(root, 'index.html'), 'utf8');
    expect(html).toContain('href="/css/app.css"');
  });

  it('index.html links to external js/app.js', () => {
    const html = readFileSync(join(root, 'index.html'), 'utf8');
    expect(html).toContain('src="/js/app.js"');
  });

  it('css/app.css exists and is non-empty', () => {
    const cssPath = join(root, 'css/app.css');
    expect(existsSync(cssPath)).toBe(true);
    const content = readFileSync(cssPath, 'utf8');
    expect(content.trim().length).toBeGreaterThan(100);
  });

  it('js/app.js exists and is non-empty', () => {
    const jsPath = join(root, 'js/app.js');
    expect(existsSync(jsPath)).toBe(true);
    const content = readFileSync(jsPath, 'utf8');
    expect(content.trim().length).toBeGreaterThan(100);
  });
});
