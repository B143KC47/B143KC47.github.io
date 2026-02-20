const UIModule = {
    isMobile: false,
    prefersReducedMotion: false,

    init() {
        this.isMobile = window.innerWidth <= 768 || 'ontouchstart' in window;
        this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        this.showInitialSkeleton();
        this.initializeSections();
        this.updateCopyrightYear();
        this.initializeAnimations();
        this.setupScrollTriggers();

        if (!this.prefersReducedMotion) {
            this.setupTextReveals();
            this.setupDecodingText();
        }

        if (!this.isMobile) {
            this.setupCustomCursor();
            this.setupSpotlightEffect();
            this.setup3DTilt();
            this.setupMagneticElements();
            this.setupCursorGlow();
        }

        this.hideInitialSkeleton();
    },

    showInitialSkeleton() {
        if (!document.querySelector('.page-skeleton-container')) {
            const skeletonContainer = document.createElement('div');
            skeletonContainer.className = 'page-skeleton-container';
            skeletonContainer.innerHTML = `
                <div class="skeleton-hero">
                    <div class="skeleton-hero-content">
                        <div class="skeleton-hero-title"></div>
                        <div class="skeleton-hero-subtitle"></div>
                        <div class="skeleton-hero-buttons">
                            <div class="skeleton-hero-button"></div>
                            <div class="skeleton-hero-button"></div>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(skeletonContainer);
        }
    },

    hideInitialSkeleton() {
        setTimeout(() => {
            const skeleton = document.querySelector('.page-skeleton-container');
            if (skeleton) {
                skeleton.classList.add('skeleton-exit');
                setTimeout(() => skeleton.remove(), 300);

                const heroSection = document.querySelector('.hero-section');
                if (heroSection) {
                    heroSection.classList.add('content-reveal');
                }
            }
        }, 100);
    },

    initializeSections() {
        document.querySelectorAll('.section').forEach(section => {
            section.style.display = 'block';
            section.style.opacity = '1';
            section.style.visibility = 'visible';
            section.style.transform = 'translateY(0)';
        });

        document.querySelectorAll('.certificate-grid, .projects-grid, .tech-categories, .research-grid, .publications-grid').forEach(grid => {
            grid.style.display = 'grid';
            grid.style.opacity = '1';
            grid.style.visibility = 'visible';
        });

        document.querySelectorAll('.certificate-item, .project-card, .tech-category, .research-card, .publication-card').forEach(item => {
            item.style.display = 'block';
            item.style.opacity = '1';
            item.style.visibility = 'visible';
        });
    },

    updateCopyrightYear() {
        const currentYear = new Date().getFullYear();
        const yearEl = document.getElementById('year');
        if (yearEl) yearEl.textContent = `\u00A9 ${currentYear} Powered by KO Ho Tin`;
    },

    initializeAnimations() {
        this.setupLoadingIndicator();
        this.setupLazyLoading();
    },

    setupLoadingIndicator() {
        const loadingIndicator = document.createElement('div');
        loadingIndicator.className = 'loading-indicator';
        const loadingProgress = document.createElement('div');
        loadingProgress.className = 'loading-progress';
        const loadingPulse = document.createElement('div');
        loadingPulse.className = 'loading-pulse';
        loadingProgress.appendChild(loadingPulse);
        loadingIndicator.appendChild(loadingProgress);
        document.body.appendChild(loadingIndicator);

        const loadingStages = [
            { progress: 20, duration: 100 },
            { progress: 40, duration: 200 },
            { progress: 60, duration: 300 },
            { progress: 80, duration: 200 },
            { progress: 90, duration: 150 },
            { progress: 100, duration: 100 }
        ];

        let stageIndex = 0;

        const updateProgress = () => {
            if (stageIndex < loadingStages.length) {
                const stage = loadingStages[stageIndex];
                loadingProgress.style.width = `${stage.progress}%`;
                stageIndex++;
                setTimeout(updateProgress, stage.duration);
            } else {
                setTimeout(() => {
                    loadingIndicator.classList.add('fade-out');
                    document.body.classList.add('page-loaded');
                    setTimeout(() => loadingIndicator.remove(), 500);
                }, 300);
            }
        };

        setTimeout(updateProgress, 50);
    },

    setupScrollTriggers() {
        const revealElements = document.querySelectorAll('.reveal-up, .reveal-down, .reveal-left, .reveal-right, .reveal-scale, .stagger, .viewport-element');

        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in-view');
                    revealObserver.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        revealElements.forEach(el => revealObserver.observe(el));
    },

    setupTextReveals() {
        const textElements = document.querySelectorAll('.text-reveal');

        textElements.forEach(element => {
            const text = element.textContent;
            element.innerHTML = '';

            text.split('').forEach((char, index) => {
                const span = document.createElement('span');
                span.className = 'char';
                span.textContent = char === ' ' ? '\u00A0' : char;
                span.style.animationDelay = `${index * 0.05}s`;
                element.appendChild(span);
            });
        });
    },

    setup3DTilt() {
        const tiltElements = document.querySelectorAll('.tilt-3d, .card');

        tiltElements.forEach(element => {
            element.addEventListener('mousemove', (e) => {
                const rect = element.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                const centerX = rect.width / 2;
                const centerY = rect.height / 2;

                const rotateX = ((y - centerY) / centerY) * -10;
                const rotateY = ((x - centerX) / centerX) * 10;

                element.style.setProperty('--tilt-x', `${rotateX}deg`);
                element.style.setProperty('--tilt-y', `${rotateY}deg`);
            }, { passive: true });

            element.addEventListener('mouseleave', () => {
                element.style.setProperty('--tilt-x', '0deg');
                element.style.setProperty('--tilt-y', '0deg');
            }, { passive: true });
        });
    },

    setupMagneticElements() {
        const magneticElements = document.querySelectorAll('.magnetic, .hero-buttons .button');

        magneticElements.forEach(element => {
            element.addEventListener('mousemove', (e) => {
                const rect = element.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;

                const strength = 0.3;
                element.style.setProperty('--magnetic-x', `${x * strength}px`);
                element.style.setProperty('--magnetic-y', `${y * strength}px`);
            }, { passive: true });

            element.addEventListener('mouseleave', () => {
                element.style.setProperty('--magnetic-x', '0px');
                element.style.setProperty('--magnetic-y', '0px');
            }, { passive: true });
        });
    },

    setupCursorGlow() {
        let cursorGlow = document.querySelector('.cursor-glow');
        if (!cursorGlow) {
            cursorGlow = document.createElement('div');
            cursorGlow.className = 'cursor-glow';
            document.body.appendChild(cursorGlow);
        }

        let mouseX = 0, mouseY = 0;
        let glowX = 0, glowY = 0;
        let rafId = null;

        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        }, { passive: true });

        const animateCursor = () => {
            glowX += (mouseX - glowX) * 0.1;
            glowY += (mouseY - glowY) * 0.1;

            cursorGlow.style.left = `${glowX}px`;
            cursorGlow.style.top = `${glowY}px`;

            rafId = requestAnimationFrame(animateCursor);
        };

        animateCursor();

        document.addEventListener('visibilitychange', () => {
            if (document.hidden && rafId) {
                cancelAnimationFrame(rafId);
                rafId = null;
            } else if (!document.hidden && !rafId) {
                animateCursor();
            }
        });

        document.addEventListener('mouseenter', () => {
            cursorGlow.style.opacity = '1';
        });

        document.addEventListener('mouseleave', () => {
            cursorGlow.style.opacity = '0';
        });
    },

    setupLazyLoading() {
        const lazyImages = document.querySelectorAll('img[loading="lazy"]');
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.classList.add('progressive-image');
                    const src = img.getAttribute('data-src');
                    if (src) {
                        img.src = src;
                        img.addEventListener('load', () => {
                            img.classList.add('loaded');
                        });
                        imageObserver.unobserve(img);
                    }
                }
            });
        }, {
            rootMargin: '50px'
        });

        lazyImages.forEach(img => {
            const isInCertificateOrProject =
                img.closest('.certificate-item') ||
                img.closest('.project-card');

            if (isInCertificateOrProject) {
                const src = img.getAttribute('data-src');
                if (src) {
                    img.src = src;
                    img.classList.add('loaded');
                }
            } else {
                imageObserver.observe(img);
            }
        });
    },

    createProjectCardSkeleton(variant = '1x1') {
        const skeleton = document.createElement('div');
        skeleton.className = `project-card skeleton-card skeleton-${variant}`;
        skeleton.innerHTML = `
            <div class="skeleton-content">
                <div class="skeleton-project-minimal">
                    <div class="skeleton-project-header"></div>
                    <div class="skeleton-project-body"></div>
                </div>
            </div>
        `;
        return skeleton;
    },

    createCertificateSkeleton() {
        const skeleton = document.createElement('div');
        skeleton.className = 'certificate-item skeleton-card';
        skeleton.innerHTML = `
            <div class="skeleton-content skeleton-certificate-minimal">
                <div class="skeleton-certificate-image"></div>
            </div>
        `;
        return skeleton;
    },

    showSkeletonGrid(container, count, createSkeletonFn) {
        container.innerHTML = '';
        for (let i = 0; i < count; i++) {
            const skeleton = createSkeletonFn.call(this);
            skeleton.style.animationDelay = `${i * 0.05}s`;
            container.appendChild(skeleton);
        }
    },

    replaceSkeletonWithContent(skeleton, content) {
        if (!skeleton || !content) return;

        content.style.opacity = '0';
        skeleton.parentNode.replaceChild(content, skeleton);

        content.offsetHeight;

        requestAnimationFrame(() => {
            content.style.transition = 'opacity 0.3s ease-in-out';
            content.style.opacity = '1';
        });
    },

    setupDecodingText() {
        const elements = document.querySelectorAll('.decoding-text');
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&";

        elements.forEach(element => {
            const originalText = element.getAttribute('data-value');
            if (!originalText) return;
            let iterations = 0;

            const interval = setInterval(() => {
                element.innerText = originalText
                    .split("")
                    .map((letter, index) => {
                        if (index < iterations) {
                            return originalText[index];
                        }
                        return chars[Math.floor(Math.random() * chars.length)];
                    })
                    .join("");

                if (iterations >= originalText.length) {
                    clearInterval(interval);
                }

                iterations += 1 / 3;
            }, 30);
        });
    },

    setupCustomCursor() {
        const cursor = document.querySelector('.custom-cursor');
        if (!cursor) return;

        document.addEventListener('mousemove', (e) => {
            cursor.style.left = e.clientX + 'px';
            cursor.style.top = e.clientY + 'px';
        }, { passive: true });

        document.addEventListener('mousedown', () => {
            cursor.style.transform = 'translate(-50%, -50%) scale(0.8)';
        });

        document.addEventListener('mouseup', () => {
            cursor.style.transform = 'translate(-50%, -50%) scale(1)';
        });

        const hoverElements = document.querySelectorAll('a, button, .card, .project-card');
        hoverElements.forEach(el => {
            el.addEventListener('mouseenter', () => cursor.classList.add('hovered'));
            el.addEventListener('mouseleave', () => cursor.classList.remove('hovered'));
        });
    },

    setupSpotlightEffect() {
        const cards = document.querySelectorAll('.bento-item, .card, .research-card, .project-card, .certificate-item, .about-section, .contact-card, .blog-card');

        cards.forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                card.style.setProperty('--mouse-x', `${x}px`);
                card.style.setProperty('--mouse-y', `${y}px`);
            }, { passive: true });
        });
    },
};
