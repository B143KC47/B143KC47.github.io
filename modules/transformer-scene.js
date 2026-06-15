/* ============================================================================
   transformer-scene.js — neural-grid hero (monochrome "Signal")
   ----------------------------------------------------------------------------
   The signature centerpiece: a vast 3D lattice of white nodes connected by
   faint lines, receding into depth. Bright signal points fire through the grid
   along its depth axis (a forward pass). The whole field slowly rotates and
   reacts to the mouse; scrolling drifts the camera inward. Strictly monochrome
   (white/gray on transparent) over the black hero.

   Zero-build: Three.js comes from the CDN import map in index.html. Loads ONLY
   when WebGL is available and motion is allowed; otherwise it no-ops and the 2D
   #hero-field fallback in startup-redesign.js keeps running.
   ========================================================================== */

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

if (stage && !reduced && hasWebGL()) {
    import('three')
        .then(THREE => start(THREE))
        .catch(err => console.warn('[neural-grid] skipped:', err));
}

async function start(THREE) {
    // WebGL scene takes over — hide the 2D fallback canvas so they don't double-render.
    const field = document.getElementById('hero-field');
    if (field) field.style.display = 'none';

    const isMobile = window.matchMedia('(max-width: 760px)').matches;
    const COLS = isMobile ? 7 : 11;
    const ROWS = isMobile ? 5 : 7;
    const DEPTH = isMobile ? 4 : 6;     // layers receding into z
    const GAP = 1.5;

    const renderer = new THREE.WebGLRenderer({ antialias: !isMobile, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2));
    renderer.setSize(stage.clientWidth, stage.clientHeight);
    stage.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, stage.clientWidth / stage.clientHeight, 0.1, 100);
    camera.position.set(0, 0, 13);

    // --- nodes (instanced) ---
    const nodes = [];
    for (let z = 0; z < DEPTH; z++)
        for (let y = 0; y < ROWS; y++)
            for (let x = 0; x < COLS; x++)
                nodes.push(new THREE.Vector3(
                    (x - (COLS - 1) / 2) * GAP,
                    (y - (ROWS - 1) / 2) * GAP,
                    (z - (DEPTH - 1) / 2) * GAP
                ));
    const N = nodes.length;

    const dot = new THREE.SphereGeometry(0.045, 8, 8);
    const dotMat = new THREE.MeshBasicMaterial({ color: 0xf5f5f5 });
    const mesh = new THREE.InstancedMesh(dot, dotMat, N);
    const m4 = new THREE.Matrix4();
    nodes.forEach((p, i) => { m4.makeTranslation(p.x, p.y, p.z); mesh.setMatrixAt(i, m4); });
    mesh.instanceMatrix.needsUpdate = true;
    scene.add(mesh);

    // --- connections (nearest neighbours along grid) ---
    const linePos = [];
    const idx = (x, y, z) => z * ROWS * COLS + y * COLS + x;
    for (let z = 0; z < DEPTH; z++) for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
        const a = nodes[idx(x, y, z)];
        if (x + 1 < COLS) { const b = nodes[idx(x + 1, y, z)]; linePos.push(a.x,a.y,a.z, b.x,b.y,b.z); }
        if (y + 1 < ROWS) { const b = nodes[idx(x, y + 1, z)]; linePos.push(a.x,a.y,a.z, b.x,b.y,b.z); }
        if (z + 1 < DEPTH) { const b = nodes[idx(x, y, z + 1)]; linePos.push(a.x,a.y,a.z, b.x,b.y,b.z); }
    }
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePos, 3));
    const lineMat = new THREE.LineBasicMaterial({ color: 0xf5f5f5, transparent: true, opacity: 0.12 });
    scene.add(new THREE.LineSegments(lineGeo, lineMat));

    // --- firing signals: bright points that travel along z ---
    const SIG = isMobile ? 24 : 60;
    const sigGeo = new THREE.BufferGeometry();
    const sigArr = new Float32Array(SIG * 3);
    const sigSeed = Array.from({ length: SIG }, (_, i) => ({
        col: Math.floor((i * 7.3) % COLS), row: Math.floor((i * 3.1) % ROWS), phase: (i / SIG)
    }));
    sigGeo.setAttribute('position', new THREE.BufferAttribute(sigArr, 3));
    const sigMat = new THREE.PointsMaterial({ color: 0xffffff, size: isMobile ? 0.16 : 0.13, transparent: true, opacity: 0.95 });
    scene.add(new THREE.Points(sigGeo, sigMat));

    const span = (DEPTH - 1) * GAP;
    const target = { x: 0, y: 0 };
    const mouse = { x: 0, y: 0 };
    window.addEventListener('pointermove', e => {
        target.x = (e.clientX / window.innerWidth - 0.5);
        target.y = (e.clientY / window.innerHeight - 0.5);
    }, { passive: true });

    let scrollY = window.scrollY;
    window.addEventListener('scroll', () => { scrollY = window.scrollY; }, { passive: true });

    const onResize = () => {
        if (!stage.clientWidth || !stage.clientHeight) return;
        renderer.setSize(stage.clientWidth, stage.clientHeight);
        camera.aspect = stage.clientWidth / stage.clientHeight; camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', onResize, { passive: true });

    let t = 0;
    const loop = () => {
        requestAnimationFrame(loop);
        if (document.hidden) return;
        t += 0.006;
        mouse.x += (target.x - mouse.x) * 0.04;
        mouse.y += (target.y - mouse.y) * 0.04;

        scene.rotation.y = Math.sin(t) * 0.25 + mouse.x * 0.6;
        scene.rotation.x = Math.cos(t * 0.8) * 0.12 - mouse.y * 0.4;
        camera.position.z = 13 - Math.min(scrollY / 220, 4);   // drift in on scroll

        for (let i = 0; i < SIG; i++) {
            const s = sigSeed[i];
            const p = ((t * 0.6 + s.phase) % 1);
            sigArr[i*3]   = (s.col - (COLS - 1) / 2) * GAP;
            sigArr[i*3+1] = (s.row - (ROWS - 1) / 2) * GAP;
            sigArr[i*3+2] = -span/2 + p * span;
        }
        sigGeo.attributes.position.needsUpdate = true;
        renderer.render(scene, camera);
    };
    loop();
}
