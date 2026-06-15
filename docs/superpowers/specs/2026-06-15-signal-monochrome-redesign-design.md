# "Signal" — Cinematic Monochrome Redesign

**Date:** 2026-06-15
**Site:** B143KC47.github.io (KO Ho Tin — AI researcher portfolio)
**Status:** Design — awaiting user review before implementation

---

## 1. Goal

Replace the in-progress cosmic / transformer-stack redesign with a **genuinely new direction**: bolder and more cinematic, built around an **immersive full-bleed WebGL hero** (a neural-network lattice), rendered in a **strict monochrome palette** (black, white, a small amount of gray — no hue, no colored glow).

Reference mood: [moonshot.ai](https://www.moonshot.ai/) — confidence through restraint, large type, deep negative space — taken fully monochrome. Drama comes from **contrast, weight, and scale**, never color.

The whole site is restyled into this system, and the section order is rethought to **lead with research impact**.

### Non-goals
- No framework migration. This stays a **zero-build static GitHub Pages site** (vanilla HTML/CSS/ES, Three.js via CDN import map). Next.js / shadcn / server actions do not apply.
- No new dependencies beyond the Three.js already loaded.
- No new files unless absolutely necessary — existing files are edited in place.
- No change to the live data sources (GitHub API, OpenReview/embedded publications JSON).

---

## 2. Current state (what is actually live)

Only these files are loaded by `index.html`; everything else in the repo (`script.js`, `styles/main.css`, `styles/mobile.css`, the `styles/{base,components,layout,pages,animations,utils}` subdirs, and unreferenced `modules/*.js`) is **dead legacy** and will be left untouched.

| File | Role |
|------|------|
| `index.html` | Markup / structure |
| `styles/startup-redesign.css` (v6) | Active design system |
| `styles/cosmic.css` (v3) | Cosmic theme/hero layer |
| `modules/startup-redesign.js` (v5) | Self-contained IIFE: header, scroll-reveal (IntersectionObserver), live GitHub fetch + cache, OpenReview/publications render, custom cursor, parallax/tilt (fine-pointer + motion-OK only) |
| `modules/transformer-scene.js` (v1) | ES module: 3D transformer-stack hero over starfield (Three.js) |

Sections today: Hero → Profile → Projects (GitHub) → Research → Timeline → Contact.

---

## 3. Design decisions (locked with user)

| Decision | Choice |
|----------|--------|
| Direction | Bolder / cinematic spectacle |
| Centerpiece | Immersive full-bleed WebGL hero |
| Scene | Neural-network lattice (nodes + firing signals, receding depth) |
| Palette | Strict monochrome: black, white, small amount of gray — no hue |
| Scope | Whole site restyled **and** structure rethought |

---

## 4. Visual system

### Palette (the only colors)
- `--ink: #05060a` — base background (black)
- `--paper: #f4f6fb` — primary text / lattice (white)
- Gray ramp for hierarchy, borders, dimmed/secondary text, e.g.
  `--gray-90 … --gray-10` derived between ink and paper.
- **Emphasis = contrast, not color.** "Active/live" = full white; "inactive/secondary" = gray. Data "syncing" pulse animates gray→white. Bloom in the hero is **neutral luminance only** (brightness, no tint).

### Type (already loaded — kept)
- **Syne** (600–800) — display headlines, dramatic scale, tight leading
- **Manrope** (400–600) — body copy
- **IBM Plex Mono** (400–600) — eyebrows, labels, data, venue/year ("lab instrument" voice)
- Large modular type scale; full-bleed headlines that approach the viewport width on hero and section openers.

### Layout language
- Full-bleed sections that **alternate ink ↔ paper** to make monochrome contrast the spectacle.
- Generous negative space; strong asymmetric grid; mono labels as section markers.

### Motion
- Scroll-driven section reveals (reuse existing IntersectionObserver `.reveal`).
- Hero parallax on mouse + scroll.
- One kinetic manifesto line.
- Thin scroll-progress indicator; sticky header that condenses on scroll.
- Hover micro-interactions (underline grows, gray→white).
- **`prefers-reduced-motion` fully honored** — all of the above degrade to static.

---

## 5. Structure (rethought)

1. **Hero** — full-bleed neural lattice scene. Overlay: mono eyebrow, one huge thesis headline, one-line lede, two CTAs (primary → research, secondary → GitHub), scroll cue.
2. **Manifesto strip** — single bold scroll-driven statement; tonal bridge into content.
3. **Selected research** *(moved up — strongest signal)* — featured cards for **AlphaBench (ICLR 2026)** and **EvoAlpha (GenAI in Finance)** from the embedded publications JSON; venue/year in mono; abstract on expand. Google Scholar / OpenReview / ORCID links live here.
4. **Build trail** — live GitHub repos in a stark mono grid (language, stars, last push). Keeps live fetch + cache + graceful fallback to profile link.
5. **Profile** — compact bio + facts (name, alias `BlackCat`/`B143KC47`, email, ORCID iD, core topics).
6. **Trajectory** — vertical timeline (ICLR 2026, GenAI in Finance 2025, CityU 2024, IEEE CIS 2024).
7. **Contact** — full-bleed closing CTA, large type, all links (email, GitHub, LinkedIn, ORCID, Zhihu).
8. **Footer** — name, role, year.

All current content is preserved; only the framing/order changes.

---

## 6. The hero scene — `modules/transformer-scene.js` rewritten

Repurpose the existing ES module (same file, new content) into the **neural-grid** scene.

- **Concept:** a vast 3D lattice of instanced node points connected by lines, receding into depth. Signals (bright pulses) propagate along connections through the grid. Slow continuous camera drift; reacts to mouse position and scroll offset.
- **Rendering:** instanced points + line segments; monochrome (white/gray on black). Optional neutral bloom on capable desktops only (DPR ≤ 2, width > 1024, non-mobile).
- **Reuse** existing helpers from the current module where sound: WebGL capability check, reduced-motion guard, DPR cap, mobile detection, tab-visibility pause.

### Fallback ladder (must never look broken)
1. WebGL available **and** motion allowed → full neural-grid scene.
2. No WebGL (or low capability) → 2D `#hero-field` canvas neural field (the existing canvas element stays in markup as the fallback surface).
3. `prefers-reduced-motion` → no animation; static high-contrast gradient/lattice still image.

### Performance
- Lazy-init after first paint; cap `devicePixelRatio`; pause `requestAnimationFrame` when `document.hidden`; particle/line counts scaled down on mobile.

---

## 7. Behavior — `modules/startup-redesign.js`

Keep the working logic; **extend, don't rewrite**:
- Header scroll/condense, nav toggle, scroll-reveal, live GitHub fetch + cache, OpenReview/publications render, custom cursor, parallax/tilt — all retained.
- Add: scroll-progress line, manifesto animation hook, any new section reveal wiring, research-card expand/collapse.
- Active-nav state reflects current section (white vs gray).

---

## 8. CSS — `styles/startup-redesign.css` + `styles/cosmic.css`

- `startup-redesign.css` → rebuilt as the monochrome design system (tokens, type scale, layout, components, motion, responsive, reduced-motion).
- `cosmic.css` → repurposed as the **hero/scene atmosphere layer** for the monochrome look (or emptied to a thin compatibility shim if everything folds cleanly into the system file). Decision finalized during implementation; no third CSS file is added.
- Mobile-first responsive; the ink↔paper alternation and type scale must hold from 360px to wide desktop.

---

## 9. Accessibility & SEO (preserve)

- Semantic landmarks/headings, skip-link, `aria-label`s, `aria-live` on data regions — all kept.
- Hero scene `aria-hidden`; all meaning lives in text.
- Color contrast trivially passes (pure black/white).
- Existing meta/OG/sitemap/structured signals retained; `theme-color` stays dark.
- Keyboard navigable; focus-visible states in the mono system.

---

## 10. Risks / open points

- **Monochrome can read flat** if contrast isn't managed — mitigated by ink↔paper section flipping, scale, and the single moving hero.
- **WebGL on low-end/mobile** — mitigated by the fallback ladder + DPR/count scaling.
- `cosmic.css` final disposition (repurpose vs shim) decided in implementation; not a structural risk.

---

## 11. Acceptance criteria

- [ ] Strict black/white/gray throughout; no hue anywhere.
- [ ] Full-bleed neural-grid WebGL hero with the 3-step fallback ladder working.
- [ ] All 7 sections present, research ordered before GitHub, content preserved.
- [ ] Live GitHub + publications data still load and render.
- [ ] `prefers-reduced-motion`, keyboard nav, and mobile (360px+) all hold.
- [ ] Zero-build; only `index.html`, `styles/startup-redesign.css`, `styles/cosmic.css`, `modules/startup-redesign.js`, `modules/transformer-scene.js` changed; no new runtime files.
