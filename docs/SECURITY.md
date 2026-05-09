# Security — Oscilloscope

## Threat Model

Oscilloscope is a client-side Web Audio oscilloscope tool. It processes user-supplied audio files locally in the browser.

**In scope:**
- XSS via malicious audio file names (rendered to DOM via textContent, not innerHTML)
- Content injection via Trusted Types bypass
- Clickjacking
- Protocol downgrade

**Out of scope:**
- Server-side RCE (no server-side code)
- Authentication / authorization (no accounts)
- Data exfiltration (no network requests made by the app)

## Security Controls

| Control | Implementation |
|---------|----------------|
| CSP | `script-src 'self'` + `style-src 'self'` — no `unsafe-inline` |
| Trusted Types | Policy `oscilloscope-template` wraps all `.innerHTML` assignments |
| Clickjacking | `X-Frame-Options: DENY` + `frame-ancestors: none` in CSP |
| Protocol | HSTS `max-age=63072000; includeSubDomains; preload` |
| COOP/CORP | `same-origin` (prevents Spectre-class cross-origin leaks) |
| File processing | All audio decoding via `AudioContext.decodeAudioData()` — browser sandbox |
| No external deps | No third-party CDN scripts/styles loaded |

## Reporting

Report vulnerabilities to: peter@sardonicrepulsion.com

Include:
- Description of the issue
- Steps to reproduce
- Impact assessment
- Suggested fix (optional)

Response time: within 48 hours.
