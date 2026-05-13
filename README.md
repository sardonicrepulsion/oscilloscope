# Oscilloscope

Web Audio Dual Osciloskop + WAV — dual-channel scope visualization with WAV playback.

## Stack

- **Runtime:** Static Caddy
- **Base image:** `caddy:2-alpine`
- **Memory:** 64MB

## Prerequisites

- Caddy (alebo Docker)

## Setup

```bash
git clone https://github.com/sardonicrepulsion/oscilloscope.git
# Servovať cez Caddy alebo ľubovoľný static server
```

## Štruktúra

- `index.html` — hlavný osciloskop (Web Audio API + Canvas)
- `404.html` — stránka nenájdená
- `version.json` — verzia pre /version endpoint
- `VERSION` — plain text verzia

## Endpointy

| Path | Popis |
|------|-------|
| `/` | Hlavný osciloskop |
| `/health` | Healthcheck (JSON) |
| `/healthz` | Healthcheck (JSON) |
| `/version` | Verzia aplikácie (JSON) |

## Security Headers

**App-layer headers** (set in `Caddyfile`):

| Header | Value |
|--------|-------|
| `Content-Security-Policy` | `default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; media-src 'self' blob:; worker-src 'self' blob:; base-uri 'self'; form-action 'self'; object-src 'none'; frame-ancestors 'none'; require-trusted-types-for 'script'; trusted-types oscilloscope-template` |
| `X-Frame-Options` | `DENY` |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | (restrictive) |
| `X-Permitted-Cross-Domain-Policies` | `none` |

**Host-proxy-layer headers** (set via `dokku caddy:labels:add` to avoid doubling with inner Caddy):

| Label | Value |
|-------|-------|
| `caddy.header.Strict-Transport-Security` | `"max-age=63072000; includeSubDomains; preload"` |
| `caddy.header.Cross-Origin-Opener-Policy` | `same-origin` |
| `caddy.header.Cross-Origin-Resource-Policy` | `same-origin` |

To re-apply after a full redeploy:
```bash
dokku caddy:labels:add oscilloscope caddy.header.Strict-Transport-Security '"max-age=63072000; includeSubDomains; preload"'
dokku caddy:labels:add oscilloscope caddy.header.Cross-Origin-Opener-Policy same-origin
dokku caddy:labels:add oscilloscope caddy.header.Cross-Origin-Resource-Policy same-origin
```

## Environment Variables

Žiadne — čisto statický site.

## Deploy

Automatický deploy cez GitHub webhook → deployer → `dokku git:from-archive`.

```bash
# Manuálny deploy (ak webhook nefiruje):
git archive HEAD --format=tar.gz | dokku git:from-archive oscilloscope --archive-type tar.gz --
```

## Versioning

Každá zmena bumpe verziu v `version.json`, `VERSION`, `package.json`, `Dockerfile` (LABEL) a `Caddyfile` (respond body).

## Tests

```bash
npm install
npm test
```
