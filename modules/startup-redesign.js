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
    const TIER_LADDER = ['Novice', 'Contributor', 'Expert', 'Master', 'Grandmaster'];
    const TIER_ABBR = { Novice: 'Nov', Contributor: 'Con', Expert: 'Exp', Master: 'Mas', Grandmaster: 'GM' };
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
        if (!btn) return;
        const current = () => (document.documentElement.dataset.theme === 'light' ? 'light' : 'dark');
        const sync = () => {
            const t = current();
            btn.textContent = t === 'light' ? 'Dark' : 'Light';
            btn.setAttribute('aria-pressed', String(t === 'light'));
            btn.setAttribute('aria-label', `Switch to ${t === 'light' ? 'dark' : 'light'} mode`);
            const themeColor = document.querySelector('meta[name="theme-color"]');
            if (themeColor) themeColor.setAttribute('content', t === 'light' ? '#f2f2f2' : '#000000');
        };
        btn.addEventListener('click', () => {
            const next = current() === 'light' ? 'dark' : 'light';
            document.documentElement.dataset.theme = next;
            try { localStorage.setItem('theme', next); } catch (error) { /* private mode */ }
            sync();
        });
        sync();
    }

    function initPrint() {
        const buttons = document.querySelectorAll('[data-print-cv]');
        if (!buttons.length) return;
        const triggerPrint = () => {
            document.documentElement.classList.remove('nav-open');
            const nav = document.querySelector('[data-nav]');
            const toggle = document.querySelector('[data-nav-toggle]');
            if (nav) nav.classList.remove('is-open');
            if (toggle) toggle.setAttribute('aria-expanded', 'false');
            window.print();
        };
        buttons.forEach(btn => btn.addEventListener('click', triggerPrint));
    }

    // ── Sticky Header & Mobile Drawer ───────────────────────────────
    function initHeader() {
        const header = document.querySelector('[data-header]');
        const toggle = document.querySelector('[data-nav-toggle]');
        const nav = document.querySelector('[data-nav]');
        const backdrop = document.querySelector('[data-nav-backdrop]');
        if (!header || !toggle || !nav) return;

        const setScrolled = () => {
            header.classList.toggle('is-scrolled', window.scrollY > 12);
        };
        setScrolled();
        window.addEventListener('scroll', setScrolled, { passive: true });

        const setNav = open => {
            nav.classList.toggle('is-open', open);
            document.documentElement.classList.toggle('nav-open', open);
            toggle.setAttribute('aria-expanded', String(open));
        };

        toggle.addEventListener('click', () => setNav(!nav.classList.contains('is-open')));
        nav.addEventListener('click', event => {
            if (event.target.closest('a')) setNav(false);
        });
        if (backdrop) backdrop.addEventListener('click', () => setNav(false));

        document.addEventListener('keydown', event => {
            if (event.key === 'Escape' && nav.classList.contains('is-open')) {
                setNav(false);
                toggle.focus();
            }
        });

        const desktop = window.matchMedia('(min-width: 1025px)');
        const onDesktop = event => { if (event.matches) setNav(false); };
        if (desktop.addEventListener) desktop.addEventListener('change', onDesktop);
        else if (desktop.addListener) desktop.addListener(onDesktop);
    }

    function initReveal() {
        const elements = document.querySelectorAll('.reveal');
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
    const CURSOR_TARGETS = 'a, button, .cv-expandable, .writing-row__mirror, .nav-toggle';

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

    function normalizeTags(tags) {
        if (!Array.isArray(tags)) return [];
        return tags.flatMap(tag => String(tag).split(';')).map(tag => tag.trim()).filter(Boolean);
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
            <button type="button" class="list-pager__btn" data-dir="-1" ${page <= 0 ? 'disabled' : ''} aria-label="Previous page">&larr; Prev</button>
            <span class="list-pager__info">${page + 1} / ${pages} &middot; ${total} items</span>
            <button type="button" class="list-pager__btn" data-dir="1" ${page >= pages - 1 ? 'disabled' : ''} aria-label="Next page">Next &rarr;</button>`;
        pager.querySelectorAll('.list-pager__btn').forEach(btn => {
            btn.addEventListener('click', () => onPage(page + Number(btn.dataset.dir)));
        });
    }

    // ── Shared Expandable Rows (Publications & Competitions) ────────
    function initExpandableRows() {
        const toggleRow = row => {
            const open = row.classList.toggle('is-open');
            row.setAttribute('aria-expanded', String(open));
            row.querySelectorAll('.cv-drawer').forEach(drawer => {
                drawer.hidden = !open;
            });
            const icon = row.querySelector('.cv-expand-icon');
            if (icon) {
                const openLabel = icon.dataset.openLabel || '−';
                const closedLabel = icon.dataset.closedLabel || '+';
                icon.textContent = open ? openLabel : closedLabel;
                if (icon.tagName === 'BUTTON') {
                    icon.setAttribute('aria-expanded', String(open));
                }
            }
        };

        document.addEventListener('click', event => {
            const toggleBtn = event.target.closest('.pub-abstract-toggle, .comp-detail-toggle');
            if (toggleBtn) {
                const row = toggleBtn.closest('.cv-expandable');
                if (row) toggleRow(row);
                return;
            }
            const row = event.target.closest('.cv-expandable');
            if (!row || event.target.closest('a, button')) return;
            toggleRow(row);
        });

        document.addEventListener('keydown', event => {
            if (event.key !== 'Enter' && event.key !== ' ') return;
            const row = event.target.closest('.cv-expandable');
            if (!row || row !== event.target || event.target.closest('a, button')) return;
            event.preventDefault();
            toggleRow(row);
        });
    }

    // ── 03. Selected Publications (Figure-Left + Clean Action Pills) ─
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
                const star = equal.has(name) ? '<sup>*</sup>' : '';
                return SELF_NAMES.includes(name)
                    ? `<strong class="pub-self-author">${escapeHtml(name)}${star}</strong>`
                    : `${escapeHtml(name)}${star}`;
            })
            .join(', ');
    }

    function formatVenueDisplay(venue, year) {
        const v = String(venue || '').trim();
        if (/ACL\s*2026/i.test(v)) {
            return { full: 'ACL 2026 System Demonstrations', badge: 'ACL 2026 Demo' };
        }
        if (/ICLR\s*2026/i.test(v)) {
            return { full: 'International Conference on Learning Representations (ICLR), 2026', badge: 'ICLR 2026' };
        }
        if (/GenAI in Finance/i.test(v) || /NeurIPS\s*2025/i.test(v)) {
            return { full: 'NeurIPS 2025 Workshop on Generative AI in Finance', badge: 'NeurIPS 2025 WS' };
        }
        return { full: year ? `${v || 'Publication'}, ${year}` : (v || 'Publication'), badge: year ? String(year) : 'Paper' };
    }

    function renderPublication(publication, figure) {
        const title = publication.title || 'Untitled publication';
        const vInfo = formatVenueDisplay(publication.venue, publication.year);
        const tags = normalizeTags(publication.tags).slice(0, 4);
        const abstract = publication.abstract || 'Research publication available online.';
        const hasEqual = Array.isArray(publication.equalContribution) && publication.equalContribution.length > 0;

        const pubUrl = publication.openreviewUrl || PROFILE.openReviewUrl;
        const pubLabel = pubUrl.includes('openreview.net') ? 'OpenReview'
            : pubUrl.includes('aclanthology.org') ? 'Anthology' : 'Paper';
        const links = [
            figure.pdfUrl ? ['PDF', figure.pdfUrl] : null,
            [pubLabel, pubUrl],
            figure.projectUrl ? ['Project', figure.projectUrl] : null,
            figure.codeUrl ? ['Code', figure.codeUrl] : null
        ].filter(Boolean);

        const figSrc = figure.src ? `${figure.src}${figure.src.includes('?') ? '&' : '?'}v=2` : '';

        return `
        <article class="pub-row cv-expandable" tabindex="0" aria-expanded="false">
            <figure class="pub-row__thumb">
                ${figSrc
                    ? `<div class="pub-row__plate">
                           <img src="${escapeAttr(figSrc)}" alt="${escapeAttr(figure.caption || `Architecture figure for ${title}`)}" loading="lazy" decoding="async">
                       </div>`
                    : `<div class="pub-row__plate pub-row__plate--placeholder"><span>${escapeHtml(vInfo.badge)}</span></div>`}
            </figure>
            <div class="pub-row__body">
                <div class="pub-row__top">
                    <h3 class="pub-row__title"><a href="${escapeAttr(pubUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(title)}</a></h3>
                    <span class="pub-venue-pill">${escapeHtml(vInfo.badge)}</span>
                </div>
                <p class="pub-row__authors">${renderAuthors(publication)}${hasEqual ? ' <span class="pub-row__equal">(* equal contribution)</span>' : ''}</p>
                <p class="pub-row__venue"><em>${escapeHtml(vInfo.full)}</em></p>
                <div class="pub-row__footer">
                    <div class="pub-row__links">
                        ${links.map(([label, url]) => `<a class="pub-action-pill" href="${escapeAttr(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)} ↗</a>`).join('')}
                        <button type="button" class="pub-action-pill pub-abstract-toggle cv-expand-icon" data-closed-label="Abstract +" data-open-label="Abstract −" aria-expanded="false">Abstract +</button>
                    </div>
                    ${tags.length ? `<div class="cv-tag-row">${tags.map(tag => `<span class="cv-tag">${escapeHtml(tag)}</span>`).join('')}</div>` : ''}
                </div>
                <div class="pub-row__drawer cv-drawer" hidden>
                    <p class="pub-row__abstract">${escapeHtml(abstract)}</p>
                    ${figure.caption ? `<p class="pub-row__caption">${escapeHtml(figure.caption)}</p>` : ''}
                </div>
            </div>
        </article>`;
    }

    async function loadPublications() {
        const list = document.getElementById('publication-list');
        const sync = document.getElementById('publication-sync');
        if (!list) return;

        let data = readInlineJson('publications-data', { publications: [] });
        try {
            if (window.location.protocol !== 'file:') {
                data = await fetchJson('data/publications.json');
            }
        } catch (error) { /* inline fallback */ }

        const figures = await loadPaperFigures();
        const publications = Array.isArray(data.publications) ? data.publications : [];
        if (sync) {
            sync.textContent = `${publications.length} paper${publications.length === 1 ? '' : 's'} · click Abstract + to read summary`;
        }

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

    // ── 04. Competitions & Practice (Kaggle + LeetCode) ─────────────
    function renderKaggleSummary(kg) {
        const tier = kg.tier || 'Contributor';
        const idx = Math.max(0, TIER_LADDER.indexOf(tier));
        const comps = Array.isArray(kg.competitionList) ? kg.competitionList : [];
        const medals = comps.reduce((acc, c) => {
            const m = String(c.medal || '').toLowerCase();
            if (m === 'gold' || m === 'silver' || m === 'bronze') acc[m] = (acc[m] || 0) + 1;
            return acc;
        }, {});
        const pcts = comps
            .map(c => {
                const r = c.privateRank ?? c.rank;
                return (r != null && c.teamCount) ? (r / c.teamCount) * 100 : null;
            })
            .filter(v => v != null);
        const bestPct = pcts.length ? Math.min(...pcts) : null;

        const medalBits = [
            medals.gold ? `${medals.gold} Gold` : null,
            medals.silver ? `${medals.silver} Silver Medal` : null,
            medals.bronze ? `${medals.bronze} Bronze` : null
        ].filter(Boolean);
        const metaBits = [
            ...medalBits,
            bestPct != null ? `Best Top ${Math.max(bestPct, 0.1).toFixed(1)}%` : null,
            comps.length ? `${comps.length} entered` : null,
            kg.badges != null ? `${kg.badges} badges` : null,
            kg.memberSince != null ? `since ${kg.memberSince}` : null
        ].filter(Boolean).join(' · ');

        const dots = TIER_LADDER.map((name, i) => {
            const cls = i === idx ? ' is-current' : (i < idx ? ' is-passed' : '');
            return `<span class="mini-tier__node${cls}" title="${escapeAttr(name)}">${escapeHtml(TIER_ABBR[name] || name)}</span>`;
        }).join('');

        return `
        <a class="cv-summary-cell" href="${escapeAttr(kg.url || 'https://www.kaggle.com/b14ckc4tmr')}" target="_blank" rel="noopener noreferrer">
            <div class="cv-summary-cell__top">
                <span class="cv-summary-cell__label">Kaggle · @${escapeHtml(kg.handle || 'b14ckc4tmr')}</span>
                <span class="cv-link-arrow" aria-hidden="true">↗</span>
            </div>
            <div class="cv-summary-cell__main">
                <strong>${escapeHtml(tier)}</strong>
                <span class="mini-tier" aria-label="Kaggle tier ${escapeAttr(tier)}">${dots}</span>
            </div>
            <p class="cv-summary-cell__meta">${escapeHtml(metaBits)}</p>
        </a>`;
    }

    function renderLeetSummary(lc) {
        const d = lc.byDifficulty || {};
        const easy = d.easy || 0;
        const medium = d.medium || 0;
        const hard = d.hard || 0;
        const total = easy + medium + hard;
        const solved = lc.solved != null ? lc.solved : total;
        const pct = v => (total > 0 ? ((v / total) * 100).toFixed(1) : '0');
        const metaBits = [
            `${easy} Easy · ${medium} Med · ${hard} Hard`,
            lc.submissions != null ? `${lc.submissions} submissions` : null
        ].filter(Boolean).join(' · ');

        return `
        <a class="cv-summary-cell" href="${escapeAttr(lc.url || 'https://leetcode.com/u/B143KC47/')}" target="_blank" rel="noopener noreferrer">
            <div class="cv-summary-cell__top">
                <span class="cv-summary-cell__label">LeetCode · @${escapeHtml(lc.handle || 'B143KC47')}</span>
                <span class="cv-link-arrow" aria-hidden="true">↗</span>
            </div>
            <div class="cv-summary-cell__main">
                <strong>${escapeHtml(String(solved))} solved</strong>
                <span class="mini-diffbar" role="img" aria-label="${easy} Easy, ${medium} Medium, ${hard} Hard">
                    <span class="mini-diffbar__seg mini-diffbar__seg--easy" style="width:${pct(easy)}%"></span>
                    <span class="mini-diffbar__seg mini-diffbar__seg--med" style="width:${pct(medium)}%"></span>
                    <span class="mini-diffbar__seg mini-diffbar__seg--hard" style="width:${pct(hard)}%"></span>
                </span>
            </div>
            <p class="cv-summary-cell__meta">${escapeHtml(metaBits)}</p>
        </a>`;
    }

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
        const orgMeta = [c.organization || 'Kaggle', c.category || null, compYear || null].filter(Boolean).join(' · ');

        const activeRank = c.privateRank ?? c.rank;
        const pctVal = (activeRank != null && c.teamCount)
            ? Math.max((activeRank / c.teamCount) * 100, 0.1)
            : null;
        const pctText = pctVal != null ? `Top ${pctVal.toFixed(1)}%` : '';

        const kpiBadge = medal
            ? `<span class="comp-kpi comp-kpi--medal"><span class="cv-medal__dot" aria-hidden="true"></span>${escapeHtml(medalLabel)}${pctText ? ` · ${escapeHtml(pctText)}` : ''}</span>`
            : pctVal != null
                ? `<span class="comp-kpi${pctVal <= 20 ? ' comp-kpi--top' : ''}">${escapeHtml(pctText)}</span>`
                : `<span class="comp-kpi">${escapeHtml(c.status || 'Entered')}</span>`;

        const hasPrivate = c.privateRank != null && c.teamCount;
        const rankStr = hasPrivate
            ? `Private #${c.privateRank.toLocaleString()} / ${Number(c.teamCount).toLocaleString()}`
            : (c.rank != null && c.teamCount ? `Public #${c.rank.toLocaleString()} / ${Number(c.teamCount).toLocaleString()}` : null);
        const reward = c.reward ? (/\d/.test(c.reward) ? `$${String(c.reward).replace(/\s*usd/i, '')} prize` : c.reward) : null;
        const metricSummary = [
            rankStr,
            reward,
            c.submissions ? `${c.submissions} sub${c.submissions === 1 ? '' : 's'}` : null
        ].filter(Boolean).join(' · ');

        const detailBits = [
            hasPrivate && c.rank != null && c.rank !== c.privateRank ? `Public rank: #${c.rank.toLocaleString()}` : null,
            hasPrivate && c.privateScore ? `Private score: ${c.privateScore}` : (c.score ? `Score: ${c.score}` : null),
            c.teamCount ? `Teams: ${Number(c.teamCount).toLocaleString()}` : null,
            c.deadline ? `${c.status === 'Ongoing' ? 'Deadline' : 'Concluded'}: ${c.deadline}` : null
        ].filter(Boolean);

        return `
        <article class="comp-card cv-expandable" tabindex="0" aria-expanded="false">
            <div class="comp-card__head">
                <span class="comp-card__org">
                    ${orgLogoSrc ? `<img src="${escapeAttr(orgLogoSrc)}" alt="" width="16" height="16" loading="lazy" decoding="async">` : ''}
                    <span>${escapeHtml(orgMeta)}</span>
                </span>
                ${kpiBadge}
            </div>
            <h3 class="comp-card__title"><a href="${escapeAttr(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(c.name || 'Kaggle competition')}</a></h3>
            <div class="comp-card__foot">
                <span class="comp-card__metrics">${escapeHtml(metricSummary)}</span>
                <button type="button" class="pub-action-pill comp-detail-toggle cv-expand-icon" data-closed-label="Details +" data-open-label="Details −" aria-expanded="false">Details +</button>
            </div>
            <div class="comp-card__drawer cv-drawer" hidden>
                ${detailBits.length ? `<p class="comp-card__details">${escapeHtml(detailBits.join(' · '))}</p>` : ''}
                <div class="pub-row__links">
                    <a class="pub-action-pill" href="${escapeAttr(url)}" target="_blank" rel="noopener noreferrer">Competition ↗</a>
                    ${writeups.map(wu => `<a class="pub-action-pill" href="${escapeAttr(wu.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(wu.title || 'Write-up')} ↗</a>`).join('')}
                </div>
            </div>
        </article>`;
    }

    function renderCompetitions(kg) {
        const block = document.getElementById('competition-block');
        const list = document.getElementById('competition-list');
        const filters = document.getElementById('comp-filters');
        if (!block || !list) return;
        const raw = Array.isArray(kg.competitionList) ? kg.competitionList : [];
        if (!raw.length) return;

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
                <button type="button" class="writing-filter is-active" data-comp-mode="competitive">Ranked (${competitive.length})</button>
                <button type="button" class="writing-filter" data-comp-mode="all">All (${allSorted.length})</button>`;
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
        block.hidden = false;
    }

    async function loadProfiles() {
        const list = document.getElementById('practice-list');
        if (!list) return;

        let data = readInlineJson('profiles-data', null);
        try {
            if (window.location.protocol !== 'file:') {
                data = await fetchJson('data/profiles.json');
            }
        } catch (error) { /* inline fallback */ }

        if (!data || (!data.leetcode && !data.kaggle)) {
            list.innerHTML = '<div class="empty-state">Practice profile data is unavailable.</div>';
            return;
        }

        const cells = [];
        if (data.kaggle) cells.push(renderKaggleSummary(data.kaggle));
        if (data.leetcode) cells.push(renderLeetSummary(data.leetcode));
        list.innerHTML = cells.join('');

        if (data.kaggle) renderCompetitions(data.kaggle);
    }

    // ── 05. Selected Open-Source Projects (Curated Research + Live GH)
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
        const topics = Array.isArray(repo.topics) ? repo.topics.slice(0, 3) : [];
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

        return `
        <a class="proj-cell" href="${escapeAttr(repo.html_url)}" target="_blank" rel="noopener noreferrer">
            <div class="proj-cell__top">
                <div class="proj-cell__heading">
                    <span class="proj-cell__owner">${escapeHtml(owner)} /</span>
                    <h3 class="proj-cell__title">${escapeHtml(repo.name)}</h3>
                </div>
                <div class="proj-cell__right">
                    ${repo.role ? `<span class="proj-cell__role">${escapeHtml(repo.role)}</span>` : ''}
                    <span class="cv-link-arrow" aria-hidden="true">↗</span>
                </div>
            </div>
            <p class="proj-cell__desc">${escapeHtml(repo.description || 'Public open-source repository on GitHub.')}</p>
            <div class="proj-cell__foot">
                <span class="proj-cell__meta">
                    <span class="proj-lang-dot" aria-hidden="true"></span>
                    <span>${escapeHtml(metaParts.join(' · '))}</span>
                </span>
                ${topics.length ? `<div class="cv-tag-row">${topics.map(t => `<span class="cv-tag">${escapeHtml(t)}</span>`).join('')}</div>` : ''}
            </div>
        </a>`;
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
        const source = document.getElementById('github-source');
        const sync = document.getElementById('github-sync');
        const count = document.getElementById('github-count');
        if (!list) return;

        // Render curated baseline immediately so layout never blocks or shows error boxes
        let renderedProjects = buildMergedProjects([]);
        list.innerHTML = renderedProjects.map(renderRepo).join('');
        if (source) source.textContent = 'CityU-MLO + @B143KC47';
        if (count) count.textContent = `${renderedProjects.length} featured`;
        if (sync) sync.textContent = 'Curated';

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
                if (sync) sync.textContent = 'Live metrics';
            } else if (sync) {
                sync.textContent = 'Cached metrics';
            }

            renderedProjects = buildMergedProjects(data.repos || []);
            if (count && data.user && data.user.public_repos) {
                count.textContent = `${renderedProjects.length} featured · ${data.user.public_repos} personal repos`;
            }
            list.innerHTML = renderedProjects.map(renderRepo).join('');
        } catch (error) {
            if (sync) sync.textContent = 'Curated selection';
        }
    }

    // ── 06. Writing & Technical Notes ───────────────────────────────
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

        return `
        <a class="writing-cell" href="${escapeAttr(w.url)}" target="_blank" rel="noopener noreferrer" data-platform="${escapeAttr(platform)}">
            <div class="writing-cell__meta">
                <span class="writing-cell__cat">${escapeHtml(platform)} · ${escapeHtml(ctx.category)}</span>
                <time class="writing-cell__date">${escapeHtml(date)}</time>
            </div>
            <div class="writing-cell__top">
                <h3 class="writing-cell__title">${escapeHtml(ctx.displayTitle)}</h3>
                <span class="cv-link-arrow" aria-hidden="true">↗</span>
            </div>
            <div class="writing-cell__foot">
                <p class="writing-cell__desc">${escapeHtml(ctx.summary)}</p>
                ${w.zhihuUrl ? `<span class="pub-bracket-link writing-row__mirror" role="link" tabindex="0" data-href="${escapeAttr(w.zhihuUrl)}" title="Also on Zhihu">[Zhihu ↗]</span>` : ''}
            </div>
        </a>`;
    }

    async function loadWritings() {
        const list = document.getElementById('writing-list');
        const filters = document.getElementById('writing-filters');
        const sync = document.getElementById('writing-sync');
        if (!list) return;

        let data = readInlineJson('writings-data', { writings: [] });
        try {
            if (window.location.protocol !== 'file:') {
                data = await fetchJson('data/writings.json');
            }
        } catch (error) { /* inline fallback */ }

        const writings = Array.isArray(data.writings) ? data.writings : [];
        if (sync) {
            sync.textContent = `${writings.length} notes`;
        }

        if (!writings.length) {
            list.innerHTML = `
                <div class="empty-state">
                    Articles live on <a href="https://b143kc47.github.io/blog/" target="_blank" rel="noopener noreferrer">Blog</a>,
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
                list.innerHTML = '<div class="empty-state">No articles on this platform yet.</div>';
                mountPager(list, 0, PAGE_SIZES.writings, 0, () => {});
                return;
            }
            const slice = visible.slice(page * PAGE_SIZES.writings, (page + 1) * PAGE_SIZES.writings);
            list.innerHTML = slice.map(renderWriting).join('');
            mountPager(list, visible.length, PAGE_SIZES.writings, page, p => { page = p; renderPage(); });
        };

        if (filters) {
            const filterItems = [
                { key: 'All', label: `All (${writings.length})` },
                ...platforms.map(p => ({ key: p, label: `${p} (${counts[p]})` }))
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

        const openMirror = (mirror, event) => {
            event.preventDefault();
            event.stopPropagation();
            window.open(mirror.dataset.href, '_blank', 'noopener');
        };
        list.addEventListener('click', event => {
            const mirror = event.target.closest('.writing-row__mirror');
            if (mirror) openMirror(mirror, event);
        });
        list.addEventListener('keydown', event => {
            if (event.key !== 'Enter' && event.key !== ' ') return;
            const mirror = event.target.closest('.writing-row__mirror');
            if (mirror) openMirror(mirror, event);
        });
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
        initExpandableRows();
        loadPublications();
        loadGitHubProjects();
        loadProfiles();
        loadWritings();
        initCursor();
    });
})();
