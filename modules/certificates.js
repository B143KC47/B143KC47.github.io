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
        this.showCertificateSkeletons();
        this.setupCertificateCards();
        this.setupModalEvents();
    },

    showCertificateSkeletons() {
        const certificateGrid = document.querySelector('.certificate-grid');
        if (!certificateGrid) return;

        const existingCertificates = certificateGrid.querySelectorAll('.certificate-item');
        if (existingCertificates.length === 0) return;

        console.log('🎨 Certificate skeleton system initializing...', existingCertificates.length, 'certificates');

        try {
            const skeletons = [];
            let successfulSkeletons = 0;

            existingCertificates.forEach((cert, index) => {
                try {
                    if (typeof UIModule === 'undefined' || !UIModule.createCertificateSkeleton) {
                        throw new Error('UIModule.createCertificateSkeleton not available');
                    }

                    const skeleton = UIModule.createCertificateSkeleton();
                    if (skeleton) {
                        skeleton.style.animationDelay = `${index * 60}ms`;

                        const certHeight = window.getComputedStyle(cert).height;
                        skeleton.style.minHeight = certHeight;
                        skeleton.style.height = '100%';

                        cert.style.opacity = '0';
                        cert.style.visibility = 'hidden';
                        cert.parentNode.insertBefore(skeleton, cert);
                        skeletons.push({ skeleton, original: cert });
                        successfulSkeletons++;
                    }
                } catch (e) {
                    console.warn('⚠️ Skeleton creation failed for certificate', index, ':', e.message);
                }
            });

            console.log(`📊 Created ${successfulSkeletons} skeletons out of ${existingCertificates.length} certificates`);

            const ensureVisibility = () => {
                existingCertificates.forEach((cert, index) => {
                    cert.style.opacity = '1';
                    cert.style.visibility = 'visible';
                    cert.style.display = 'flex';
                });
                console.log('✅ Certificates fail-safe visibility activated - all certificates now visible');
            };

            const failSafeTimeout = setTimeout(ensureVisibility, 2000);

            if (successfulSkeletons > 0) {
                setTimeout(() => {
                    skeletons.forEach(({ skeleton, original }, index) => {
                        setTimeout(() => {
                            skeleton.classList.add('skeleton-exit');
                            setTimeout(() => {
                                skeleton.remove();
                                original.style.opacity = '1';
                                original.style.visibility = 'visible';
                                original.style.display = 'flex';
                                original.classList.add('content-reveal');
                                original.style.animationDelay = `${index * 60}ms`;
                            }, 300);
                        }, index * 100);
                    });

                    clearTimeout(failSafeTimeout);
                    console.log('✅ Certificate skeleton animation completed successfully');
                }, 800);
            } else {
                console.warn('⚠️ No skeletons created - forcing immediate visibility');
                clearTimeout(failSafeTimeout);
                ensureVisibility();
            }
        } catch (error) {
            console.error('❌ Certificate skeleton system failed critically:', error);
            existingCertificates.forEach((cert, index) => {
                cert.style.opacity = '1';
                cert.style.visibility = 'visible';
                cert.style.display = 'flex';
            });
            console.log('✅ Emergency visibility fallback activated');
        }
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