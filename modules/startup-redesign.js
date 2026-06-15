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
        if (!header || !toggle || !nav) return;

        const setScrolled = () => {
            header.classList.toggle('is-scrolled', window.scrollY > 20);
        };
        setScrolled();
        window.addEventListener('scroll', setScrolled, { passive: true });

        toggle.addEventListener('click', () => {
            const isOpen = nav.classList.toggle('is-open');
            toggle.setAttribute('aria-expanded', String(isOpen));
        });

        nav.addEventListener('click', event => {
            if (!event.target.closest('a')) return;
            nav.classList.remove('is-open');
            toggle.setAttribute('aria-expanded', 'false');
        });
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

    const FANCY_TARGETS = 'a, button, .project-row, .publication-row, .profile-link, .timeline-item, .nav-toggle';
    const TILT_TARGETS = '.project-row, .publication-row, .profile-link, .timeline-item';

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
                        ctx.strokeStyle = `rgba(124, 156, 255, ${(1 - dist / max) * 0.22})`;
                        ctx.lineWidth = 0.8;
                        ctx.stroke();
                    }
                }
            }

            this.points.forEach(point => {
                ctx.beginPath();
                ctx.arc(point.x, point.y, point.size, 0, Math.PI * 2);
                ctx.fillStyle = point.accent ? 'rgba(240, 201, 135, 0.85)' : 'rgba(124, 156, 255, 0.5)';
                ctx.fill();
            });
        }

        animate() {
            this.time += 16;
            // Skip the (O(n^2)) draw while the fallback canvas is hidden — e.g.
            // once the 3D transformer takes over and sets display:none on it.
            if (this.canvas.offsetParent !== null) this.draw();
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
            <a class="publication-row" href="${escapeAttr(url)}" target="_blank" rel="noopener noreferrer">
                <div>
                    <h3>${escapeHtml(title)}</h3>
                    <p>${escapeHtml(abstractPreview)}${isLongAbstract ? '&hellip;' : ''}</p>
                    <div class="publication-meta">
                        ${meta.map(item => `<span>${escapeHtml(String(item))}</span>`).join('')}
                        <span>${escapeHtml(authors)}</span>
                        ${tags.map(tag => `<span class="topic-pill">${escapeHtml(tag)}</span>`).join('')}
                    </div>
                </div>
                <span class="publication-arrow" aria-hidden="true">-></span>
            </a>
        `;
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

    function initFooterYear() {
        const year = document.getElementById('footer-year');
        if (year) year.textContent = String(new Date().getFullYear());
    }

    document.addEventListener('DOMContentLoaded', () => {
        initHeader();
        initReveal();
        initFooterYear();
        loadGitHubProjects();
        loadPublications();
        initCursor();
        initTilt();
        initParallax();

        const heroCanvas = document.getElementById('hero-field');
        if (heroCanvas) new HeroField(heroCanvas);
    });
})();
