#!/usr/bin/env node
// Fetch publications from OpenReview and refresh index.html + data/publications.json.
//
// NON-DESTRUCTIVE BY DESIGN: this script only overwrites the publication data when it
// successfully retrieves at least one publication. On any error, on the anonymous
// bot-challenge (HTTP 403), or on an empty result, it leaves the existing curated data
// untouched and exits 0. This is what stops the site from being wiped daily.
//
// OPTIONAL AUTH: OpenReview now blocks anonymous note queries with a challenge (403).
// Set the GitHub Secrets OPENREVIEW_USERNAME and OPENREVIEW_PASSWORD to log in and query
// with a Bearer token, which the API trusts and does not challenge. Without credentials
// the script attempts an anonymous fetch, safely no-ops on the 403, and preserves the
// curated data already in the repo.
//
// MANUAL ENTRIES: publications OpenReview does not host (e.g. an ACL Anthology paper)
// are pinned directly in data/publications.json with "source": "manual"; every sync
// re-merges them ahead of the fetched list instead of dropping them.

import fs from 'node:fs';

const PROFILE_ID = '~Ho_Tin_Ko2';
const API = 'https://api2.openreview.net';
const ORCID_ID = '0009-0002-7298-8196';
const ORCID_API = `https://pub.orcid.org/v3.0/${ORCID_ID}`;
const INDEX_HTML = 'index.html';
const DATA_JSON = 'data/publications.json';
const PUB_PATTERN = /(<script id="publications-data" type="application\/json">)([\s\S]*?)(<\/script>)/;

// Title fingerprint for cross-source dedupe (OpenReview vs ORCID vs manual pins).
const normTitle = (t) => String(t || '').toLowerCase().replace(/[^a-z0-9]+/g, '');

// ── ORCID public API (no auth) ────────────────────────────────────────
// Google Scholar has no public API and captcha-walls bots, so ORCID is the
// automated cross-check source: anything listed on the ORCID record that the
// OpenReview fetch + manual pins don't cover is appended automatically.
async function fetchOrcidWorks() {
  const res = await fetch(`${ORCID_API}/works`, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`ORCID works HTTP ${res.status}`);
  const json = await res.json();
  const out = [];
  for (const g of json.group || []) {
    const s = (g['work-summary'] || [])[0] || {};
    const title = (((s.title || {}).title) || {}).value;
    if (!title) continue;
    const extUrl = ((s['external-ids'] || {})['external-id'] || [])
      .map((e) => e['external-id-value'])
      .find((v) => /^https?:/.test(String(v)));
    out.push({
      putCode: s['put-code'],
      title,
      venue: (s['journal-title'] || {}).value || '',
      year: Number((((s['publication-date'] || {}).year) || {}).value) || null,
      url: (s.url || {}).value || extUrl || '',
    });
  }
  return out;
}

const orcidToPublication = (w) => ({
  id: `orcid-${w.putCode}`,
  title: w.title,
  authors: [], // work summaries carry no contributor list; the renderer defaults to the owner
  venue: w.venue || 'ORCID record',
  year: w.year || new Date().getFullYear(),
  status: 'Published',
  abstract: '',
  openreviewUrl: w.url || `https://orcid.org/${ORCID_ID}`,
  tags: [],
  type: 'Publication',
  source: 'orcid',
});

// Append ORCID works not already covered (matched by normalized title). Returns count added.
function mergeOrcid(merged, orcidWorks) {
  const titles = new Set(merged.map((p) => normTitle(p.title)));
  let added = 0;
  for (const w of orcidWorks) {
    if (titles.has(normTitle(w.title))) continue;
    merged.push(orcidToPublication(w));
    titles.add(normTitle(w.title));
    added++;
  }
  return added;
}

function readExisting() {
  try { return JSON.parse(fs.readFileSync(DATA_JSON, 'utf-8')).publications || []; } catch { return []; }
}

// OpenReview API v2 wraps content fields as { value: ... }; v1 stores them plainly.
const val = (field) => (field && typeof field === 'object' && 'value' in field) ? field.value : field;

async function login(id, password) {
  const res = await fetch(`${API}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, password }),
  });
  if (!res.ok) throw new Error(`login failed: HTTP ${res.status}`);
  const json = await res.json();
  if (!json.token) throw new Error('login returned no token');
  return json.token;
}

async function fetchNotes(token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const url = `${API}/notes?content.authorids=${encodeURIComponent(PROFILE_ID)}&limit=50`;
  const res = await fetch(url, { headers });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`notes query HTTP ${res.status}: ${[json.name, json.message].filter(Boolean).join(' ')}`.trim());
  }
  return Array.isArray(json.notes) ? json.notes : [];
}

function buildPublication(note) {
  const c = note.content || {};

  let authors = val(c.authors);
  if (!authors && note.signatures) authors = note.signatures.slice(0, 5);
  if (!authors) authors = ['Ko Ho Tin'];
  if (!Array.isArray(authors)) authors = [authors];

  let year = val(c.year);
  if (!year && note.cdate) year = new Date(note.cdate).getFullYear();
  if (!year) year = new Date().getFullYear();

  let tags = val(c.keywords);
  if (tags && !Array.isArray(tags)) tags = [tags];
  if (!tags || !tags.length) tags = ['Research', 'AI'];

  const venue = val(c.venue) || 'OpenReview';
  const decision = String(val(c.decision) || '').toLowerCase();
  let status = 'Research';
  if (decision.includes('accept')) status = 'Accepted';
  else if (decision.includes('reject')) status = 'Under Review';
  else if (val(c.venue)) status = 'Published';

  return {
    id: note.id,
    title: val(c.title) || 'Untitled',
    authors,
    venue,
    year,
    status,
    abstract: val(c.abstract) || 'No abstract available.',
    openreviewUrl: `https://openreview.net/forum?id=${note.id}`,
    tags,
    type: 'Publication',
    fetchedAt: new Date().toISOString(),
  };
}

function writeData(result) {
  const json = JSON.stringify(result, null, 2);
  const html = fs.readFileSync(INDEX_HTML, 'utf-8');
  if (!PUB_PATTERN.test(html)) throw new Error('publications-data <script> block not found in index.html');
  fs.writeFileSync(INDEX_HTML, html.replace(PUB_PATTERN, `$1\n${json}\n$3`), 'utf-8');
  fs.writeFileSync(DATA_JSON, json, 'utf-8');
}

async function main() {
  // Trim: secrets piped in via Windows PowerShell can carry a trailing \r\n,
  // which OpenReview rejects as an invalid password.
  const user = (process.env.OPENREVIEW_USERNAME || '').trim();
  const pass = (process.env.OPENREVIEW_PASSWORD || '').trim();
  let token = null;

  if (user && pass) {
    token = await login(user, pass);
    console.log('🔐 Authenticated with OpenReview.');
  } else {
    console.log('ℹ️  No OpenReview credentials set; attempting anonymous fetch.');
  }

  const orcidWorks = await fetchOrcidWorks()
    .catch((err) => { console.log(`⚠️  ORCID fetch failed (${err.message}) — skipped.`); return []; });
  console.log(`ORCID record lists ${orcidWorks.length} work(s).`);

  // A 403 challenge (or any OpenReview error) must not abort the run: fall back to
  // merging ORCID works into the existing file, append-only.
  let all = [];
  try {
    all = await fetchNotes(token);
    console.log(`Fetched ${all.length} note(s) from OpenReview.`);
  } catch (err) {
    console.log(`⚠️  OpenReview fetch failed (${err.message}) — ORCID-only merge path.`);
  }

  // An authenticated query also returns the author's own under-review notes.
  // Publishing those would (a) mislabel unaccepted work and (b) break double-blind
  // anonymity by naming the authors on a public site. Keep only notes that are
  // publicly readable AND past the submission stage — on acceptance OpenReview
  // rewrites the venue (e.g. "ICLR 2026 Poster") and the paper appears here
  // automatically on the next daily run. The pre-acceptance patterns below cover
  // the venue strings OpenReview actually emits ("…Submission", "Submitted to …",
  // "Under Review", "Withdrawn", "Rejected") plus the machine venueid, so a note
  // with a custom venue string still cannot slip through while under review.
  const PRE_ACCEPTANCE = /submi(?:ssion|tted)|under[\s_]*review|in[\s_]*review|withdrawn|desk[\s_]*reject|rejected/i;
  const notes = all.filter((note) => {
    const isPublic = Array.isArray(note.readers) && note.readers.includes('everyone');
    const c = note.content || {};
    const venue = String(val(c.venue) || '');
    const venueid = String(val(c.venueid) || '');
    const underReview = PRE_ACCEPTANCE.test(venue) || PRE_ACCEPTANCE.test(venueid);
    if (!isPublic || underReview) {
      // Log only the note id: workflow logs are public, and printing the title of a
      // non-public note would leak exactly what this filter exists to protect.
      console.log(`⏭️  Skipping note ${note.id} (${!isPublic ? 'not public' : 'under review'}).`);
      return false;
    }
    return true;
  });

  if (notes.length === 0) {
    // Fallback path: keep every existing entry, add only ORCID works that are new.
    const merged = readExisting();
    const added = mergeOrcid(merged, orcidWorks);
    if (!added) {
      console.log('⚠️  0 publications from OpenReview and ORCID has nothing new — no write.');
      return;
    }
    writeData({
      publications: merged,
      lastUpdated: new Date().toISOString(),
      totalCount: merged.length,
      source: 'ORCID public API (OpenReview unavailable)',
    });
    console.log(`✅ ORCID added ${added} publication(s); existing data preserved.`);
    return;
  }

  const publications = notes.map(buildPublication);

  // Curated entries (e.g. the ACL demo paper, which OpenReview does not host) are
  // pinned with "source": "manual" in data/publications.json and never dropped by a
  // sync. They render first so hand-picked highlights stay on top. A fetched note whose
  // title duplicates a manual pin (same paper on two platforms) is dropped for the pin.
  const existing = readExisting();
  const fetchedIds = new Set(publications.map((p) => p.id));
  const manual = existing.filter((p) => p && p.source === 'manual' && !fetchedIds.has(p.id));
  const manualTitles = new Set(manual.map((p) => normTitle(p.title)));
  const fetched = publications.filter((p) => !manualTitles.has(normTitle(p.title)));
  if (fetched.length !== publications.length) console.log('📌 A fetched note duplicates a manual pin — pin kept.');
  const merged = [...manual, ...fetched];
  if (manual.length) console.log(`📌 Preserved ${manual.length} manual publication(s).`);

  const orcidAdded = mergeOrcid(merged, orcidWorks);
  if (orcidAdded) console.log(`🔎 ORCID added ${orcidAdded} publication(s) not on OpenReview.`);

  writeData({
    publications: merged,
    lastUpdated: new Date().toISOString(),
    totalCount: merged.length,
    source: token ? 'OpenReview API v2 (authenticated) + ORCID' : 'OpenReview API v2 (anonymous) + ORCID',
  });
  console.log(`✅ Updated ${merged.length} publication(s) in index.html and data/publications.json.`);
}

// Never fail the job and never wipe data: any error keeps the existing curated data.
// We deliberately do NOT call process.exit() — letting the event loop drain naturally
// gives a clean exit 0 on every platform (process.exit() can race with fetch's socket
// teardown). exitCode stays 0, so the job is never marked failed.
main().catch((err) => {
  console.log(`⚠️  Fetch failed (${err.message}). Preserving existing curated data (no write).`);
});
