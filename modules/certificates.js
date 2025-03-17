// 证书模块实现 - 使用全局对象而非ES模块
const CertificatesModule = {
    certificateData: {
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
    },

    init() {
        this.setupCertificateCards();
        this.setupModalEvents();
    },

    setupCertificateCards() {
        document.querySelectorAll('.certificate-item').forEach(card => {
            // 添加3D悬停效果
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

            // 添加点击事件处理
            card.addEventListener('click', () => {
                const certificateId = card.dataset.certificateId;
                if (certificateId) {
                    this.showCertificateDetails(certificateId);
                }
            });
        });
    },

    setupModalEvents() {
        const modal = document.getElementById('certificateModal');
        const closeBtn = document.querySelector('.close-modal');

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.classList.remove('show');
                setTimeout(() => {
                    modal.style.display = 'none';
                    document.body.style.overflow = 'auto';
                }, 300);
            });
        }

        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('show');
                setTimeout(() => {
                    modal.style.display = 'none';
                    document.body.style.overflow = 'auto';
                }, 300);
            }
        });
    },

    showCertificateDetails(certificateId) {
        const data = this.certificateData[certificateId];
        const modal = document.getElementById('certificateModal');
        
        if (!data || !modal) return;
        
        document.getElementById('modalTitle').textContent = data.title;
        document.getElementById('modalDescription').textContent = data.description;
        document.getElementById('modalImage').src = data.image;
        document.getElementById('modalDate').textContent = data.date;
        
        const tagsContainer = document.getElementById('modalTags');
        tagsContainer.innerHTML = data.tags.map(tag => 
            `<span class="certificate-tag">${tag}</span>`
        ).join('');
        
        modal.style.display = 'block';
        setTimeout(() => modal.classList.add('show'), 10);
        
        document.body.style.overflow = 'hidden';
    }
};