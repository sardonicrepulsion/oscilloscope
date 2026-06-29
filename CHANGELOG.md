# Changelog


## [1.0.10] - 2026-06-29 — `chore(deps)(srcore#1206)` — Security dependency refresh

### Changed
- `vitest` 4.1.5 -> 4.1.9

## [1.0.9] - 2026-05-28 — `feat(srcore#1104)` — Hero auto-changelog block

### Added

- `js/changelog-block.js`: parses the top three `## [X.Y.Z] - DATE — TITLE` entries from `/CHANGELOG.md` at page load and renders them into a new `<section class="recent-updates">` block placed between the topbar and the scope canvas. Uses an `oscilloscope-changelog` Trusted Types policy for the single `innerHTML` write and reuses the existing `connect-src 'self'` CSP — no new external host needed. Refreshes whenever the site is redeployed (CHANGELOG is the single source of truth).
- `css/app.css`: `.recent-updates` block styles (tabular-nums version/date columns, mobile single-column reflow).
- `index.html`: new section + deferred script tag.

## [1.0.8] - 2026-05-23 — `chore(srcore#956)` — Add `node --check` parse guard for shipped JS

### Added

- `tests/parse-guard-static.test.mjs` — runs `node --check` against every shipped JS entry. Brew #953 root cause was a parser-time SyntaxError that silently dead-paged the site; this gate catches that class of bug fleet-wide.

## [1.0.7] - 2026-05-21 — `chore(srcore#870)` — Calibrate LHCI score floors

### Changed

- `lighthouserc.json`: re-floored per-repo LHCI assertions to match observed main-branch baseline (perf=0.85, a11y=0.98, best-practices=0.93, seo=0.88). Previously every V2 repo carried the same default 0.80/0.93/0.95/0.95 floor regardless of its real score, causing repos with low real scores to fail green-CI gates spuriously and high-scoring repos to never get a tight gate. Calibrated to `max(observed - 0.02, 0.50)` so a real regression of ~2 points trips the gate.

## [1.0.6] - 2026-05-21 — `chore(srcore#872)` — Unblock LH workflow (inline Chromium resolve + hidden-file upload)

### Fixed

- `.github/workflows/lighthouse.yml`: replaced `uses: sardonicrepulsion/devops/.github/actions/resolve-playwright-chromium@main` (private cross-repo composite action ref — fails with "Unable to resolve action" at setup) with an inline `run:` step that resolves `/opt/playwright-browsers/chromium-*/chrome-linux/chrome` directly and exports `CHROME_PATH`.
- `.github/workflows/lighthouse.yml`: `actions/upload-artifact@v7` step now sets `include-hidden-files: true`. Without it the action skipped `.lighthouseci/` because the directory name starts with `.` — Lighthouse reports were written but never uploaded, so the artifact was missing every run. Unblocks #870 calibration (need score data to set per-repo thresholds).

## [1.0.5] - 2026-05-21 — `chore(srcore#867)` — Add Lighthouse CI score gates

### Added

- `.github/workflows/lighthouse.yml` — standalone LHCI workflow. Self-hosted ARM64. Builds image, boots on port 19220, runs `@lhci/cli@0.14.x autorun`, uploads report artifact. `continue-on-error: true` initially — thresholds will be calibrated from first run.
- `lighthouserc.json` — desktop preset, 2 runs, baseline thresholds (perf 0.80, a11y 0.93, best-practices 0.95, seo 0.95). PWA + crawlable + preconnect audits off.

Part of fleet-wide #867 LHCI rollout (17 V2 repos). Pattern from synth pilot (#854).

## [1.0.4] - 2026-05-21 — `chore(srcore#866)` — Canonicalise Caddyfile indent (tabs per `caddy fmt`)

### Changed

- `Caddyfile` reformatted with `caddy fmt --overwrite` (4-space → tab indent). No semantic change. Part of fleet-wide #866 sweep.

## [1.0.3] - 2026-05-21 — `chore(srcore#853)` — Long-cache static assets (Cache-Control max-age=30d)

### Added

- Caddyfile `@longcache` matcher applies `Cache-Control: public, max-age=2592000, must-revalidate` to `/js/*.js`, `/styles.css`, `/favicon.svg`, `/og-cover.svg`, `/icon-*.png`, `/manifest.webmanifest`. Closes Lighthouse `uses-long-cache-ttl` gap that fast 2.4.0 already had.

## [1.0.2] - 2026-05-21 — `chore(srcore#823)` — Bump GHA actions to Node 24-compatible versions

### Changed

- `actions/checkout@v4` → `@v6` (where present).
- `actions/setup-node@v4` → `@v6` (where present).
- `actions/upload-artifact@v4` → `@v7` (where present).
- `docker/build-push-action@v6` → `@v7` (where present).
- `docker/setup-buildx-action@v3` → `@v4` (where present).
- `dependabot/fetch-metadata@v2` → `@v3` (where present).

GitHub forces Node 24 default on **2026-06-16**; Node 20 fully removed **2026-09-16**. Pattern validated on `brew` (canary).

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
