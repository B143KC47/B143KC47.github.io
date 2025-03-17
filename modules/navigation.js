// 导航模块实现 - 使用全局对象而非ES模块
const NavigationModule = {
    init() {
        this.setupSmoothScroll();
        this.setupNavbarScroll();
    },

    setupSmoothScroll() {
        function smoothScroll(targetId) {
            const targetElement = document.querySelector(targetId);
            if (!targetElement) return;

            const headerOffset = 60;
            const elementPosition = targetElement.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });

            history.pushState(null, '', targetId);
        }

        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const targetId = this.getAttribute('href');
                smoothScroll(targetId);
            });
        });

        document.querySelector('.hero-buttons .primary')?.addEventListener('click', function(e) {
            e.preventDefault();
            smoothScroll('#about-me');
        });

        document.querySelector('.hero-buttons .secondary')?.addEventListener('click', function(e) {
            e.preventDefault();
            smoothScroll('#contact');
        });

        window.addEventListener('popstate', () => {
            const hash = window.location.hash;
            if (hash) {
                const targetElement = document.querySelector(hash);
                if (targetElement) {
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    },

    setupNavbarScroll() {
        let lastScrollTop = 0;
        window.addEventListener('scroll', () => {
            const navbar = document.querySelector('.navbar');
            const currentScroll = window.pageYOffset;
            
            if (currentScroll > lastScrollTop) {
                navbar.classList.add('scroll-down');
                navbar.classList.remove('scroll-up');
            } else {
                navbar.classList.add('scroll-up');
                navbar.classList.remove('scroll-down');
            }
            
            lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
        }, { passive: true });
    }
};