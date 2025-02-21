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
});

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
        image: 'assets/Honors_Awards_Certificates/JA.jpg',
        tags: ['Entrepreneurship', 'Leadership', 'Business'],
        date: '2024'
    },
    'mit': {
        title: 'MIT Innovation Academy',
        description: 'Student bootcamp focused on IoT and smart home innovations. Hands-on experience with cutting-edge technology.',
        image: 'assets/Honors_Awards_Certificates/MIT.jpg',
        tags: ['IoT', 'Innovation', 'Technology'],
        date: '2024'
    },
    'ieee': {
        title: 'IEEE CIS Summer School',
        description: 'Quantum Computational Intelligence program in Yokohama. Advanced research and practical applications in quantum computing.',
        image: 'assets/Honors_Awards_Certificates/IEEE_Summer_school.png',
        tags: ['Quantum Computing', 'AI', 'Research'],
        date: 'June 26-28, 2024'
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
