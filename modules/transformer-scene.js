/* ============================================================================
   transformer-scene.js — interactive 3D "stack of attention layers"
   ----------------------------------------------------------------------------
   The signature hero centerpiece. A stack of transformer blocks recedes in
   depth: each layer is a row of token nodes wired by glowing self-attention
   links, with a residual stream carrying pulses upward through the stack
   (a forward pass). It slowly orbits, reacts to the mouse and to scroll, over
   a cosmic starfield — the dark "Dark Side of the Moon" Moonshot mood.

   Zero-build: Three.js is pulled from a CDN via the import map in index.html.
   Loads ONLY when WebGL is available and motion is allowed; otherwise it
   no-ops and the 2D #hero-field fallback in startup-redesign.js keeps running.
   ========================================================================== */

// Real tokens from KO Ho Tin's research — edit these two lines to retune copy.
const TOKENS = ['large', 'language', 'models', 'mine', 'alpha', 'factors'];
const THEMES = ['LLM agents', 'Quant AI', 'Computer vision', 'Evaluation'];

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const stage = document.getElementById('transformer-stage');

function hasWebGL() {
    try {
        const c = document.createElement('canvas');
        return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
    } catch (e) {
        return false;
    }
}

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
// Deterministic per-node depth jitter (avoids layout shift across resizes).
const jitter = (i, t) => Math.sin(i * 12.9898 + t * 78.233) * 0.45;

if (stage && !reduced && hasWebGL()) {
    import('three')
        .then(THREE => start(THREE))
        .catch(err => console.warn('[transformer-scene] skipped:', err));
}

async function start(THREE) {
    const L = 5;                       // transformer layers (stacked along Y)
    const T = TOKENS.length;           // tokens per layer
    const LAYER_GAP = 1.5;
    const TOKEN_GAP = 1.05;
    const BASE_TILT = -0.12;
    const CAM_Z = 9;

    const isMobile = window.matchMedia('(max-width: 760px)').matches;
    const STAR_COUNT = isMobile ? 1200 : 2600;
    let useBloom = !isMobile && window.innerWidth > 1024 &&
        (window.devicePixelRatio || 1) <= 2;

    const COOL = new THREE.Color(0x7c9cff);
    const WARM = new THREE.Color(0xf0c987);

    // --- node geometry helper ------------------------------------------------
    const nodeLocal = (i, t) => new THREE.Vector3(
        (t - (T - 1) / 2) * TOKEN_GAP,
        (i - (L - 1) / 2) * LAYER_GAP,
        jitter(i, t)
    );

    // --- renderer / scene / camera ------------------------------------------
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    let pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(pixelRatio);
    renderer.setClearColor(0x05060a, 1);          // matches the body cosmic base
    renderer.setSize(stage.clientWidth || window.innerWidth, stage.clientHeight || window.innerHeight, false);
    stage.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0, CAM_Z);

    const group = new THREE.Group();        // the transformer itself
    group.rotation.x = BASE_TILT;
    scene.add(group);

    const starGroup = new THREE.Group();
    scene.add(starGroup);

    // --- token nodes (InstancedMesh) ----------------------------------------
    const nodeGeo = new THREE.SphereGeometry(0.14, 18, 18);
    const nodeMat = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false });
    const nodes = new THREE.InstancedMesh(nodeGeo, nodeMat, L * T);
    const dummy = new THREE.Object3D();
    let n = 0;
    for (let i = 0; i < L; i++) {
        for (let t = 0; t < T; t++) {
            dummy.position.copy(nodeLocal(i, t));
            dummy.scale.setScalar(i === 0 || i === L - 1 ? 1.25 : 1);
            dummy.updateMatrix();
            nodes.setMatrixAt(n, dummy.matrix);
            const warm = i === L - 1 || (i * T + t) % 7 === 0;
            nodes.setColorAt(n, warm ? WARM : COOL);
            n++;
        }
    }
    nodes.instanceMatrix.needsUpdate = true;
    if (nodes.instanceColor) nodes.instanceColor.needsUpdate = true;
    group.add(nodes);

    // --- self-attention links within each layer (all token pairs) -----------
    const linkPairs = [];
    for (let i = 0; i < L; i++) {
        for (let a = 0; a < T; a++) {
            for (let b = a + 1; b < T; b++) {
                linkPairs.push({
                    a: nodeLocal(i, a),
                    b: nodeLocal(i, b),
                    phase: (i * 3.1 + a * 1.7 + b * 2.3) % (Math.PI * 2),
                    color: (a + b + i) % 2 === 0 ? COOL : WARM   // two "heads"
                });
            }
        }
    }
    const linkPos = new Float32Array(linkPairs.length * 6);
    const linkCol = new Float32Array(linkPairs.length * 6);
    linkPairs.forEach((lk, k) => {
        linkPos.set([lk.a.x, lk.a.y, lk.a.z, lk.b.x, lk.b.y, lk.b.z], k * 6);
    });
    const linkGeo = new THREE.BufferGeometry();
    linkGeo.setAttribute('position', new THREE.BufferAttribute(linkPos, 3));
    linkGeo.setAttribute('color', new THREE.BufferAttribute(linkCol, 3));
    const linkMat = new THREE.LineBasicMaterial({
        vertexColors: true, transparent: true, opacity: 0.7,
        blending: THREE.AdditiveBlending, depthWrite: false
    });
    const links = new THREE.LineSegments(linkGeo, linkMat);
    group.add(links);

    // --- residual stream edges (token t across consecutive layers) ----------
    const resPairs = [];
    for (let i = 0; i < L - 1; i++) {
        for (let t = 0; t < T; t++) {
            resPairs.push([nodeLocal(i, t), nodeLocal(i + 1, t)]);
        }
    }
    const resPos = new Float32Array(resPairs.length * 6);
    resPairs.forEach((p, k) => resPos.set([p[0].x, p[0].y, p[0].z, p[1].x, p[1].y, p[1].z], k * 6));
    const resGeo = new THREE.BufferGeometry();
    resGeo.setAttribute('position', new THREE.BufferAttribute(resPos, 3));
    const resMat = new THREE.LineBasicMaterial({
        color: 0x4a5a8a, transparent: true, opacity: 0.3,
        blending: THREE.AdditiveBlending, depthWrite: false
    });
    group.add(new THREE.LineSegments(resGeo, resMat));

    // --- rising residual pulses (a forward pass) ----------------------------
    const PULSES = T * 2;
    const pulseState = [];
    for (let k = 0; k < PULSES; k++) {
        pulseState.push({ t: k % T, g: ((k / PULSES) * (L - 1)) % (L - 1) });
    }
    const pulsePos = new Float32Array(PULSES * 3);
    const pulseGeo = new THREE.BufferGeometry();
    pulseGeo.setAttribute('position', new THREE.BufferAttribute(pulsePos, 3));
    const pulseMat = new THREE.PointsMaterial({
        color: 0xfff0d8, size: 0.22, transparent: true, opacity: 0.95,
        blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true
    });
    const pulses = new THREE.Points(pulseGeo, pulseMat);
    group.add(pulses);

    // --- starfield -----------------------------------------------------------
    const starPos = new Float32Array(STAR_COUNT * 3);
    const starCol = new Float32Array(STAR_COUNT * 3);
    const tmp = new THREE.Color();
    for (let k = 0; k < STAR_COUNT; k++) {
        const r = 18 + Math.random() * 28;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        starPos[k * 3] = r * Math.sin(phi) * Math.cos(theta);
        starPos[k * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        starPos[k * 3 + 2] = r * Math.cos(phi);
        const roll = Math.random();
        tmp.copy(roll > 0.86 ? WARM : roll > 0.7 ? COOL : new THREE.Color(0xdfe6ff));
        tmp.multiplyScalar(0.5 + Math.random() * 0.5);
        starCol.set([tmp.r, tmp.g, tmp.b], k * 3);
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starCol, 3));
    const starMat = new THREE.PointsMaterial({
        size: 0.12, vertexColors: true, transparent: true, opacity: 0.9,
        blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true
    });
    starGroup.add(new THREE.Points(starGeo, starMat));

    // --- DOM token labels (real research phrase + theme tags) ---------------
    const labelLayer = document.createElement('div');
    labelLayer.className = 'transformer-labels';
    labelLayer.setAttribute('aria-hidden', 'true');
    // Mount on the hero section (not inside the dimmed stage) so labels read
    // above the readability scrim. Its box matches the stage (both inset:0).
    (stage.parentElement || stage).appendChild(labelLayer);

    const labels = [];
    const makeLabel = (text, local, cls) => {
        const el = document.createElement('span');
        el.className = `tf-label ${cls}`;
        el.textContent = text;
        labelLayer.appendChild(el);
        labels.push({ el, local });
    };
    TOKENS.forEach((tok, t) => makeLabel(tok, nodeLocal(0, t).add(new THREE.Vector3(0, -0.55, 0)), 'is-input'));
    THEMES.forEach((th, k) => makeLabel(th, nodeLocal(L - 1, k + 1).add(new THREE.Vector3(0, 0.55, 0)), 'is-theme'));

    // --- optional bloom (desktop) -------------------------------------------
    let composer = null;
    if (useBloom) {
        try {
            const [{ EffectComposer }, { RenderPass }, { UnrealBloomPass }] = await Promise.all([
                import('three/addons/postprocessing/EffectComposer.js'),
                import('three/addons/postprocessing/RenderPass.js'),
                import('three/addons/postprocessing/UnrealBloomPass.js')
            ]);
            composer = new EffectComposer(renderer);
            composer.addPass(new RenderPass(scene, camera));
            const w = stage.clientWidth || window.innerWidth;
            const h = stage.clientHeight || window.innerHeight;
            const bloom = new UnrealBloomPass(new THREE.Vector2(w, h), 0.9, 0.6, 0.2);
            composer.addPass(bloom);
            composer.setSize(w, h);
        } catch (e) {
            composer = null;
            useBloom = false;
        }
    }

    // --- responsive fit ------------------------------------------------------
    function fit() {
        const w = stage.clientWidth || window.innerWidth;
        const h = stage.clientHeight || window.innerHeight;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        if (composer) composer.setSize(w, h);
        group.scale.setScalar(clamp(camera.aspect / 1.3, 0.5, 1.05));
    }
    fit();

    // --- interaction state ---------------------------------------------------
    const pointer = { tx: 0, ty: 0, x: 0, y: 0 };
    window.addEventListener('pointermove', e => {
        if (e.pointerType === 'touch') return;
        pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
        pointer.ty = (e.clientY / window.innerHeight) * 2 - 1;
    }, { passive: true });

    let scrollP = 0;
    const onScroll = () => {
        const heroH = stage.getBoundingClientRect().height || window.innerHeight;
        scrollP = clamp(window.scrollY / (heroH * 0.9), 0, 1);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    const ro = new ResizeObserver(() => fit());
    ro.observe(stage);

    // pause when the hero scrolls out of view
    let onScreen = true;
    if ('IntersectionObserver' in window) {
        const heroSection = document.querySelector('.hero-section');
        if (heroSection) {
            new IntersectionObserver(entries => {
                onScreen = entries[0].isIntersecting;
                if (onScreen && !raf) loop();
            }, { threshold: 0 }).observe(heroSection);
        }
    }
    let hidden = false;
    document.addEventListener('visibilitychange', () => {
        hidden = document.hidden;
        if (!hidden && !raf) loop();
    });

    document.body.classList.add('tf-active');
    stage.classList.add('is-ready');
    stage.style.transition = 'none';   // JS owns opacity per-frame (intro + scroll fade)

    // --- animation loop ------------------------------------------------------
    const clock = new THREE.Clock();
    const proj = new THREE.Vector3();
    let spin = 0;
    let curRX = 0, curRY = 0;
    let intro = 0;
    let raf = 0;

    // lightweight FPS governor
    let fpsAccum = 0, fpsFrames = 0;

    function updateLabels(rect) {
        group.updateMatrixWorld();
        for (const lb of labels) {
            proj.copy(lb.local).applyMatrix4(group.matrixWorld).project(camera);
            if (proj.z > 1) { lb.el.style.opacity = '0'; continue; }
            lb.el.style.opacity = '';   // hand opacity back to the CSS class
            const x = (proj.x * 0.5 + 0.5) * rect.width;
            const y = (-proj.y * 0.5 + 0.5) * rect.height;
            lb.el.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px)`;
            if (intro > 0.6) lb.el.classList.add('is-visible');
        }
    }

    function loop() {
        if (!onScreen || hidden) { raf = 0; return; }
        raf = requestAnimationFrame(loop);

        const dt = Math.min(clock.getDelta(), 0.05);
        const time = clock.getElapsedTime();
        intro = Math.min(1, intro + dt * 0.7);

        // rotation: idle spin + damped mouse parallax + scroll kick
        spin += dt * 0.18;
        curRY += (pointer.tx * 0.35 - curRY) * 0.05;
        curRX += (pointer.ty * 0.2 - curRX) * 0.05;
        group.rotation.y = spin + curRY + scrollP * 0.6;
        group.rotation.x = BASE_TILT + curRX;
        group.position.y = -scrollP * 1.6;
        starGroup.rotation.y -= dt * 0.01;
        starGroup.rotation.x = curRX * 0.3;

        camera.position.z = CAM_Z - scrollP * 2.5;

        // shimmer the attention links (shifting "weights")
        const col = linkGeo.attributes.color.array;
        for (let k = 0; k < linkPairs.length; k++) {
            const lk = linkPairs[k];
            const w = 0.15 + 0.85 * (0.5 + 0.5 * Math.sin(time * 1.6 + lk.phase));
            const o = k * 6;
            col[o] = lk.color.r * w; col[o + 1] = lk.color.g * w; col[o + 2] = lk.color.b * w;
            col[o + 3] = lk.color.r * w; col[o + 4] = lk.color.g * w; col[o + 5] = lk.color.b * w;
        }
        linkGeo.attributes.color.needsUpdate = true;

        // rise the residual pulses through the whole stack
        const pp = pulseGeo.attributes.position.array;
        for (let k = 0; k < PULSES; k++) {
            const ps = pulseState[k];
            ps.g += dt * 0.55;
            if (ps.g >= L - 1) ps.g -= (L - 1);
            const i0 = Math.floor(ps.g);
            const s = ps.g - i0;
            const a = nodeLocal(i0, ps.t);
            const b = nodeLocal(i0 + 1, ps.t);
            pp[k * 3] = a.x + (b.x - a.x) * s;
            pp[k * 3 + 1] = a.y + (b.y - a.y) * s;
            pp[k * 3 + 2] = a.z + (b.z - a.z) * s;
        }
        pulseGeo.attributes.position.needsUpdate = true;

        const rect = stage.getBoundingClientRect();
        updateLabels(rect);
        stage.style.opacity = String(intro * (1 - scrollP * 0.85));

        if (composer) composer.render();
        else renderer.render(scene, camera);

        // governor: if persistently slow, shed bloom then pixel ratio
        fpsAccum += dt; fpsFrames++;
        if (fpsAccum >= 1.2) {
            const fps = fpsFrames / fpsAccum;
            if (fps < 40 && composer) { composer = null; }
            else if (fps < 28 && pixelRatio > 1) { pixelRatio = 1; renderer.setPixelRatio(1); fit(); }
            fpsAccum = 0; fpsFrames = 0;
        }
    }
    loop();

    // --- teardown ------------------------------------------------------------
    window.addEventListener('pagehide', () => {
        if (raf) cancelAnimationFrame(raf);
        ro.disconnect();
        renderer.dispose();
        nodeGeo.dispose(); nodeMat.dispose();
        linkGeo.dispose(); linkMat.dispose();
        resGeo.dispose(); resMat.dispose();
        pulseGeo.dispose(); pulseMat.dispose();
        starGeo.dispose(); starMat.dispose();
    }, { once: true });
}
