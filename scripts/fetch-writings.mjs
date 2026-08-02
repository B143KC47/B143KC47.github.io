#!/usr/bin/env node
// Aggregate the author's public articles (Hexo blog + CSDN + Zhihu) and refresh
// data/writings.json + the #writings-data block in index.html.
//
// NON-DESTRUCTIVE BY DESIGN (same contract as fetch-publications.mjs): each source is
// best-effort. A source that errors or returns nothing is skipped; its existing entries
// stay. Entries with `"source": "manual"` (curated links the fetchers cannot see, e.g.
// Zhihu articles behind the login wall) are always preserved.
//
// SOURCES
//   Blog  — https://b143kc47.github.io/blog/archives/ (GitHub Pages, no bot wall; scraped)
//   CSDN  — blog.csdn.net community home-api (public JSON the site itself calls)
//   Zhihu — members API (usually 401 without login; kept for the day it works)
//
// No dependencies, no secrets. Never fails the job.

import fs from 'node:fs';

const INDEX_HTML = 'index.html';
const WRITINGS_JSON = 'data/writings.json';
const WRITINGS_PATTERN = /(<script id="writings-data" type="application\/json">)([\s\S]*?)(<\/script>)/;
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

const BLOG_BASE = 'https://b143kc47.github.io/blog/';
const CSDN_USER = 'B143KC47';
const ZHIHU_USER = 'B143KC47';
const MAX_ENTRIES = 60;

const clean = (s) => String(s || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

// ── Blog: scrape the archives page (links look like ../2025/02/23/<category>/<slug>/) ──
async function fetchBlog() {
  const res = await fetch(`${BLOG_BASE}archives/`, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`blog archives HTTP ${res.status}`);
  const html = await res.text();
  const entries = [];
  const re = /<a[^>]+href="\.\.\/(\d{4})\/(\d{2})\/(\d{2})\/([^"]+?)\/"[^>]*>([\s\S]*?)<\/a>/g;
  let m;
  while ((m = re.exec(html))) {
    const [, y, mo, d, slugPath, text] = m;
    const title = clean(text).replace(/^\d{2}-\d{2}\s*/, ''); // strip leading "MM-DD"
    if (!title) continue;
    entries.push({
      title,
      url: `${BLOG_BASE}${y}/${mo}/${d}/${slugPath}/`,
      platform: 'Blog',
      date: `${y}-${mo}-${d}`,
      source: 'auto',
    });
  }
  if (!entries.length) throw new Error('blog archives parsed to 0 posts');
  return entries;
}

// ── CSDN: the public JSON API behind the profile's article list ──
async function fetchCSDN() {
  const url = `https://blog.csdn.net/community/home-api/v1/get-business-list?page=0&size=30&businessType=blog&noMore=false&username=${CSDN_USER}`;
  const res = await fetch(url, { headers: { 'User-Agent': UA, Referer: `https://blog.csdn.net/${CSDN_USER}` } });
  if (!res.ok) throw new Error(`CSDN API HTTP ${res.status}`);
  const json = await res.json();
  const list = json && json.data && Array.isArray(json.data.list) ? json.data.list : [];
  const entries = list
    .map((item) => ({
      title: clean(item.title),
      url: item.url || (item.articleId ? `https://blog.csdn.net/${CSDN_USER}/article/details/${item.articleId}` : ''),
      platform: 'CSDN',
      date: String(item.postTime || item.formatTime || '').slice(0, 10),
      desc: clean(item.description).slice(0, 120),
      image: Array.isArray(item.picList) && item.picList.length ? String(item.picList[0]) : '',
      source: 'auto',
    }))
    .filter((e) => e.title && e.url);
  if (!entries.length) throw new Error('CSDN API returned 0 articles');
  return entries;
}

// ── Zhihu: public articles API (typically 401 without app auth — best effort) ──
async function fetchZhihu() {
  const url = `https://www.zhihu.com/api/v4/members/${ZHIHU_USER}/articles?limit=30&offset=0`;
  const res = await fetch(url, { headers: { 'User-Agent': UA, Referer: `https://www.zhihu.com/people/${ZHIHU_USER}` } });
  if (!res.ok) throw new Error(`Zhihu API HTTP ${res.status}`);
  const json = await res.json();
  const list = Array.isArray(json.data) ? json.data : [];
  const entries = list
    .map((item) => ({
      title: clean(item.title),
      url: item.url ? item.url.replace('api/v4/articles', 'p') : '',
      platform: 'Zhihu',
      date: item.created ? new Date(item.created * 1000).toISOString().slice(0, 10) : '',
      source: 'auto',
    }))
    .filter((e) => e.title && e.url);
  if (!entries.length) throw new Error('Zhihu API returned 0 articles');
  return entries;
}

function readExisting() {
  try { return JSON.parse(fs.readFileSync(WRITINGS_JSON, 'utf-8')); } catch { return { writings: [] }; }
}

async function main() {
  const existing = readExisting();
  const manual = (existing.writings || []).filter((e) => e.source === 'manual');

  const results = await Promise.allSettled([fetchBlog(), fetchCSDN(), fetchZhihu()]);
  const names = ['Blog', 'CSDN', 'Zhihu'];
  const fetched = [];
  results.forEach((r, i) => {
    if (r.status === 'fulfilled') {
      console.log(`📥 ${names[i]}: ${r.value.length} article(s).`);
      fetched.push(...r.value);
    } else {
      console.log(`⚠️  ${names[i]} fetch failed (${r.reason.message}) — existing entries kept.`);
      // Keep the previous auto entries for the failed platform only.
      fetched.push(...(existing.writings || []).filter((e) => e.source !== 'manual' && e.platform === names[i]));
    }
  });

  // Merge: manual entries are first-class; a fetched entry with the same URL only
  // fills fields the manual one left empty (desc/image/date). Dedup by URL.
  const byUrl = new Map();
  for (const e of manual) byUrl.set(e.url, { ...e });
  for (const e of fetched) {
    const prev = byUrl.get(e.url);
    if (prev) {
      for (const k of ['date', 'desc', 'image']) if (!prev[k] && e[k]) prev[k] = e[k];
    } else {
      byUrl.set(e.url, e);
    }
  }
  const writings = [...byUrl.values()]
    .filter((e) => e.url)
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))
    .slice(0, MAX_ENTRIES);

  if (!writings.length) {
    console.log('⚠️  0 writings after merge — preserving existing data (no write).');
    return;
  }

  const out = { writings, lastUpdated: new Date().toISOString() };
  const json = JSON.stringify(out, null, 2);
  const html = fs.readFileSync(INDEX_HTML, 'utf-8');
  if (!WRITINGS_PATTERN.test(html)) throw new Error('#writings-data <script> block not found in index.html');
  fs.writeFileSync(INDEX_HTML, html.replace(WRITINGS_PATTERN, `$1\n${json}\n$3`), 'utf-8');
  fs.writeFileSync(WRITINGS_JSON, json + '\n', 'utf-8');
  console.log(`✅ ${writings.length} writing(s) (${manual.length} manual) written to index.html + data/writings.json.`);
}

// Never fail the job: any error keeps the existing curated data.
main().catch((err) => {
  console.log(`⚠️  Writings fetch failed (${err.message}). Preserving existing data (no write).`);
});
