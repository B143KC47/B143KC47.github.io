#!/usr/bin/env node
// Fetch Kaggle profile stats and refresh the #profiles-data block in index.html.
//
// NON-DESTRUCTIVE BY DESIGN (same contract as fetch-publications.mjs): this script only
// rewrites data when it successfully retrieves a valid performance tier. On any error,
// challenge, or malformed response it leaves the existing curated data untouched and
// exits 0. This is what stops a bad CI run (or a Kaggle block on the Actions IP) from
// wiping the card.
//
// NO SECRETS REQUIRED. Kaggle's profile RPC is a public endpoint guarded by a
// double-submit CSRF cookie. We load the public profile page once to obtain the
// anonymous XSRF-TOKEN (plus the GCLB/session cookies), then call the same
// GetPageDataByUrl RPC the site itself uses on load.
//
// ONLY the .kaggle object is refreshed. The hand-maintained .leetcode card and the
// curated .kaggle.handle / .kaggle.url fields are preserved.

import fs from 'node:fs';

const HANDLE = 'b14ckc4tmr';
const PROFILE_URL = `https://www.kaggle.com/${HANDLE}`;
const RPC = 'https://www.kaggle.com/api/i/routing.RoutingService/GetPageDataByUrl';
const INDEX_HTML = 'index.html';
const DATA_JSON = 'data/profiles.json';
const UA = 'Mozilla/5.0 (compatible; B143KC47-site-bot/1.0; +https://b143kc47.github.io)';
const PROFILES_PATTERN = /(<script id="profiles-data" type="application\/json">)([\s\S]*?)(<\/script>)/;

// The Kaggle tier ladder rendered by the practice card (modules/startup-redesign.js).
// The API returns an upper-case enum (e.g. "CONTRIBUTOR"); the card expects title case.
const TIER_LADDER = ['Novice', 'Contributor', 'Expert', 'Master', 'Grandmaster'];

const titleCase = (s) => String(s || '').charAt(0).toUpperCase() + String(s || '').slice(1).toLowerCase();

function mapTier(raw) {
  const wanted = String(raw || '').toLowerCase();
  return TIER_LADDER.find((t) => t.toLowerCase() === wanted) || null;
}

// Build a { name: value } map from an array of Set-Cookie header strings.
function parseSetCookies(lines) {
  const jar = {};
  for (const line of lines) {
    const pair = line.split(';', 1)[0];
    const idx = pair.indexOf('=');
    if (idx > 0) jar[pair.slice(0, idx).trim()] = pair.slice(idx + 1).trim();
  }
  return jar;
}

async function fetchProfile() {
  // 1) GET the profile page to obtain the anti-forgery cookies.
  const page = await fetch(PROFILE_URL, { headers: { 'User-Agent': UA, Accept: 'text/html' } });
  if (!page.ok) throw new Error(`profile page HTTP ${page.status}`);
  const jar = parseSetCookies(page.headers.getSetCookie ? page.headers.getSetCookie() : []);
  const xsrf = jar['XSRF-TOKEN'];
  if (!xsrf) throw new Error('no XSRF-TOKEN cookie returned (anti-bot challenge?)');
  const cookieHeader = Object.entries(jar).map(([k, v]) => `${k}=${v}`).join('; ');

  // 2) Call the same RPC the site uses. Cookie values are URL-encoded; the token must be
  //    decoded to satisfy the double-submit check (the browser does decodeURIComponent too).
  const res = await fetch(RPC, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': UA,
      Cookie: cookieHeader,
      'x-xsrf-token': decodeURIComponent(xsrf),
      'x-kaggle-build-version': '1',
    },
    body: JSON.stringify({ relativeUrl: `/${HANDLE}` }),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(`profile RPC HTTP ${res.status}`);
  const profile = json && json.userProfile;
  if (!profile) throw new Error('response had no userProfile');
  return profile;
}

// Merge live stats onto the existing curated card, preserving handle/url and (if the API
// returns nothing usable) every existing value as a fallback.
function buildKaggleCard(profile, existing) {
  const tier = mapTier(profile.performanceTier);
  if (!tier) throw new Error(`unmapped performance tier "${profile.performanceTier}"`);

  const categories = Array.isArray(profile.achievementSummaries) && profile.achievementSummaries.length
    ? [...new Set(profile.achievementSummaries.map((a) => titleCase(String(a.summaryType).replace('USER_ACHIEVEMENT_TYPE_', ''))))]
    : existing.categories;

  return {
    ...existing, // keep curated handle + url (and anything else already there)
    handle: existing.handle || profile.userName || HANDLE,
    url: existing.url || PROFILE_URL,
    tier,
    categories,
    badges: Array.isArray(profile.badges) ? profile.badges.length : existing.badges,
    competitions: profile.totalActiveCompetitions != null ? profile.totalActiveCompetitions : existing.competitions,
    memberSince: profile.userJoinDate ? new Date(profile.userJoinDate).getFullYear() : existing.memberSince,
  };
}

async function main() {
  const html = fs.readFileSync(INDEX_HTML, 'utf-8');
  const match = html.match(PROFILES_PATTERN);
  if (!match) throw new Error('#profiles-data <script> block not found in index.html');

  const data = JSON.parse(match[2]); // { leetcode, kaggle, lastUpdated }
  const existingKaggle = data.kaggle || {};

  const profile = await fetchProfile();
  const kaggle = buildKaggleCard(profile, existingKaggle);

  // Spread-first so leetcode stays first and only .kaggle / lastUpdated change.
  const updated = { ...data, kaggle, lastUpdated: new Date().toISOString().slice(0, 10) };
  const json = JSON.stringify(updated, null, 2);

  fs.writeFileSync(INDEX_HTML, html.replace(PROFILES_PATTERN, `$1\n${json}\n$3`), 'utf-8');
  fs.writeFileSync(DATA_JSON, json + '\n', 'utf-8');
  console.log(`✅ Kaggle refreshed: ${kaggle.tier}, ${kaggle.badges} badges, ${kaggle.competitions} competitions, member since ${kaggle.memberSince}. LeetCode card preserved.`);
}

// Never fail the job and never wipe data: any error keeps the existing curated card.
// We deliberately do NOT call process.exit() — letting the event loop drain gives a clean
// exit 0 on every platform (process.exit can race with fetch's socket teardown).
main().catch((err) => {
  console.log(`⚠️  Kaggle fetch failed (${err.message}). Preserving existing curated data (no write).`);
});
