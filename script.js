document.addEventListener('DOMContentLoaded', () => {
    const currentYear = new Date().getFullYear();
    document.getElementById('year').textContent = `© ${currentYear} Powered by KO Ho Tin`;

    // 优化平滑滚动
    function smoothScroll(targetId) {
        const targetElement = document.querySelector(targetId);
        if (!targetElement) return;

        const headerOffset = 60; // 导航栏高度
        const elementPosition = targetElement.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });

        // 更新 URL，但不触发实际跳转
        history.pushState(null, '', targetId);
    }

    // 处理所有页内导航链接
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            smoothScroll(targetId);
        });
    });

    // 特别处理 hero 按钮
    document.querySelector('.hero-buttons .primary').addEventListener('click', function(e) {
        e.preventDefault();
        smoothScroll('#about-me');
    });

    document.querySelector('.hero-buttons .secondary').addEventListener('click', function(e) {
        e.preventDefault();
        smoothScroll('#contact');
    });

    // 处理浏览器后退/前进按钮
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

    // 统一滚动动画和视差效果
    const hero = document.querySelector('.hero');
    const heroContent = document.querySelector('.hero-content');
    const heroBackground = document.querySelector('.hero-background');
    let lastScrollY = 0;
    let ticking = false;
    const dampFactor = 0.4;

    const updateParallax = () => {
        const scrollY = window.scrollY;
        const easedScroll = lastScrollY + (scrollY - lastScrollY) * dampFactor;
        lastScrollY = easedScroll;

        document.body.classList.toggle('scrolled', easedScroll > 50);

        const contentTranslate = easedScroll * 0.3;
        const bgTranslate = easedScroll * 0.5;
        const scaleValue = 1 + (easedScroll * 0.0005);
        const opacityValue = Math.max(0, 1 - easedScroll * 0.002);

        heroContent.style.transform = `translate3d(0, ${contentTranslate}px, 0)`;
        heroBackground.style.transform = `translate3d(0, ${bgTranslate}px, 0) scale(${scaleValue})`;
        heroContent.style.opacity = opacityValue;

        ticking = false;
    };

    const onScroll = () => {
        if (!ticking) {
            requestAnimationFrame(updateParallax);
            ticking = true;
        }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    updateParallax();

    // 统一 Intersection Observer
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '50px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // 添加统一的类名，表示元素已进入可视区域
                entry.target.classList.add('in-view');

                // 根据不同的元素，执行不同的操作
                if (entry.target.classList.contains('fade-up')) {
                    entry.target.classList.add('fade-up-animation');
                }
                if (entry.target.classList.contains('fade-in')) {
                    entry.target.classList.add('fade-in-animation');
                }
                if (entry.target.classList.contains('section')) {
                    entry.target.classList.add('section-animation');
                }

                // 停止观察，避免重复执行
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // 观察所有需要使用 Intersection Observer 的元素
    document.querySelectorAll('section, .fade-up, .fade-in').forEach(element => {
        observer.observe(element);
    });

    // 鼠标跟踪效果
    document.querySelectorAll('.card, .certificate-card').forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            card.style.setProperty('--mouse-x', `${x}px`);
            card.style.setProperty('--mouse-y', `${y}px`);
        });
    });

    // 图片加载动画
    document.querySelectorAll('.certificate-image').forEach(img => {
        img.addEventListener('load', () => {
            img.classList.add('loaded');
            img.removeEventListener('load', arguments.callee);
        });
    });

    const modal = document.getElementById('certificateModal');
    const closeBtn = document.querySelector('.close-modal');
    
    closeBtn.onclick = () => {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }, 300);
    };
    
    window.onclick = (event) => {
        if (event.target === modal) {
            closeBtn.onclick();
        }
    };

    fetchGitHubProjects();

    // 页面加载进度指示器
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'loading-indicator';
    const loadingProgress = document.createElement('div');
    loadingProgress.className = 'loading-progress';
    const loadingPulse = document.createElement('div');
    loadingPulse.className = 'loading-pulse';
    loadingProgress.appendChild(loadingPulse);
    loadingIndicator.appendChild(loadingProgress);
    document.body.appendChild(loadingIndicator);

    // 模拟加载进度
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

    // 图片延迟加载
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

    lazyImages.forEach(img => imageObserver.observe(img));

    // 滚动动画
    const scrollElements = document.querySelectorAll('.scroll-reveal');
    const scrollObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                scrollObserver.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1
    });

    scrollElements.forEach(el => scrollObserver.observe(el));

    // 鼠标跟随效果
    document.addEventListener('mousemove', (e) => {
        const interactiveElements = document.querySelectorAll('.mouse-parallax-element');
        interactiveElements.forEach(el => {
            const rect = el.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            el.style.setProperty('--mouse-x', x + 'px');
            el.style.setProperty('--mouse-y', y + 'px');
        });
    });

    // 平滑滚动
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // 证书卡片悬停效果
    document.querySelectorAll('.certificate-item').forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = (y - centerY) / 20;
            const rotateY = (centerX - x) / 20;
            
            card.style.transform = `
                perspective(1000px)
                rotateX(${rotateX}deg)
                rotateY(${rotateY}deg)
                scale3d(1.02, 1.02, 1.02)
            `;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
        });
    });

    // 导航栏滚动效果
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

    // 性能优化
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reducedMotion.matches) {
        document.documentElement.classList.add('reduced-motion');
    }
});

// 动态调整视差效果
function updateParallax() {
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

window.addEventListener('scroll', updateParallax, { passive: true });


// 移动端导航栏控制
function toggleMobileNav() {
    const nav = document.querySelector('.navbar');
    nav.style.display = nav.style.display === 'none' ? 'flex' : 'none';
}

// 证书数据
const certificateData = {
    'ja': {
        title: 'JA Student Company Program',
        description: 'HSBC x JA Company Programme for entrepreneurship development. Learn business operations and leadership skills through practical experience.',
        image: 'assets/Certificates/JA.jpg',
        tags: ['Entrepreneurship', 'Leadership', 'Business'],
        date: '2024'
    },
    'mit': {
        title: 'MIT Innovation Academy',
        description: 'Student bootcamp focused on IoT and smart home innovations. Hands-on experience with cutting-edge technology.',
        image: 'assets/Certificates/MIT.jpg',
        tags: ['IoT', 'Innovation', 'Technology'],
        date: '2024'
    },
    'ieee': {
        title: 'IEEE CIS Summer School',
        description: 'Quantum Computational Intelligence program in Yokohama',
        image: 'assets/Certificates/IEEE_Summer_school.png',
        tags: ['Quantum Computing', 'AI', 'Research'],
        date: 'June 26-28, 2024'
    },
    'hkujsi': {
        title: 'HKU JSI',
        description: 'HKU JSI',
        image: 'assets/Certificates/hkujsi.jpg',
        tags: ['Innovation', 'Science', 'Technology'],
        date: 'Summer, 2024'
    },
    'econ_workshop': {
        title: 'Econ Workshop',
        description: 'Econ Workshop',
        image: 'assets/Certificates/econ_workshop.jpg',
        tags: ['Economics', 'Business'],
        date: 'Summer, 2024'
    },
    'cityu_ai': {
        title: 'CityU Gifted Program for AI and Hardware',
        description: 'CityU Gifted Program focused on AI and Hardware',
        image: 'assets/Certificates/cityu_gef.jpg',
        tags: ['AI', 'Hardware', 'Technology'],
        date: 'Summer, 2024'
    },
    'space_tech': {
        title: 'Space Tech Competition',
        description: 'Space Tech Competition',
        image: 'assets/Certificates/space_comp.jpg',
        tags: ['Space', 'Technology', 'Engineering'],
        date: 'Summer, 2024'
    }
};

// 更新证书点击事件处理函数
function showCertificateDetails(certificateId) {
    const data = certificateData[certificateId];
    const modal = document.getElementById('certificateModal');
    
    // 更新模态框内容
    document.getElementById('modalTitle').textContent = data.title;
    document.getElementById('modalDescription').textContent = data.description;
    document.getElementById('modalImage').src = data.image;
    document.getElementById('modalDate').textContent = data.date;
    
    // 更新标签
    const tagsContainer = document.getElementById('modalTags');
    tagsContainer.innerHTML = data.tags.map(tag => 
        `<span class="certificate-tag">${tag}</span>`
    ).join('');
    
    // 显示模态框
    modal.style.display = 'block';
    setTimeout(() => modal.classList.add('show'), 10);
    
    // 禁止背景滚动
    document.body.style.overflow = 'hidden';
}

// GitHub 项目功能
async function fetchGitHubProjects() {
    const username = 'B143KC47'; // 你的 GitHub 用户名
    try {
        const response = await fetch(`https://api.github.com/users/${username}/repos?sort=stars&per_page=6`);
        const repos = await response.json();
        
        // 过滤掉 fork 的仓库和星星数小于 1 的仓库
        const filteredRepos = repos.filter(repo => !repo.fork && repo.stargazers_count >= 1);
        
        const projectsGrid = document.querySelector('.projects-grid');
        projectsGrid.innerHTML = ''; // 清除加载动画
        
        filteredRepos.forEach(repo => {
            const card = createProjectCard(repo);
            projectsGrid.appendChild(card);
        });
    } catch (error) {
        console.error('Error fetching GitHub projects:', error);
        const projectsGrid = document.querySelector('.projects-grid');
        projectsGrid.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                <p>加载项目时出现错误</p>
            </div>
        `;
    }
}

function createProjectCard(repo) {
    const card = document.createElement('div');
    card.className = 'project-card';
    
    const languageColor = getLanguageColor(repo.language);
    
    card.innerHTML = `
        <div class="project-header">
            <i class="far fa-folder-open project-icon"></i>
            <a href="${repo.html_url}" target="_blank" class="project-title">${repo.name}</a>
        </div>
        <p class="project-description">${repo.description || '暂无描述'}</p>
        ${repo.language ? `
            <div class="project-language">
                <span class="language-dot" style="background-color: ${languageColor}"></span>
                ${repo.language}
            </div>
        ` : ''}
        <div class="project-stats">
            <div class="stat-item">
                <i class="far fa-star"></i>
                ${repo.stargazers_count}
            </div>
            <div class="stat-item">
                <i class="fas fa-code-branch"></i>
                ${repo.forks_count}
            </div>
            <div class="stat-item">
                <i class="far fa-eye"></i>
                ${repo.watchers_count}
            </div>
        </div>
    `;
    
    return card;
}

function getLanguageColor(language) {
    const colors = {
        'JavaScript': '#f1e05a',
        'Python': '#3572A5',
        'HTML': '#e34c26',
        'CSS': '#563d7c',
        'TypeScript': '#2b7489',
        'Java': '#b07219',
        'C++': '#f34b7d'
    };
    return colors[language] || '#8b8b8b';
}

// 添加触摸手势支持
class TouchHandler {
    constructor() {
        this.startX = 0;
        this.startY = 0;
        this.startTime = 0;
        this.minSwipeDistance = 50;
        this.maxSwipeTime = 300;
        
        this.init();
    }
    
    init() {
        document.addEventListener('touchstart', this.handleTouchStart.bind(this));
        document.addEventListener('touchend', this.handleTouchEnd.bind(this));
    }
    
    handleTouchStart(e) {
        this.startX = e.touches[0].clientX;
        this.startY = e.touches[0].clientY;
        this.startTime = Date.now();
    }
    
    handleTouchEnd(e) {
        if (!this.startTime) return;
        
        const endX = e.changedTouches[0].clientX;
        const endY = e.changedTouches[0].clientY;
        const deltaX = endX - this.startX;
        const deltaY = endY - this.startY;
        const deltaTime = Date.now() - this.startTime;
        
        if (deltaTime > this.maxSwipeTime) return;
        
        if (Math.abs(deltaX) > this.minSwipeDistance) {
            // 水平滑动
            const direction = deltaX > 0 ? 'right' : 'left';
            this.handleSwipe(direction);
        } else if (Math.abs(deltaY) > this.minSwipeDistance) {
            // 垂直滑动
            const direction = deltaY > 0 ? 'down' : 'up';
            this.handleSwipe(direction);
        }
    }
    
    handleSwipe(direction) {
        // 导航栏响应
        const navbar = document.querySelector('.navbar');
        if (direction === 'down') {
            navbar.classList.add('scroll-up');
            navbar.classList.remove('scroll-down');
        } else if (direction === 'up') {
            navbar.classList.add('scroll-down');
            navbar.classList.remove('scroll-up');
        }
        
        // 证书卡片响应
        const certificateCards = document.querySelectorAll('.certificate-item');
        if (direction === 'left' || direction === 'right') {
            certificateCards.forEach(card => {
                card.style.transform = `translateX(${direction === 'right' ? '10px' : '-10px'})`;
                setTimeout(() => {
                    card.style.transform = '';
                }, 300);
            });
        }
    }
}

// 初始化触摸手势
const touchHandler = new TouchHandler();

// 优化滚动性能
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 优化滚动处理
const optimizedScroll = debounce(() => {
    const scrollTop = window.pageYOffset;
    
    // 更新导航栏状态
    const navbar = document.querySelector('.navbar');
    navbar.classList.toggle('scrolled', scrollTop > 50);
    
    // 更新视差效果
    updateParallax();
    
    // 检查元素是否在视口中
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

// 优化图片加载
function loadImage(img) {
    const container = img.parentElement;
    const placeholder = container.querySelector('.placeholder');
    
    // 创建新图片以预加载
    const tempImage = new Image();
    tempImage.src = img.dataset.src;
    
    tempImage.onload = () => {
        img.src = img.dataset.src;
        img.classList.add('loaded');
        if (placeholder) {
            placeholder.classList.add('hidden');
        }
    };
}

// 监听所有图片
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
    imageObserver.observe(img);
});
