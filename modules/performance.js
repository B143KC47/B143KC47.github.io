// 性能优化模块实现 - 使用全局对象而非ES模块
const PerformanceModule = {
    init() {
        this.checkBrowserSupport();
        this.checkReducedMotion();
        this.setupScrollOptimization();
        this.setupImageOptimization();
    },

    checkReducedMotion() {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion) {
            document.documentElement.classList.add('reduced-motion');
        }

        window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
            if (e.matches) {
                document.documentElement.classList.add('reduced-motion');
            } else {
                document.documentElement.classList.remove('reduced-motion');
            }
        });
    },

    // 检查浏览器对现代特性的支持情况
    checkBrowserSupport() {
        this.supportsWebp = false;
        // 检测WebP支持
        const webpTest = new Image();
        webpTest.onload = () => { this.supportsWebp = true; };
        webpTest.src = 'data:image/webp;base64,UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==';
        
        // 检测Intersection Observer API支持
        this.supportsIntersectionObserver = 'IntersectionObserver' in window;
        this.supportsBackdropFilter = CSS.supports('backdrop-filter', 'blur(10px)') || CSS.supports('-webkit-backdrop-filter', 'blur(10px)');

        // 检测被动事件监听器支持
        let supportsPassive = false;
        try {
            const opts = Object.defineProperty({}, 'passive', {
                get: function() { supportsPassive = true; return true; }
            });
            window.addEventListener('testPassive', null, opts);
            window.removeEventListener('testPassive', null, opts);
        } catch (e) {}
        this.supportsPassive = supportsPassive;

        if (!this.supportsBackdropFilter) {
            document.documentElement.classList.add('no-backdrop-filter');
        }
    },

    setupScrollOptimization() {
        // 使用更高效的防抖和节流
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

        const throttle = (func, limit) => {
            let inThrottle;
            return function(...args) {
                if (!inThrottle) {
                    func(...args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            };
        };

        // 使用节流函数处理高频滚动事件
        const optimizedScroll = throttle(() => {
            const scrollTop = window.pageYOffset;
            
            const navbar = document.querySelector('.navbar');
            if (navbar) {
                navbar.classList.toggle('scrolled', scrollTop > 50);
            }
            
            // 使用requestAnimationFrame确保平滑的视觉效果
            window.requestAnimationFrame(() => {
                this.updateParallax();
            
                document.querySelectorAll('.viewport-element').forEach(element => {
                    const rect = element.getBoundingClientRect();
                    const isInViewport = (
                        rect.top <= window.innerHeight * 0.8 &&
                        rect.bottom >= 0
                    );
                    
                    if (isInViewport) {
                        element.classList.add('in-view');
                    }
                });
            });
        }, 20);

        // 使用被动事件监听器以提高性能
        window.addEventListener('scroll', optimizedScroll, 
            this.supportsPassive ? { passive: true } : false);
    },

    setupImageOptimization() {
        const loadImage = (img) => {
            const container = img.parentElement;
            const placeholder = container?.querySelector('.placeholder');
            
            // 选择最佳图片格式
            let imgSrc = img.dataset.src;
            // 如果浏览器支持WebP且我们有WebP版本的图片
            const webpSrc = img.dataset.webp;
            if (this.supportsWebp && webpSrc) {
                imgSrc = webpSrc;
            }
            
            // 预加载图片
            const tempImage = new Image();
            tempImage.src = imgSrc;
            
            tempImage.onload = () => {
                // 图片加载完成后应用
                img.src = imgSrc;
                img.classList.add('loaded');
                if (placeholder) {
                    placeholder.classList.add('hidden');
                    // 淡出效果后删除占位符以减少DOM节点
                    setTimeout(() => {
                        placeholder.remove();
                    }, 500);
                }
            };

            tempImage.onerror = function() {
                // 如果加载失败，尝试回退到原图
                console.warn(`Failed to load optimized image: ${imgSrc}, falling back to original source`);
                if (imgSrc !== img.dataset.src) {
                    tempImage.src = img.dataset.src;
                }
            };
        };

        // 使用原生的IntersectionObserver进行懒加载
        if (this.supportsIntersectionObserver) {
            const imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        loadImage(entry.target);
                        imageObserver.unobserve(entry.target);
                    }
                });
            }, {
                rootMargin: '100px', // 提前100px开始加载
                threshold: 0.1 // 10%可见即开始加载
            });
    
            // 统一处理所有带data-src的图片
            document.querySelectorAll('img[data-src]').forEach(img => {
                // 项目卡片和证书内的图片优先加载
                if (img.closest('.certificate-item') || img.closest('.project-card')) {
                    // 如果图片接近视口则立即加载
                    if (this.isNearViewport(img)) {
                        loadImage(img);
                    } else {
                        // 否则仍然观察
                        imageObserver.observe(img);
                    }
                } else {
                    imageObserver.observe(img);
                }
            });
        } else {
            // 后备方案：如果不支持IntersectionObserver，则直接加载所有图片
            document.querySelectorAll('img[data-src]').forEach(img => {
                loadImage(img);
            });
        }
    },

    // 辅助方法：检查元素是否接近视口
    isNearViewport(el) {
        const rect = el.getBoundingClientRect();
        const windowHeight = window.innerHeight || document.documentElement.clientHeight;
        const windowWidth = window.innerWidth || document.documentElement.clientWidth;
        
        // 元素在视口或即将出现在视口中
        const vertInView = (rect.top <= windowHeight) && ((rect.top + rect.height) >= 0);
        const horInView = (rect.left <= windowWidth) && ((rect.left + rect.width) >= 0);
        
        return vertInView && horInView;
    },

    updateParallax() {
        // 在小屏幕上禁用视差效果以提高性能
        if (window.innerWidth <= 768) return;
        
        const parallaxElements = document.querySelectorAll('.parallax-element');
        window.requestAnimationFrame(() => {
            const scrolled = window.pageYOffset;
            parallaxElements.forEach(el => {
                const speed = el.getAttribute('data-speed') || 0.5;
                const yPos = -(scrolled * speed);
                // 使用transform而不是修改top/margin-top属性更高效
                el.style.transform = `translate3d(0, ${yPos}px, 0)`;
            });
        });
    }
};