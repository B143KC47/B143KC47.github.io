#!/usr/bin/env node
// Fetch Kaggle profile stats + competition history and refresh the #profiles-data block
// in index.html.
//
// NON-DESTRUCTIVE BY DESIGN (same contract as fetch-publications.mjs): this script only
// rewrites data when it successfully retrieves a valid performance tier. On any error,
// challenge, or malformed response it leaves the existing curated data untouched and
// exits 0. This is what stops a bad CI run (or a Kaggle block on the Actions IP) from
// wiping the card.
//
// PROFILE STATS (tier / badges / counts): no secrets needed. Kaggle's profile RPC is a
// public endpoint guarded by a double-submit CSRF cookie; we load the public profile
// page once to obtain the anonymous XSRF-TOKEN, then call the same GetPageDataByUrl RPC
// the site itself uses on load.
//
// COMPETITION HISTORY (competitionList): needs credentials. Set the GitHub Secret
// KAGGLE_API_TOKEN (a "KGAT_..." API token from kaggle.com/settings) — or, as a
// fallback, KAGGLE_USERNAME + KAGGLE_KEY (legacy kaggle.json pair). With credentials we
// call the official API (api.kaggle.com/v1, same one kaggle-cli 2.x uses) to list
// entered competitions, download each public leaderboard ZIP to find our team rank, and
// count submissions. Ended competitions additionally get their final private-leaderboard
// rank via GetLeaderboard (private by default when available, same as kaggle-cli --show).
// Curated fields on existing entries — notably `writeups` — are preserved per-slug;
// without credentials the curated competitionList is kept as-is.
//
// MEDIA ASSETS: each competition's cover (open-graph image, when Kaggle has one) is
// downloaded to assets/competitions/<slug>.png, and each known organizer's logo to
// assets/competitions/orgs/<org>.png. When Kaggle has no open-graph image for a
// competition (older/beta comps), a branded cover is rendered locally with
// @napi-rs/canvas and saved as assets/competitions/gen-<slug>.png — the separate
// filename means a later official download always takes precedence over the generated
// tile. All media is decorative and best-effort — a missing image never fails the sync,
// and the renderer falls back to a placeholder tile.
//
// ONLY the .kaggle object is refreshed. The hand-maintained .leetcode card and the
// curated .kaggle.handle / .kaggle.url fields are preserved.

import fs from 'node:fs';
import { unzipSync } from 'fflate';

const HANDLE = 'b14ckc4tmr';
const PROFILE_URL = `https://www.kaggle.com/${HANDLE}`;
const RPC = 'https://www.kaggle.com/api/i/routing.RoutingService/GetPageDataByUrl';
const API_V1 = 'https://api.kaggle.com/v1/competitions.CompetitionApiService';
const INDEX_HTML = 'index.html';
const DATA_JSON = 'data/profiles.json';
const ASSETS_DIR = 'assets/competitions';
const UA = 'Mozilla/5.0 (compatible; B143KC47-site-bot/1.0; +https://b143kc47.github.io)';
const PROFILES_PATTERN = /(<script id="profiles-data" type="application\/json">)([\s\S]*?)(<\/script>)/;

// Organizer logo lookup (Google favicon service, 128px PNG). Kaggle exposes no public
// org-avatar API, so only orgs with a known domain get a logo; the renderer falls back
// to a monochrome initial badge for the rest.
const ORG_DOMAINS = {
  'Google Cloud': 'cloud.google.com',
  'OpenAI': 'openai.com',
  'Biohub': 'biohub.org',
  'ROGII': 'rogii.com',
  'Kaggle': 'kaggle.com',
};

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
    competitions: (profile.totalCompetitions ?? profile.totalActiveCompetitions) != null ? (profile.totalCompetitions ?? profile.totalActiveCompetitions) : existing.competitions,
    memberSince: profile.userJoinDate ? new Date(profile.userJoinDate).getFullYear() : existing.memberSince,
  };
}

// ── Competition history via the official Kaggle API ───────────────────────

function readApiToken() {
  const bearer = (process.env.KAGGLE_API_TOKEN || '').trim();
  if (bearer) return { bearer };
  const username = (process.env.KAGGLE_USERNAME || '').trim();
  const key = (process.env.KAGGLE_KEY || '').trim();
  if (username && key) return { username, key };
  return null;
}

function apiAuthHeader(token) {
  if (token.bearer) return `Bearer ${token.bearer}`;
  return `Basic ${Buffer.from(`${token.username}:${token.key}`).toString('base64')}`;
}

async function apiCall(requestName, body, token) {
  const res = await fetch(`${API_V1}/${requestName}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: apiAuthHeader(token) },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${requestName} HTTP ${res.status}`);
  return res;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Minimal quoted-CSV parser (leaderboard files have quoted team names with commas).
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ',') { row.push(field); field = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.length > 1 || row[0] !== '') rows.push(row);
      row = [];
    } else field += ch;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows;
}

// Download the public leaderboard ZIP and locate our team's row.
async function fetchLeaderboardStats(slug, token) {
  const res = await apiCall('DownloadLeaderboard', { competitionName: slug }, token);
  const zip = new Uint8Array(await res.arrayBuffer());
  const files = unzipSync(zip);
  const name = Object.keys(files).find((n) => n.endsWith('.csv'));
  if (!name) return null;
  const rows = parseCsv(new TextDecoder().decode(files[name]));
  const header = (rows[0] || []).map((h) => h.replace(/^﻿/, '').trim());
  const idx = Object.fromEntries(header.map((h, i) => [h, i]));
  if (idx.Rank == null || idx.TeamMemberUserNames == null) return null;
  const mine = rows.slice(1).find((r) =>
    String(r[idx.TeamMemberUserNames] || '').split(/[;,]/).map((s) => s.trim()).includes(HANDLE));
  return {
    teams: rows.length - 1,
    rank: mine ? Number(mine[idx.Rank]) : null,
    score: mine ? mine[idx.Score] || null : null,
    submissions: mine && idx.SubmissionCount != null ? Number(mine[idx.SubmissionCount]) || null : null,
    teamId: mine && idx.TeamId != null ? Number(mine[idx.TeamId]) || null : null,
  };
}

async function fetchSubmissionCount(slug, token) {
  try {
    const res = await apiCall('ListSubmissions', { competitionName: slug, pageSize: 100 }, token);
    const json = await res.json();
    return Array.isArray(json.submissions) ? json.submissions.length : 0;
  } catch {
    return 0; // entered but never submitted (or hidden)
  }
}

// Private leaderboard (ended comps only). GetLeaderboard returns the PRIVATE board by
// default when one exists (overridePublic:true forces the public one — same behaviour
// as `kaggle competitions leaderboard --show`). We compare page 1 of both to detect a
// real private board, then page through it to locate our team, identified by the
// TeamId captured from the public leaderboard CSV.
async function fetchPrivateRank(slug, lb, token) {
  if (!lb || lb.teamId == null) return null;
  try {
    const get = async (extra) => {
      const res = await apiCall('GetLeaderboard', { competitionName: slug, pageSize: 100, ...extra }, token);
      return res.json();
    };
    const privFirst = await get({});
    await sleep(250);
    const pubFirst = await get({ overridePublic: true });
    const p0 = (privFirst.submissions || [])[0];
    const q0 = (pubFirst.submissions || [])[0];
    if (!p0 || !q0) return null;
    if (p0.teamId === q0.teamId && p0.score === q0.score) return null; // no separate private board

    let subs = privFirst.submissions || [];
    let pageToken = privFirst.nextPageToken || null;
    let pos = 0;
    for (let pages = 0; pages < 60; pages++) { // scan cap: 6,000 teams
      for (let i = 0; i < subs.length; i++) {
        if (subs[i].teamId === lb.teamId) return { rank: pos + i + 1, score: subs[i].score || null };
      }
      if (!pageToken || !subs.length) break;
      pos += subs.length;
      await sleep(250);
      const next = await get({ pageToken });
      subs = next.submissions || [];
      pageToken = next.nextPageToken || null;
    }
    return null; // our team is beyond the scan cap
  } catch (err) {
    console.log(`   ⚠️  ${slug}: private leaderboard unavailable (${err.message})`);
    return null;
  }
}

// ── Competition media assets ─────────────────────────────────────────
// Cover art: Kaggle serves each competition's open-graph image via a 302 to a signed
// GCS URL. Not every competition has one (the key simply doesn't exist for older or
// beta comps) — for those we render a branded tile locally so every card has a visual.
async function downloadCover(entry, file) {
  if (!entry.kaggleId) return false;
  try {
    const r1 = await fetch(`https://www.kaggle.com/open-graph/images/Competitions/${entry.kaggleId}`, {
      redirect: 'manual', headers: { 'User-Agent': UA },
    });
    const loc = r1.headers.get('location');
    if (!loc) return false;
    const r2 = await fetch(loc, { headers: { 'User-Agent': UA } });
    if (!r2.ok) return false;
    const buf = Buffer.from(await r2.arrayBuffer());
    if (buf.length < 4000 || buf.subarray(0, 4).toString('hex') !== '89504e47') return false;
    fs.mkdirSync(ASSETS_DIR, { recursive: true });
    fs.writeFileSync(file, buf);
    console.log(`   🖼️  ${entry.slug}: cover saved (${Math.round(buf.length / 1024)} KB)`);
    return true;
  } catch {
    return false; // covers are decorative — never block the sync
  }
}

// Locally rendered fallback cover: hatched dark tile with the organizer logo on a light
// plate and the competition name below it. Pixel work goes through pngjs (pure JS) and
// text through an explicitly registered monospace font, because @napi-rs/canvas's
// drawImage and generic font matching are unreliable across platforms. Both raster deps
// are optional at runtime — if either is absent we skip generation rather than fail.
const COVER_FONT_CANDIDATES = [
  'C:/Windows/Fonts/consolab.ttf', // Windows (Consolas Bold)
  '/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf', // Ubuntu CI
  '/usr/share/fonts/truetype/liberation/LiberationMono-Bold.ttf',
];
let coverFont; // undefined = not probed yet; '' = no usable font; otherwise family name

async function loadCoverKit() {
  const [{ createCanvas, GlobalFonts }, { PNG }] = await Promise.all([
    import('@napi-rs/canvas'),
    import('pngjs'),
  ]);
  if (coverFont === undefined) {
    coverFont = '';
    for (const p of COVER_FONT_CANDIDATES) {
      if (!fs.existsSync(p)) continue;
      try { GlobalFonts.registerFromPath(p, 'CoverMono'); coverFont = 'CoverMono'; break; } catch { /* try next */ }
    }
  }
  return { createCanvas, PNG };
}

// Bilinear upscale of a decoded PNG (favicons arrive as small as 32px).
function scalePng(png, targetH) {
  const targetW = Math.max(1, Math.round((png.width / png.height) * targetH));
  const out = Buffer.alloc(targetW * targetH * 4);
  for (let y = 0; y < targetH; y++) {
    for (let x = 0; x < targetW; x++) {
      const gx = (x + 0.5) * (png.width / targetW) - 0.5;
      const gy = (y + 0.5) * (png.height / targetH) - 0.5;
      const x0 = Math.floor(gx), y0 = Math.floor(gy);
      const fx = gx - x0, fy = gy - y0;
      const di = (y * targetW + x) * 4;
      for (let c = 0; c < 4; c++) {
        const px = (xx, yy) => png.data[
          (Math.min(png.height - 1, Math.max(0, yy)) * png.width + Math.min(png.width - 1, Math.max(0, xx))) * 4 + c];
        out[di + c] = Math.round(
          px(x0, y0) * (1 - fx) * (1 - fy) + px(x0 + 1, y0) * fx * (1 - fy) +
          px(x0, y0 + 1) * (1 - fx) * fy + px(x0 + 1, y0 + 1) * fx * fy);
      }
    }
  }
  return { data: out, width: targetW, height: targetH };
}

// Alpha-blend RGBA pixels over a canvas region (plain putImageData would erase what's
// underneath wherever the source is transparent).
function blendOver(ctx, cx, cy, scaled) {
  const region = ctx.getImageData(cx, cy, scaled.width, scaled.height);
  const d = region.data, s = scaled.data;
  for (let i = 0; i < d.length; i += 4) {
    const a = s[i + 3] / 255;
    if (a === 0) continue;
    d[i] = Math.round(s[i] * a + d[i] * (1 - a));
    d[i + 1] = Math.round(s[i + 1] * a + d[i + 1] * (1 - a));
    d[i + 2] = Math.round(s[i + 2] * a + d[i + 2] * (1 - a));
    d[i + 3] = Math.round(s[i + 3] + d[i + 3] * (1 - a));
  }
  ctx.putImageData(region, cx, cy);
}

function wrapCoverText(ctx, text, maxW) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const w of words) {
    const t = line ? `${line} ${w}` : w;
    if (line && ctx.measureText(t).width > maxW) { lines.push(line); line = w; }
    else line = t;
  }
  if (line) lines.push(line);
  return lines.slice(0, 2);
}

async function generateCover(entry, file) {
  try {
    const kit = await loadCoverKit().catch(() => null);
    if (!kit) return false;
    const { createCanvas, PNG } = kit;
    const W = 1200, H = 630;
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#0b0b0b';
    ctx.fillRect(0, 0, W, H);

    // diagonal hatch texture
    ctx.strokeStyle = 'rgba(245,245,245,.05)';
    ctx.lineWidth = 1;
    for (let x = -H; x < W; x += 22) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + H, H);
      ctx.stroke();
    }

    // organizer logo on a light rounded plate (keeps dark logos legible)
    let textTop = H / 2 - 20;
    if (entry.orgLogo && fs.existsSync(entry.orgLogo)) {
      const png = PNG.sync.read(fs.readFileSync(entry.orgLogo));
      const logoH = 104;
      const scaled = scalePng(png, logoH);
      const padX = 34, padY = 26;
      const plateW = scaled.width + padX * 2, plateH = logoH + padY * 2;
      const plateX = (W - plateW) / 2, plateY = 158;
      ctx.fillStyle = 'rgba(245,245,245,.94)';
      ctx.beginPath();
      ctx.roundRect(plateX, plateY, plateW, plateH, 16);
      ctx.fill();
      blendOver(ctx, Math.round(plateX + padX), Math.round(plateY + padY), scaled);
      textTop = plateY + plateH + 58;
    }

    // competition name, max 2 lines (skipped entirely if no font could be registered)
    if (coverFont) {
      ctx.font = `700 52px ${coverFont}`;
      ctx.fillStyle = '#d8d8d8';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      wrapCoverText(ctx, entry.name || entry.slug, W - 220)
        .forEach((ln, i) => ctx.fillText(ln, W / 2, textTop + i * 64));
    }

    // hairline frame
    ctx.strokeStyle = 'rgba(245,245,245,.12)';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, W - 2, H - 2);

    fs.mkdirSync(ASSETS_DIR, { recursive: true });
    fs.writeFileSync(file, canvas.toBuffer('image/png'));
    console.log(`   🎨 ${entry.slug}: generated fallback cover`);
    return true;
  } catch (err) {
    console.log(`   ⚠️  ${entry.slug}: cover generation skipped (${err.message})`);
    return false;
  }
}

// Resolve a card's cover in precedence order: existing official download → fresh
// open-graph download → existing generated tile → newly generated tile. The generated
// tile uses a gen- prefix so it never blocks a future official download.
async function syncCover(entry) {
  entry.image = ''; // clear any stale path; re-set only when the file really exists
  const real = `${ASSETS_DIR}/${entry.slug}.png`;
  const gen = `${ASSETS_DIR}/gen-${entry.slug}.png`;
  if (fs.existsSync(real)) { entry.image = real; return true; }
  if (await downloadCover(entry, real)) { entry.image = real; return true; }
  if (fs.existsSync(gen)) { entry.image = gen; return true; }
  if (await generateCover(entry, gen)) { entry.image = gen; return true; }
  return false;
}

// Organizer logos: 128px PNGs from Google's favicon service for known org domains.
async function syncOrgLogos(list) {
  const dir = `${ASSETS_DIR}/orgs`;
  for (const entry of list) {
    const org = entry.organization;
    if (!org) continue;
    const domain = ORG_DOMAINS[org];
    if (!domain) continue;
    const file = `${dir}/${org.toLowerCase().replace(/[^a-z0-9]+/g, '')}.png`;
    entry.orgLogo = file;
    if (fs.existsSync(file)) continue;
    try {
      const res = await fetch(`https://www.google.com/s2/favicons?domain=${domain}&sz=128`, {
        headers: { 'User-Agent': UA },
      });
      if (!res.ok) { entry.orgLogo = ''; continue; }
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 200 || buf.subarray(0, 4).toString('hex') !== '89504e47') { entry.orgLogo = ''; continue; }
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(file, buf);
      console.log(`   🏢 ${org}: logo saved`);
    } catch {
      entry.orgLogo = ''; // decorative — ignore
    }
  }
}

// Build the display list from the official API, preserving curated per-slug fields
// (writeups and any hand-set overrides) from the existing competitionList.
// Only competitions with at least one submission are kept — that mirrors what the
// Kaggle profile's own "Competitions" tab shows (joined-but-never-submitted = hidden).
async function buildCompetitionList(token, existingList) {
  const res = await apiCall('ListCompetitions', { group: 'COMPETITION_LIST_TAB_ENTERED' }, token);
  const json = await res.json();
  const comps = Array.isArray(json.competitions) ? json.competitions : [];
  if (!comps.length) throw new Error('API returned 0 entered competitions');

  const curated = new Map((Array.isArray(existingList) ? existingList : []).map((e) => [e.slug, e]));
  const now = Date.now();
  const out = [];
  for (const c of comps) {
    const slug = String(c.ref || c.url || '').split('/').filter(Boolean).pop();
    if (!slug) continue;
    const prev = curated.get(slug) || {};

    let lb = null;
    try {
      lb = await fetchLeaderboardStats(slug, token);
    } catch (err) {
      console.log(`   ⚠️  ${slug}: leaderboard unavailable (${err.message})`);
    }
    const listedSubs = await fetchSubmissionCount(slug, token);
    // The leaderboard row's SubmissionCount is authoritative (team total, no pagination cap).
    const submissions = (lb && lb.submissions) || listedSubs || prev.submissions || 0;
    await sleep(300); // be polite to the API

    if (!submissions) {
      console.log(`   ⏭️  ${slug}: joined but 0 submissions — hidden`);
      continue;
    }

    // Ended comps: fetch the final private-leaderboard rank when Kaggle has one.
    const ended = new Date(String(c.deadline || 0)).getTime() <= now;
    const priv = ended ? await fetchPrivateRank(slug, lb, token) : null;

    out.push({
      slug,
      name: c.title || prev.name || slug,
      url: c.url || `https://www.kaggle.com/competitions/${slug}`,
      category: c.category || prev.category || '',
      organization: c.organizationName || prev.organization || '',
      reward: c.reward || prev.reward || '',
      kaggleId: c.id || prev.kaggleId || null,
      deadline: String(c.deadline || prev.deadline || '').slice(0, 10),
      started: String(c.enabledDate || prev.started || '').slice(0, 10),
      status: ended ? 'Ended' : 'Ongoing',
      rank: (lb && lb.rank != null) ? lb.rank : (prev.rank ?? null),
      teamCount: (lb && lb.teams) || c.teamCount || prev.teamCount || null,
      score: (lb && lb.score) || prev.score || null,
      privateRank: priv ? priv.rank : (prev.privateRank ?? null),
      privateScore: priv ? priv.score : (prev.privateScore ?? null),
      submissions,
      image: prev.image || '',
      orgLogo: prev.orgLogo || '',
      writeups: Array.isArray(prev.writeups) ? prev.writeups : [],
    });
    const got = out[out.length - 1];
    console.log(`   🏁 ${slug}: ${got.rank ? `rank ${got.rank}/${got.teamCount}` : 'no LB rank'}${got.privateRank ? ` · private ${got.privateRank}` : ''} · ${got.submissions} subs`);
  }

  // Ongoing first (soonest deadline), then ended (most recent).
  out.sort((a, b) => {
    const ao = a.status === 'Ongoing' ? 0 : 1;
    const bo = b.status === 'Ongoing' ? 0 : 1;
    if (ao !== bo) return ao - bo;
    return ao === 0 ? String(a.deadline).localeCompare(String(b.deadline))
                    : String(b.deadline).localeCompare(String(a.deadline));
  });
  return out;
}

async function main() {
  const html = fs.readFileSync(INDEX_HTML, 'utf-8');
  const match = html.match(PROFILES_PATTERN);
  if (!match) throw new Error('#profiles-data <script> block not found in index.html');

  const data = JSON.parse(match[2]); // { leetcode, kaggle, lastUpdated }
  const existingKaggle = data.kaggle || {};

  const profile = await fetchProfile();
  const kaggle = buildKaggleCard(profile, existingKaggle);

  // Competition history: official API when credentials exist; otherwise keep curated.
  const token = readApiToken();
  if (token) {
    try {
      const competitionList = await buildCompetitionList(token, existingKaggle.competitionList);
      if (competitionList.length) {
        await syncOrgLogos(competitionList); // first — generated covers reuse the logo
        for (const entry of competitionList) await syncCover(entry);
        kaggle.competitionList = competitionList;
      }
      console.log(`🏆 Competition history refreshed: ${competitionList.length} entered.`);
    } catch (err) {
      console.log(`⚠️  Competition history fetch failed (${err.message}) — curated list preserved.`);
    }
  } else {
    console.log('ℹ️  No Kaggle API credentials set; competitionList left as curated.');
  }

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
