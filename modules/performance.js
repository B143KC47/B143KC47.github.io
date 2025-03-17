// 性能优化模块实现 - 使用全局对象而非ES模块
const PerformanceModule = {
    init() {
        this.setupScrollOptimization();
        this.setupImageOptimization();
    },

    setupScrollOptimization() {
        const debounce = (func, wait) => {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        };

        const optimizedScroll = debounce(() => {
            const scrollTop = window.pageYOffset;
            
            const navbar = document.querySelector('.navbar');
            if (navbar) {
                navbar.classList.toggle('scrolled', scrollTop > 50);
            }
            
            this.updateParallax();
            
            document.querySelectorAll('.viewport-element').forEach(element => {
                const rect = element.getBoundingClientRect();
                const isInViewport = (
                    rect.top >= 0 &&
                    rect.bottom <= window.innerHeight
                );
                
                if (isInViewport) {
                    element.classList.add('in-view');
                }
            });
        }, 10);

        window.addEventListener('scroll', optimizedScroll, { passive: true });
    },

    setupImageOptimization() {
        const loadImage = (img) => {
            const container = img.parentElement;
            const placeholder = container?.querySelector('.placeholder');
            
            const tempImage = new Image();
            tempImage.src = img.dataset.src;
            
            tempImage.onload = () => {
                img.src = img.dataset.src;
                img.classList.add('loaded');
                if (placeholder) {
                    placeholder.classList.add('hidden');
                }
            };
        };

        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    loadImage(entry.target);
                    imageObserver.unobserve(entry.target);
                }
            });
        }, {
            rootMargin: '50px'
        });

        document.querySelectorAll('.progressive-img-container img[data-src]').forEach(img => {
            if (img.closest('.certificate-item') || img.closest('.project-card')) {
                loadImage(img);
            } else {
                imageObserver.observe(img);
            }
        });
    },

    updateParallax() {
        if (window.innerWidth <= 768) return;
        
        const parallaxElements = document.querySelectorAll('.parallax-element');
        window.requestAnimationFrame(() => {
            const scrolled = window.pageYOffset;
            parallaxElements.forEach(el => {
                const speed = el.getAttribute('data-speed') || 0.5;
                const yPos = -(scrolled * speed);
                el.style.transform = `translate3d(0, ${yPos}px, 0)`;
            });
        });
    }
};