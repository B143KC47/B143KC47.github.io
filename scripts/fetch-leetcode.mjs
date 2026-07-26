#!/usr/bin/env node
// Fetch LeetCode profile stats and refresh the #profiles-data block in index.html.
//
// NON-DESTRUCTIVE BY DESIGN (same contract as fetch-kaggle.mjs / fetch-publications.mjs):
// this script only rewrites data when it successfully retrieves a valid solved count.
// On any error, challenge, or malformed response it leaves the existing curated data
// untouched and exits 0, so a bad CI run can never wipe the card.
//
// NO SECRETS REQUIRED. LeetCode's public GraphQL endpoint answers matchedUser queries
// anonymously; we only send a Referer + UA like the site itself does.
//
// ONLY the .leetcode object is refreshed. The .kaggle card (maintained by
// fetch-kaggle.mjs) and the curated .leetcode.handle / .leetcode.url fields are preserved.

import fs from 'node:fs';

const HANDLE = 'B143KC47';
const GRAPHQL = 'https://leetcode.com/graphql';
const INDEX_HTML = 'index.html';
const DATA_JSON = 'data/profiles.json';
const UA = 'Mozilla/5.0 (compatible; B143KC47-site-bot/1.0; +https://b143kc47.github.io)';
const PROFILES_PATTERN = /(<script id="profiles-data" type="application\/json">)([\s\S]*?)(<\/script>)/;

const QUERY = `query u($username: String!) {
  matchedUser(username: $username) {
    username
    submitStatsGlobal {
      acSubmissionNum { difficulty count }
      totalSubmissionNum { difficulty submissions }
    }
    userCalendar { submissionCalendar }
  }
}`;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const monthLabel = (epochSeconds) => {
  const d = new Date(epochSeconds * 1000);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
};

async function fetchProfile() {
  const res = await fetch(GRAPHQL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': UA,
      Referer: `https://leetcode.com/u/${HANDLE}/`,
    },
    body: JSON.stringify({ query: QUERY, variables: { username: HANDLE } }),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(`GraphQL HTTP ${res.status}`);
  const user = json && json.data && json.data.matchedUser;
  if (!user) throw new Error('response had no matchedUser (challenge or renamed handle?)');
  return user;
}

const byDiff = (rows, difficulty) => (Array.isArray(rows) ? rows.find((r) => r.difficulty === difficulty) : null);

// The rolling-year submission calendar gives an honest "active Mon YYYY – Mon YYYY" range.
function buildActivePeriod(calendar, fallback) {
  try {
    const epochs = Object.keys(JSON.parse(calendar || '{}')).map(Number).filter(Number.isFinite);
    if (!epochs.length) return fallback;
    const first = monthLabel(Math.min(...epochs));
    const last = monthLabel(Math.max(...epochs));
    return first === last ? first : `${first} – ${last}`;
  } catch {
    return fallback;
  }
}

// Merge live stats onto the existing curated card, preserving handle/url and falling back
// to every existing value when the API omits a field.
function buildLeetCard(user, existing) {
  const stats = user.submitStatsGlobal || {};
  const solvedAll = byDiff(stats.acSubmissionNum, 'All');
  if (!solvedAll || typeof solvedAll.count !== 'number') throw new Error('no solved count in response');

  const easy = byDiff(stats.acSubmissionNum, 'Easy');
  const medium = byDiff(stats.acSubmissionNum, 'Medium');
  const hard = byDiff(stats.acSubmissionNum, 'Hard');
  const totalSubs = byDiff(stats.totalSubmissionNum, 'All');

  return {
    ...existing, // keep curated handle + url (and anything else already there)
    handle: existing.handle || user.username || HANDLE,
    url: existing.url || `https://leetcode.com/u/${HANDLE}/`,
    solved: solvedAll.count,
    byDifficulty: {
      easy: easy ? easy.count : (existing.byDifficulty || {}).easy || 0,
      medium: medium ? medium.count : (existing.byDifficulty || {}).medium || 0,
      hard: hard ? hard.count : (existing.byDifficulty || {}).hard || 0,
    },
    submissions: totalSubs && typeof totalSubs.submissions === 'number' ? totalSubs.submissions : existing.submissions,
    activePeriod: buildActivePeriod((user.userCalendar || {}).submissionCalendar, existing.activePeriod),
  };
}

async function main() {
  const html = fs.readFileSync(INDEX_HTML, 'utf-8');
  const match = html.match(PROFILES_PATTERN);
  if (!match) throw new Error('#profiles-data <script> block not found in index.html');

  const data = JSON.parse(match[2]); // { leetcode, kaggle, lastUpdated }
  const existingLeet = data.leetcode || {};

  const user = await fetchProfile();
  const leetcode = buildLeetCard(user, existingLeet);

  // Rebuild in place so key order stays leetcode, kaggle, lastUpdated.
  const updated = { ...data, leetcode, lastUpdated: new Date().toISOString().slice(0, 10) };
  const json = JSON.stringify(updated, null, 2);

  fs.writeFileSync(INDEX_HTML, html.replace(PROFILES_PATTERN, `$1\n${json}\n$3`), 'utf-8');
  fs.writeFileSync(DATA_JSON, json + '\n', 'utf-8');
  console.log(`✅ LeetCode refreshed: ${leetcode.solved} solved (${leetcode.byDifficulty.easy}E/${leetcode.byDifficulty.medium}M/${leetcode.byDifficulty.hard}H), ${leetcode.submissions} submissions, active ${leetcode.activePeriod}. Kaggle card preserved.`);
}

// Never fail the job and never wipe data: any error keeps the existing curated card.
// We deliberately do NOT call process.exit() — letting the event loop drain gives a clean
// exit 0 on every platform (process.exit can race with fetch's socket teardown).
main().catch((err) => {
  console.log(`⚠️  LeetCode fetch failed (${err.message}). Preserving existing curated data (no write).`);
});
