# ADR-001: External CSS and JS Assets

**Date:** 2026-05-09
**Status:** Accepted

## Context

The original oscilloscope was a single `index.html` file (1193 LOC) with inline `<style>` (299 lines) and `<script>` (739 lines). This prevented implementing a strict Content Security Policy without `unsafe-inline`.

## Decision

Extract the inline `<style>` block to `css/app.css` and the inline `<script>` block to `js/app.js`. Load them as external resources via `<link rel="stylesheet">` and `<script src defer>`.

## Consequences

- **Positive:** Enables strict CSP without `unsafe-inline` for both script-src and style-src
- **Positive:** Enables `require-trusted-types-for 'script'` enforcement
- **Positive:** Separate files are independently cacheable
- **Positive:** Easier to maintain and test (assertions on external file existence/size)
- **Negative:** One additional HTTP request per asset (mitigated by HTTP/2 multiplexing)

## ADR-002: Trusted Types Policy

**Date:** 2026-05-09
**Status:** Accepted

## Context

After extracting JS to `js/app.js`, a `require-trusted-types-for 'script'` CSP directive was added. The code uses `ui.status.innerHTML` to render audio status updates (with `<br>` HTML).

## Decision

Define a Trusted Types policy `oscilloscope-template` that accepts HTML strings for the status display. The policy is intentionally permissive for this single trusted use case since the HTML is composed from known-safe application state (not user-controlled).

## Consequences

- **Positive:** Full Trusted Types compliance — browsers enforce that all `.innerHTML` calls go through the policy
- **Positive:** Future `.innerHTML` additions require explicit policy use, acting as an audit trail
- **Negative:** Minor overhead of policy creation on page load (negligible)
- **Alternative considered:** Use `textContent` + DOM construction for status — rejected because the `<br>` formatting is needed for multi-line status display
