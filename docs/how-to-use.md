# How to Use — Oscilloscope

Web Audio Dual Osciloskop + WAV — real-time dual-channel oscilloscope in the browser.

## Quick Start

### Prerequisites

- Modern browser with Web Audio API support (Chrome 80+, Firefox 75+, Safari 14.1+)
- No installation required — runs fully client-side

### Local Development

```bash
git clone https://github.com/sardonicrepulsion/oscilloscope.git
cd oscilloscope
npm install        # dev dependencies (vitest)
npm test           # run static tests
```

Serve locally with any static server:

```bash
# Via Docker (matches production exactly):
docker build -t oscilloscope:local .
docker run -p 8080:80 oscilloscope:local
# Open http://localhost:8080

# Or via any static server:
npx serve .
python3 -m http.server 8080
```

## Using the Oscilloscope

### Demo Mode

1. Click **Spustiť demo** (Start demo) or press **Space**
2. Adjust the sine wave frequency (20–1200 Hz) and amplitude
3. Adjust the sawtooth wave frequency and amplitude
4. Use **Zoom / časová základňa** to change the time window (2–250 ms)
5. **Vertikálne zosilnenie** scales the vertical amplitude
6. **Stabilizácia obrazu** controls frame smoothing (0 = instant, 0.96 = very smooth)

### WAV Mode

1. Select **WAV/audio súbor: L + R kanál** from the Režim dropdown
2. Click the file input to upload any audio file (WAV, MP3, etc.)
3. Click **Prehrať WAV** or press **Space** to start playback
4. Left channel → cyan trace, Right channel → amber trace (mono files show both as same)
5. Use **WAV pozícia** slider to scrub through the file
6. Enable **Sleduj pozíciu prehrávania** to auto-scroll the display

### Controls Reference

| Control | Description |
|---------|-------------|
| Spustiť/Zastaviť demo | Start/stop demo oscillators |
| Mute / Unmute | Silence audio output |
| Freeze obraz | Freeze the oscilloscope display |
| Zoom / časová základňa | Time window in milliseconds |
| Vertikálne zosilnenie | Vertical scale multiplier |
| Stabilizácia obrazu | Frame-to-frame smoothing (0–0.96) |
| Sync / trigger | Triggering mode (common / per-trace / free-run) |
| Trigger level | Rising-edge threshold (−0.9 to +0.9) |
| Master volume | Output volume (0–0.5) |
| FPS limit | Render frame rate cap (5–60 fps) |

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Space | Toggle start/stop (demo or WAV playback) |

## Deploy

Automatic deploy via GitHub webhook → deployer → dokku:

```bash
# After PR merge, webhook auto-deploys. Do NOT run git:from-archive after merge
# (race condition with webhook — see feedback_deploy_race memory).

# Manual deploy only if webhook fails (inspect deployer logs first):
git archive HEAD --format=tar.gz | dokku git:from-archive oscilloscope --archive-type tar.gz --
```

## Versioning

All of these must be bumped together in every change commit:

| File | Field |
|------|-------|
| `VERSION` | plain semver |
| `version.json` | `.version` |
| `package.json` | `.version` |
| `Caddyfile` | `/health`, `/healthz`, `/version` respond bodies |
| `Dockerfile` | `LABEL version=` |
| `CHANGELOG.md` | new `[X.Y.Z]` section |

## Running Tests

```bash
npm test    # vitest run — 17 assertions covering structure + CSP + PWA + versions
```

Required gates: `static-tests`, `version-consistency`, `smoke`. Coverage and mutation-tests are informational.

## Customizing

The app uses CSS custom properties for theming — edit `css/app.css`:

```css
:root {
  --bg: #0b1020;          /* background */
  --panel: #141b2f;       /* panel background */
  --text: #edf2ff;        /* primary text */
  --trace-a: #41d7ff;     /* channel A color (cyan) */
  --trace-b: #ffbe3d;     /* channel B color (amber) */
  --accent: #8ee66f;      /* accent / active color */
  --danger: #ff6878;      /* danger / warning color */
}
```
