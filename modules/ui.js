// UI模块实现 - 使用全局对象而非ES模块
const UIModule = {
    init() {
        this.initializeSections();
        this.updateCopyrightYear();
        this.initializeAnimations();
    },

    initializeSections() {
        document.querySelectorAll('.certificates-section, .github-projects-section').forEach(section => {
            section.style.display = 'block';
            section.style.opacity = '1';
            section.style.visibility = 'visible';
            section.style.transform = 'translateY(0)';
        });

        document.querySelectorAll('.certificate-grid, .projects-grid').forEach(grid => {
            grid.style.display = 'grid';
            grid.style.opacity = '1';
            grid.style.visibility = 'visible';
        });

        document.querySelectorAll('.certificate-item, .project-card').forEach(item => {
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

        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += Math.random() * 30;
            if (progress > 100) {
                progress = 100;
                clearInterval(progressInterval);
                setTimeout(() => {
                    loadingIndicator.style.opacity = '0';
                    document.body.classList.add('page-loaded');
                    setTimeout(() => loadingIndicator.remove(), 300);
                }, 500);
            }
            loadingProgress.style.width = `${progress}%`;
        }, 200);
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
    }
};