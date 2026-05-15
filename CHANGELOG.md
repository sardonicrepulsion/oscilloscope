# Changelog

## [1.0.1] - 2026-05-15 — `refactor(srcore#760)` — Drop version literal from /health

### Changed
- `Caddyfile`: `/health` and `/healthz` respond bodies no longer carry a `version` field. Eliminates the Caddyfile-side source-of-truth that drifted in coin#22.

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2026-05-09

### Added
- V2 audit complete — promoted to 1.x production release
- `docs/how-to-use.md` — user guide + deploy guide + versioning reference
- `docs/components.md` — markup contract, state classes, CSS hooks for all components
- `docs/SECURITY.md` — threat model, security controls, reporting policy
- `docs/ADR-001-external-assets.md` — architecture decisions for CSS/JS extraction + Trusted Types
- `docs/incidents/` — incidents directory (empty, ready for postmortems)
- SRcore project #37 rating bumped to 9.4 (V2 sweep #547-#552 complete)

## [0.5.0] - 2026-05-09

### Added
- PWA `manifest.webmanifest` with name, short_name, theme_color, display standalone, 2 SVG icons
- `icons/icon-192.svg` and `icons/icon-512.svg` (oscilloscope waveform placeholders)
- `<meta name="theme-color" content="#0b1020">` in `<head>`
- `<link rel="manifest" href="/manifest.webmanifest">` in `<head>`
- Skip-link `<a class="skip-link" href="#main">` as first focusable element
- `id="main"` added to `<main>` element
- `.skip-link` CSS with off-screen hide + focus reveal styles
- Tests updated: manifest link, theme-color meta, `<main>` element, manifest.webmanifest

## [0.4.0] - 2026-05-09

### Added
- GitHub Actions CI workflow `.github/workflows/ci.yml` on `sardonic-arm64-oscilloscope` runner
  - `static-tests`: npm ci + vitest
  - `version-consistency`: VERSION/version.json/package.json/Caddyfile must match
  - `docker-build`: Docker image build (push: false)
  - `smoke`: run container, curl /healthz + /version
- Self-hosted runner `sardonic-arm64-oscilloscope` registered and started

## [0.3.1] - 2026-05-09

### Added
- HSTS, COOP, CORP headers via `dokku caddy:labels:add` (host-proxy layer)
- README "Security Headers" section updated with full header table and re-apply instructions

## [0.3.0] - 2026-05-09

### Added
- Content-Security-Policy header in Caddyfile: strict `'self'` for all directives
- `require-trusted-types-for 'script'` + `trusted-types oscilloscope-template` policy
- Trusted Types policy `oscilloscope-template` in js/app.js wraps single `.innerHTML` assignment
- Bumped version to 0.3.0

## [0.2.0] - 2026-05-09

### Changed
- Extracted inline `<style>` (299 lines) → `css/app.css`
- Extracted inline `<script>` (739 lines) → `js/app.js` (loaded with `defer`)
- `index.html` now references external assets via `<link>` and `<script src>`
- Updated Dockerfile LABEL version, VERSION, version.json, Caddyfile handlers

## [0.1.0] - 2026-05-09

### Added
- Initial bootstrap — template snapshot of Web Audio Dual Osciloskop (1193 LOC, single-file)
- V2 baseline scaffold: Caddyfile, Dockerfile, app.json, version.json, VERSION
- Security headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy)
- Health endpoints `/health`, `/healthz`, `/version`
- Static file serving with cache headers
- 404 error page matching tool color scheme (dark, cyan/green)
- Vitest smoke tests for project structure
- GitHub Actions CI ready (via deployer webhook)
- Domain: oscilloscope.sardonicrepulsion.com
