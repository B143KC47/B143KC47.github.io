# "Signal" Monochrome Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild B143KC47.github.io as a cinematic, strictly monochrome (black/white/gray) portfolio with an immersive full-bleed neural-grid WebGL hero, leading with research impact.

**Architecture:** Zero-build static site. Edit five live files in place — `index.html`, `styles/startup-redesign.css`, `styles/cosmic.css`, `modules/startup-redesign.js`, `modules/transformer-scene.js`. Three.js loads from CDN via the existing import map. Live GitHub + OpenReview/publications data wiring is preserved; only framing, order, palette, and the 3D scene change.

**Tech Stack:** HTML5, modern CSS (custom properties, grid, `clamp()`), vanilla ES (IIFE + one ES module), Three.js 0.184 (CDN).

**Spec:** `docs/superpowers/specs/2026-06-15-signal-monochrome-redesign-design.md`

---

## Testing approach (read first)

No test framework exists. Every task's verification = run a local server and inspect in a real browser. Start it once:

```bash
cd "C:/Users/ko202/Desktop/Github Page Website/B143KC47.github.io"
python -m http.server 8000
```

Then open `http://localhost:8000/`. Use http (not `file://`) so ES-module imports, the import map, and `fetch` behave like production. "Verify" steps below mean: reload, look at the page, and open DevTools Console — **zero uncaught errors** is a pass condition for every task.

**Preserved DOM contract** (these IDs/classes are read by `startup-redesign.js` and MUST survive the HTML rewrite):
`#transformer-stage`, `#hero-field`, `#project-list`, `#github-source`, `#github-sync`, `#github-count`, `#publication-list`, `#publication-sync`, `#publications-data` (inline JSON), `#footer-year`, `.cursor-dot`, `.cursor-ring`, `.reveal`, `[data-header]`, `[data-nav-toggle]`, `[data-nav]`. Generated rows use `.project-row`/`.project-meta`/`.publication-row`/`.publication-meta`/`.topic-pill` — keep these class names so existing render functions style correctly.

---

## Task 1: Monochrome design system foundation

**Files:**
- Modify: `styles/startup-redesign.css` (replace the `:root`/reset/base-typography block at the top; leave component blocks for later tasks)

- [ ] **Step 1: Replace the token + base layer**

Replace the existing `:root` and base/reset rules at the top of the file with the monochrome system. Keep the file's later component rules for now (they get rewritten in Tasks 3–7).

```css
:root {
  /* The only colors in the site: black, white, gray. */
  --ink: #05060a;          /* base black */
  --ink-2: #0b0d14;        /* raised black (cards on dark) */
  --paper: #f4f6fb;        /* white */
  --paper-2: #e9ecf3;      /* dimmed white */
  --gray-70: #9aa0ad;      /* secondary text on dark */
  --gray-50: #6b7280;      /* muted / meta */
  --gray-30: #3a3f4b;      /* borders on dark */
  --gray-15: #1b1e26;      /* hairlines on dark */
  --line-dark: rgba(244,246,251,.12);
  --line-light: rgba(5,6,10,.12);

  --font-display: 'Syne', system-ui, sans-serif;
  --font-body: 'Manrope', system-ui, sans-serif;
  --font-mono: 'IBM Plex Mono', ui-monospace, monospace;

  /* Fluid type scale */
  --fs-eyebrow: .78rem;
  --fs-body: clamp(1rem, .96rem + .3vw, 1.15rem);
  --fs-h3: clamp(1.25rem, 1.1rem + .8vw, 1.6rem);
  --fs-h2: clamp(2rem, 1.4rem + 3vw, 3.6rem);
  --fs-display: clamp(2.6rem, 1.4rem + 6vw, 6.4rem);

  --maxw: 1180px;
  --gutter: clamp(1.25rem, 4vw, 4rem);
  --ease: cubic-bezier(.22,.61,.36,1);
}

*, *::before, *::after { box-sizing: border-box; }
html { scroll-behavior: smooth; -webkit-text-size-adjust: 100%; }
@media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }

body {
  margin: 0;
  background: var(--ink);
  color: var(--paper);
  font-family: var(--font-body);
  font-size: var(--fs-body);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  overflow-x: hidden;
}

h1, h2, h3 { font-family: var(--font-display); font-weight: 700; line-height: 1.04; letter-spacing: -.02em; margin: 0; }
a { color: inherit; text-decoration: none; }
img { max-width: 100%; display: block; }

.eyebrow {
  font-family: var(--font-mono); font-size: var(--fs-eyebrow);
  text-transform: uppercase; letter-spacing: .28em; color: var(--gray-50); margin: 0 0 1rem;
}

.skip-link { position: absolute; left: -999px; top: 0; background: var(--paper); color: var(--ink); padding: .6rem 1rem; z-index: 200; }
.skip-link:focus { left: .5rem; top: .5rem; }

:focus-visible { outline: 2px solid var(--paper); outline-offset: 3px; }

/* Section rhythm + ink<->paper alternation (the monochrome "drama") */
.section { padding: clamp(4.5rem, 10vw, 9rem) var(--gutter); }
.section-inner { max-width: var(--maxw); margin: 0 auto; }
.section--paper { background: var(--paper); color: var(--ink); }
.section--paper .eyebrow { color: var(--gray-50); }
.section--paper .eyebrow { color: #5a6170; }

/* Reveal animation (driven by existing IntersectionObserver -> .in-view) */
.reveal { opacity: 0; transform: translateY(22px); transition: opacity .7s var(--ease), transform .7s var(--ease); }
.reveal.in-view { opacity: 1; transform: none; }
@media (prefers-reduced-motion: reduce) { .reveal { opacity: 1; transform: none; transition: none; } }
```

- [ ] **Step 2: Verify**

Run the server, open `http://localhost:8000/`. Expected: pure black background, white text, mono uppercase eyebrows. Layout below the hero will look unstyled/raw — that is expected at this stage. Console: no errors.

- [ ] **Step 3: Commit**

```bash
git add styles/startup-redesign.css
git commit -m "feat(design): monochrome design-system foundation"
```

---

## Task 2: Restructure index.html (new order + hooks preserved)

**Files:**
- Modify: `index.html` (the `<body>` content from `<main>` through `</footer>`; keep `<head>` except the version bumps in Step 1)

- [ ] **Step 1: Bump cache-busting versions in `<head>`**

Change the stylesheet/script query strings so browsers fetch fresh assets:
- `styles/startup-redesign.css?v=6` → `?v=7`
- `styles/cosmic.css?v=3` → `?v=4`
- `modules/startup-redesign.js?v=5` → `?v=6`
- `modules/transformer-scene.js?v=1` → `?v=2`

Keep `<meta name="theme-color" content="#05060a">` (already correct).

- [ ] **Step 2: Rewrite the body structure**

Replace everything inside `<main id="top">…</main>` and the `<footer>` with the new section order. Keep the header/nav block, the cursor divs, the skip link, and the `#publications-data` JSON script **unchanged**. New `<main>`:

```html
<main id="top">
  <!-- 1. HERO -->
  <section class="hero" aria-labelledby="hero-title">
    <div id="transformer-stage" class="hero-stage" aria-hidden="true"></div>
    <canvas id="hero-field" class="hero-field" aria-hidden="true"></canvas>
    <div class="hero-grid" aria-hidden="true"></div>
    <div class="hero-inner section-inner">
      <p class="eyebrow reveal">AI researcher / engineering student / builder</p>
      <h1 id="hero-title" class="hero-title reveal">Building AI systems with visible evidence.</h1>
      <p class="hero-lede reveal">LLM agents, formulaic alpha-factor mining, computer vision, and research tooling — kept in one place: live code, papers, and contact routes.</p>
      <div class="hero-actions reveal">
        <a class="btn btn--solid" href="#research">View research</a>
        <a class="btn btn--ghost" href="#build">Live GitHub</a>
      </div>
    </div>
    <a class="hero-scroll" href="#manifesto" aria-label="Scroll to content"><span></span></a>
  </section>

  <!-- 2. MANIFESTO -->
  <section id="manifesto" class="manifesto" aria-label="Statement">
    <p class="manifesto-line section-inner reveal">
      I turn unclear technical ideas into <em>inspectable</em> AI systems.
    </p>
  </section>

  <!-- 3. RESEARCH (lead with impact) -->
  <section id="research" class="section research" aria-labelledby="research-title">
    <div class="section-inner">
      <div class="section-head reveal">
        <p class="eyebrow">Selected research</p>
        <h2 id="research-title">Papers, published beside the code.</h2>
      </div>
      <div id="publication-list" class="publication-list" aria-live="polite">
        <div class="skeleton-line"></div><div class="skeleton-line"></div>
      </div>
      <div class="research-links reveal">
        <a class="meta-link" href="https://scholar.google.com/scholar?q=%22Ho+Tin+Ko%22" target="_blank" rel="noopener noreferrer"><span>Google Scholar</span></a>
        <a class="meta-link" href="https://openreview.net/profile?id=%7EHo_Tin_Ko2" target="_blank" rel="noopener noreferrer"><span>OpenReview ~Ho_Tin_Ko2</span></a>
        <a class="meta-link" href="https://orcid.org/0009-0002-7298-8196" target="_blank" rel="me noopener noreferrer"><span>ORCID 0009-0002-7298-8196</span></a>
        <span class="meta-link meta-link--status" id="publication-sync">Loading…</span>
      </div>
    </div>
  </section>

  <!-- 4. BUILD TRAIL -->
  <section id="build" class="section section--paper build" aria-labelledby="build-title">
    <div class="section-inner">
      <div class="section-head reveal">
        <p class="eyebrow">Build trail</p>
        <h2 id="build-title">Live projects, pulled from GitHub on load.</h2>
      </div>
      <div class="github-status reveal">
        <div><span class="status-label">Source</span><strong id="github-source">GitHub API</strong></div>
        <div><span class="status-label">Last sync</span><strong id="github-sync">Fetching…</strong></div>
        <div><span class="status-label">Public signal</span><strong id="github-count">--</strong></div>
      </div>
      <div id="project-list" class="project-list" aria-live="polite">
        <div class="skeleton-line"></div><div class="skeleton-line"></div><div class="skeleton-line"></div>
      </div>
    </div>
  </section>

  <!-- 5. PROFILE -->
  <section id="profile" class="section profile" aria-labelledby="profile-title">
    <div class="section-inner profile-grid">
      <div class="reveal">
        <p class="eyebrow">Profile</p>
        <h2 id="profile-title">A compact evidence layer.</h2>
        <p>I am KO Ho Tin, also known as BlackCat online — focused on LLM benchmarks, alpha-factor discovery, and practical automation. This site is who I am, what I build, where it is published, and how to reach me.</p>
      </div>
      <dl class="facts reveal">
        <div><dt>Name</dt><dd>KO Ho Tin</dd></div>
        <div><dt>Alias</dt><dd>BlackCat / B143KC47</dd></div>
        <div><dt>Email</dt><dd><a href="mailto:s20200057@ylmass.edu.hk">s20200057@ylmass.edu.hk</a></dd></div>
        <div><dt>ORCID iD</dt><dd><a href="https://orcid.org/0009-0002-7298-8196" target="_blank" rel="me noopener noreferrer">0009-0002-7298-8196</a></dd></div>
        <div><dt>Core topics</dt><dd>LLM agents, quantitative AI, computer vision, evaluation</dd></div>
      </dl>
    </div>
  </section>

  <!-- 6. TRAJECTORY -->
  <section id="trajectory" class="section section--paper trajectory" aria-labelledby="trajectory-title">
    <div class="section-inner">
      <div class="section-head reveal">
        <p class="eyebrow">Trajectory</p>
        <h2 id="trajectory-title">Recent signals from research and building.</h2>
      </div>
      <ol class="timeline">
        <li class="timeline-item reveal"><span class="timeline-year">2026</span><div><h3>ICLR 2026 Poster</h3><p>AlphaBench: benchmarking LLMs in formulaic alpha-factor mining.</p></div></li>
        <li class="timeline-item reveal"><span class="timeline-year">2025</span><div><h3>GenAI in Finance Poster</h3><p>EvoAlpha: evolutionary alpha-factor discovery with LLMs.</p></div></li>
        <li class="timeline-item reveal"><span class="timeline-year">2024</span><div><h3>City University of Hong Kong</h3><p>Research internship and AI / ML research exposure.</p></div></li>
        <li class="timeline-item reveal"><span class="timeline-year">2024</span><div><h3>IEEE CIS Summer School</h3><p>Quantum computational intelligence program, Yokohama.</p></div></li>
      </ol>
    </div>
  </section>

  <!-- 7. CONTACT -->
  <section id="contact" class="section contact" aria-labelledby="contact-title">
    <div class="section-inner reveal">
      <p class="eyebrow">Contact</p>
      <h2 id="contact-title">For research, AI systems, or collaboration — reach out.</h2>
      <div class="contact-actions">
        <a class="btn btn--solid" href="mailto:s20200057@ylmass.edu.hk">Email me</a>
        <a class="btn btn--ghost" href="https://github.com/B143KC47" target="_blank" rel="noopener noreferrer">GitHub</a>
        <a class="btn btn--ghost" href="https://www.linkedin.com/in/blackcat/" target="_blank" rel="noopener noreferrer">LinkedIn</a>
        <a class="btn btn--ghost" href="https://orcid.org/0009-0002-7298-8196" target="_blank" rel="me noopener noreferrer">ORCID</a>
        <a class="btn btn--ghost" href="https://www.zhihu.com/people/B143KC47" target="_blank" rel="noopener noreferrer">Zhihu</a>
      </div>
    </div>
  </section>
</main>

<footer class="site-footer">
  <span>KO Ho Tin</span><span>AI Researcher &amp; Builder</span><span id="footer-year">2026</span>
</footer>
```

Update the nav links in the existing header to match new IDs: `#research`, `#build`, `#profile`, `#trajectory`, and the CTA `#contact`.

- [ ] **Step 3: Verify**

Reload. Expected: all sections present in new order (Hero → Manifesto → Research → Build → Profile → Trajectory → Contact). The Research list and Build list populate with real data within ~1s (publications from inline JSON; repos from GitHub API). Console: no errors. Anchor nav jumps to correct sections.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat(structure): research-first section order, monochrome hooks"
```

---

## Task 3: Header, nav, scroll-progress

**Files:**
- Modify: `styles/startup-redesign.css` (header/nav/progress component block)
- Modify: `modules/startup-redesign.js` (add `initScrollProgress` + active-nav; wire in init)

- [ ] **Step 1: Header + nav + progress CSS**

```css
.site-header { position: fixed; inset: 0 0 auto; z-index: 100; display: flex; align-items: center; justify-content: space-between;
  padding: 1rem var(--gutter); transition: background .4s var(--ease), border-color .4s var(--ease); border-bottom: 1px solid transparent; }
.site-header.is-scrolled { background: rgba(5,6,10,.72); backdrop-filter: blur(14px); border-bottom-color: var(--line-dark); }
.brand { display: flex; gap: .65rem; align-items: center; }
.brand-mark { font-family: var(--font-mono); font-weight: 600; border: 1px solid var(--line-dark); padding: .25rem .5rem; letter-spacing: .1em; }
.brand-copy { display: flex; flex-direction: column; line-height: 1.1; }
.brand-copy small { color: var(--gray-50); font-size: .72rem; font-family: var(--font-mono); }
.site-nav { display: flex; gap: 1.6rem; align-items: center; font-family: var(--font-mono); font-size: .82rem; }
.site-nav a { color: var(--gray-70); transition: color .25s var(--ease); }
.site-nav a:hover, .site-nav a.is-active { color: var(--paper); }
.nav-cta { border: 1px solid var(--line-dark); padding: .45rem .9rem; }
.scroll-progress { position: fixed; top: 0; left: 0; height: 2px; width: 0; background: var(--paper); z-index: 101; }
.nav-toggle { display: none; }
@media (max-width: 760px) {
  .site-nav { position: fixed; inset: 0 0 0 auto; width: min(78vw,320px); flex-direction: column; justify-content: center; gap: 2rem;
    background: var(--ink-2); transform: translateX(100%); transition: transform .4s var(--ease); border-left: 1px solid var(--line-dark); }
  .site-nav.is-open { transform: none; }
  .nav-toggle { display: inline-flex; flex-direction: column; gap: 5px; background: none; border: 0; cursor: pointer; z-index: 102; }
  .nav-toggle span { width: 24px; height: 2px; background: var(--paper); }
}
```

- [ ] **Step 2: Add the progress bar element**

In `index.html`, immediately after `<body>`'s skip-link, add: `<div class="scroll-progress" aria-hidden="true"></div>`.

- [ ] **Step 3: Add JS for progress + active nav**

In `modules/startup-redesign.js`, add these functions and call them from the init block at the bottom (alongside `initHeader()` etc.):

```js
function initScrollProgress() {
  const bar = document.querySelector('.scroll-progress');
  if (!bar) return;
  let ticking = false;
  const update = () => {
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    bar.style.width = `${max > 0 ? (h.scrollTop / max) * 100 : 0}%`;
    ticking = false;
  };
  update();
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
}

function initActiveNav() {
  const links = [...document.querySelectorAll('[data-nav] a[href^="#"]')];
  const map = new Map();
  links.forEach(a => { const el = document.querySelector(a.getAttribute('href')); if (el) map.set(el, a); });
  if (!map.size || !('IntersectionObserver' in window)) return;
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) {
      links.forEach(l => l.classList.remove('is-active'));
      map.get(e.target)?.classList.add('is-active');
    }});
  }, { rootMargin: '-45% 0px -50% 0px' });
  map.forEach((_, el) => obs.observe(el));
}
```

- [ ] **Step 4: Verify**

Reload. Header is transparent at top, gains a blurred dark bar after scrolling 20px. A thin white progress line tracks scroll at the very top. The active section's nav link turns white. On a ≤760px viewport, the hamburger opens a slide-in panel. Console: no errors.

- [ ] **Step 5: Commit**

```bash
git add styles/startup-redesign.css index.html modules/startup-redesign.js
git commit -m "feat(nav): condensing header, scroll progress, active-section nav"
```

---

## Task 4: Hero layout + monochrome 2D fallback recolor

**Files:**
- Modify: `styles/startup-redesign.css` (hero block)
- Modify: `modules/startup-redesign.js` (`HeroField.draw` colors; `.hero-grid` parallax already targets a valid element)

- [ ] **Step 1: Hero CSS**

```css
.hero { position: relative; min-height: 100svh; display: flex; align-items: center; overflow: hidden; padding: 0 var(--gutter); }
.hero-stage, .hero-field, .hero-grid { position: absolute; inset: 0; width: 100%; height: 100%; }
.hero-stage { z-index: 0; }                 /* WebGL neural grid */
.hero-field { z-index: 0; }                 /* 2D canvas fallback */
.hero-grid { z-index: 0; background:
  linear-gradient(transparent 95%, var(--line-dark) 95%) 0 0 / 100% 64px,
  linear-gradient(90deg, transparent 95%, var(--line-dark) 95%) 0 0 / 64px 100%;
  mask-image: radial-gradient(120% 90% at 50% 30%, #000 35%, transparent 75%); opacity: .5; }
.hero-inner { position: relative; z-index: 2; max-width: var(--maxw); margin: 0 auto; width: 100%; }
.hero-title { font-size: var(--fs-display); max-width: 14ch; margin: 0 0 1.4rem; }
.hero-lede { max-width: 46ch; color: var(--gray-70); font-size: 1.15rem; margin: 0 0 2.2rem; }
.hero-actions { display: flex; gap: 1rem; flex-wrap: wrap; }
.hero-scroll { position: absolute; left: 50%; bottom: 2rem; transform: translateX(-50%); z-index: 2; }
.hero-scroll span { display: block; width: 1px; height: 46px; background: linear-gradient(var(--paper), transparent); animation: scrollcue 1.8s var(--ease) infinite; }
@keyframes scrollcue { 0%{transform:scaleY(0);transform-origin:top} 50%{transform:scaleY(1);transform-origin:top} 100%{transform:scaleY(1);transform-origin:bottom;opacity:0} }

.btn { font-family: var(--font-mono); font-size: .85rem; letter-spacing: .04em; padding: .85rem 1.5rem; border: 1px solid var(--paper); transition: background .25s var(--ease), color .25s var(--ease); }
.btn--solid { background: var(--paper); color: var(--ink); }
.btn--solid:hover { background: transparent; color: var(--paper); }
.btn--ghost { background: transparent; color: var(--paper); border-color: var(--line-dark); }
.btn--ghost:hover { border-color: var(--paper); }
.section--paper .btn { border-color: var(--ink); }
.section--paper .btn--solid { background: var(--ink); color: var(--paper); }
.section--paper .btn--solid:hover { background: transparent; color: var(--ink); }
@media (prefers-reduced-motion: reduce) { .hero-scroll span { animation: none; } }
```

- [ ] **Step 2: Recolor the 2D fallback to monochrome**

In `modules/startup-redesign.js`, in `HeroField.draw()`, replace the two colored strokes/fills:
- Line stroke `` `rgba(124, 156, 255, ${(1 - dist / max) * 0.22})` `` → `` `rgba(244,246,251,${(1 - dist / max) * 0.18})` ``
- Node fill `point.accent ? 'rgba(240, 201, 135, 0.85)' : 'rgba(124, 156, 255, 0.5)'` → `point.accent ? 'rgba(244,246,251,0.9)' : 'rgba(244,246,251,0.45)'`

- [ ] **Step 3: Verify**

Reload. Hero fills the viewport; headline at display scale, two buttons (solid hovers to inverse), a faint masked grid, an animated scroll cue. If WebGL is disabled (DevTools → Rendering → "Disable WebGL... " or just confirm the canvas), the 2D `#hero-field` shows a **white/gray** point-network (no blue/amber). Console: no errors.

- [ ] **Step 4: Commit**

```bash
git add styles/startup-redesign.css modules/startup-redesign.js
git commit -m "feat(hero): cinematic monochrome hero layout + grayscale 2D fallback"
```

---

## Task 5: Neural-grid WebGL scene

**Files:**
- Modify: `modules/transformer-scene.js` (replace the scene body; keep the WebGL/motion guards, the `import('three')` bootstrap, and `#transformer-stage` mounting)

- [ ] **Step 1: Replace the scene**

Keep lines 19–39 of the current file (the `reduced`/`stage`/`hasWebGL`/`clamp` helpers and the `import('three').then(start)` guard). Replace `async function start(THREE) {…}` with a neural-grid builder:

```js
async function start(THREE) {
  const isMobile = window.matchMedia('(max-width: 760px)').matches;
  const COLS = isMobile ? 7 : 11;
  const ROWS = isMobile ? 5 : 7;
  const DEPTH = isMobile ? 4 : 6;     // layers receding into z
  const GAP = 1.5;

  const renderer = new THREE.WebGLRenderer({ antialias: !isMobile, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2));
  renderer.setSize(stage.clientWidth, stage.clientHeight);
  stage.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, stage.clientWidth / stage.clientHeight, 0.1, 100);
  camera.position.set(0, 0, 13);

  // --- nodes (instanced) ---
  const nodes = [];
  for (let z = 0; z < DEPTH; z++)
    for (let y = 0; y < ROWS; y++)
      for (let x = 0; x < COLS; x++)
        nodes.push(new THREE.Vector3(
          (x - (COLS - 1) / 2) * GAP,
          (y - (ROWS - 1) / 2) * GAP,
          (z - (DEPTH - 1) / 2) * GAP
        ));
  const N = nodes.length;

  const dot = new THREE.SphereGeometry(0.045, 8, 8);
  const dotMat = new THREE.MeshBasicMaterial({ color: 0xf4f6fb });
  const mesh = new THREE.InstancedMesh(dot, dotMat, N);
  const m4 = new THREE.Matrix4();
  nodes.forEach((p, i) => { m4.makeTranslation(p.x, p.y, p.z); mesh.setMatrixAt(i, m4); });
  mesh.instanceMatrix.needsUpdate = true;
  scene.add(mesh);

  // --- connections (nearest neighbours along grid) ---
  const linePos = [];
  const idx = (x, y, z) => z * ROWS * COLS + y * COLS + x;
  for (let z = 0; z < DEPTH; z++) for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
    const a = nodes[idx(x, y, z)];
    if (x + 1 < COLS) { const b = nodes[idx(x + 1, y, z)]; linePos.push(a.x,a.y,a.z, b.x,b.y,b.z); }
    if (y + 1 < ROWS) { const b = nodes[idx(x, y + 1, z)]; linePos.push(a.x,a.y,a.z, b.x,b.y,b.z); }
    if (z + 1 < DEPTH) { const b = nodes[idx(x, y, z + 1)]; linePos.push(a.x,a.y,a.z, b.x,b.y,b.z); }
  }
  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePos, 3));
  const lineMat = new THREE.LineBasicMaterial({ color: 0xf4f6fb, transparent: true, opacity: 0.12 });
  scene.add(new THREE.LineSegments(lineGeo, lineMat));

  // --- firing signals: bright points that travel along z ---
  const SIG = isMobile ? 24 : 60;
  const sigGeo = new THREE.BufferGeometry();
  const sigArr = new Float32Array(SIG * 3);
  const sigSeed = Array.from({ length: SIG }, (_, i) => ({
    col: Math.floor((i * 7.3) % COLS), row: Math.floor((i * 3.1) % ROWS), phase: (i / SIG)
  }));
  sigGeo.setAttribute('position', new THREE.BufferAttribute(sigArr, 3));
  const sigMat = new THREE.PointsMaterial({ color: 0xffffff, size: isMobile ? 0.16 : 0.13, transparent: true, opacity: 0.95 });
  scene.add(new THREE.Points(sigGeo, sigMat));

  const span = (DEPTH - 1) * GAP;
  const target = { x: 0, y: 0 };
  const mouse = { x: 0, y: 0 };
  window.addEventListener('pointermove', e => {
    target.x = (e.clientX / window.innerWidth - 0.5);
    target.y = (e.clientY / window.innerHeight - 0.5);
  }, { passive: true });

  let scrollY = 0;
  window.addEventListener('scroll', () => { scrollY = window.scrollY; }, { passive: true });

  const onResize = () => {
    renderer.setSize(stage.clientWidth, stage.clientHeight);
    camera.aspect = stage.clientWidth / stage.clientHeight; camera.updateProjectionMatrix();
  };
  window.addEventListener('resize', onResize, { passive: true });

  let t = 0, raf = 0;
  const loop = () => {
    raf = requestAnimationFrame(loop);
    if (document.hidden) return;
    t += 0.006;
    mouse.x += (target.x - mouse.x) * 0.04;
    mouse.y += (target.y - mouse.y) * 0.04;

    scene.rotation.y = Math.sin(t) * 0.25 + mouse.x * 0.6;
    scene.rotation.x = Math.cos(t * 0.8) * 0.12 - mouse.y * 0.4;
    camera.position.z = 13 - Math.min(scrollY / 220, 4);   // drift in on scroll

    for (let i = 0; i < SIG; i++) {
      const s = sigSeed[i];
      const p = ((t * 0.6 + s.phase) % 1);
      sigArr[i*3]   = (s.col - (COLS - 1) / 2) * GAP;
      sigArr[i*3+1] = (s.row - (ROWS - 1) / 2) * GAP;
      sigArr[i*3+2] = -span/2 + p * span;
    }
    sigGeo.attributes.position.needsUpdate = true;
    renderer.render(scene, camera);
  };
  loop();
}
```

- [ ] **Step 2: Verify**

Reload `http://localhost:8000/`. Expected: a white-on-black 3D lattice fills the hero, slowly rotating; bright white signal points stream through it along depth; moving the mouse parallax-tilts the grid; scrolling drifts the camera inward. The 2D `#hero-field` should be hidden behind / superseded (z-index parity is fine — the WebGL canvas paints over it). Console: no errors, no Three.js warnings about missing import.

Test the fallback ladder:
- DevTools → toggle `prefers-reduced-motion: reduce` (Rendering tab) → reload → **no** 3D animation; static page; 2D field static. Pass.
- Confirm `hasWebGL()` guard: in console run `WebGLRenderingContext` exists → scene loads. (No need to truly disable; the guard path is exercised by the reduced-motion test which also no-ops the module.)

- [ ] **Step 3: Commit**

```bash
git add modules/transformer-scene.js
git commit -m "feat(hero): neural-grid WebGL scene with firing signals (monochrome)"
```

---

## Task 6: Manifesto + Research section styling & expand

**Files:**
- Modify: `styles/startup-redesign.css` (manifesto + research/publication blocks)
- Modify: `modules/startup-redesign.js` (`renderPublication` — show venue/year prominently; add click-to-expand abstract instead of opening the link directly)

- [ ] **Step 1: Manifesto + research CSS**

```css
.manifesto { padding: clamp(5rem,12vw,10rem) var(--gutter); border-top: 1px solid var(--line-dark); border-bottom: 1px solid var(--line-dark); }
.manifesto-line { font-family: var(--font-display); font-weight: 700; font-size: clamp(1.8rem,1rem+4vw,4rem); line-height: 1.1; max-width: 18ch; letter-spacing: -.02em; }
.manifesto-line em { font-style: normal; color: var(--gray-50); }

.section-head { margin-bottom: clamp(2rem,5vw,4rem); max-width: 30ch; }
.publication-list { display: grid; gap: 1px; background: var(--line-dark); border: 1px solid var(--line-dark); }
.publication-row { display: grid; grid-template-columns: 1fr auto; gap: 1.5rem; padding: clamp(1.5rem,3vw,2.5rem); background: var(--ink); cursor: pointer; transition: background .3s var(--ease); align-items: start; }
.publication-row:hover { background: var(--ink-2); }
.publication-row h3 { font-size: var(--fs-h3); margin-bottom: .6rem; }
.publication-row p { color: var(--gray-70); margin: 0; }
.publication-row.is-open p { color: var(--paper-2); }
.publication-meta { display: flex; flex-wrap: wrap; gap: .6rem 1rem; margin-top: 1rem; font-family: var(--font-mono); font-size: .74rem; color: var(--gray-50); text-transform: uppercase; letter-spacing: .08em; }
.topic-pill { border: 1px solid var(--line-dark); padding: .15rem .55rem; color: var(--gray-70); text-transform: none; letter-spacing: 0; }
.publication-arrow { font-family: var(--font-mono); color: var(--gray-50); transition: transform .3s var(--ease); }
.publication-row:hover .publication-arrow { transform: translateX(4px); color: var(--paper); }
.research-links { display: flex; flex-wrap: wrap; gap: 1rem 2rem; margin-top: 1.6rem; font-family: var(--font-mono); font-size: .8rem; }
.meta-link { color: var(--gray-70); border-bottom: 1px solid transparent; transition: color .25s var(--ease), border-color .25s var(--ease); }
.meta-link:hover { color: var(--paper); border-bottom-color: var(--paper); }
.meta-link--status { color: var(--gray-50); margin-left: auto; }
.skeleton-line { height: 1rem; margin: .6rem 0; background: linear-gradient(90deg, var(--gray-15), var(--gray-30), var(--gray-15)); background-size: 200% 100%; animation: shimmer 1.4s infinite; }
@keyframes shimmer { to { background-position: -200% 0; } }
@media (prefers-reduced-motion: reduce) { .skeleton-line { animation: none; } }
```

- [ ] **Step 2: Make publications expand the full abstract in place**

In `modules/startup-redesign.js`, change `renderPublication` so the row is a `<article>` (not an `<a>`), stores the full abstract, and shows a preview. Replace the function body's returned markup with:

```js
return `
  <article class="publication-row reveal" data-full="${escapeAttr(abstract)}" data-preview="${escapeAttr(abstractPreview + (isLongAbstract ? '…' : ''))}">
    <div>
      <h3>${escapeHtml(title)}</h3>
      <p>${escapeHtml(abstractPreview)}${isLongAbstract ? '&hellip;' : ''}</p>
      <div class="publication-meta">
        ${meta.map(item => `<span>${escapeHtml(String(item))}</span>`).join('')}
        <span>${escapeHtml(authors)}</span>
        ${tags.map(tag => `<span class="topic-pill">${escapeHtml(tag)}</span>`).join('')}
      </div>
      <a class="meta-link" href="${escapeAttr(url)}" target="_blank" rel="noopener noreferrer">Open on OpenReview</a>
    </div>
    <span class="publication-arrow" aria-hidden="true">+</span>
  </article>`;
```

Then add an expand handler (call from init, after `loadPublications()` resolves — simplest: event delegation bound once at init):

```js
function initPublicationExpand() {
  document.addEventListener('click', e => {
    const row = e.target.closest('.publication-row');
    if (!row || e.target.closest('a')) return;       // let the OpenReview link work
    const p = row.querySelector('p');
    const open = row.classList.toggle('is-open');
    p.textContent = open ? row.dataset.full : row.dataset.preview;
    row.querySelector('.publication-arrow').textContent = open ? '–' : '+';
  });
}
```

Mark the in-view class for injected rows: after `list.innerHTML = …` in `loadPublications`, add `list.querySelectorAll('.reveal').forEach(el => el.classList.add('in-view'));` (they inject after the observer runs, so reveal them directly).

- [ ] **Step 3: Verify**

Reload. Research section shows two publication rows (AlphaBench, EvoAlpha) with mono venue/year/author meta and topic pills. Clicking a row toggles the full abstract and the `+`/`–` marker; the "Open on OpenReview" link still opens in a new tab without toggling. Manifesto line renders at large display scale between hero and research. Console: no errors.

- [ ] **Step 4: Commit**

```bash
git add styles/startup-redesign.css modules/startup-redesign.js
git commit -m "feat(research): manifesto strip + expandable monochrome publication rows"
```

---

## Task 7: Build trail, profile, trajectory, contact, footer styling

**Files:**
- Modify: `styles/startup-redesign.css` (remaining component blocks)

- [ ] **Step 1: Styles**

```css
/* Build trail (GitHub) — on --paper section */
.github-status { display: grid; grid-template-columns: repeat(3,1fr); gap: 1px; background: var(--line-light); border: 1px solid var(--line-light); margin-bottom: 2rem; }
.github-status > div { background: var(--paper); padding: 1.2rem; }
.status-label { display: block; font-family: var(--font-mono); font-size: .72rem; text-transform: uppercase; letter-spacing: .12em; color: #5a6170; margin-bottom: .3rem; }
.github-status strong { font-size: 1.1rem; }
.project-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px,1fr)); gap: 1px; background: var(--line-light); border: 1px solid var(--line-light); }
.project-row { display: flex; flex-direction: column; justify-content: space-between; gap: 1rem; padding: 1.6rem; background: var(--paper); color: var(--ink); transition: background .25s var(--ease); }
.project-row:hover { background: var(--paper-2); }
.project-row h3 { font-size: var(--fs-h3); }
.project-row p { color: #4a505c; font-size: .95rem; margin: .5rem 0 0; }
.project-meta { display: flex; flex-wrap: wrap; gap: .5rem .9rem; font-family: var(--font-mono); font-size: .72rem; color: #5a6170; }
.section--paper .topic-pill { border-color: var(--line-light); color: #4a505c; }
.project-arrow { font-family: var(--font-mono); align-self: flex-end; }
.empty-state, .error-state { padding: 2rem; font-family: var(--font-mono); font-size: .85rem; color: var(--gray-50); grid-column: 1 / -1; }
.section--paper .empty-state, .section--paper .error-state { color: #5a6170; }

/* Profile */
.profile-grid { display: grid; grid-template-columns: 1.1fr .9fr; gap: clamp(2rem,6vw,5rem); align-items: start; }
.facts { margin: 0; display: grid; gap: 0; }
.facts > div { display: grid; grid-template-columns: 10rem 1fr; gap: 1rem; padding: 1rem 0; border-top: 1px solid var(--line-dark); }
.facts dt { font-family: var(--font-mono); font-size: .78rem; text-transform: uppercase; letter-spacing: .1em; color: var(--gray-50); }
.facts dd { margin: 0; }
.facts a { border-bottom: 1px solid var(--line-dark); }
.facts a:hover { border-bottom-color: var(--paper); }

/* Trajectory (timeline) on --paper */
.timeline { list-style: none; margin: 0; padding: 0; display: grid; gap: 0; }
.timeline-item { display: grid; grid-template-columns: 6rem 1fr; gap: 1.5rem; padding: 1.8rem 0; border-top: 1px solid var(--line-light); }
.timeline-year { font-family: var(--font-mono); font-size: 1.1rem; color: #5a6170; }
.timeline-item h3 { font-size: var(--fs-h3); }
.timeline-item p { margin: .4rem 0 0; color: #4a505c; }

/* Contact */
.contact { text-align: center; }
.contact h2 { font-size: var(--fs-h2); max-width: 22ch; margin: 0 auto 2rem; }
.contact-actions { display: flex; flex-wrap: wrap; gap: 1rem; justify-content: center; }

/* Footer */
.site-footer { display: flex; flex-wrap: wrap; gap: 1rem 2rem; justify-content: space-between; padding: 2rem var(--gutter); border-top: 1px solid var(--line-dark); font-family: var(--font-mono); font-size: .78rem; color: var(--gray-50); }

@media (max-width: 760px) {
  .profile-grid { grid-template-columns: 1fr; }
  .github-status { grid-template-columns: 1fr; }
  .facts > div { grid-template-columns: 7rem 1fr; }
}
```

- [ ] **Step 2: Verify**

Reload. Build section (white background) shows a status strip + a responsive grid of real repo cards with mono meta. Profile shows a two-column bio/facts table (collapses to one column on mobile). Trajectory shows a clean timeline on white. Contact is centered with button row. Footer is a mono strip. Console: no errors. Resize to 360px — nothing overflows horizontally.

- [ ] **Step 3: Commit**

```bash
git add styles/startup-redesign.css
git commit -m "feat(sections): monochrome styling for build, profile, trajectory, contact"
```

---

## Task 8: cosmic.css disposition + cursor/tilt monochrome

**Files:**
- Modify: `styles/cosmic.css` (repurpose as the cursor + tilt + atmosphere layer; strip cosmic/colored rules)

- [ ] **Step 1: Reduce cosmic.css to the interaction layer**

Replace the file contents with only the custom-cursor, tilt perspective, and any atmosphere needed — all monochrome. Remove every starfield/colored-glow rule.

```css
/* cosmic.css — interaction + atmosphere layer (monochrome) */
.cursor-dot, .cursor-ring { position: fixed; top: 0; left: 0; pointer-events: none; z-index: 300; border-radius: 50%; transform: translate3d(-100px,-100px,0); }
.cursor-dot { width: 6px; height: 6px; margin: -3px 0 0 -3px; background: var(--paper); mix-blend-mode: difference; }
.cursor-ring { width: 34px; height: 34px; margin: -17px 0 0 -17px; border: 1px solid var(--line-dark); transition: width .25s var(--ease), height .25s var(--ease), border-color .25s var(--ease); }
.cursor-ring.cursor-hover { width: 54px; height: 54px; margin: -27px 0 0 -27px; border-color: var(--paper); }
body.has-custom-cursor { cursor: none; }
@media (hover: none), (pointer: coarse) { .cursor-dot, .cursor-ring { display: none; } body.has-custom-cursor { cursor: auto; } }

/* Card tilt (JS sets --rx/--ry; only on body.allow-tilt) */
body.allow-tilt .project-row, body.allow-tilt .publication-row,
body.allow-tilt .timeline-item { transform: perspective(900px) rotateX(var(--rx,0)) rotateY(var(--ry,0)); transition: transform .2s var(--ease); transform-style: preserve-3d; }
@media (prefers-reduced-motion: reduce) { body.allow-tilt * { transform: none !important; } }
```

- [ ] **Step 2: Verify**

Reload on a desktop (fine pointer). A small white dot + trailing ring replace the cursor and the ring swells over links/cards. Cards tilt slightly toward the pointer. No colored glow anywhere. On a touch/coarse viewport the native cursor returns. Console: no errors.

- [ ] **Step 3: Commit**

```bash
git add styles/cosmic.css
git commit -m "refactor(cosmic): monochrome cursor + tilt layer, drop cosmic/colored rules"
```

---

## Task 9: Responsive, reduced-motion, accessibility & final verification

**Files:**
- Modify: `styles/startup-redesign.css` (only if gaps found)
- Modify: `index.html` (only if gaps found)

- [ ] **Step 1: Cross-cutting checks (fix inline if any fail)**

Run through `http://localhost:8000/` and confirm each:
1. **Mobile 360–414px:** no horizontal scroll; hero title legible; nav hamburger works; all grids collapse to one column.
2. **Tablet 768px & desktop 1280px+:** layout holds, max-width container centered.
3. **Reduced motion** (DevTools Rendering → emulate `prefers-reduced-motion: reduce`): no WebGL animation, no scroll-cue/shimmer/reveal motion; everything visible and static.
4. **Keyboard:** Tab through — skip-link appears first and works; every link/button has a visible white focus ring; publication rows are reachable/toggleable (add `tabindex="0"` + Enter handling to `.publication-row` in the expand handler if you want full parity — optional).
5. **Contrast:** body text on both ink and paper sections is legible (it is — pure black/white).
6. **Console:** no errors or 404s on any asset (check the Network tab for the bumped `?v=` files).

- [ ] **Step 2: Confirm data still live**

Hard-reload with cache disabled. Research rows come from inline `#publications-data`; Build rows come from `https://api.github.com/users/B143KC47/repos`. If GitHub rate-limits, the `.error-state` fallback link must render (simulate by setting an invalid user temporarily, then revert). Publication sync + github sync labels update.

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "polish: responsive, reduced-motion, and a11y pass for monochrome redesign"
```

---

## Self-review notes (author)

- **Spec coverage:** palette (T1), structure/order (T2), header/progress/active-nav (T3), immersive hero + fallback ladder (T4 fallback recolor + T5 WebGL + reduced-motion no-op), neural-grid scene (T5), manifesto + research-first (T6), all sections restyled (T7), monochrome cursor/tilt + cosmic.css fate (T8), responsive/reduced-motion/a11y/data-preserved (T9). All spec sections map to a task.
- **DOM contract:** every ID/class read by `startup-redesign.js` is preserved by the T2 markup (verified against the functions in that file).
- **No new runtime files:** only the five live files change; docs are the only additions.
- **Known optional item:** full keyboard parity for the new click-to-expand publication rows is called out in T9 step 1.4 (add `tabindex`/Enter) — recommended but not blocking.
```
