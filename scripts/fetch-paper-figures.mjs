#!/usr/bin/env node
// Extract a display figure from each publication's OpenReview PDF and refresh
// assets/papers/ + data/paper-figures.json + the #paper-figures-data block in index.html.
//
// NON-DESTRUCTIVE BY DESIGN (same contract as fetch-publications.mjs): a paper whose PDF
// or images cannot be fetched is simply skipped — its existing figure (or none) is kept.
// The script never deletes images and never fails the job.
//
// Entries flagged `"source": "manual"` in data/paper-figures.json are curated by hand
// (custom image, project/code links) and are never overwritten — drop a file in
// assets/papers/ and set its entry to manual to pin a figure.
//
// AUTH: OpenReview blocks anonymous PDF downloads with a 403 challenge, so this uses the
// same OPENREVIEW_USERNAME / OPENREVIEW_PASSWORD secrets as fetch-publications.mjs.
// Without credentials it still tries api2 anonymously and skips on 403.
//
// PDF CACHE / LOCAL OVERRIDE: every successfully downloaded PDF is cached at
// .playwright-mcp/pdfs/<pub-id>.pdf ($PAPER_FIGURES_LOCAL_DIR overrides the dir), and a
// cached file is always preferred over a network fetch — credentials are only needed the
// first time. When a PDF is available the card's PDF link is pointed at a self-hosted
// copy (assets/papers/<pub-id>.pdf) so the link works even from challenge-blocked IPs.
//
// VECTOR-ONLY PDFs: if the first pages contain no usable raster image (figures drawn as
// vector graphics), the script renders the region above the "Figure 1"/"Figure 2"
// caption to PNG instead of giving up.
//
// Deps (CI-only): pdfjs-dist (image decode + page render) + pngjs (PNG re-encode)
// + @napi-rs/canvas (render surface). See package.json.

import fs from 'node:fs';
import path from 'node:path';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { PNG } from 'pngjs';
import { createCanvas } from '@napi-rs/canvas';

const API = 'https://api2.openreview.net';
const INDEX_HTML = 'index.html';
const FIGURES_JSON = 'data/paper-figures.json';
const FIGURES_DIR = 'assets/papers';
const FIGURES_PATTERN = /(<script id="paper-figures-data" type="application\/json">)([\s\S]*?)(<\/script>)/;
const PUB_JSON = 'data/publications.json';
const LOCAL_PDF_DIR = process.env.PAPER_FIGURES_LOCAL_DIR || '.playwright-mcp/pdfs';

const MAX_PAGES = 4;          // teaser figures live on the first pages
const MIN_AREA = 200 * 160;   // skip icons/logos
const MAX_SIDE = 1600;        // downscale monsters to keep the repo light
const RENDER_SCALE = 2;       // vector-fallback render quality
const ImageKind = { GRAY_1BPP: 1, RGB_24BPP: 2, RGBA_32BPP: 3 };

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

async function fetchPdf(id, token) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  for (const url of [`${API}/pdf?id=${id}`, `https://openreview.net/pdf?id=${id}`]) {
    const res = await fetch(url, { headers, redirect: 'follow' });
    if (res.ok) {
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length > 10000 && buf.subarray(0, 5).toString() === '%PDF-') {
        fs.mkdirSync(LOCAL_PDF_DIR, { recursive: true });
        fs.writeFileSync(path.join(LOCAL_PDF_DIR, `${id}.pdf`), buf); // cache: no creds needed next time
        return buf;
      }
    }
  }
  throw new Error('PDF download blocked or not a PDF');
}

// Pull every raster image painted on the first MAX_PAGES pages, largest first.
async function collectImages(pdf) {
  const images = [];
  for (let p = 1; p <= Math.min(pdf.numPages, MAX_PAGES); p++) {
    const page = await pdf.getPage(p);
    const ops = await page.getOperatorList();
    for (let i = 0; i < ops.fnArray.length; i++) {
      const fn = ops.fnArray[i];
      // 85 = paintImageXObject, 86 = paintInlineImageXObject, 87 = paintImageMaskXObject
      if (fn !== 85 && fn !== 86) continue;
      const name = ops.argsArray[i][0];
      try {
        const img = await new Promise((resolve) => page.objs.get(name, resolve));
        if (img && img.data && img.width * img.height >= MIN_AREA) images.push(img);
      } catch { /* object not resolvable — skip */ }
    }
  }
  return images.sort((a, b) => b.width * b.height - a.width * a.height);
}

// Normalize any pdf.js bitmap to an RGBA PNG buffer (downscaling if needed).
function toPng(img) {
  const scale = Math.min(1, MAX_SIDE / Math.max(img.width, img.height));
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);
  const png = new PNG({ width: w, height: h, colorType: 2 }); // RGB, no alpha (smaller)

  const put = (x, y, r, g, b) => {
    const j = (y * w + x) * 3;
    png.data[j] = r; png.data[j + 1] = g; png.data[j + 2] = b;
  };
  const px = (x, y) => {
    const sx = Math.min(img.width - 1, Math.floor(x / scale));
    const sy = Math.min(img.height - 1, Math.floor(y / scale));
    if (img.kind === ImageKind.RGBA_32BPP) {
      const i = (sy * img.width + sx) * 4;
      return [img.data[i], img.data[i + 1], img.data[i + 2]];
    }
    if (img.kind === ImageKind.RGB_24BPP) {
      const i = (sy * img.width + sx) * 3;
      return [img.data[i], img.data[i + 1], img.data[i + 2]];
    }
    // GRAY_1BPP bitmap
    const rowBytes = Math.floor((img.width + 7) / 8);
    const bit = (img.data[sy * rowBytes + (sx >> 3)] >> (7 - (sx & 7))) & 1;
    const v = bit ? 255 : 0;
    return [v, v, v];
  };
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) put(x, y, ...px(x, y));
  return PNG.sync.write(png);
}

// ── Vector fallback: render the figure region above a "Figure N" caption ────
// A real caption starts with "Figure N:" / "Fig. N:" — in-text mentions like
// "Figure 2(a) shows …" lack the colon and are ignored. The figure is the
// cluster of text/labels directly above the caption: walk upward from the
// caption while consecutive items are spaced like lines; a large vertical gap
// (body paragraph or page top) ends the figure. PDF user space has y pointing
// up; getTextContent() item transforms are in user units.
async function findFigureRegion(page, figureNo) {
  const tc = await page.getTextContent();
  const items = tc.items.filter((it) => it.str && it.str.trim());
  const capRe = new RegExp(`^\\s*(?:Figure|Fig\\.?)\\s*${figureNo}\\s*[:.]`);
  const cap = items.find((it) => capRe.test(it.str));
  if (!cap) return null;
  const [pageX0, pageY0, pageX1, pageY1] = page.view;
  const pageW = pageX1 - pageX0;
  const capX = cap.transform[4];
  const capY = cap.transform[5];
  const capSize = Math.abs(cap.transform[3]) || Math.abs(cap.transform[0]) || 9;

  // Items above the caption, within the caption's column band, top-first.
  const xMin = capX - pageW * 0.05;
  const xMax = capX + pageW * 0.8;
  const above = items
    .filter((it) => it.transform[5] > capY + capSize && it.transform[4] >= xMin && it.transform[4] <= xMax)
    .sort((a, b) => b.transform[5] - a.transform[5]);
  if (!above.length) return null;

  // Typical line leading = median consecutive gap; a figure boundary is a much larger gap.
  const gaps = [];
  for (let i = 0; i + 1 < above.length; i++) {
    const g = above[i].transform[5] - above[i + 1].transform[5];
    if (g > 0) gaps.push(g);
  }
  gaps.sort((a, b) => a - b);
  const median = gaps.length ? gaps[Math.floor(gaps.length / 2)] : 12;
  const boundary = Math.max(18, median * 1.6);

  // Walk upward from the item nearest the caption until a boundary gap.
  let topItem = above[above.length - 1];
  for (let i = above.length - 1; i > 0; i--) {
    if (above[i - 1].transform[5] - above[i].transform[5] >= boundary) break;
    topItem = above[i - 1];
  }
  const topSize = Math.abs(topItem.transform[3]) || Math.abs(topItem.transform[0]) || 9;
  const top = topItem.transform[5] + topSize * 0.75 + 3;
  const bottom = capY + capSize * 0.85; // just above the caption text
  if (top - bottom < 40) return null;   // no real figure gap — bail

  const left = capX;
  const right = pageX1 - capX;          // symmetric margin assumption
  const width = right - left;
  if (width < pageW * 0.35) return null; // column detection went wrong
  return { left, bottom, width, height: top - bottom };
}

// Render `region` (PDF user-space rect) of `page` to a PNG buffer.
async function renderRegionToPng(page, region) {
  const viewport = page.getViewport({ scale: RENDER_SCALE });
  const full = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
  const ctx = full.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, full.width, full.height);
  await page.render({ canvasContext: ctx, viewport }).promise;

  const [vx0, vy0] = viewport.convertToViewportPoint(region.left, region.bottom + region.height);
  const [vx1, vy1] = viewport.convertToViewportPoint(region.left + region.width, region.bottom);
  const sx = Math.max(0, Math.floor(Math.min(vx0, vx1)));
  const sy = Math.max(0, Math.floor(Math.min(vy0, vy1)));
  const sw = Math.min(full.width - sx, Math.ceil(Math.abs(vx1 - vx0)));
  const sh = Math.min(full.height - sy, Math.ceil(Math.abs(vy1 - vy0)));
  if (sw < 50 || sh < 50) throw new Error(`rendered region too small (${sw}×${sh})`);

  const scale = Math.min(1, MAX_SIDE / Math.max(sw, sh));
  const out = createCanvas(Math.round(sw * scale), Math.round(sh * scale));
  out.getContext('2d').drawImage(full, sx, sy, sw, sh, 0, 0, out.width, out.height);
  return { buf: await out.encode('png'), w: out.width, h: out.height };
}

// Try the vector fallback on the first MAX_PAGES pages: Figure 1, then Figure 2.
async function renderFallback(pdf) {
  for (const figNo of [1, 2]) {
    for (let p = 1; p <= Math.min(pdf.numPages, MAX_PAGES); p++) {
      const page = await pdf.getPage(p);
      const region = await findFigureRegion(page, figNo);
      if (!region) continue;
      const { buf, w, h } = await renderRegionToPng(page, region);
      console.log(`   (vector fallback: rendered Figure ${figNo} region from page ${p})`);
      return { buf, w, h };
    }
  }
  return null;
}

function readJson(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, 'utf-8')); } catch { return fallback; }
}

async function main() {
  const pubs = readJson(PUB_JSON, { publications: [] }).publications || [];
  if (!pubs.length) throw new Error('no publications to process');

  const figures = readJson(FIGURES_JSON, { figures: {} });
  figures.figures = figures.figures || {};
  fs.mkdirSync(FIGURES_DIR, { recursive: true });

  const user = (process.env.OPENREVIEW_USERNAME || '').trim();
  const pass = (process.env.OPENREVIEW_PASSWORD || '').trim();
  const token = user && pass ? await login(user, pass) : null;
  console.log(token ? '🔐 Authenticated with OpenReview.' : 'ℹ️  No credentials; trying anonymous PDF access.');

  let changed = 0;
  for (const pub of pubs) {
    const existing = figures.figures[pub.id];
    if (existing && existing.source === 'manual') {
      console.log(`📌 ${pub.id}: manual entry — preserved.`);
      continue;
    }
    try {
      // Idempotent: a paper with an existing figure file is left alone; only new
      // publications (or a deleted image) trigger extraction.
      if (existing && existing.src && fs.existsSync(existing.src)) {
        console.log(`✔ ${pub.id}: figure already present — skipped.`);
        continue;
      }
      const localPdf = path.join(LOCAL_PDF_DIR, `${pub.id}.pdf`);
      const pdfBuf = fs.existsSync(localPdf)
        ? (console.log(`📁 ${pub.id}: using local PDF ${localPdf}`), fs.readFileSync(localPdf))
        : await fetchPdf(pub.id, token);
      const pdf = await getDocument({ data: new Uint8Array(pdfBuf), isEvalSupported: false, disableFontFace: true }).promise;

      let pngBuf, dims;
      const [best] = await collectImages(pdf);
      if (best) {
        pngBuf = toPng(best);
        dims = `${best.width}×${best.height}`;
      } else {
        const rendered = await renderFallback(pdf);
        if (!rendered) throw new Error('no usable raster image or figure region on the first pages');
        pngBuf = rendered.buf;
        dims = `${rendered.w}×${rendered.h} (rendered)`;
      }

      const file = `${FIGURES_DIR}/${pub.id}.png`;
      fs.writeFileSync(file, pngBuf);
      // Self-host the PDF next to the figure so the card link works from anywhere.
      const pdfFile = `${FIGURES_DIR}/${pub.id}.pdf`;
      fs.writeFileSync(pdfFile, pdfBuf);
      figures.figures[pub.id] = {
        ...(existing || {}), // keep any curated links on auto entries
        src: file,
        caption: (existing && existing.caption) || `Figure from “${pub.title}” (auto-extracted from the paper PDF).`,
        source: 'auto',
        pdfUrl: pdfFile,
      };
      changed++;
      console.log(`🖼️  ${pub.id}: extracted ${dims} figure -> ${file} (+ self-hosted PDF)`);
    } catch (err) {
      console.log(`⚠️  ${pub.id}: figure fetch failed (${err.message}) — keeping existing.`);
    }
  }

  if (changed === 0) {
    console.log('ℹ️  No new figures extracted — nothing to write.');
    return;
  }

  figures.lastUpdated = new Date().toISOString();
  const json = JSON.stringify(figures, null, 2);

  const html = fs.readFileSync(INDEX_HTML, 'utf-8');
  if (!FIGURES_PATTERN.test(html)) throw new Error('#paper-figures-data <script> block not found in index.html');
  fs.writeFileSync(INDEX_HTML, html.replace(FIGURES_PATTERN, `$1\n${json}\n$3`), 'utf-8');
  fs.writeFileSync(FIGURES_JSON, json + '\n', 'utf-8');
  console.log(`✅ Figures refreshed for ${changed}/${pubs.length} publication(s); manual entries preserved.`);
}

// Never fail the job: any error keeps the existing figures and data.
main().catch((err) => {
  console.log(`⚠️  Paper-figure fetch failed (${err.message}). Preserving existing data (no write).`);
});
