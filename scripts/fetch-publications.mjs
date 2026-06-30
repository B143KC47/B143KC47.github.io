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

import fs from 'node:fs';

const PROFILE_ID = '~Ho_Tin_Ko2';
const API = 'https://api2.openreview.net';
const INDEX_HTML = 'index.html';
const DATA_JSON = 'data/publications.json';
const PUB_PATTERN = /(<script id="publications-data" type="application\/json">)([\s\S]*?)(<\/script>)/;

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
  const user = process.env.OPENREVIEW_USERNAME;
  const pass = process.env.OPENREVIEW_PASSWORD;
  let token = null;

  if (user && pass) {
    token = await login(user, pass);
    console.log('🔐 Authenticated with OpenReview.');
  } else {
    console.log('ℹ️  No OpenReview credentials set; attempting anonymous fetch.');
  }

  const notes = await fetchNotes(token);
  console.log(`Fetched ${notes.length} note(s) from OpenReview.`);

  if (notes.length === 0) {
    console.log('⚠️  0 publications returned — preserving existing curated data (no write).');
    return;
  }

  const publications = notes.map(buildPublication);
  writeData({
    publications,
    lastUpdated: new Date().toISOString(),
    totalCount: publications.length,
    source: token ? 'OpenReview API v2 (authenticated)' : 'OpenReview API v2 (anonymous)',
  });
  console.log(`✅ Updated ${publications.length} publication(s) in index.html and data/publications.json.`);
}

// Never fail the job and never wipe data: any error keeps the existing curated data.
// We deliberately do NOT call process.exit() — letting the event loop drain naturally
// gives a clean exit 0 on every platform (process.exit() can race with fetch's socket
// teardown). exitCode stays 0, so the job is never marked failed.
main().catch((err) => {
  console.log(`⚠️  Fetch failed (${err.message}). Preserving existing curated data (no write).`);
});
