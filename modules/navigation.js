// 导航模块实现 - 使用全局对象而非ES模块
const NavigationModule = {
    init() {
        this.setupSmoothScroll();
        this.setupNavbarScroll();
        this.setupMobileMenu();
        this.setupMobileDropdown();
    },
    
    setupMobileDropdown() {
        const dropdowns = document.querySelectorAll('.dropdown');
        
        if (window.innerWidth <= 768) {
            dropdowns.forEach(dropdown => {
                const dropdownLink = dropdown.querySelector(':scope > a');
                const dropdownContent = dropdown.querySelector('.dropdown-content');
                
                if (dropdownLink && dropdownContent) {
                    dropdownLink.addEventListener('click', (e) => {
                        if (window.innerWidth <= 768) {
                            e.preventDefault();
                            e.stopPropagation();
                            
                            // 关闭其他 dropdown
                            dropdowns.forEach(other => {
                                if (other !== dropdown) {
                                    other.classList.remove('active');
                                }
                            });
                            
                            // 切换当前 dropdown
                            dropdown.classList.toggle('active');
                        }
                    });
                }
            });
        }
        
        // 监听窗口大小变化
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) {
                dropdowns.forEach(dropdown => dropdown.classList.remove('active'));
            }
        });
    },
    
    setupMobileMenu() {
        const hamburger = document.querySelector('.hamburger-menu');
        const navLinks = document.querySelector('.navbar-links');
        const navLinkItems = document.querySelectorAll('.navbar-links > a, .navbar-links > .dropdown > a');
        
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
            
            // 关闭所有 dropdown
            if (isActive) {
                document.querySelectorAll('.dropdown').forEach(d => d.classList.remove('active'));
            }
        };
        
        // 汉堡菜单点击事件
        hamburger.addEventListener('click', toggleMenu);
        
        // 点击非 dropdown 的导航链接后关闭菜单
        navLinkItems.forEach(link => {
            link.addEventListener('click', (e) => {
                const isDropdownToggle = link.parentElement.classList.contains('dropdown');
                if (navLinks.classList.contains('active') && window.innerWidth <= 768 && !isDropdownToggle) {
                    toggleMenu();
                }
            });
        });
        
        // 点击 dropdown 内的链接后关闭菜单
        document.querySelectorAll('.dropdown-content a').forEach(link => {
            link.addEventListener('click', () => {
                if (navLinks.classList.contains('active') && window.innerWidth <= 768) {
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