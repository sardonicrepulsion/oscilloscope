# Components — Oscilloscope

Markup contract, state classes, CSS hooks, and gotchas for each UI component.

## Component Index

| Component | Element | CSS Location | JS Owner |
|-----------|---------|--------------|----------|
| Skip Link | `.skip-link` | `css/app.css` L1–27 | none |
| Topbar | `.topbar` | `css/app.css` L54–74 | `updateStatus()` |
| Status Display | `#status` | `.status` | `updateStatus()` |
| Scope Canvas | `#scope` | `canvas` | `paint()` |
| Legend Pills | `.legend .pill` | `css/app.css` L104–124 | `updateLegend()` |
| Controls Panel | `.controls` | `css/app.css` L126–137 | various |
| Control Group | `.group` | `css/app.css` L150–170 | `updatePanelState()` |
| Start/Stop Button | `#startStop` | `.primary` | `startDemo()` / `playWav()` |
| Mute Button | `#mute` | `button` | muted state toggle |
| Freeze Button | `#freeze` | `.danger` | frozen state toggle |

## Skip Link

**Markup:**
```html
<a class="skip-link" href="#main">Preskočiť na hlavný obsah</a>
```

**CSS hook:** `.skip-link` — off-screen by default, reveals on `:focus`
**State:** no JS state, pure CSS
**Gotcha:** Must be the first focusable element in `<body>`. Target `#main` must exist.

## Topbar

**Markup:**
```html
<section class="topbar">
  <div>
    <h1>…</h1>
    <p class="hint">…</p>
  </div>
  <div class="status" id="status">…</div>
</section>
```

**CSS hook:** `.topbar` — flex row with space-between; collapses to column below 1040px
**JS owner:** `updateStatus()` writes to `#status.innerHTML` via `ttPolicy.createHTML()`
**Gotcha:** `.status` uses `.innerHTML` — must go through the Trusted Types policy `oscilloscope-template`.

## Scope Canvas

**Markup:**
```html
<canvas id="scope" aria-label="Osciloskop zobrazujúci dva signály"></canvas>
```

**CSS hook:** `canvas` — `display: block; width: 100%; height: min(54vh, 520px)`
**JS owner:** `paint()` — RAF loop renders grid + traces
**State classes:** none on element itself; internal `frozen` / `firstFrame` flags
**Gotcha:** Must call `resizeCanvas()` on `window.resize` to keep DPR-correct dimensions.

## Legend Pills

**Markup:**
```html
<span class="pill trace-a"><span class="dot"></span><span id="legendA">Sínus</span></span>
<span class="pill trace-b"><span class="dot"></span><span id="legendB">Píla</span></span>
```

**CSS hook:** `.pill` — glassmorphism style with `backdrop-filter: blur(8px)`
**State:** `.trace-a` = `var(--trace-a)` cyan, `.trace-b` = `var(--trace-b)` amber
**JS owner:** `updateLegend()` sets `legendA.textContent` / `legendB.textContent`

## Control Groups

**Markup:**
```html
<div class="group [demo-only|wav-only]" id="…">…</div>
```

**CSS hook:** `.group` — grid layout, `align-content: start`
**State class:** `.is-muted` — applied by `updatePanelState()` when the mode doesn't match
- `.demo-only.is-muted` → opacity 0.58 when in WAV mode
- `.wav-only.is-muted` → opacity 0.58 when in demo mode

**JS owner:** `updatePanelState()` toggles `.is-muted` based on `sourceMode.value`

## Range Inputs + Output Labels

**Markup:**
```html
<label>
  <span class="row">Label Text <output id="valueOut">value</output></span>
  <input id="control" type="range" min="…" max="…" step="…" value="…">
</label>
```

**CSS hook:** `input[type="range"]` — `accent-color: var(--accent)`, full width
**JS owner:** `updateLabels()` updates all `output` elements from current input values
**Event:** `input` + `change` → calls `updateAudioParams()` → `updateLabels()`

## File Input

**Markup:**
```html
<input id="wavFile" type="file" accept="audio/wav,audio/x-wav,audio/*">
```

**CSS hook:** `input[type="file"]::file-selector-button` — custom accent-colored button
**JS owner:** `loadWavFile()` called on `change` event
**Gotcha:** `AudioContext.decodeAudioData()` is async — UI shows "Dekódujem audio súbor…" during decode.

## State Class Index

| Class | Owner | Effect |
|-------|-------|--------|
| `.is-muted` | `updatePanelState()` | opacity 0.58 on `.group` when mode mismatch |
| `.skip-link:focus` | browser | reveals skip link at top-left |

## Where Components Render

| Component | Rendered | CSS file | Line range |
|-----------|----------|----------|------------|
| `.skip-link` | body start | `css/app.css` | L1–27 |
| `.topbar` | `main.app` | `css/app.css` | L54–74 |
| `.scope-wrap` | `main.app` | `css/app.css` | L76–124 |
| `.controls` | `main.app` | `css/app.css` | L126–148 |
| `.group` | `.control-grid` | `css/app.css` | L150–170 |
| `output` | inside `label` | `css/app.css` | L196–203 |
