// 采用全局对象模式，避免模块导入导致的CORS问题

// Development mode detection
(function() {
    'use strict';

    const isDevelopment = window.location.protocol === 'file:' ||
                          window.location.hostname === 'localhost' ||
                          window.location.hostname === '127.0.0.1';

    if (isDevelopment && !sessionStorage.getItem('welcomeShown')) {
        console.log('%c🎨 Portfolio Website', 'color: #10a37f; font-size: 20px; font-weight: bold');
        console.log('%cDeveloper Mode Active', 'color: #888; font-size: 12px');
        console.log('%cAPI calls use fallback strategies - this is normal!', 'color: #888; font-size: 11px');
        console.log(' ');
        sessionStorage.setItem('welcomeShown', 'true');
    }
})();

// DOM加载完成后初始化所有功能模块
document.addEventListener('DOMContentLoaded', () => {
    // 检查所有模块是否已加载
    if (typeof UIModule !== 'undefined' &&
        typeof NavigationModule !== 'undefined' &&
        typeof CertificatesModule !== 'undefined' &&
        typeof GitHubModule !== 'undefined' &&
        typeof OpenReviewModule !== 'undefined' &&
        typeof TouchModule !== 'undefined' &&
        typeof PerformanceModule !== 'undefined') {

        // 初始化所有模块
        UIModule.init();
        NavigationModule.init();
        CertificatesModule.init();
        GitHubModule.init().catch(console.error);
        OpenReviewModule.init().catch(console.error);
        TouchModule.init();
        PerformanceModule.init();
    } else {
        console.error('某些模块未正确加载');
    }

    // 初始化模态窗口功能
    initModal();
});

// 证书模态窗口功能
function initModal() {
    // 获取模态窗口元素
    const modal = document.getElementById('certificateModal');
    if (!modal) return;
    
    // 获取关闭按钮
    const closeBtn = modal.querySelector('.close-modal');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }
    
    // 点击模态窗口外部关闭
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// 显示证书详情
function showCertificateDetails(id) {
    const certificates = {
        'ja': {
            title: 'JA Student Company Program',
            image: 'assets/Certificates/JA.jpg',
            description: '参与HSBC与青年成就联合举办的学生公司计划，培养创业精神与商业技能',
            tags: ['Entrepreneurship', 'Leadership', 'Business'],
            date: '2024'
        },
        'mit': {
            title: 'MIT Innovation Academy',
            image: 'assets/Certificates/MIT.jpg',
            description: '麻省理工学院创新训练营，专注于物联网和智能家居创新的学生项目',
            tags: ['IoT', 'Innovation', 'Technology'],
            date: '2024'
        },
        'ieee': {
            title: 'IEEE CIS Summer School',
            image: 'assets/Certificates/IEEE_Summer_school.png',
            description: '在横滨参加的量子计算智能程序培训',
            tags: ['Quantum Computing', 'AI', 'Research'],
            date: 'June 26-28, 2024'
        },
        'hkujsi': {
            title: 'HKU JSI',
            image: 'assets/Certificates/hkujsi.jpg',
            description: '香港大学创新科学研究项目',
            tags: ['Innovation', 'Science', 'Technology'],
            date: 'Summer, 2024'
        },
        'econ_workshop': {
            title: 'Economics Workshop',
            image: 'assets/Certificates/econ_workshop.jpg',
            description: '经济学研讨会，学习现代经济学理论与应用',
            tags: ['Economics', 'Business'],
            date: 'Summer, 2024'
        },
        'cityu_ai': {
            title: 'CityU Gifted Program for AI and Hardware',
            image: 'assets/Certificates/cityu_gef.jpg',
            description: '香港城市大学人工智能与硬件资优项目',
            tags: ['AI', 'Hardware', 'Technology'],
            date: 'Summer, 2024'
        },
        'space_tech': {
            title: 'Space Tech Competition',
            image: 'assets/Certificates/space_comp.jpg',
            description: '太空技术竞赛项目，探索太空创新技术',
            tags: ['Space', 'Technology', 'Engineering'],
            date: 'Summer, 2024'
        }
    };
    
    const cert = certificates[id];
    if (!cert) return;
    
    const modal = document.getElementById('certificateModal');
    const modalImage = document.getElementById('modalImage');
    const modalTitle = document.getElementById('modalTitle');
    const modalDescription = document.getElementById('modalDescription');
    const modalTags = document.getElementById('modalTags');
    const modalDate = document.getElementById('modalDate');
    
    // 设置模态窗口内容
    if (modalImage) modalImage.src = cert.image;
    if (modalTitle) modalTitle.textContent = cert.title;
    if (modalDescription) modalDescription.textContent = cert.description;
    if (modalDate) modalDate.textContent = cert.date;
    
    // 设置标签
    if (modalTags) {
        modalTags.innerHTML = '';
        cert.tags.forEach(tag => {
            const span = document.createElement('span');
            span.className = 'certificate-tag';
            span.textContent = tag;
            modalTags.appendChild(span);
        });
    }
    
    // 显示模态窗口
    if (modal) modal.style.display = 'block';
}
