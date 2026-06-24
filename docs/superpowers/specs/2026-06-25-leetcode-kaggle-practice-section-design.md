# Practice Trail — LeetCode + Kaggle section

**Date:** 2026-06-25
**Status:** Design (awaiting review)

## Goal

Add the user's LeetCode (`B143KC47`) and Kaggle (`b14ckc4tmr`) profiles to the
site as a new section, presented in a way that fits the strict-monochrome
"Signal" design and — critically — flatters early-stage activity instead of
exposing it.

## The core design decision: framing, not metrics

Both profiles are genuinely **early-stage**:

- **LeetCode** — 9 solved (7 Easy, 2 Medium, 0 Hard), 23 submissions, global
  rank ~5,000,001 (a sentinel = effectively unranked), reputation 0. Activity
  was a short burst in Nov 2025.
- **Kaggle** — *Contributor* tier (entry-level, 2nd of 5) across Competitions /
  Datasets / Notebooks, 13 mostly "getting-started" badges, 1 active
  competition, member since Jul 2024, no medals.

The site's ethos is "visible evidence." A leaderboard / trophy-case framing
would invite a magnitude read (rank 5M, rep 0, entry tier) that works *against*
the user's strong researcher brand. So we **reframe** these as *"where I'm
actively practicing and competing, in the open"* — breadth + current momentum
across platforms. That framing is fully honest and reads well for early-career.

### Honesty rule (what we show vs. omit)

Show counts of things *done*; omit floor-level standings.

- **LeetCode** → show `9 solved`, the Easy/Medium/Hard breakdown, total
  submissions, recency. **Omit** the 5,000,001 global rank and reputation 0
  (absence of standing, not an achievement).
- **Kaggle** → show `Contributor` tier, category list, badge count, "1
  competition", "member since 2024", recency. **Omit** the `rank_out_of`
  figures (those are the category population/denominator, not the user's rank —
  showing them as a rank would be misleading).

## Placement (user-chosen)

A **new section** `#practice`, inserted **after Build/GitHub and before
Profile**, as a sibling "practice & compete" evidence layer. Add a `Practice`
link to the primary nav between `GitHub` and `Profile`.

Section order becomes: Hero → Manifesto → Research → Build → **Practice** →
Profile → Trajectory → Contact.

## Freshness (user-chosen)

**Static, accurate-now.** Real values (pulled today from the Kaggle MCP +
LeetCode public endpoints) are baked into an inline
`<script id="profiles-data" type="application/json">` block — the same idiom as
the existing `#publications-data` fallback. No live third-party fetch (LeetCode
proxies are flaky; Kaggle has no CORS-friendly endpoint). Refresh = edit the
JSON (or ask Claude to re-pull). A GitHub Action auto-refresh is a documented
*future option*, not built now.

## Visual treatment (strict monochrome)

Two stat cards in a 2-up grid, reusing the existing card language (`--ink-2`
surface, hairline borders, hover → `--ink-3`, 3D tilt + custom cursor). Big
`IBM Plex Mono` readouts echo the site's instrument/AI vibe. Two distinctive
monochrome devices make sparse data look *intentional*:

```
┌──────────────────────────────┐   ┌──────────────────────────────┐
│ LeetCode          @B143KC47 →│   │ Kaggle          @b14ckc4tmr →│
│                              │   │                              │
│  09                          │   │  Contributor                 │
│  problems solved             │   │  competitions·datasets·nb    │
│                              │   │                              │
│  ▓▓▓▓▓▓▒▒░  (difficulty bar) │   │  ○──●──○──○──○  (tier ladder)│
│  7 Easy · 2 Medium · 0 Hard  │   │  Nov Con Exp Mas GM          │
│                              │   │                              │
│  23 submissions · Nov 2025   │   │  13 badges · 1 competition   │
│                              │   │  member since 2024           │
└──────────────────────────────┘   └──────────────────────────────┘
```

- **Difficulty bar** (LeetCode): one horizontal bar split into Easy/Medium/Hard
  segments sized by proportion, encoded by **grayscale value** (Easy lightest →
  Hard brightest/white), on a faint `--gray-15` track. No green/yellow/red.
- **Tier ladder** (Kaggle): the 5 Kaggle tiers (Novice · Contributor · Expert ·
  Master · Grandmaster) as a connected row of nodes, current tier filled/bright,
  the rest muted. Honest "where I am" without a misleading number.

Constraints honored: no colored Kaggle badge SVGs, no LeetCode difficulty
colors — monochrome only; reduced-motion respected (reveal + tilt already gated
by the existing JS).

## Components / files touched

1. **`index.html`**
   - New `<section id="practice">` (after Build, before Profile) with a
     `.section-head` and an empty `#practice-list` (skeleton lines as
     placeholder, mirroring `#publication-list`).
   - New nav link `Practice` between `GitHub` and `Profile`.
   - New inline `<script id="profiles-data" type="application/json">` holding the
     LeetCode + Kaggle data.
   - Bump CSS/JS cache-busters (`startup-redesign.css?v=16`,
     `modules/startup-redesign.js?v=7`).

2. **`modules/startup-redesign.js`**
   - `loadProfiles()` — reads `#profiles-data`, renders the two cards into
     `#practice-list`, computes difficulty-bar segment widths and the tier-ladder
     current index, then force-adds `.in-view` to the new `.reveal` cards (same
     trick `loadPublications()` uses for post-load reveals).
   - Add `.practice-card` to `TILT_TARGETS` and `FANCY_TARGETS` so the cards get
     tilt + cursor-swell for free.
   - Call `loadProfiles()` from the `DOMContentLoaded` handler.

3. **`styles/startup-redesign.css`** (append a `── Practice trail ──` block)
   - `.practice-list` (2-up grid, 1-col under 760px), `.practice-card` and its
     head/brand/handle, `.practice-stat` (big mono number + label), `.diffbar`
     + segments, `.tierladder` + nodes, `.practice-foot`.

### Data shape (`#profiles-data`)

```json
{
  "leetcode": {
    "handle": "B143KC47",
    "url": "https://leetcode.com/u/B143KC47/",
    "solved": 9,
    "byDifficulty": { "easy": 7, "medium": 2, "hard": 0 },
    "submissions": 23,
    "activePeriod": "Nov 2025"
  },
  "kaggle": {
    "handle": "b14ckc4tmr",
    "url": "https://www.kaggle.com/b14ckc4tmr",
    "tier": "Contributor",
    "categories": ["Competitions", "Datasets", "Notebooks"],
    "badges": 13,
    "competitions": 1,
    "memberSince": 2024
  },
  "lastUpdated": "2026-06-25"
}
```

Tier ladder order is a constant in JS:
`["Novice", "Contributor", "Expert", "Master", "Grandmaster"]`.

## Accessibility

- Difficulty bar: `role="img"` + `aria-label="7 Easy, 2 Medium, 0 Hard"`.
- Tier ladder: `aria-label="Kaggle tier: Contributor (2 of 5)"`; current node
  marked with `aria-current`.
- Handles open in a new tab with `rel="noopener noreferrer"`.
- Section labelled by its `<h2 id="practice-title">`.

## Out of scope (YAGNI)

- No GitHub Action auto-refresh (documented future option only).
- No live client-side fetch.
- No separate `data/profiles.json` (single inline source of truth for now;
  add it only if/when the Action is built).
- No rank/percentile/reputation surfaces.

## Verification

- Open `index.html` over `file://` (must render from the inline JSON — no
  network) and confirm both cards, bar, and ladder display correctly.
- Check 1366×768 / mobile (≤760px → 1-col), reduced-motion (no tilt/animation),
  and keyboard focus on the handle links.
