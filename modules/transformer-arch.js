/* ============================================================================
   transformer-arch.js — EXACT "Attention Is All You Need" architecture, in 3D
   ----------------------------------------------------------------------------
   The canonical Transformer (Vaswani et al., 2017, Fig 1) rendered as a crisp
   SVG "front face" placed in a CSS-3D scene: the encoder & decoder layer stacks
   recede into depth (the N× layers literally stacked behind in Z), the whole
   deck tilted in perspective, slowly rotating with mouse parallax. A forward-pass
   glow sweeps up both stacks; connectors flow; attention blocks pulse.
   Pure SVG/CSS/JS — NO dependencies, so it works over file:// too.
   Honors prefers-reduced-motion (renders static).
   ========================================================================== */

(() => {
  const stage = document.getElementById('transformer-stage');
  if (!stage) return;
  const field = document.getElementById('hero-field');
  if (field) field.style.display = 'none';

  const NS = 'http://www.w3.org/2000/svg';
  const E = (tag, attrs, parent) => {
    const e = document.createElementNS(NS, tag);
    if (attrs) for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  };

  const VW = 1000, VH = 700;
  const svg = E('svg', { viewBox: `0 0 ${VW} ${VH}`, class: 'tf-svg', preserveAspectRatio: 'xMidYMid meet', 'aria-hidden': 'true' });
  const defs = E('defs', null, svg);
  const mk = E('marker', { id: 'tf-arrow', viewBox: '0 0 10 10', refX: '8', refY: '5', markerWidth: '7', markerHeight: '7', orient: 'auto-start-reverse' }, defs);
  E('path', { d: 'M0,0 L10,5 L0,10 z', fill: 'rgba(245,245,245,0.55)' }, mk);

  const gConn = E('g', null, svg);
  const gBlock = E('g', null, svg);
  const gOverlay = E('g', null, svg);

  const encX = 318, decX = 682, W = 224, H = 44, H2 = 52, ANH = 30;
  const blocks = {};

  function block(key, cx, cy, lines, kind) {
    const two = lines.length > 1;
    const h = kind === 'an' ? ANH : (two ? H2 : H);
    const cls = 'tf-block' + (kind === 'attn' ? ' tf-attn' : '') + (kind === 'an' ? ' tf-an' : '') + (kind === 'io' ? ' tf-ioblk' : '');
    const g = E('g', { class: cls }, gBlock);
    E('rect', { x: cx - W / 2, y: cy - h / 2, width: W, height: h, rx: 9, class: 'tf-rect' }, g);
    if (two) {
      E('text', { x: cx, y: cy - 8, class: 'tf-label' }, g).textContent = lines[0];
      E('text', { x: cx, y: cy + 10, class: 'tf-label' }, g).textContent = lines[1];
    } else {
      E('text', { x: cx, y: cy + 1, class: 'tf-label' + (kind === 'an' ? ' tf-anlabel' : '') }, g).textContent = lines[0];
    }
    blocks[key] = { cx, cy, h, g };
    return blocks[key];
  }
  function plus(key, cx, cy) {
    const g = E('g', { class: 'tf-block' }, gBlock);
    E('circle', { cx, cy, r: 16, class: 'tf-rect' }, g);
    E('text', { x: cx, y: cy + 1, class: 'tf-label' }, g).textContent = '+';
    blocks[key] = { cx, cy, h: 32, g };
    return blocks[key];
  }
  const ioText = (cx, cy, str, strong) => { E('text', { x: cx, y: cy, class: 'tf-io' + (strong ? ' tf-strong' : '') }, gOverlay).textContent = str; };

  // ENCODER (left)
  block('e_an2', encX, 286, ['Add & Norm'], 'an');
  block('e_ff',  encX, 342, ['Feed Forward']);
  block('e_an1', encX, 410, ['Add & Norm'], 'an');
  block('e_mha', encX, 462, ['Multi-Head', 'Attention'], 'attn');
  plus('e_pos', encX, 548);
  block('e_emb', encX, 600, ['Input Embedding'], 'io');
  ioText(encX, 660, 'Inputs');

  // DECODER (right) — baseline-aligned with encoder (embeddings on one line)
  block('d_softmax', decX, 68, ['Softmax']);
  block('d_linear',  decX, 124, ['Linear']);
  block('d_an3', decX, 186, ['Add & Norm'], 'an');
  block('d_ff',  decX, 240, ['Feed Forward']);
  block('d_an2', decX, 302, ['Add & Norm'], 'an');
  block('d_xmha', decX, 354, ['Multi-Head', 'Attention'], 'attn');
  block('d_an1', decX, 420, ['Add & Norm'], 'an');
  block('d_mmha', decX, 472, ['Masked Multi-Head', 'Attention'], 'attn');
  plus('d_pos', decX, 548);
  block('d_emb', decX, 600, ['Output Embedding'], 'io');
  ioText(decX, 658, 'Outputs', false);
  ioText(decX, 672, '(shifted right)', false);
  ioText(decX, 18, 'Output Probabilities', true);

  // connectors
  const top = b => b.cy - b.h / 2, bot = b => b.cy + b.h / 2;
  function conn(a, b, flow) {
    E('path', { d: `M ${a.cx} ${top(a)} L ${b.cx} ${bot(b)}`, class: 'tf-conn' + (flow ? ' tf-flow' : ''), 'marker-end': 'url(#tf-arrow)' }, gConn);
  }
  const chain = keys => { for (let i = 0; i < keys.length - 1; i++) conn(blocks[keys[i]], blocks[keys[i + 1]], true); };
  chain(['e_emb', 'e_pos', 'e_mha', 'e_an1', 'e_ff', 'e_an2']);
  chain(['d_emb', 'd_pos', 'd_mmha', 'd_an1', 'd_xmha', 'd_an2', 'd_ff', 'd_an3', 'd_linear', 'd_softmax']);
  conn({ cx: encX, cy: 660, h: 0 }, blocks.e_emb, false);
  conn({ cx: decX, cy: 672, h: 0 }, blocks.d_emb, false);
  conn(blocks.d_softmax, { cx: decX, cy: 30, h: 0 }, true);

  function residual(subKey, anKey, side) {
    const sub = blocks[subKey], an = blocks[anKey];
    const x = sub.cx + side * (W / 2 + 18), yIn = bot(sub) + 8, yOut = an.cy;
    E('path', { d: `M ${sub.cx + side * (W / 2)} ${yIn} L ${x} ${yIn} L ${x} ${yOut} L ${an.cx + side * (W / 2)} ${yOut}`, class: 'tf-conn tf-residual' }, gConn);
  }
  residual('e_mha', 'e_an1', -1); residual('e_ff', 'e_an2', -1);
  residual('d_mmha', 'd_an1', 1); residual('d_xmha', 'd_an2', 1); residual('d_ff', 'd_an3', 1);

  // encoder output → decoder cross-attention (K, V)
  const eTop = top(blocks.e_an2);
  const cross = dx => E('path', { d: `M ${encX} ${eTop} C ${encX} ${eTop - 70}, ${decX + dx} ${blocks.d_xmha.cy - 130}, ${decX + dx} ${bot(blocks.d_xmha)}`, class: 'tf-conn tf-flow tf-cross', 'marker-end': 'url(#tf-arrow)' }, gConn);
  cross(-40); cross(0);

  // N× brackets
  function nx(cx, y0, y1, side) {
    const x = cx + side * (W / 2 + 70);
    E('path', { d: `M ${x - side * 12} ${y0} L ${x} ${y0} L ${x} ${y1} L ${x - side * 12} ${y1}`, class: 'tf-bracket' }, gOverlay);
    E('text', { x: x + side * 18, y: (y0 + y1) / 2, class: 'tf-nx' }, gOverlay).textContent = 'N×';
  }
  nx(encX, top(blocks.e_mha) - 6, bot(blocks.e_an2) + 6, -1);
  nx(decX, top(blocks.d_mmha) - 6, bot(blocks.d_an3) + 6, 1);

  // positional-encoding labels
  E('text', { x: encX - 150, y: 542, class: 'tf-side' }, gOverlay).textContent = 'Positional';
  E('text', { x: encX - 150, y: 558, class: 'tf-side' }, gOverlay).textContent = 'Encoding';
  E('text', { x: decX + 150, y: 542, class: 'tf-side' }, gOverlay).textContent = 'Positional';
  E('text', { x: decX + 150, y: 558, class: 'tf-side' }, gOverlay).textContent = 'Encoding';

  // forward-pass sweep (stagger a brightening bottom → top)
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduced) {
    const ordered = ['e_emb','e_pos','e_mha','e_an1','e_ff','e_an2','d_emb','d_pos','d_mmha','d_an1','d_xmha','d_an2','d_ff','d_an3','d_linear','d_softmax'];
    ordered.forEach(k => { const b = blocks[k]; const p = (660 - b.cy) / (660 - 68); b.g.classList.add('tf-step'); b.g.style.setProperty('--d', (p * 3.4).toFixed(2) + 's'); });
  }

  // ---- 3D scene assembly -------------------------------------------------
  const scene = document.createElement('div'); scene.className = 'tf-scene';
  const deck = document.createElement('div'); deck.className = 'tf-deck';
  scene.appendChild(deck);

  // depth stacks behind each layer region → the "N×" layers receding in Z
  function depth(leftP, topP, wP, hP) {
    const c = document.createElement('div'); c.className = 'tf-depth';
    c.style.cssText = `left:${leftP}%;top:${topP}%;width:${wP}%;height:${hP}%`;
    for (let i = 1; i <= 5; i++) {
      const card = document.createElement('div'); card.className = 'tf-depthcard';
      card.style.transform = `translateZ(${-i * 26}px)`;
      card.style.opacity = (0.5 - i * 0.075).toFixed(3);
      c.appendChild(card);
    }
    deck.appendChild(c);
  }
  depth(20.6, 38.7, 22.4, 31.0);   // encoder layer region
  depth(57.0, 24.4, 22.4, 46.7);   // decoder layer region (baseline-shifted up)
  deck.appendChild(svg);
  stage.appendChild(scene);

  // ---- rotation + parallax ----------------------------------------------
  const target = { x: 0, y: 0 }, m = { x: 0, y: 0 };
  if (!reduced) {
    window.addEventListener('pointermove', e => { target.x = e.clientX / window.innerWidth - 0.5; target.y = e.clientY / window.innerHeight - 0.5; }, { passive: true });
    let t = 0;
    const loop = () => {
      requestAnimationFrame(loop);
      if (document.hidden) return;
      t += 0.016;
      m.x += (target.x - m.x) * 0.05; m.y += (target.y - m.y) * 0.05;
      const ry = -23 + Math.sin(t * 0.32) * 5 + m.x * 16;
      const rx = 9 - m.y * 9;
      deck.style.transform = `rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
    };
    loop();
  } else {
    deck.style.transform = 'rotateX(9deg) rotateY(-23deg)';
  }

  // ---- styles ------------------------------------------------------------
  if (!document.getElementById('tf-arch-style')) {
    const st = document.createElement('style'); st.id = 'tf-arch-style';
    st.textContent = `
#transformer-stage{position:relative}
.tf-scene{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;perspective:1450px}
.tf-deck{position:relative;width:100%;height:100%;transform-style:preserve-3d;transform:rotateX(9deg) rotateY(-23deg);will-change:transform}
.tf-svg{position:absolute;inset:0;overflow:visible;transform:translateZ(1px)}
.tf-depth{position:absolute;transform-style:preserve-3d;pointer-events:none}
.tf-depthcard{position:absolute;inset:0;border:1px solid rgba(245,245,245,.18);border-radius:14px;background:rgba(245,245,245,.012)}
.tf-rect{fill:rgba(245,245,245,.03);stroke:rgba(245,245,245,.32);stroke-width:1.3}
.tf-attn .tf-rect{stroke:rgba(245,245,245,.64);fill:rgba(245,245,245,.06)}
.tf-an .tf-rect{fill:rgba(245,245,245,.012);stroke:rgba(245,245,245,.22);stroke-dasharray:4 4}
.tf-ioblk .tf-rect{stroke:rgba(245,245,245,.42)}
.tf-label{fill:#f5f5f5;font-family:'IBM Plex Mono',ui-monospace,monospace;font-size:14.5px;font-weight:500;text-anchor:middle;dominant-baseline:middle}
.tf-anlabel{fill:#9a9a9a;font-size:13px}
.tf-conn{stroke:rgba(245,245,245,.34);stroke-width:1.4;fill:none}
.tf-residual{stroke:rgba(245,245,245,.16);stroke-width:1.1}
.tf-cross{stroke:rgba(245,245,245,.44)}
.tf-bracket{stroke:rgba(245,245,245,.32);stroke-width:1.3;fill:none}
.tf-nx{fill:#a1a1a1;font-family:'IBM Plex Mono',monospace;font-size:15px;font-weight:600;text-anchor:middle;dominant-baseline:middle}
.tf-io{fill:#9a9a9a;font-family:'IBM Plex Mono',monospace;font-size:13.5px;letter-spacing:.04em;text-anchor:middle;dominant-baseline:middle}
.tf-io.tf-strong{fill:#f5f5f5;font-size:14.5px;letter-spacing:.12em}
.tf-side{fill:#6e6e6e;font-family:'IBM Plex Mono',monospace;font-size:11.5px;text-anchor:middle;dominant-baseline:middle}
@media (prefers-reduced-motion:no-preference){
  .tf-flow{stroke-dasharray:5 9;animation:tf-flow 1.05s linear infinite}
  @keyframes tf-flow{to{stroke-dashoffset:-14}}
  .tf-attn .tf-rect{animation:tf-attn 3.2s ease-in-out infinite}
  @keyframes tf-attn{0%,100%{stroke:rgba(245,245,245,.45)}50%{stroke:rgba(245,245,245,.92);filter:drop-shadow(0 0 5px rgba(245,245,245,.55))}}
  .tf-step{animation:tf-step 5.5s ease-in-out infinite;animation-delay:var(--d,0s)}
  @keyframes tf-step{0%,72%,100%{filter:none}80%{filter:drop-shadow(0 0 7px rgba(245,245,245,.65))}}
}`;
    document.head.appendChild(st);
  }
})();
