// 导航模块实现 - 使用全局对象而非ES模块
const NavigationModule = {
    init() {
        this.setupSmoothScroll();
        this.setupNavbarScroll();
        this.setupMobileMenu(); // 添加移动端菜单设置
    },
    
    setupMobileMenu() {
        const hamburger = document.querySelector('.hamburger-menu');
        const navLinks = document.querySelector('.navbar-links');
        const navLinkItems = document.querySelectorAll('.navbar-links a'); // 获取所有导航链接
        
        if (!hamburger || !navLinks) {
            console.warn('未找到汉堡菜单或导航链接元素');
            return;
        }
        
        // 切换菜单状态函数
        const toggleMenu = () => {
            const isActive = navLinks.classList.contains('active');
            hamburger.classList.toggle('active');
            navLinks.classList.toggle('active');
            hamburger.setAttribute('aria-expanded', !isActive);
            
            // 防止菜单打开时页面滚动
            document.body.style.overflow = isActive ? '' : 'hidden';
        };
        
        // 汉堡菜单点击事件
        hamburger.addEventListener('click', toggleMenu);
        
        // 点击导航链接后关闭菜单
        navLinkItems.forEach(link => {
            link.addEventListener('click', () => {
                if (navLinks.classList.contains('active') && window.innerWidth <= 768) {
                    // 只在移动端且菜单打开时执行
                    toggleMenu();
                }
            });
        });
        
        // 点击菜单外部关闭菜单
        document.addEventListener('click', (event) => {
            if (navLinks.classList.contains('active') && 
                !navLinks.contains(event.target) && 
                !hamburger.contains(event.target)) {
                toggleMenu();
            }
        });
        
        // 按ESC键关闭菜单
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && navLinks.classList.contains('active')) {
                toggleMenu();
            }
        });
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
        // Disabled for floating HUD
    }
};