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
    const allowFancyCursor = !prefersReducedMotion && !isTouch;
    const repoCacheKey = 'ko_profile_github_repos_v4';
    const repoCacheDuration = 15 * 60 * 1000;

    const SELF_NAMES = ['Ho Tin Ko', 'KO Ho Tin'];
    const PAGE_SIZES = { publications: 8, writings: 12, competitions: 8 };
    const MEDAL_ORDER = { gold: 0, silver: 1, bronze: 2 };

    const CURATED_PROJECTS = [
        {
            fullName: 'CityU-MLO/qfinzero',
            owner: 'CityU-MLO',
            name: 'qfinzero',
            role: 'Co-First Author',
            language: 'Python',
            description: 'Unified financial toolchain & stateful brokerage simulation environment (UPQ, NPP, PMB) for LLM-based trading agents (ACL 2026 Demo).',
            topics: ['LLM Agents', 'MCP', 'Quant Finance'],
            html_url: 'https://github.com/CityU-MLO/qfinzero',
            paperUrl: 'https://aclanthology.org/2026.acl-demo.7.pdf',
            stargazers_count: 0,
            forks_count: 0
        },
        {
            fullName: 'CityU-MLO/AlphaBench',
            owner: 'CityU-MLO',
            name: 'AlphaBench',
            role: 'Co-Author',
            language: 'Python',
            description: 'Systematic closed-loop benchmark for evaluating LLMs in formulaic alpha-factor mining across Qlib and Assay backtesting engines (ICLR 2026).',
            topics: ['Benchmark', 'Alpha Mining', 'ICLR 2026'],
            html_url: 'https://github.com/CityU-MLO/AlphaBench',
            websiteUrl: 'https://alphabench.cc/',
            paperUrl: 'https://openreview.net/pdf?id=d97Q8r7ZKZ',
            stargazers_count: 0,
            forks_count: 0
        },
        {
            fullName: 'B143KC47/claudeCO-webui',
            owner: 'B143KC47',
            name: 'claudeCO-webui',
            role: 'Author',
            language: 'TypeScript',
            description: 'Full-featured web interface for Claude Code with integrated terminal, file workspace, session persistence, and MCP server management.',
            topics: ['React', 'TypeScript', 'MCP'],
            html_url: 'https://github.com/B143KC47/claudeCO-webui',
            stargazers_count: 0,
            forks_count: 0
        },
        {
            fullName: 'B143KC47/deep-research-skill',
            owner: 'B143KC47',
            name: 'deep-research-skill',
            role: 'Author',
            language: 'Python',
            description: 'Evidence-first deep research agent skill featuring source tracking, inline citations, contradiction checks, and uncertainty-aware synthesis.',
            topics: ['AI Agents', 'Research', 'CLI'],
            html_url: 'https://github.com/B143KC47/deep-research-skill',
            stargazers_count: 0,
            forks_count: 0
        },
        {
            fullName: 'B143KC47/Ultratranslate',
            owner: 'B143KC47',
            name: 'Ultratranslate',
            role: 'Author',
            language: 'JavaScript',
            description: 'Chrome MV3 extension for in-place DOM translation powered by DeepSeek, OpenAI, Google, and Baidu APIs.',
            topics: ['Chrome MV3', 'LLM Translation'],
            html_url: 'https://github.com/B143KC47/Ultratranslate',
            stargazers_count: 0,
            forks_count: 0
        },
        {
            fullName: 'B143KC47/VSC4T',
            owner: 'B143KC47',
            name: 'VSC4T',
            role: 'Author',
            language: 'CSS',
            description: 'Minimalist dark Hexo blog theme inspired by Visual Studio Code with clean code typography and responsive navigation.',
            topics: ['Hexo Theme', 'Design'],
            html_url: 'https://github.com/B143KC47/VSC4T',
            stargazers_count: 0,
            forks_count: 0
        }
    ];

    const CATEGORY_NORMALIZE = {
        'Neuro Sceince': 'Neuroscience',
        'Neural-Networks-Zero-to-Hero': 'Neural Networks: Zero to Hero',
        'Generative AI in Finance': 'Generative AI in Finance',
        '持续学习': 'Continual Learning',
        'Cognitive Science': 'Cognitive Science'
    };

    const BLOG_TITLE_OVERRIDES = {
        Alphabench: 'AlphaBench — Paper & Architecture Notes',
        Evoalpha: 'EvoAlpha — Evolutionary Alpha Factor Notes',
        Qfinzero: 'QFinZero — Financial Toolchain Notes',
        micrograd: 'micrograd — Autograd Engine from Scratch',
        Roadmap: 'Neuroscience & AI Study Roadmap'
    };

    const BLOG_SUMMARY_OVERRIDES = {
        'Cognitive Science': 'Reading and conceptual notes on human cognition, memory, and learning frameworks.',
        '持续学习': 'Notes on continual learning, overcoming catastrophic forgetting, and lifelong model adaptation.',
        Roadmap: 'Structured study roadmap connecting computational neuroscience and modern deep learning.',
        micrograd: 'Walkthrough implementing scalar autograd and backpropagation from scratch following Zero to Hero.',
        Alphabench: 'Research notes on evaluating LLMs in formulaic alpha mining across generation, evaluation, and search.',
        Evoalpha: 'Notes on LLM-guided evolutionary operators for interpretable alpha-factor discovery.',
        Qfinzero: 'System notes covering unified market data, news retrieval, and brokerage simulation primitives.'
    };

    // ── Theme & Print ───────────────────────────────────────────────
    function initTheme() {
        const btn = document.getElementById('theme-toggle');
        const mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
        const systemTheme = () => (mq && mq.matches ? 'dark' : 'light');
        const current = () => (document.documentElement.dataset.theme === 'light' ? 'light' : 'dark');

        try { localStorage.removeItem('theme'); } catch (error) { /* private mode */ }

        const applyTheme = theme => {
            document.documentElement.dataset.theme = theme;
            const themeColor = document.querySelector('meta[name="theme-color"]');
            if (themeColor) themeColor.setAttribute('content', theme === 'light' ? '#f8f9fa' : '#000000');
            if (btn) {
                const label = `Switch to ${theme === 'light' ? 'dark' : 'light'} mode`;
                btn.setAttribute('aria-pressed', String(theme === 'light'));
                btn.setAttribute('aria-label', label);
                btn.setAttribute('title', label);
            }
        };

        let saved = null;
        try { saved = localStorage.getItem('theme-preference'); } catch (error) { /* private mode */ }
        applyTheme((saved === 'dark' || saved === 'light') ? saved : systemTheme());

        if (mq) {
            const onSystemChange = event => {
                let manual = null;
                try { manual = localStorage.getItem('theme-preference'); } catch (error) { /* private mode */ }
                if (manual !== 'dark' && manual !== 'light') {
                    applyTheme(event.matches ? 'dark' : 'light');
                }
            };
            if (mq.addEventListener) mq.addEventListener('change', onSystemChange);
            else if (mq.addListener) mq.addListener(onSystemChange);
        }

        if (!btn) return;
        btn.addEventListener('click', () => {
            const next = current() === 'light' ? 'dark' : 'light';
            try {
                if (next === systemTheme()) localStorage.removeItem('theme-preference');
                else localStorage.setItem('theme-preference', next);
            } catch (error) { /* private mode */ }
            applyTheme(next);
        });
    }

    function initPrint() {
        const buttons = document.querySelectorAll('[data-print-cv]');
        if (!buttons.length) return;
        const triggerPrint = () => {
            window.print();
        };
        buttons.forEach(btn => btn.addEventListener('click', triggerPrint));
    }

    // ── Sticky Header ───────────────────────────────────────────────
    function initHeader() {
        const header = document.querySelector('[data-header]');
        if (!header) return;

        const setScrolled = () => {
            header.classList.toggle('is-scrolled', window.scrollY > 12);
        };
        setScrolled();
        window.addEventListener('scroll', setScrolled, { passive: true });
    }

    function initReveal() {
        const elements = document.querySelectorAll('.reveal');
        if (!elements.length) return;
        if (prefersReducedMotion || !('IntersectionObserver' in window)) {
            elements.forEach(el => el.classList.add('in-view'));
            return;
        }
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('in-view');
                observer.unobserve(entry.target);
            });
        }, { threshold: 0.05, rootMargin: '0px 0px -20px' });
        elements.forEach(el => observer.observe(el));
    }

    // ── Subtle Monochrome Cursor (no 3D card tilt) ──────────────────
    const CURSOR_TARGETS = 'a, button';

    function initCursor() {
        if (!allowFancyCursor) return;
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
            ringX += (mouseX - ringX) * 0.22;
            ringY += (mouseY - ringY) * 0.22;
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
            if (event.target.closest(CURSOR_TARGETS)) ring.classList.add('cursor-hover');
        }, { passive: true });
        document.addEventListener('pointerout', event => {
            if (event.target.closest(CURSOR_TARGETS)) ring.classList.remove('cursor-hover');
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

    // ── Data Helpers ────────────────────────────────────────────────
    async function fetchJson(url, options) {
        const response = await fetch(url, options);
        if (!response.ok) throw new Error(`${url} returned ${response.status}`);
        return response.json();
    }

    function readInlineJson(id, fallback) {
        try {
            const script = document.getElementById(id);
            return script ? JSON.parse(script.textContent) : fallback;
        } catch (error) {
            return fallback;
        }
    }

    function formatDate(value) {
        try {
            return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(value));
        } catch (error) {
            return String(value);
        }
    }

    function formatMonthYear(value) {
        try {
            return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short' }).format(new Date(value));
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

    function mountPager(list, total, perPage, page, onPage) {
        let pager = list.nextElementSibling;
        if (!pager || !pager.classList.contains('list-pager')) {
            pager = document.createElement('div');
            pager.className = 'list-pager';
            list.insertAdjacentElement('afterend', pager);
        }
        const pages = Math.ceil(total / perPage);
        if (pages <= 1) {
            pager.remove();
            return;
        }
        pager.innerHTML = `
            <button type="button" class="list-pager__btn" data-dir="-1" ${page <= 0 ? 'disabled' : ''} aria-label="Previous page">[&larr; Prev]</button>
            <span class="list-pager__info">${page + 1} / ${pages} &middot; ${total} items</span>
            <button type="button" class="list-pager__btn" data-dir="1" ${page >= pages - 1 ? 'disabled' : ''} aria-label="Next page">[Next &rarr;]</button>`;
        pager.querySelectorAll('.list-pager__btn').forEach(btn => {
            btn.addEventListener('click', () => onPage(page + Number(btn.dataset.dir)));
        });
    }

    // ── 03. Selected Publications (luost26/academic-homepage layout) ──
    async function loadPaperFigures() {
        let data = readInlineJson('paper-figures-data', { figures: {} });
        try {
            if (window.location.protocol !== 'file:') {
                data = await fetchJson('data/paper-figures.json');
            }
        } catch (error) { /* inline fallback */ }
        return data && data.figures ? data.figures : {};
    }

    function renderAuthors(publication) {
        const list = Array.isArray(publication.authors) && publication.authors.length ? publication.authors : ['Ho Tin Ko'];
        const equal = new Set(Array.isArray(publication.equalContribution) ? publication.equalContribution : []);
        return list
            .map(name => {
                const star = equal.has(name) ? '*' : '';
                return SELF_NAMES.includes(name)
                    ? `<strong class="pub-self-author">${escapeHtml(name)}${star}</strong>`
                    : `${escapeHtml(name)}${star}`;
            })
            .join(', ');
    }

    function formatVenueDisplay(venue, year) {
        const v = String(venue || '').trim();
        if (/ACL\s*2026/i.test(v)) {
            return { venueName: 'Annual Meeting of the Association for Computational Linguistics (ACL System Demonstrations)', yearText: '2026' };
        }
        if (/ICLR\s*2026/i.test(v)) {
            return { venueName: 'International Conference on Learning Representations (ICLR)', yearText: '2026' };
        }
        if (/GenAI in Finance/i.test(v) || /NeurIPS\s*2025/i.test(v)) {
            return { venueName: 'NeurIPS Workshop on Generative AI in Finance (GenAI in Finance)', yearText: '2025' };
        }
        return { venueName: v || 'Publication', yearText: year ? String(year) : '' };
    }

    function cleanAbstractText(raw) {
        return String(raw || '')
            .replace(/\$\\ell_0\$/g, 'ℓ₀')
            .replace(/\$([^$]+)\$/g, '$1')
            .trim();
    }

    function renderPublication(publication, figure) {
        const title = publication.title || 'Untitled publication';
        const vInfo = formatVenueDisplay(publication.venue, publication.year);
        const abstract = publication.abstract || 'Research publication available online.';
        const hasEqual = Array.isArray(publication.equalContribution) && publication.equalContribution.length > 0;

        const pubUrl = publication.openreviewUrl || PROFILE.openReviewUrl;
        const paperHref = figure.pdfUrl || pubUrl;
        const forumLabel = pubUrl.includes('openreview.net') ? 'OpenReview'
            : pubUrl.includes('aclanthology.org') ? 'Anthology' : null;
        const links = [
            ['Paper', paperHref],
            (figure.pdfUrl && pubUrl && figure.pdfUrl !== pubUrl && forumLabel) ? [forumLabel, pubUrl] : null,
            figure.projectUrl ? ['Website', figure.projectUrl] : null,
            figure.codeUrl ? ['Code', figure.codeUrl] : null
        ].filter(Boolean);

        const figSrc = figure.src ? `${figure.src}${figure.src.includes('?') ? '&' : '?'}v=2` : '';

        return `
        <article class="pub-row">
            <div class="pub-row__thumb">
                ${figSrc
                    ? `<img class="pub-row__img" src="${escapeAttr(figSrc)}" alt="${escapeAttr(figure.caption || title)}" loading="lazy" decoding="async">`
                    : `<div class="pub-row__placeholder">${escapeHtml(vInfo.yearText || 'Paper')}</div>`}
            </div>
            <div class="pub-row__body">
                <h3 class="pub-row__title"><a href="${escapeAttr(paperHref)}" target="_blank" rel="noopener noreferrer">${escapeHtml(title)}</a></h3>
                <p class="pub-row__authors">${renderAuthors(publication)}${hasEqual ? ' <span class="pub-row__equal">(<i>* equal contribution</i>)</span>' : ''}</p>
                <p class="pub-row__venue"><i>${escapeHtml(vInfo.venueName)}</i>${vInfo.yearText ? ` ${escapeHtml(vInfo.yearText)}` : ''}</p>
                <p class="pub-row__abstract">${escapeHtml(cleanAbstractText(abstract))}</p>
                <p class="cv-item-links">
                    ${links.map(([label, url]) => `<a class="cv-bracket-btn" href="${escapeAttr(url)}" target="_blank" rel="noopener noreferrer">[${escapeHtml(label)}]</a>`).join(' ')}
                </p>
            </div>
        </article>`;
    }

    async function loadPublications() {
        const list = document.getElementById('publication-list');
        if (!list) return;

        let data = readInlineJson('publications-data', { publications: [] });
        try {
            if (window.location.protocol !== 'file:') {
                data = await fetchJson('data/publications.json');
            }
        } catch (error) { /* inline fallback */ }

        const figures = await loadPaperFigures();
        const publications = Array.isArray(data.publications) ? data.publications : [];

        if (!publications.length) {
            list.innerHTML = `<div class="empty-state">No publications in local feed. View <a href="${PROFILE.openReviewUrl}" target="_blank" rel="noopener noreferrer">OpenReview</a>.</div>`;
            return;
        }

        let page = 0;
        const renderPage = () => {
            const slice = publications.slice(page * PAGE_SIZES.publications, (page + 1) * PAGE_SIZES.publications);
            list.innerHTML = slice.map(pub => renderPublication(pub, figures[pub.id] || {})).join('');
            mountPager(list, publications.length, PAGE_SIZES.publications, page, p => { page = p; renderPage(); });
        };
        renderPage();
    }

    async function loadPublicationsArchive() {
        const archive = document.querySelector('[data-pub-archive]');
        const yearNav = document.querySelector('[data-pub-year-nav]');
        if (!archive) return;

        let data = readInlineJson('publications-data', { publications: [] });
        try {
            if (window.location.protocol !== 'file:') {
                data = await fetchJson('data/publications.json');
            }
        } catch (error) { /* inline fallback */ }

        const figures = await loadPaperFigures();
        const publications = Array.isArray(data.publications) ? data.publications : [];

        if (!publications.length) {
            archive.innerHTML = `<div class="cv-card cv-flush-card"><div class="empty-state">No publications in local feed. View <a href="${PROFILE.openReviewUrl}" target="_blank" rel="noopener noreferrer">OpenReview</a>.</div></div>`;
            if (yearNav) yearNav.innerHTML = '';
            return;
        }

        const byYear = new Map();
        publications.forEach(pub => {
            const yr = formatVenueDisplay(pub.venue, pub.year).yearText || String(pub.year || 'Other');
            if (!byYear.has(yr)) byYear.set(yr, []);
            byYear.get(yr).push(pub);
        });

        const years = [...byYear.keys()].sort((a, b) => (Number(b) || 0) - (Number(a) || 0));

        archive.innerHTML = years.map(yr => `
            <section id="year-${escapeAttr(yr)}" class="pub-year-section">
                <h2 class="pub-year-heading">${escapeHtml(yr)}</h2>
                <div class="cv-card cv-flush-card pub-list">
                    ${byYear.get(yr).map(pub => renderPublication(pub, figures[pub.id] || {})).join('')}
                </div>
            </section>`).join('');

        if (yearNav) {
            yearNav.innerHTML = years
                .map((yr, i) => `<a class="pub-year-link${i === 0 ? ' is-active' : ''}" href="#year-${escapeAttr(yr)}">${escapeHtml(yr)}</a>`)
                .join('');

            const yearLinks = [...yearNav.querySelectorAll('.pub-year-link')];
            const setActive = id => {
                yearLinks.forEach(link => link.classList.toggle('is-active', link.getAttribute('href') === `#${id}`));
            };

            yearNav.addEventListener('click', event => {
                const link = event.target.closest('.pub-year-link');
                if (!link) return;
                const href = link.getAttribute('href') || '';
                if (href.startsWith('#')) setActive(href.slice(1));
            });

            if ('IntersectionObserver' in window) {
                const sections = [...archive.querySelectorAll('.pub-year-section')];
                const obs = new IntersectionObserver(entries => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) setActive(entry.target.id);
                    });
                }, { rootMargin: '-20% 0px -65% 0px' });
                sections.forEach(sec => obs.observe(sec));
            }
        }
    }

    // ── 04. Kaggle Competitions ─────────────────────────────────────
    function sortCompetitionsForCv(comps) {
        return [...comps].sort((a, b) => {
            const ma = MEDAL_ORDER[String(a.medal || '').toLowerCase()] ?? 99;
            const mb = MEDAL_ORDER[String(b.medal || '').toLowerCase()] ?? 99;
            if (ma !== mb) return ma - mb;

            const rankA = a.privateRank ?? a.rank;
            const rankB = b.privateRank ?? b.rank;
            const hasRankA = rankA != null && a.teamCount;
            const hasRankB = rankB != null && b.teamCount;
            if (hasRankA !== hasRankB) return hasRankA ? -1 : 1;
            if (hasRankA && hasRankB) {
                const pctA = rankA / a.teamCount;
                const pctB = rankB / b.teamCount;
                if (Math.abs(pctA - pctB) > 0.0001) return pctA - pctB;
            }
            return (b.submissions || 0) - (a.submissions || 0);
        });
    }

    const MEDAL_PALETTES = {
        gold:   { ribL: '#b45309', ribR: '#d97706', rim: '#b45309', face: '#f59e0b', shine: '#fef08a', ring: '#fffbeb' },
        silver: { ribL: '#64748b', ribR: '#94a3b8', rim: '#7b8798', face: '#cbd5e1', shine: '#f1f5f9', ring: '#f8fafc' },
        bronze: { ribL: '#7c2d12', ribR: '#b45309', rim: '#9a3412', face: '#d97706', shine: '#fed7aa', ring: '#fff7ed' }
    };

    function renderMedalIcon(medal, size = 18) {
        const p = MEDAL_PALETTES[medal] || MEDAL_PALETTES.silver;
        const label = `${medal.charAt(0).toUpperCase()}${medal.slice(1)} Medal`;
        return `<svg class="kaggle-medal-icon" width="${size}" height="${size}" viewBox="0 0 24 24" role="img" aria-label="${escapeAttr(label)}"><title>${escapeHtml(label)}</title><path d="M8.2 13.8L5.8 21.5l4.2-2.1 1.5 2.4 1.8-6.2z" fill="${p.ribL}"/><path d="M15.8 13.8l2.4 7.7-4.2-2.1-1.5 2.4-1.8-6.2z" fill="${p.ribR}"/><circle cx="12" cy="9.5" r="7.2" fill="${p.rim}"/><circle cx="12" cy="9.5" r="6.2" fill="${p.face}"/><path d="M7.6 5.1a6.2 6.2 0 0 1 8.8 0 6.2 6.2 0 0 0-8.8 8.8 6.2 6.2 0 0 1 0-8.8z" fill="${p.shine}"/><circle cx="12" cy="9.5" r="4.6" fill="none" stroke="${p.ring}" stroke-width="0.9" opacity="0.9"/><polygon points="12,6.1 12.95,8.15 15.2,8.42 13.55,9.95 13.98,12.18 12,11.08 10.02,12.18 10.45,9.95 8.8,8.42 11.05,8.15" fill="#ffffff"/></svg>`;
    }

    function resolveCompOrgLogo(c) {
        if (String(c.organization || '').toLowerCase() === 'kaggle') {
            return 'assets/logos/kaggle.svg?v=2';
        }
        return c.orgLogo || '';
    }

    function renderCompetition(c) {
        const writeups = Array.isArray(c.writeups) ? c.writeups : [];
        const url = c.url || 'https://www.kaggle.com/b14ckc4tmr/competitions';
        const orgLogoSrc = resolveCompOrgLogo(c);
        const medal = ['gold', 'silver', 'bronze'].includes(String(c.medal || '').toLowerCase())
            ? String(c.medal).toLowerCase()
            : '';
        const medalLabel = medal ? `${medal.charAt(0).toUpperCase()}${medal.slice(1)} Medal` : '';

        const yearMatch = String(c.started || c.deadline || '').match(/^\d{4}/);
        const compYear = yearMatch ? yearMatch[0] : '';
        const orgSub = [c.organization || 'Kaggle', c.category || null].filter(Boolean).join(' · ');

        const activeRank = c.privateRank ?? c.rank;
        const pctVal = (activeRank != null && c.teamCount)
            ? Math.max((activeRank / c.teamCount) * 100, 0.1)
            : null;
        const pctText = pctVal != null ? `Top ${pctVal.toFixed(1)}%` : '';

        const badgeHtml = medal
            ? `<span class="comp-badge comp-badge--medal" title="${escapeAttr(`Kaggle ${medalLabel}`)}">${renderMedalIcon(medal, 19)}${pctText ? `<span>${escapeHtml(pctText)}</span>` : ''}</span>`
            : pctVal != null
                ? `<span class="comp-badge${pctVal <= 20 ? ' comp-badge--top' : ''}">${escapeHtml(pctText)}</span>`
                : `<span class="comp-badge">${escapeHtml(c.status || 'Entered')}</span>`;

        const hasPrivate = c.privateRank != null && c.teamCount;
        const rankStr = hasPrivate
            ? `Private Rank #${c.privateRank.toLocaleString()} / ${Number(c.teamCount).toLocaleString()} teams`
            : (c.rank != null && c.teamCount ? `Public Rank #${c.rank.toLocaleString()} / ${Number(c.teamCount).toLocaleString()} teams` : null);
        const reward = c.reward ? (/\d/.test(c.reward) ? `$${String(c.reward).replace(/\s*usd/i, '')} prize` : c.reward) : null;
        const subsStr = c.submissions ? `${c.submissions} submission${c.submissions === 1 ? '' : 's'}` : null;
        const metricSummary = [rankStr, reward, subsStr].filter(Boolean).join(' · ');

        const links = [
            ['Competition', url],
            ...writeups.map(wu => [wu.title || 'Write-up', wu.url])
        ];

        return `
        <article class="comp-card">
            <div class="comp-card__head">
                <h3 class="comp-card__title"><a href="${escapeAttr(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(c.name || 'Kaggle competition')}</a></h3>
                ${badgeHtml}
            </div>
            <p class="comp-card__sub">
                ${orgLogoSrc ? `<img src="${escapeAttr(orgLogoSrc)}" alt="" width="15" height="15" loading="lazy" decoding="async">` : ''}
                <span><i>${escapeHtml(orgSub)}</i>${compYear ? ` ${escapeHtml(compYear)}` : ''}</span>
            </p>
            <p class="comp-card__desc">${escapeHtml(metricSummary || 'Kaggle machine learning competition.')}</p>
            <p class="cv-item-links">
                ${links.map(([label, href]) => `<a class="cv-bracket-btn" href="${escapeAttr(href)}" target="_blank" rel="noopener noreferrer">[${escapeHtml(label)}]</a>`).join(' ')}
            </p>
        </article>`;
    }

    function renderCompetitions(kg) {
        const list = document.getElementById('competition-list');
        const filters = document.getElementById('comp-filters');
        if (!list) return;
        const raw = Array.isArray(kg.competitionList) ? kg.competitionList : [];
        if (!raw.length) {
            list.innerHTML = '<div class="empty-state">No Kaggle competitions found.</div>';
            return;
        }

        const allSorted = sortCompetitionsForCv(raw);
        const competitive = allSorted.filter(c => !(c.category === 'Getting Started' && c.rank == null && c.privateRank == null));
        const hasSplit = competitive.length > 0 && competitive.length < allSorted.length;

        let mode = hasSplit ? 'competitive' : 'all';
        let page = 0;

        const renderPage = () => {
            const sourceList = mode === 'competitive' ? competitive : allSorted;
            const slice = sourceList.slice(page * PAGE_SIZES.competitions, (page + 1) * PAGE_SIZES.competitions);
            list.innerHTML = slice.map(renderCompetition).join('');
            mountPager(list, sourceList.length, PAGE_SIZES.competitions, page, p => { page = p; renderPage(); });
        };

        if (filters && hasSplit) {
            filters.innerHTML = `
                <button type="button" class="writing-filter is-active" data-comp-mode="competitive">[Ranked (${competitive.length})]</button>
                <button type="button" class="writing-filter" data-comp-mode="all">[All (${allSorted.length})]</button>`;
            filters.addEventListener('click', event => {
                const btn = event.target.closest('[data-comp-mode]');
                if (!btn) return;
                filters.querySelectorAll('[data-comp-mode]').forEach(b => b.classList.toggle('is-active', b === btn));
                mode = btn.dataset.compMode;
                page = 0;
                renderPage();
            });
        }

        renderPage();
    }

    async function loadProfiles() {
        const list = document.getElementById('competition-list');
        const tierNote = document.getElementById('kaggle-tier-note');
        if (!list) return;

        let data = readInlineJson('profiles-data', null);
        try {
            if (window.location.protocol !== 'file:') {
                data = await fetchJson('data/profiles.json');
            }
        } catch (error) { /* inline fallback */ }

        if (!data || !data.kaggle) {
            list.innerHTML = '<div class="empty-state">Kaggle competition history is unavailable.</div>';
            return;
        }

        if (tierNote) {
            const comps = Array.isArray(data.kaggle.competitionList) ? data.kaggle.competitionList : [];
            const medals = comps.reduce((acc, c) => {
                const m = String(c.medal || '').toLowerCase();
                if (m === 'gold' || m === 'silver' || m === 'bronze') acc[m] = (acc[m] || 0) + 1;
                return acc;
            }, {});
            const medalBits = [
                medals.gold ? `<span class="kaggle-tier-medal">${renderMedalIcon('gold', 15)}<span>${medals.gold}</span></span>` : null,
                medals.silver ? `<span class="kaggle-tier-medal">${renderMedalIcon('silver', 15)}<span>${medals.silver}</span></span>` : null,
                medals.bronze ? `<span class="kaggle-tier-medal">${renderMedalIcon('bronze', 15)}<span>${medals.bronze}</span></span>` : null
            ].filter(Boolean);
            const pcts = comps
                .map(c => {
                    const r = c.privateRank ?? c.rank;
                    return (r != null && c.teamCount) ? (r / c.teamCount) * 100 : null;
                })
                .filter(v => v != null);
            const bestPct = pcts.length ? Math.max(Math.min(...pcts), 0.1).toFixed(1) : null;
            tierNote.innerHTML = [
                escapeHtml(data.kaggle.tier || 'Contributor'),
                ...medalBits,
                bestPct != null ? escapeHtml(`Best Top ${bestPct}%`) : null
            ].filter(Boolean).join(' <span class="meta-sep" aria-hidden="true">·</span> ');
        }

        renderCompetitions(data.kaggle);
    }

    // ── 05. Selected Projects (Curated Research + Live GH) ──────────
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
        } catch (error) { /* storage blocked */ }
    }

    function renderRepo(repo) {
        const updated = repo.pushed_at || repo.updated_at;
        const stars = repo.stargazers_count || 0;
        const forks = repo.forks_count || 0;
        const owner = repo.owner && typeof repo.owner === 'object' ? repo.owner.login : (repo.owner || PROFILE.githubUser);
        const metaParts = [
            repo.language || 'Code',
            stars > 0 ? `★ ${stars}` : null,
            forks > 0 ? `⑂ ${forks}` : null,
            updated ? formatMonthYear(updated) : null
        ].filter(Boolean);
        const links = [
            ['Code', repo.html_url],
            repo.websiteUrl ? ['Website', repo.websiteUrl] : null,
            repo.paperUrl ? ['Paper', repo.paperUrl] : null
        ].filter(Boolean);

        return `
        <article class="proj-cell">
            <h3 class="proj-cell__title"><a href="${escapeAttr(repo.html_url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(owner)}/${escapeHtml(repo.name)}</a></h3>
            <p class="proj-cell__sub"><i>${escapeHtml(repo.role || 'Author')}</i> · ${escapeHtml(metaParts.join(' · '))}</p>
            <p class="proj-cell__desc">${escapeHtml(repo.description || 'Public open-source repository on GitHub.')}</p>
            <p class="cv-item-links">
                ${links.map(([label, url]) => `<a class="cv-bracket-btn" href="${escapeAttr(url)}" target="_blank" rel="noopener noreferrer">[${escapeHtml(label)}]</a>`).join(' ')}
            </p>
        </article>`;
    }

    function buildMergedProjects(liveRepos) {
        const byFullName = new Map();
        (liveRepos || []).forEach(r => {
            if (!r || !r.full_name) return;
            byFullName.set(r.full_name.toLowerCase(), r);
        });

        const merged = CURATED_PROJECTS.map(curated => {
            const live = byFullName.get(curated.fullName.toLowerCase());
            if (!live) return curated;
            return {
                ...curated,
                stargazers_count: live.stargazers_count ?? curated.stargazers_count,
                forks_count: live.forks_count ?? curated.forks_count,
                language: live.language || curated.language,
                description: (live.description && live.description.trim().length > 18) ? live.description : curated.description,
                topics: (Array.isArray(live.topics) && live.topics.length) ? live.topics : curated.topics,
                pushed_at: live.pushed_at || live.updated_at || null
            };
        });

        const usedNames = new Set(merged.map(m => m.fullName.toLowerCase()));
        const extras = (liveRepos || [])
            .filter(r => r && !r.fork && !usedNames.has(r.full_name.toLowerCase())
                && r.name !== PROFILE.githubUser && r.name !== `${PROFILE.githubUser}.github.io`)
            .sort((a, b) => (b.stargazers_count || 0) * 10 - (a.stargazers_count || 0) * 10);

        return [...merged, ...extras.map(r => ({
            fullName: r.full_name,
            owner: (r.owner && r.owner.login) || PROFILE.githubUser,
            name: r.name,
            role: 'Author',
            language: r.language || 'Code',
            description: r.description || 'Public open-source repository on GitHub.',
            topics: Array.isArray(r.topics) ? r.topics : [],
            html_url: r.html_url,
            stargazers_count: r.stargazers_count || 0,
            forks_count: r.forks_count || 0,
            pushed_at: r.pushed_at || r.updated_at
        }))].slice(0, 6);
    }

    async function loadGitHubProjects() {
        const list = document.getElementById('project-list');
        if (!list) return;

        // Render curated baseline immediately so layout never blocks or shows error boxes
        let renderedProjects = buildMergedProjects([]);
        list.innerHTML = renderedProjects.map(renderRepo).join('');

        try {
            let data = readRepoCache();
            if (!data) {
                const results = await Promise.allSettled([
                    fetchJson(`https://api.github.com/users/${PROFILE.githubUser}`),
                    fetchJson(`https://api.github.com/users/${PROFILE.githubUser}/repos?sort=updated&per_page=30`),
                    fetchJson('https://api.github.com/repos/CityU-MLO/qfinzero'),
                    fetchJson('https://api.github.com/repos/CityU-MLO/AlphaBench')
                ]);
                const user = results[0].status === 'fulfilled' ? results[0].value : null;
                const userRepos = results[1].status === 'fulfilled' ? results[1].value : [];
                const orgRepos = [results[2], results[3]]
                    .filter(r => r.status === 'fulfilled' && r.value)
                    .map(r => r.value);
                if (!user && !userRepos.length && !orgRepos.length) throw new Error('GitHub API unreachable');
                data = { user, repos: [...orgRepos, ...userRepos] };
                writeRepoCache(data);
            }

            renderedProjects = buildMergedProjects(data.repos || []);
            list.innerHTML = renderedProjects.map(renderRepo).join('');
        } catch (error) { /* keep curated baseline */ }
    }

    // ── 06. Blog ────────────────────────────────────────────────────
    function inferWritingContext(w) {
        const platform = w.platform || 'Other';
        let rawCat = '';
        const urlMatch = String(w.url || '').match(/\/blog\/\d{4}\/\d{2}\/\d{2}\/([^/]+)\//i);
        if (urlMatch && urlMatch[1]) {
            try { rawCat = decodeURIComponent(urlMatch[1]).trim(); } catch (e) { rawCat = urlMatch[1]; }
        }
        const cleanTitle = w.title && BLOG_TITLE_OVERRIDES[w.title] ? BLOG_TITLE_OVERRIDES[w.title] : (w.title || 'Untitled Note');
        const normalizedCat = CATEGORY_NORMALIZE[rawCat] || rawCat || (platform === 'CSDN' ? 'Deep Learning' : 'Technical Notes');
        const summary = (w.desc && w.desc.trim())
            || BLOG_SUMMARY_OVERRIDES[w.title]
            || (rawCat ? `Technical notes from ${normalizedCat} series.` : `Published on ${platform}.`);

        return {
            displayTitle: cleanTitle,
            category: normalizedCat,
            summary
        };
    }

    function renderWriting(w) {
        const date = w.date ? formatDate(w.date) : '';
        const platform = w.platform || 'Other';
        const ctx = inferWritingContext(w);
        const primaryLabel = platform === 'Blog' ? 'Blog' : platform;
        const links = [
            [primaryLabel, w.url],
            w.zhihuUrl ? ['Zhihu', w.zhihuUrl] : null
        ].filter(Boolean);

        return `
        <article class="writing-cell" data-platform="${escapeAttr(platform)}">
            <h3 class="writing-cell__title"><a href="${escapeAttr(w.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(ctx.displayTitle)}</a></h3>
            <p class="writing-cell__sub"><i>${escapeHtml(ctx.category)}</i>${date ? ` · ${escapeHtml(date)}` : ''}</p>
            <p class="writing-cell__desc">${escapeHtml(ctx.summary)}</p>
            <p class="cv-item-links">
                ${links.map(([label, url]) => `<a class="cv-bracket-btn" href="${escapeAttr(url)}" target="_blank" rel="noopener noreferrer">[${escapeHtml(label)}]</a>`).join(' ')}
            </p>
        </article>`;
    }

    async function loadWritings() {
        const list = document.getElementById('writing-list');
        const filters = document.getElementById('writing-filters');
        if (!list) return;

        let data = readInlineJson('writings-data', { writings: [] });
        try {
            if (window.location.protocol !== 'file:') {
                data = await fetchJson('data/writings.json');
            }
        } catch (error) { /* inline fallback */ }

        const writings = Array.isArray(data.writings) ? data.writings : [];

        if (!writings.length) {
            list.innerHTML = `
                <div class="empty-state">
                    Posts live on <a href="https://b143kc47.github.io/blog/" target="_blank" rel="noopener noreferrer">Blog</a>,
                    <a href="https://www.zhihu.com/people/B143KC47" target="_blank" rel="noopener noreferrer">Zhihu</a>, and
                    <a href="https://blog.csdn.net/B143KC47" target="_blank" rel="noopener noreferrer">CSDN</a>.
                </div>`;
            return;
        }

        const counts = writings.reduce((acc, w) => {
            const p = w.platform || 'Other';
            acc[p] = (acc[p] || 0) + 1;
            return acc;
        }, {});
        const platforms = Object.keys(counts);
        let activePlatform = 'All';
        let page = 0;

        const renderPage = () => {
            const visible = activePlatform === 'All'
                ? writings
                : writings.filter(w => (w.platform || 'Other') === activePlatform);
            if (!visible.length) {
                list.innerHTML = '<div class="empty-state">No blog posts on this platform yet.</div>';
                mountPager(list, 0, PAGE_SIZES.writings, 0, () => {});
                return;
            }
            const slice = visible.slice(page * PAGE_SIZES.writings, (page + 1) * PAGE_SIZES.writings);
            list.innerHTML = slice.map(renderWriting).join('');
            mountPager(list, visible.length, PAGE_SIZES.writings, page, p => { page = p; renderPage(); });
        };

        if (filters) {
            const filterItems = [
                { key: 'All', label: `[All (${writings.length})]` },
                ...platforms.map(p => ({ key: p, label: `[${p} (${counts[p]})]` }))
            ];
            filters.innerHTML = filterItems
                .map((item, i) => `<button type="button" class="writing-filter${i === 0 ? ' is-active' : ''}" data-platform="${escapeAttr(item.key)}">${escapeHtml(item.label)}</button>`)
                .join('');
            filters.addEventListener('click', event => {
                const btn = event.target.closest('.writing-filter');
                if (!btn) return;
                filters.querySelectorAll('.writing-filter').forEach(b => b.classList.toggle('is-active', b === btn));
                activePlatform = btn.dataset.platform;
                page = 0;
                renderPage();
            });
        }

        renderPage();
    }

    // ── Utilities ───────────────────────────────────────────────────
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
        window.addEventListener('scroll', () => {
            if (!ticking) {
                ticking = true;
                requestAnimationFrame(update);
            }
        }, { passive: true });
    }

    function initActiveNav() {
        const links = [...document.querySelectorAll('[data-nav] a[href^="#"]')];
        const map = new Map();
        links.forEach(a => {
            const el = document.querySelector(a.getAttribute('href'));
            if (el) map.set(el, a);
        });
        if (!map.size || !('IntersectionObserver' in window)) return;
        const obs = new IntersectionObserver(entries => {
            entries.forEach(e => {
                if (e.isIntersecting) {
                    links.forEach(l => l.classList.remove('is-active'));
                    map.get(e.target)?.classList.add('is-active');
                }
            });
        }, { rootMargin: '-25% 0px -60% 0px' });
        map.forEach((_, el) => obs.observe(el));
    }

    document.addEventListener('DOMContentLoaded', () => {
        initTheme();
        initPrint();
        initHeader();
        initReveal();
        initFooterYear();
        initScrollProgress();
        initActiveNav();
        loadPublications();
        loadPublicationsArchive();
        loadGitHubProjects();
        loadProfiles();
        loadWritings();
        initCursor();
    });
})();
