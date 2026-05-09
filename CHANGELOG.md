# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
