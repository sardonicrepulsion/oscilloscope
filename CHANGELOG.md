# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
