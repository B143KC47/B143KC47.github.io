(function () {
    'use strict';

    const PROFILE = {
        githubUser: 'B143KC47',
        githubUrl: 'https://github.com/B143KC47',
        openReviewId: '~Ho_Tin_Ko2',
        openReviewUrl: 'https://openreview.net/profile?id=%7EHo_Tin_Ko2'
    };

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;
    // Fancy pointer-driven effects (custom cursor, card tilt, parallax) only run
    // with a fine pointer and motion allowed. Touch + reduced-motion get the
    // native cursor and a calm page.
    const allowFancy = !prefersReducedMotion && !isTouch;
    const repoCacheKey = 'ko_profile_github_repos_v3';
    const repoCacheDuration = 10 * 60 * 1000;

    function initHeader() {
        const header = document.querySelector('[data-header]');
        const toggle = document.querySelector('[data-nav-toggle]');
        const nav = document.querySelector('[data-nav]');
        const backdrop = document.querySelector('[data-nav-backdrop]');
        if (!header || !toggle || !nav) return;

        const setScrolled = () => {
            header.classList.toggle('is-scrolled', window.scrollY > 20);
        };
        setScrolled();
        window.addEventListener('scroll', setScrolled, { passive: true });

        // Single source of truth for the mobile drawer: toggles the panel, the
        // backdrop scrim, the hamburger->X (via aria-expanded), and a scroll lock
        // on <html> so the page can't scroll behind the open menu.
        const setNav = open => {
            nav.classList.toggle('is-open', open);
            document.documentElement.classList.toggle('nav-open', open);
            toggle.setAttribute('aria-expanded', String(open));
        };

        toggle.addEventListener('click', () => setNav(!nav.classList.contains('is-open')));
        nav.addEventListener('click', event => { if (event.target.closest('a')) setNav(false); });
        if (backdrop) backdrop.addEventListener('click', () => setNav(false));

        document.addEventListener('keydown', event => {
            if (event.key === 'Escape' && nav.classList.contains('is-open')) {
                setNav(false);
                toggle.focus();
            }
        });

        // Close the drawer (clearing the scroll lock + backdrop) if the viewport
        // grows to desktop while it's open, so neither lingers on the inline nav.
        const desktop = window.matchMedia('(min-width: 761px)');
        const onDesktop = event => { if (event.matches) setNav(false); };
        if (desktop.addEventListener) desktop.addEventListener('change', onDesktop);
        else if (desktop.addListener) desktop.addListener(onDesktop);
    }

    function initReveal() {
        const elements = document.querySelectorAll('.reveal');
        if (prefersReducedMotion || !('IntersectionObserver' in window)) {
            elements.forEach(element => element.classList.add('in-view'));
            return;
        }

        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('in-view');
                observer.unobserve(entry.target);
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -42px' });

        elements.forEach(element => observer.observe(element));
    }

    const FANCY_TARGETS = 'a, button, .project-row, .publication-row, .practice-card, .timeline-item, .nav-toggle';
    const TILT_TARGETS = '.project-row, .publication-row, .practice-card, .timeline-item';

    // Custom cursor: an instant dot + a trailing ring that swells over interactive
    // elements. Native cursor is hidden only while this is active.
    function initCursor() {
        if (!allowFancy) return;
        const dot = document.querySelector('.cursor-dot');
        const ring = document.querySelector('.cursor-ring');
        if (!dot || !ring) return;

        document.body.classList.add('has-custom-cursor');

        let mouseX = window.innerWidth / 2;
        let mouseY = window.innerHeight / 2;
        let ringX = mouseX;
        let ringY = mouseY;
        let raf = 0;

        const loop = () => {
            ringX += (mouseX - ringX) * 0.18;
            ringY += (mouseY - ringY) * 0.18;
            ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;
            if (Math.abs(mouseX - ringX) > 0.1 || Math.abs(mouseY - ringY) > 0.1) {
                raf = requestAnimationFrame(loop);
            } else {
                raf = 0;
            }
        };

        window.addEventListener('pointermove', event => {
            if (event.pointerType === 'touch') return;
            mouseX = event.clientX;
            mouseY = event.clientY;
            dot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
            if (!raf) raf = requestAnimationFrame(loop);
        }, { passive: true });

        document.addEventListener('pointerover', event => {
            if (event.target.closest(FANCY_TARGETS)) ring.classList.add('cursor-hover');
        }, { passive: true });
        document.addEventListener('pointerout', event => {
            if (event.target.closest(FANCY_TARGETS)) ring.classList.remove('cursor-hover');
        }, { passive: true });

        document.addEventListener('mouseleave', () => {
            dot.style.opacity = '0';
            ring.style.opacity = '0';
        });
        document.addEventListener('mouseenter', () => {
            dot.style.opacity = '';
            ring.style.opacity = '';
        });
    }

    // Subtle 3D tilt on cards. Uses event delegation so rows injected after the
    // GitHub/OpenReview fetch are covered without re-binding. JS writes --rx/--ry;
    // cosmic.css applies the perspective transform when <body> has .allow-tilt.
    function initTilt() {
        if (!allowFancy) return;
        document.body.classList.add('allow-tilt');
        const MAX = 6;

        document.addEventListener('pointermove', event => {
            const card = event.target.closest(TILT_TARGETS);
            if (!card) return;
            const rect = card.getBoundingClientRect();
            const px = (event.clientX - rect.left) / rect.width - 0.5;
            const py = (event.clientY - rect.top) / rect.height - 0.5;
            card.style.setProperty('--ry', `${(px * MAX).toFixed(2)}deg`);
            card.style.setProperty('--rx', `${(-py * MAX).toFixed(2)}deg`);
        }, { passive: true });

        document.addEventListener('pointerout', event => {
            const card = event.target.closest(TILT_TARGETS);
            if (!card || card.contains(event.relatedTarget)) return;
            card.style.setProperty('--rx', '0deg');
            card.style.setProperty('--ry', '0deg');
        }, { passive: true });
    }

    // Light scroll parallax on the hero glow for depth (rAF-throttled).
    function initParallax() {
        if (!allowFancy) return;
        const grid = document.querySelector('.hero-grid');
        if (!grid) return;
        let ticking = false;

        const update = () => {
            grid.style.transform = `translateY(${window.scrollY * 0.12}px)`;
            ticking = false;
        };

        window.addEventListener('scroll', () => {
            if (!ticking) {
                ticking = true;
                requestAnimationFrame(update);
            }
        }, { passive: true });
    }

    class HeroField {
        constructor(canvas) {
            this.canvas = canvas;
            this.ctx = canvas.getContext('2d');
            this.pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
            this.points = [];
            this.time = 0;
            this.mouse = { x: 0, y: 0, tx: 0, ty: 0 };
            this.resize = this.resize.bind(this);
            this.animate = this.animate.bind(this);
            this.draw = this.draw.bind(this);
            this.init();
        }

        init() {
            this.resize();
            window.addEventListener('resize', this.resize, { passive: true });
            this.canvas.addEventListener('pointermove', event => {
                const rect = this.canvas.getBoundingClientRect();
                this.mouse.tx = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
                this.mouse.ty = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
            }, { passive: true });
            this.canvas.addEventListener('pointerleave', () => {
                this.mouse.tx = 0;
                this.mouse.ty = 0;
            }, { passive: true });

            if (prefersReducedMotion) this.draw();
            else this.animate();
        }

        resize() {
            const rect = this.canvas.getBoundingClientRect();
            this.width = Math.max(320, rect.width || window.innerWidth);
            this.height = Math.max(460, rect.height || window.innerHeight);
            this.canvas.width = Math.floor(this.width * this.pixelRatio);
            this.canvas.height = Math.floor(this.height * this.pixelRatio);
            this.ctx.setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0);
            const count = this.width < 760 ? 38 : 78;
            this.points = Array.from({ length: count }, (_, index) => ({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                vx: (Math.random() - 0.5) * 0.22,
                vy: (Math.random() - 0.5) * 0.22,
                size: index % 9 === 0 ? 2.7 : 1.4 + Math.random() * 1.6,
                accent: index % 11 === 0
            }));
            this.draw();
        }

        draw() {
            const ctx = this.ctx;
            ctx.clearRect(0, 0, this.width, this.height);
            this.mouse.x += (this.mouse.tx - this.mouse.x) * 0.055;
            this.mouse.y += (this.mouse.ty - this.mouse.y) * 0.055;

            this.points.forEach(point => {
                if (!prefersReducedMotion) {
                    point.x += point.vx + this.mouse.x * 0.012;
                    point.y += point.vy + this.mouse.y * 0.012;
                    if (point.x < -20) point.x = this.width + 20;
                    if (point.x > this.width + 20) point.x = -20;
                    if (point.y < -20) point.y = this.height + 20;
                    if (point.y > this.height + 20) point.y = -20;
                }
            });

            for (let i = 0; i < this.points.length; i++) {
                for (let j = i + 1; j < this.points.length; j++) {
                    const a = this.points[i];
                    const b = this.points[j];
                    const dx = a.x - b.x;
                    const dy = a.y - b.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    const max = this.width < 760 ? 95 : 145;
                    if (dist < max) {
                        ctx.beginPath();
                        ctx.moveTo(a.x, a.y);
                        ctx.lineTo(b.x, b.y);
                        ctx.strokeStyle = `rgba(245,245,245,${(1 - dist / max) * 0.18})`;
                        ctx.lineWidth = 0.8;
                        ctx.stroke();
                    }
                }
            }

            this.points.forEach(point => {
                ctx.beginPath();
                ctx.arc(point.x, point.y, point.size, 0, Math.PI * 2);
                ctx.fillStyle = point.accent ? 'rgba(245,245,245,0.9)' : 'rgba(245,245,245,0.45)';
                ctx.fill();
            });
        }

        animate() {
            this.time += 16;
            // Skip the (O(n^2)) draw while the fallback canvas is hidden — e.g.
            // once the 3D transformer takes over and sets display:none on it.
            if (!document.hidden && this.canvas.offsetParent !== null) this.draw();
            requestAnimationFrame(this.animate);
        }
    }

    async function fetchJson(url, options) {
        const response = await fetch(url, options);
        if (!response.ok) throw new Error(`${url} returned ${response.status}`);
        return response.json();
    }

    function readRepoCache() {
        try {
            const cached = JSON.parse(localStorage.getItem(repoCacheKey));
            if (!cached || Date.now() - cached.timestamp > repoCacheDuration) return null;
            return cached.data;
        } catch (error) {
            return null;
        }
    }

    function writeRepoCache(data) {
        try {
            localStorage.setItem(repoCacheKey, JSON.stringify({ data, timestamp: Date.now() }));
        } catch (error) {
            // Browsers may block storage in private mode; fetching still works.
        }
    }

    async function loadGitHubProjects() {
        const list = document.getElementById('project-list');
        const source = document.getElementById('github-source');
        const sync = document.getElementById('github-sync');
        const count = document.getElementById('github-count');
        if (!list) return;

        try {
            let data = readRepoCache();
            if (!data) {
                const [user, repos] = await Promise.all([
                    fetchJson(`https://api.github.com/users/${PROFILE.githubUser}`),
                    fetchJson(`https://api.github.com/users/${PROFILE.githubUser}/repos?sort=updated&per_page=30`)
                ]);
                data = { user, repos };
                writeRepoCache(data);
            } else if (source) {
                source.textContent = 'GitHub API cache';
            }

            const repos = (data.repos || [])
                .filter(repo => !repo.fork && repo.name !== PROFILE.githubUser && repo.name !== `${PROFILE.githubUser}.github.io`)
                .sort((a, b) => scoreRepo(b) - scoreRepo(a))
                .slice(0, 6);

            if (count) count.textContent = `${data.user.public_repos || repos.length} public repos`;
            if (sync) sync.textContent = new Date().toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

            if (!repos.length) {
                list.innerHTML = `<div class="empty-state">No public repositories were returned. Visit <a href="${PROFILE.githubUrl}" target="_blank" rel="noopener noreferrer">GitHub</a>.</div>`;
                return;
            }

            list.innerHTML = repos.map(repo => renderRepo(repo)).join('');
        } catch (error) {
            if (source) source.textContent = 'Fallback link';
            if (sync) sync.textContent = 'Unavailable';
            if (count) count.textContent = 'View profile';
            list.innerHTML = `
                <div class="error-state">
                    GitHub data could not be loaded from this browser. Open the full project list at
                    <a href="${PROFILE.githubUrl}" target="_blank" rel="noopener noreferrer">github.com/${PROFILE.githubUser}</a>.
                </div>
            `;
        }
    }

    function scoreRepo(repo) {
        const updated = new Date(repo.pushed_at || repo.updated_at || 0).getTime();
        const recency = Number.isFinite(updated) ? updated / 100000000000 : 0;
        return (repo.stargazers_count || 0) * 10 + (repo.forks_count || 0) * 3 + recency;
    }

    function renderRepo(repo) {
        const topics = Array.isArray(repo.topics) ? repo.topics.slice(0, 3) : [];
        const updated = repo.pushed_at || repo.updated_at;
        const meta = [
            repo.language || 'Code',
            `${repo.stargazers_count || 0} stars`,
            `${repo.forks_count || 0} forks`,
            updated ? `Updated ${formatDate(updated)}` : null
        ].filter(Boolean);

        return `
            <a class="project-row" href="${escapeAttr(repo.html_url)}" target="_blank" rel="noopener noreferrer">
                <div>
                    <h3>${escapeHtml(repo.name)}</h3>
                    <p>${escapeHtml(repo.description || 'Public GitHub project from the live repository feed.')}</p>
                    <div class="project-meta">
                        ${meta.map(item => `<span>${escapeHtml(item)}</span>`).join('')}
                        ${topics.map(topic => `<span class="topic-pill">${escapeHtml(topic)}</span>`).join('')}
                    </div>
                </div>
                <span class="project-arrow" aria-hidden="true">-></span>
            </a>
        `;
    }

    async function loadPublications() {
        const list = document.getElementById('publication-list');
        const sync = document.getElementById('publication-sync');
        if (!list) return;

        let data = readInlinePublications();
        try {
            if (window.location.protocol !== 'file:') {
                data = await fetchJson('data/publications.json');
            }
        } catch (error) {
            // Inline JSON is kept as a static fallback and is updated by the workflow.
        }

        const publications = Array.isArray(data.publications) ? data.publications : [];
        if (sync) {
            const label = data.lastUpdated ? `Updated ${formatDate(data.lastUpdated)}` : 'Static profile data';
            sync.textContent = `${label} - ${publications.length} items`;
        }

        if (!publications.length) {
            list.innerHTML = `
                <div class="empty-state">
                    No publications are available in the local feed yet. Open
                    <a href="${PROFILE.openReviewUrl}" target="_blank" rel="noopener noreferrer">OpenReview</a>.
                </div>
            `;
            return;
        }

        list.innerHTML = publications.map(renderPublication).join('');
        list.querySelectorAll('.reveal').forEach(el => el.classList.add('in-view'));
    }

    function readInlinePublications() {
        try {
            const script = document.getElementById('publications-data');
            return script ? JSON.parse(script.textContent) : { publications: [] };
        } catch (error) {
            return { publications: [] };
        }
    }

    function renderPublication(publication) {
        const title = publication.title || 'Untitled publication';
        const url = publication.openreviewUrl || PROFILE.openReviewUrl;
        const authors = Array.isArray(publication.authors) ? publication.authors.join(', ') : 'Ho Tin Ko';
        const tags = normalizeTags(publication.tags).slice(0, 4);
        const meta = [publication.venue || 'OpenReview', publication.year || null, publication.status || null].filter(Boolean);
        const abstract = publication.abstract || 'Research publication available on OpenReview.';
        const isLongAbstract = abstract.length > 220;
        const abstractPreview = isLongAbstract ? abstract.slice(0, 217) : abstract;

        return `
        <article class="publication-row reveal" tabindex="0" aria-expanded="false" data-full="${escapeAttr(abstract)}" data-preview="${escapeAttr(abstractPreview + (isLongAbstract ? '…' : ''))}">
            <div>
                <h3>${escapeHtml(title)}</h3>
                <p>${escapeHtml(abstractPreview)}${isLongAbstract ? '&hellip;' : ''}</p>
                <div class="publication-meta">
                    ${meta.map(item => `<span>${escapeHtml(String(item))}</span>`).join('')}
                    <span>${escapeHtml(authors)}</span>
                    ${tags.map(tag => `<span class="topic-pill">${escapeHtml(tag)}</span>`).join('')}
                </div>
                <a class="meta-link" href="${escapeAttr(url)}" target="_blank" rel="noopener noreferrer">Open on OpenReview</a>
            </div>
            <span class="publication-arrow" aria-hidden="true">+</span>
        </article>`;
    }

    function normalizeTags(tags) {
        if (!Array.isArray(tags)) return [];
        return tags.flatMap(tag => String(tag).split(';')).map(tag => tag.trim()).filter(Boolean);
    }

    function formatDate(value) {
        try {
            return new Intl.DateTimeFormat([], { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(value));
        } catch (error) {
            return String(value);
        }
    }

    function escapeHtml(value) {
        return String(value)
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');
    }

    function escapeAttr(value) {
        return escapeHtml(value);
    }

    function initPublicationExpand() {
        const toggleRow = row => {
            const p = row.querySelector('p');
            const open = row.classList.toggle('is-open');
            p.textContent = open ? row.dataset.full : row.dataset.preview;
            row.setAttribute('aria-expanded', String(open));
            const arrow = row.querySelector('.publication-arrow');
            if (arrow) arrow.textContent = open ? '–' : '+';
        };
        document.addEventListener('click', event => {
            const row = event.target.closest('.publication-row');
            if (!row || event.target.closest('a')) return;
            toggleRow(row);
        });
        document.addEventListener('keydown', event => {
            if (event.key !== 'Enter' && event.key !== ' ') return;
            const row = event.target.closest('.publication-row');
            if (!row || row !== event.target || event.target.closest('a')) return;
            event.preventDefault();
            toggleRow(row);
        });
    }

    // ── Practice trail (LeetCode + Kaggle) ──────────────────────────
    // Static, honest "where I practice" cards rendered from the inline
    // #profiles-data block (same idiom as #publications-data). We show counts
    // of things done and omit floor-level ranks/reputation by design.
    const TIER_LADDER = ['Novice', 'Contributor', 'Expert', 'Master', 'Grandmaster'];
    const TIER_ABBR = { Novice: 'Nov', Contributor: 'Con', Expert: 'Exp', Master: 'Mas', Grandmaster: 'GM' };

    function readInlineProfiles() {
        try {
            const script = document.getElementById('profiles-data');
            return script ? JSON.parse(script.textContent) : null;
        } catch (error) {
            return null;
        }
    }

    function loadProfiles() {
        const list = document.getElementById('practice-list');
        if (!list) return;

        const data = readInlineProfiles();
        if (!data || (!data.leetcode && !data.kaggle)) {
            list.innerHTML = '<div class="empty-state">Practice profile data is unavailable.</div>';
            return;
        }

        const cards = [];
        if (data.leetcode) cards.push(renderLeetCard(data.leetcode));
        if (data.kaggle) cards.push(renderKaggleCard(data.kaggle));
        list.innerHTML = cards.join('');
        // Cards are injected after the IntersectionObserver was wired, so reveal them now.
        list.querySelectorAll('.reveal').forEach(el => el.classList.add('in-view'));
    }

    function renderLeetCard(lc) {
        const d = lc.byDifficulty || {};
        const easy = d.easy || 0;
        const medium = d.medium || 0;
        const hard = d.hard || 0;
        const total = easy + medium + hard;
        const pct = value => (total > 0 ? (value / total) * 100 : 0).toFixed(1);
        const solved = String(lc.solved != null ? lc.solved : total).padStart(2, '0');
        const foot = [
            lc.submissions != null ? `${lc.submissions} submissions` : null,
            lc.activePeriod ? `active ${lc.activePeriod}` : null
        ].filter(Boolean).join(' · ');

        return `
        <a class="practice-card reveal" href="${escapeAttr(lc.url)}" target="_blank" rel="noopener noreferrer">
            <header class="practice-card__head">
                <span class="practice-card__brand">LeetCode</span>
                <span class="practice-card__handle">@${escapeHtml(lc.handle)} <span class="practice-card__go" aria-hidden="true">-&gt;</span></span>
            </header>
            <div class="practice-stat">
                <span class="practice-stat__num">${escapeHtml(solved)}</span>
                <span class="practice-stat__label">problems solved</span>
            </div>
            <div class="diffbar" role="img" aria-label="${easy} Easy, ${medium} Medium, ${hard} Hard solved">
                <span class="diffbar__seg diffbar__seg--easy" style="width:${pct(easy)}%"></span>
                <span class="diffbar__seg diffbar__seg--med" style="width:${pct(medium)}%"></span>
                <span class="diffbar__seg diffbar__seg--hard" style="width:${pct(hard)}%"></span>
            </div>
            <ul class="practice-legend" aria-hidden="true">
                <li><i class="legend-dot legend-dot--easy"></i>${easy} Easy</li>
                <li><i class="legend-dot legend-dot--med"></i>${medium} Medium</li>
                <li><i class="legend-dot legend-dot--hard"></i>${hard} Hard</li>
            </ul>
            ${foot ? `<p class="practice-foot">${escapeHtml(foot)}</p>` : ''}
        </a>`;
    }

    function renderKaggleCard(kg) {
        const tier = kg.tier || 'Novice';
        const idx = Math.max(0, TIER_LADDER.indexOf(tier));
        const cats = Array.isArray(kg.categories) ? kg.categories.map(c => String(c).toLowerCase()).join(' · ') : '';
        const nodes = TIER_LADDER.map((name, i) => {
            const state = i === idx ? ' is-current' : (i < idx ? ' is-passed' : '');
            const current = i === idx ? ' aria-current="true"' : '';
            return `
                <li class="tierladder__node${state}"${current}>
                    <i class="tierladder__dot" aria-hidden="true"></i>
                    <span class="tierladder__abbr">${escapeHtml(TIER_ABBR[name] || name)}</span>
                </li>`;
        }).join('');
        const foot = [
            kg.badges != null ? `${kg.badges} badges` : null,
            kg.competitions != null ? `${kg.competitions} competition${kg.competitions === 1 ? '' : 's'}` : null,
            kg.memberSince != null ? `member since ${kg.memberSince}` : null
        ].filter(Boolean).join(' · ');

        return `
        <a class="practice-card reveal" href="${escapeAttr(kg.url)}" target="_blank" rel="noopener noreferrer">
            <header class="practice-card__head">
                <span class="practice-card__brand">Kaggle</span>
                <span class="practice-card__handle">@${escapeHtml(kg.handle)} <span class="practice-card__go" aria-hidden="true">-&gt;</span></span>
            </header>
            <div class="practice-stat">
                <span class="practice-stat__num practice-stat__num--tier">${escapeHtml(tier)}</span>
                <span class="practice-stat__label">${escapeHtml(cats)}</span>
            </div>
            <ol class="tierladder" role="img" aria-label="Kaggle tier: ${escapeAttr(tier)} (${idx + 1} of ${TIER_LADDER.length})">
                ${nodes}
            </ol>
            ${foot ? `<p class="practice-foot">${escapeHtml(foot)}</p>` : ''}
        </a>`;
    }

    function initFooterYear() {
        const year = document.getElementById('footer-year');
        if (year) year.textContent = String(new Date().getFullYear());
    }

    function initScrollProgress() {
        const bar = document.querySelector('.scroll-progress');
        if (!bar) return;
        let ticking = false;
        const update = () => {
            const h = document.documentElement;
            const max = h.scrollHeight - h.clientHeight;
            bar.style.width = `${max > 0 ? (h.scrollTop / max) * 100 : 0}%`;
            ticking = false;
        };
        update();
        window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    }

    function initActiveNav() {
        const links = [...document.querySelectorAll('[data-nav] a[href^="#"]')];
        const map = new Map();
        links.forEach(a => { const el = document.querySelector(a.getAttribute('href')); if (el) map.set(el, a); });
        if (!map.size || !('IntersectionObserver' in window)) return;
        const obs = new IntersectionObserver(entries => {
            entries.forEach(e => { if (e.isIntersecting) {
                links.forEach(l => l.classList.remove('is-active'));
                map.get(e.target)?.classList.add('is-active');
            }});
        }, { rootMargin: '-50% 0px -50% 0px' });
        map.forEach((_, el) => obs.observe(el));
    }

    document.addEventListener('DOMContentLoaded', () => {
        initHeader();
        initReveal();
        initFooterYear();
        initScrollProgress();
        initActiveNav();
        loadGitHubProjects();
        loadPublications();
        loadProfiles();
        initPublicationExpand();
        initCursor();
        initTilt();
        initParallax();

        const heroCanvas = document.getElementById('hero-field');
        if (heroCanvas) new HeroField(heroCanvas);
    });
})();
