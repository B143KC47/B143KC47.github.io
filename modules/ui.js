// UI模块实现 - 使用全局对象而非ES模块
const UIModule = {
    init() {
        this.showInitialSkeleton();
        this.initializeSections();
        this.updateCopyrightYear();
        this.initializeAnimations();
        this.setupScrollTriggers();
        this.setupTextReveals();
        this.setup3DTilt();
        this.setupMagneticElements();
        this.setupCursorGlow();
        this.hideInitialSkeleton();
    },

    showInitialSkeleton() {
        // Create page skeleton container if it doesn't exist
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
        // Smoothly remove skeleton after content loads
        setTimeout(() => {
            const skeleton = document.querySelector('.page-skeleton-container');
            if (skeleton) {
                skeleton.classList.add('skeleton-exit');
                setTimeout(() => skeleton.remove(), 300);

                // Add reveal animation to hero content
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
        document.getElementById('year').textContent = `© ${currentYear} Powered by KO Ho Tin`;
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

        // Realistic loading stages
        const loadingStages = [
            { progress: 20, duration: 100 },  // Initial DOM parsing
            { progress: 40, duration: 200 },  // CSS loading
            { progress: 60, duration: 300 },  // Font loading
            { progress: 80, duration: 200 },  // JavaScript initialization
            { progress: 90, duration: 150 },  // Image preloading
            { progress: 100, duration: 100 }  // Final rendering
        ];

        let currentProgress = 0;
        let stageIndex = 0;

        const updateProgress = () => {
            if (stageIndex < loadingStages.length) {
                const stage = loadingStages[stageIndex];
                currentProgress = stage.progress;
                loadingProgress.style.width = `${currentProgress}%`;
                stageIndex++;
                setTimeout(updateProgress, stage.duration);
            } else {
                // Smooth fade out
                setTimeout(() => {
                    loadingIndicator.classList.add('fade-out');
                    document.body.classList.add('page-loaded');
                    setTimeout(() => loadingIndicator.remove(), 500);
                }, 300);
            }
        };

        // Start the loading sequence
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
            });

            element.addEventListener('mouseleave', () => {
                element.style.setProperty('--tilt-x', '0deg');
                element.style.setProperty('--tilt-y', '0deg');
            });
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
                const moveX = x * strength;
                const moveY = y * strength;

                element.style.setProperty('--magnetic-x', `${moveX}px`);
                element.style.setProperty('--magnetic-y', `${moveY}px`);
            });

            element.addEventListener('mouseleave', () => {
                element.style.setProperty('--magnetic-x', '0px');
                element.style.setProperty('--magnetic-y', '0px');
            });
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

        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        });

        function animateCursor() {
            glowX += (mouseX - glowX) * 0.1;
            glowY += (mouseY - glowY) * 0.1;

            cursorGlow.style.left = `${glowX}px`;
            cursorGlow.style.top = `${glowY}px`;

            requestAnimationFrame(animateCursor);
        }

        animateCursor();

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

    // Skeleton loader utilities with minimal design
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

        // Trigger reflow
        content.offsetHeight;

        requestAnimationFrame(() => {
            content.style.transition = 'opacity 0.3s ease-in-out';
            content.style.opacity = '1';
        });
    }
};