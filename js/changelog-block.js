// SRcore #1104 — Hero auto-changelog block. Fetches /CHANGELOG.md (same
// origin, no extra CSP host needed), parses the top three `## [X.Y.Z] -
// DATE — TITLE` headers, renders them under the hero topbar. CHANGELOG is
// the single source of truth — refreshes on every deploy. Uses the
// `oscilloscope-template` Trusted Types policy already declared in the
// page CSP for the one innerHTML write.
(function () {
  const ttPolicy =
    typeof window.trustedTypes !== 'undefined' && window.trustedTypes.createPolicy
      ? window.trustedTypes.createPolicy('oscilloscope-changelog', { createHTML: (s) => s })
      : { createHTML: (s) => s };

  const HEADER_RE = /^##\s+\[(\d+\.\d+\.\d+)\]\s+-\s+(\d{4}-\d{2}-\d{2})\s+—\s+(.+)$/gm;

  function parseTopThree(markdown) {
    const entries = [];
    let m;
    while ((m = HEADER_RE.exec(markdown)) !== null) {
      entries.push({ version: m[1], date: m[2], title: m[3].trim() });
      if (entries.length === 3) break;
    }
    return entries;
  }

  function escapeText(value) {
    const div = document.createElement('div');
    div.textContent = String(value);
    return div.innerHTML;
  }

  function renderEntries(entries) {
    if (!entries.length) {
      return '<li class="recent-empty">Žiadne nedávne zmeny.</li>';
    }
    return entries
      .map(
        (e) =>
          `<li class="recent-item">` +
          `<span class="recent-version">v${escapeText(e.version)}</span>` +
          `<time class="recent-date" datetime="${escapeText(e.date)}">${escapeText(e.date)}</time>` +
          `<span class="recent-title">${escapeText(e.title)}</span>` +
          `</li>`,
      )
      .join('');
  }

  async function mount() {
    const list = document.getElementById('recent-updates-list');
    if (!list) return;
    let entries = [];
    try {
      const res = await fetch('/CHANGELOG.md', { cache: 'no-cache' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const text = await res.text();
      entries = parseTopThree(text);
    } catch (err) {
      list.innerHTML = ttPolicy.createHTML('<li class="recent-empty">Nedostupné</li>');
      return;
    }
    list.innerHTML = ttPolicy.createHTML(renderEntries(entries));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount, { once: true });
  } else {
    mount();
  }
})();
