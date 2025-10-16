const OpenReviewModule = {
    profileId: '~Ho_Tin_Ko2',
    profileUrl: 'https://openreview.net/profile?id=%7EHo_Tin_Ko2',
    publications: [],
    isLoading: false,
    hasError: false,

    profileInfo: {
        name: 'KO Ho Tin (BlackCat)',
        title: 'AI Researcher & Engineering Student',
        institution: 'Engineering Student',
        bio: 'AI researcher with a passion for engineering and design, focused on exploring cutting-edge technology in machine learning and deep learning. Recently completed research internship at City University of Hong Kong with contributions to top-tier AI conferences.',
        researchInterests: [
            'Machine Learning',
            'Deep Learning',
            'Computer Vision',
            'Natural Language Processing',
            'Generative AI',
            'Large Language Models'
        ],
        email: 's20200057@ylmass.edu.hk',
        stats: {
            affiliation: 'City University of Hong Kong',
            role: 'Research Intern',
            focus: 'AI & Machine Learning Research'
        }
    },

    async init() {
        this.showSkeletonLoaders();
        this.addProfileLink();

        const minLoadTime = new Promise(resolve => setTimeout(resolve, 600));

        const success = await this.fetchPublications();

        await minLoadTime;

        if (success) {
            this.renderPublications();
        } else {
            console.log('🔴 Fetch failed, calling showErrorState()');
            this.showErrorState();
        }
    },

    showSkeletonLoaders() {
        const publicationsGrid = document.querySelector('.publications-grid');
        if (!publicationsGrid) return;

        publicationsGrid.innerHTML = '';

        for (let i = 0; i < 3; i++) {
            const skeleton = document.createElement('div');
            skeleton.className = 'publication-item skeleton-loader';
            skeleton.style.animationDelay = `${i * 0.1}s`;
            skeleton.innerHTML = `
                <div class="skeleton-header">
                    <div class="skeleton-title"></div>
                    <div class="skeleton-status"></div>
                </div>
                <div class="skeleton-meta">
                    <div class="skeleton-text"></div>
                    <div class="skeleton-text short"></div>
                </div>
                <div class="skeleton-description">
                    <div class="skeleton-line"></div>
                    <div class="skeleton-line"></div>
                    <div class="skeleton-line short"></div>
                </div>
                <div class="skeleton-tags">
                    <div class="skeleton-tag"></div>
                    <div class="skeleton-tag"></div>
                    <div class="skeleton-tag"></div>
                </div>
            `;
            publicationsGrid.appendChild(skeleton);
        }

        const style = document.createElement('style');
        style.textContent = `
            .skeleton-loader {
                animation: skeletonPulse 1.5s ease-in-out infinite;
            }

            .skeleton-header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: var(--space-4);
                gap: var(--space-4);
            }

            .skeleton-title {
                flex: 1;
                height: 24px;
                background: var(--color-surface-elevated);
                border-radius: var(--radius-sm);
            }

            .skeleton-status {
                width: 80px;
                height: 24px;
                background: var(--color-surface-elevated);
                border-radius: var(--radius-full);
            }

            .skeleton-meta {
                margin-bottom: var(--space-4);
            }

            .skeleton-text {
                height: 16px;
                background: var(--color-surface-elevated);
                border-radius: var(--radius-sm);
                margin-bottom: var(--space-2);
            }

            .skeleton-text.short {
                width: 60%;
            }

            .skeleton-description {
                margin-bottom: var(--space-4);
            }

            .skeleton-line {
                height: 14px;
                background: var(--color-surface-elevated);
                border-radius: var(--radius-sm);
                margin-bottom: var(--space-2);
            }

            .skeleton-line.short {
                width: 75%;
            }

            .skeleton-tags {
                display: flex;
                gap: var(--space-2);
            }

            .skeleton-tag {
                width: 60px;
                height: 24px;
                background: var(--color-surface-elevated);
                border-radius: var(--radius-full);
            }

            @keyframes skeletonPulse {
                0%, 100% {
                    opacity: 1;
                }
                50% {
                    opacity: 0.5;
                }
            }
        `;
        document.head.appendChild(style);
    },

    async fetchPublications() {
        const isFileProtocol = window.location.protocol === 'file:';

        if (isFileProtocol) {
            console.log('📁 File protocol detected - trying local strategies first');
        }

        this.isLoading = true;
        this.hasError = false;

        const strategies = [
            () => this.loadFromInlineJSON(),
            () => this.loadFromDataFile(),
            () => this.fetchViaCORSProxyAllOrigins(),
            () => this.fetchViaCORSProxyCorsAnywhere(),
            () => this.fetchViaNotesAPI(),
            () => this.fetchViaProfilesAPI()
        ];

        for (const strategy of strategies) {
            try {
                const publications = await strategy();
                if (publications && publications.length > 0) {
                    this.publications = publications;
                    this.isLoading = false;
                    console.log(`✅ Fetched ${publications.length} publications`);
                    return true;
                }
            } catch (error) {
                console.warn('Strategy failed, trying next...', error.message);
            }
        }

        this.isLoading = false;
        this.hasError = true;
        console.log('📚 Could not fetch publications - showing error state');
        return false;
    },

    async loadFromInlineJSON() {
        try {
            const dataScript = document.getElementById('publications-data');
            if (!dataScript) {
                throw new Error('Publications data script not found');
            }

            const data = JSON.parse(dataScript.textContent);

            if (data.publications && data.publications.length > 0) {
                console.log(`✅ Loaded ${data.publications.length} publications from inline JSON`);
                console.log(`📅 Last updated: ${data.lastUpdated}`);
                console.log(`📦 Source: ${data.source}`);
                return data.publications;
            }

            throw new Error('No publications in inline JSON');
        } catch (error) {
            throw new Error(`Inline JSON load failed: ${error.message}`);
        }
    },

    async loadFromDataFile() {
        try {
            const response = await fetch('data/publications.json');

            if (!response.ok) {
                throw new Error(`Failed to load data file: ${response.status}`);
            }

            const data = await response.json();

            if (data.publications && data.publications.length > 0) {
                console.log(`✅ Loaded ${data.publications.length} publications from data/publications.json`);
                console.log(`📅 Last updated: ${data.lastUpdated}`);
                console.log(`📦 Source: ${data.source}`);
                return data.publications;
            }

            throw new Error('No publications in data file');
        } catch (error) {
            throw new Error(`Data file load failed: ${error.message}`);
        }
    },

    async fetchViaCORSProxyAllOrigins() {
        const targetUrl = `https://api2.openreview.net/notes?content.authorids=${this.profileId}&limit=20`;

        const response = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`AllOrigins proxy returned ${response.status}`);
        }

        const data = await response.json();

        if (data.notes && data.notes.length > 0) {
            console.log(`✅ Fetched via AllOrigins CORS proxy`);
            return this.processNotesData(data.notes);
        }

        throw new Error('No notes found via AllOrigins');
    },

    async fetchViaCORSProxyCorsAnywhere() {
        const targetUrl = `https://api2.openreview.net/notes?content.authorids=${this.profileId}&limit=20`;

        const response = await fetch(`https://cors-anywhere.herokuapp.com/${targetUrl}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        });

        if (!response.ok) {
            throw new Error(`CORS Anywhere returned ${response.status}`);
        }

        const data = await response.json();

        if (data.notes && data.notes.length > 0) {
            console.log(`✅ Fetched via CORS Anywhere proxy`);
            return this.processNotesData(data.notes);
        }

        throw new Error('No notes found via CORS Anywhere');
    },

    processNotesData(notes) {
        return notes.map(note => ({
            id: note.id,
            title: note.content?.title?.value || note.content?.title || 'Untitled',
            authors: this.extractAuthors(note),
            venue: note.content?.venue?.value || note.content?.venue || 'OpenReview',
            year: this.extractYear(note),
            status: this.determineStatus(note),
            abstract: note.content?.abstract?.value || note.content?.abstract || 'No abstract available.',
            openreviewUrl: `https://openreview.net/forum?id=${note.id}`,
            tags: this.extractKeywords(note),
            type: 'Publication'
        }));
    },

    async fetchViaNotesAPI() {
        const response = await fetch(`https://api2.openreview.net/notes?content.authorids=${this.profileId}&limit=20`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Notes API returned ${response.status}`);
        }

        const data = await response.json();

        if (data.notes && data.notes.length > 0) {
            console.log(`✅ Fetched directly from OpenReview API`);
            return this.processNotesData(data.notes);
        }

        throw new Error('No notes found');
    },

    async fetchViaProfilesAPI() {
        const response = await fetch(`https://api2.openreview.net/profiles?id=${this.profileId}&with_publications=true`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Profiles API returned ${response.status}`);
        }

        const data = await response.json();

        if (data.profiles && data.profiles.length > 0) {
            const profile = data.profiles[0];

            if (profile.content?.publications && profile.content.publications.length > 0) {
                return profile.content.publications.map(pub => ({
                    id: pub.id || `pub-${Date.now()}`,
                    title: pub.title || 'Untitled Publication',
                    authors: pub.authors || [profile.content.names?.[0]?.fullname || 'Ko Ho Tin'],
                    venue: pub.venue || 'OpenReview',
                    year: pub.year || new Date().getFullYear(),
                    status: 'Published',
                    abstract: pub.abstract || 'Research publication available on OpenReview.',
                    openreviewUrl: pub.url || this.profileUrl,
                    tags: pub.keywords || ['Research'],
                    type: pub.type || 'Publication'
                }));
            }
        }

        throw new Error('No publications in profile');
    },

    extractAuthors(note) {
        if (note.content?.authors?.value) {
            return note.content.authors.value;
        }
        if (note.content?.authors) {
            return Array.isArray(note.content.authors) ? note.content.authors : [note.content.authors];
        }
        if (note.signatures) {
            return note.signatures.slice(0, 5);
        }
        return ['Ko Ho Tin'];
    },

    extractYear(note) {
        if (note.content?.year?.value) return note.content.year.value;
        if (note.content?.year) return note.content.year;
        if (note.cdate) {
            return new Date(note.cdate).getFullYear();
        }
        return new Date().getFullYear();
    },

    extractKeywords(note) {
        if (note.content?.keywords?.value) {
            return Array.isArray(note.content.keywords.value) ? note.content.keywords.value : [note.content.keywords.value];
        }
        if (note.content?.keywords) {
            return Array.isArray(note.content.keywords) ? note.content.keywords : [note.content.keywords];
        }
        return ['Research', 'AI'];
    },

    determineStatus(note) {
        if (note.content?.decision?.value) {
            const decision = note.content.decision.value.toLowerCase();
            if (decision.includes('accept')) return 'Accepted';
            if (decision.includes('reject')) return 'Under Review';
        }
        if (note.content?.venue?.value) return 'Published';
        return 'Research';
    },

    renderPublications() {
        const publicationsGrid = document.querySelector('.publications-grid');
        if (!publicationsGrid) return;

        publicationsGrid.style.opacity = '0';

        setTimeout(() => {
            publicationsGrid.innerHTML = '';

            if (this.publications.length === 0) {
                this.showEmptyState();
                return;
            }

            this.publications.forEach((publication, index) => {
                const card = this.createPublicationCard(publication);
                card.style.opacity = '0';
                card.style.animation = 'fadeInUp 0.6s ease forwards';
                card.style.animationDelay = `${index * 0.1}s`;
                publicationsGrid.appendChild(card);
            });

            publicationsGrid.style.transition = 'opacity 0.3s ease';
            publicationsGrid.style.opacity = '1';
        }, 150);
    },

    createPublicationCard(pub) {
        const card = document.createElement('div');
        card.className = 'publication-item';

        const statusClass = this.getStatusClass(pub.status);
        const authorsText = Array.isArray(pub.authors) && pub.authors.length > 3
            ? `${pub.authors.slice(0, 3).join(', ')}, et al.`
            : Array.isArray(pub.authors)
                ? pub.authors.join(', ')
                : pub.authors;

        card.innerHTML = `
            <div class="publication-header">
                <h3 class="publication-title">${pub.title}</h3>
                <span class="publication-status ${statusClass}">${pub.status}</span>
            </div>
            <div class="publication-details">
                <div class="publication-meta" style="margin-bottom: 0.75rem;">
                    <p style="color: rgba(255, 255, 255, 0.7); font-size: 0.9rem; margin: 0;">
                        <i class="fas fa-users" style="margin-right: 0.5rem; color: #10a37f;"></i>
                        ${authorsText}
                    </p>
                    <p style="color: rgba(255, 255, 255, 0.7); font-size: 0.9rem; margin: 0.25rem 0 0 0;">
                        <i class="fas fa-university" style="margin-right: 0.5rem; color: #10a37f;"></i>
                        ${pub.venue}
                    </p>
                </div>
                <p class="publication-description">${pub.abstract}</p>
                <div class="publication-tags">
                    ${Array.isArray(pub.tags) ? pub.tags.map(tag => `<span class="publication-tag">${tag}</span>`).join('') : ''}
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1rem;">
                    <p class="publication-date">${pub.year}</p>
                    ${pub.openreviewUrl ? `
                        <a href="${pub.openreviewUrl}"
                           target="_blank"
                           rel="noopener noreferrer"
                           style="color: #10a37f; text-decoration: none; font-size: 0.85rem; font-weight: 500; display: flex; align-items: center; gap: 0.5rem; transition: all 0.3s ease;"
                           onmouseover="this.style.color='#0d8f6b'; this.style.transform='translateX(4px)'"
                           onmouseout="this.style.color='#10a37f'; this.style.transform='translateX(0)'">
                            View on OpenReview
                            <i class="fas fa-external-link-alt" style="font-size: 0.75rem;"></i>
                        </a>
                    ` : ''}
                </div>
            </div>
        `;

        return card;
    },

    getStatusClass(status) {
        const statusMap = {
            'Published': 'status-published',
            'Under Review': 'status-review',
            'Accepted': 'status-accepted',
            'Research': 'status-research'
        };
        return statusMap[status] || 'status-default';
    },

    showEmptyState() {
        const publicationsGrid = document.querySelector('.publications-grid');
        if (!publicationsGrid) return;

        const isFileProtocol = window.location.protocol === 'file:';
        const message = isFileProtocol
            ? 'Publications will auto-update when deployed to GitHub Pages'
            : 'No publications found';

        publicationsGrid.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1; text-align: center; padding: var(--space-8);">
                <i class="fas fa-file-alt" style="font-size: var(--font-size-large-title); color: var(--color-primary); opacity: 0.3; margin-bottom: var(--space-4); display: block;"></i>
                <p style="color: var(--color-text-secondary); margin-bottom: var(--space-5); font-size: var(--font-size-lg);">${message}</p>
                <a href="${this.profileUrl}"
                   target="_blank"
                   rel="noopener noreferrer"
                   class="button secondary"
                   style="display: inline-flex; align-items: center; gap: var(--space-2);">
                    <i class="fas fa-user-graduate"></i>
                    View Profile on OpenReview
                    <i class="fas fa-external-link-alt" style="font-size: var(--font-size-sm);"></i>
                </a>
            </div>
        `;
        publicationsGrid.style.opacity = '1';
    },

    showProfileCard() {
        console.log('🎨 showProfileCard called - rendering profile');

        const ensureGridStyles = () => {
            const existingStyle = document.getElementById('publications-grid-styles');
            if (!existingStyle) {
                const style = document.createElement('style');
                style.id = 'publications-grid-styles';
                style.textContent = `
                    .publications-grid {
                        display: grid !important;
                        grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)) !important;
                        gap: 24px !important;
                        padding: 24px !important;
                        opacity: 1 !important;
                        visibility: visible !important;
                        min-height: 500px !important;
                    }
                    .publications-section {
                        display: block !important;
                        opacity: 1 !important;
                        visibility: visible !important;
                    }
                `;
                document.head.appendChild(style);
                console.log('📝 Added grid visibility styles');
            }
        };
        ensureGridStyles();

        let publicationsGrid = document.querySelector('.publications-grid');

        if (!publicationsGrid) {
            console.log('⚠️ Publications grid not found, trying to create it...');
            const section = document.querySelector('.publications-section');
            if (section) {
                const container = section.querySelector('.section-container') || section;
                publicationsGrid = document.createElement('div');
                publicationsGrid.className = 'publications-grid';
                container.appendChild(publicationsGrid);
                console.log('✅ Created new publications grid');
            } else {
                console.error('❌ No publications section found!');
                return;
            }
        }

        console.log('📊 Grid visibility check:', {
            element: publicationsGrid,
            display: window.getComputedStyle(publicationsGrid).display,
            visibility: window.getComputedStyle(publicationsGrid).visibility,
            opacity: window.getComputedStyle(publicationsGrid).opacity,
            height: publicationsGrid.offsetHeight,
            width: publicationsGrid.offsetWidth,
            parentDisplay: publicationsGrid.parentElement ? window.getComputedStyle(publicationsGrid.parentElement).display : 'no parent'
        });

        publicationsGrid.style.cssText = '';
        publicationsGrid.style.display = 'grid';
        publicationsGrid.style.gridTemplateColumns = '1fr';
        publicationsGrid.style.gap = '24px';
        publicationsGrid.style.padding = '24px';
        publicationsGrid.style.minHeight = '600px';
        publicationsGrid.style.opacity = '1';
        publicationsGrid.style.visibility = 'visible';
        publicationsGrid.style.position = 'relative';
        publicationsGrid.style.zIndex = '10';

        const profile = this.profileInfo;
        const interestTags = profile.researchInterests
            .map(interest => `<span class="publication-tag" style="background: rgba(255, 255, 255, 0.1); color: rgba(255, 255, 255, 0.95); padding: 8px 16px; border-radius: 9999px; font-size: 14px; font-weight: 500;">${interest}</span>`)
            .join('');

        try {
            const profileCardHTML = `
                <div class="profile-card" style="grid-column: 1 / -1; max-width: 800px; margin: 0 auto; background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(15px); -webkit-backdrop-filter: blur(15px); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 20px; padding: 64px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2); animation: fadeInUp 0.6s ease forwards;">
                    <div style="text-align: center; margin-bottom: 48px;">
                        <div style="width: 80px; height: 80px; margin: 0 auto 24px; background: linear-gradient(135deg, #10a37f, #15c896); border-radius: 9999px; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 20px rgba(16, 163, 127, 0.25);">
                            <i class="fas fa-user-graduate" style="font-size: 2rem; color: white;"></i>
                        </div>
                        <h2 class="gradient-text" style="font-size: 34px; font-weight: 700; margin: 0 0 8px; line-height: 1.2;">${profile.name}</h2>
                        <p style="color: rgba(255, 255, 255, 0.7); font-size: 20px; font-weight: 500; margin: 0 0 16px;">${profile.title}</p>
                        <div style="display: inline-flex; align-items: center; gap: 8px; background: rgba(255, 255, 255, 0.1); padding: 8px 16px; border-radius: 9999px; font-size: 14px; color: rgba(255, 255, 255, 0.7);">
                            <i class="fas fa-university" style="color: #10a37f;"></i>
                            <span>${profile.stats.affiliation}</span>
                        </div>
                    </div>

                    <div style="background: rgba(255, 255, 255, 0.1); border-radius: 16px; padding: 32px; margin-bottom: 32px; border-left: 4px solid #10a37f;">
                        <p style="color: rgba(255, 255, 255, 0.95); font-size: 16px; line-height: 1.6; margin: 0;">${profile.bio}</p>
                    </div>

                    <div style="margin-bottom: 48px;">
                        <h3 style="color: rgba(255, 255, 255, 0.95); font-size: 20px; font-weight: 600; margin: 0 0 16px; display: flex; align-items: center; gap: 8px;">
                            <i class="fas fa-brain" style="color: #10a37f;"></i>
                            Research Interests
                        </h3>
                        <div style="display: flex; flex-wrap: wrap; gap: 12px;">
                            ${interestTags}
                        </div>
                    </div>

                    <div style="background: linear-gradient(135deg, rgba(16, 163, 127, 0.1), rgba(21, 200, 150, 0.05)); border-radius: 16px; padding: 32px; margin-bottom: 32px; text-align: center; border: 1px solid rgba(16, 163, 127, 0.2);">
                        <i class="fas fa-book-open" style="font-size: 28px; color: #10a37f; margin-bottom: 12px; display: block;"></i>
                        <p style="color: rgba(255, 255, 255, 0.95); font-size: 16px; margin: 0 0 8px; font-weight: 500;">Research Publications</p>
                        <p style="color: rgba(255, 255, 255, 0.7); font-size: 14px; margin: 0;">Available on OpenReview</p>
                    </div>

                    <div style="display: flex; flex-wrap: wrap; gap: 16px; justify-content: center;">
                        <a href="${this.profileUrl}"
                           target="_blank"
                           rel="noopener noreferrer"
                           class="button primary"
                           style="display: inline-flex; align-items: center; gap: 8px; padding: 16px 32px; font-size: 16px; text-decoration: none; flex: 1; min-width: 200px; justify-content: center; max-width: 300px;">
                            <i class="fas fa-user-graduate"></i>
                            View Full Profile
                            <i class="fas fa-external-link-alt" style="font-size: 12px;"></i>
                        </a>
                        <a href="mailto:${profile.email}"
                           class="button secondary"
                           style="display: inline-flex; align-items: center; gap: 8px; padding: 16px 32px; font-size: 16px; text-decoration: none; flex: 1; min-width: 200px; justify-content: center; max-width: 300px;">
                            <i class="fas fa-envelope"></i>
                            Contact Me
                        </a>
                    </div>

                    <div style="text-align: center; margin-top: 32px; padding-top: 32px; border-top: 1px solid rgba(255, 255, 255, 0.1);">
                        <p style="color: rgba(255, 255, 255, 0.5); font-size: 14px; margin: 0;">
                            <i class="fas fa-info-circle" style="margin-right: 8px;"></i>
                            Publications automatically load when deployed to GitHub Pages
                        </p>
                    </div>
                </div>

                <style>
                    @keyframes fadeInUp {
                        from {
                            opacity: 0;
                            transform: translateY(20px);
                        }
                        to {
                            opacity: 1;
                            transform: translateY(0);
                        }
                    }
                </style>
            `;

            publicationsGrid.innerHTML = profileCardHTML;
            publicationsGrid.style.opacity = '1';

            let parent = publicationsGrid.parentElement;
            while (parent && parent !== document.body) {
                parent.style.display = 'block';
                parent.style.visibility = 'visible';
                parent.style.opacity = '1';
                parent = parent.parentElement;
            }

            setTimeout(() => {
                publicationsGrid.style.transition = 'opacity 0.3s ease';
            }, 10);

            console.log('✅ Profile card rendered successfully');
            console.log('📍 Final grid state:', {
                innerHTML: publicationsGrid.innerHTML.length + ' chars',
                visible: publicationsGrid.offsetHeight > 0,
                computedDisplay: window.getComputedStyle(publicationsGrid).display
            });
        } catch (error) {
            console.error('❌ Failed to render profile card:', error);
            publicationsGrid.innerHTML = `
                <div style="text-align: center; padding: 48px; color: rgba(255, 255, 255, 0.7);">
                    <i class="fas fa-exclamation-circle" style="font-size: 48px; color: #ff6b6b; margin-bottom: 16px; display: block;"></i>
                    <h3 style="color: rgba(255, 255, 255, 0.95); margin-bottom: 8px;">Error Loading Profile</h3>
                    <p>Unable to display profile information. Please refresh the page.</p>
                </div>
            `;
            publicationsGrid.style.opacity = '1';
        }
    },

    showErrorState() {
        console.log('📋 showErrorState called - displaying profile card');
        const publicationsGrid = document.querySelector('.publications-grid');
        if (!publicationsGrid) {
            console.error('❌ Publications grid not found in showErrorState!');
            return;
        }
        this.showProfileCard();
    },

    async retry() {
        const publicationsGrid = document.querySelector('.publications-grid');
        if (!publicationsGrid) return;

        publicationsGrid.style.opacity = '0';

        setTimeout(async () => {
            this.showSkeletonLoaders();

            const minLoadTime = new Promise(resolve => setTimeout(resolve, 600));
            const success = await this.fetchPublications();
            await minLoadTime;

            if (success) {
                this.renderPublications();
            } else {
                this.showErrorState();
            }
        }, 150);
    },

    addProfileLink() {
        const sectionTitle = document.querySelector('.publications-section .section-title');
        if (!sectionTitle) return;

        const existingLink = document.querySelector('.openreview-profile-link');
        if (existingLink) return;

        const profileLink = document.createElement('div');
        profileLink.className = 'openreview-profile-link';
        profileLink.style.cssText = 'text-align: center; margin-top: 1.5rem;';
        profileLink.innerHTML = `
            <a href="${this.profileUrl}"
               target="_blank"
               rel="noopener noreferrer"
               class="button secondary"
               style="display: inline-flex; align-items: center; gap: 0.75rem; text-decoration: none;">
                <i class="fas fa-user-graduate"></i>
                View Full Profile on OpenReview
                <i class="fas fa-external-link-alt" style="font-size: 0.8rem;"></i>
            </a>
        `;

        const container = sectionTitle.closest('.section-container');
        if (container) {
            container.appendChild(profileLink);
        }
    }
};

window.debugShowProfile = () => {
    console.log('🔧 Manually triggering profile card display');
    OpenReviewModule.showProfileCard();
};

window.debugClearPublications = () => {
    console.log('🧹 Clearing publications grid');
    const publicationsGrid = document.querySelector('.publications-grid');
    if (publicationsGrid) {
        publicationsGrid.innerHTML = '';
        publicationsGrid.style.opacity = '1';
        console.log('✅ Grid cleared');
    } else {
        console.error('❌ Publications grid not found');
    }
};

window.debugReloadModule = () => {
    console.log('🔄 Reloading OpenReview module');
    OpenReviewModule.init();
};

window.debugForceShowProfile = () => {
    console.log('🚀 Force showing profile...');
    const grid = document.querySelector('.publications-grid');
    const section = document.querySelector('.publications-section');

    if (section) {
        section.style.display = 'block';
        section.style.opacity = '1';
        section.style.visibility = 'visible';
        section.style.minHeight = '700px';
        console.log('✅ Section forced visible');
    }

    if (grid) {
        grid.style.cssText = 'display: block !important; opacity: 1 !important; visibility: visible !important; min-height: 500px !important; background: rgba(255,255,255,0.05) !important; padding: 20px !important; border: 1px solid rgba(255,255,255,0.2) !important;';
        OpenReviewModule.showProfileCard();
        console.log('✅ Grid forced visible and profile rendered');
    } else {
        console.error('❌ Grid not found - trying to create and render');
        OpenReviewModule.showProfileCard();
    }
};

window.debugCheckDOM = () => {
    console.log('🔍 DOM Structure Check:');
    const section = document.querySelector('.publications-section');
    console.log('Publications section:', section);
    console.log('Section container:', document.querySelector('.publications-section .section-container'));
    console.log('Publications grid:', document.querySelector('.publications-grid'));
    console.log('Section title:', document.querySelector('.publications-section .section-title'));

    if (section) {
        const rect = section.getBoundingClientRect();
        console.log('Section position:', {
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            inViewport: rect.top < window.innerHeight && rect.bottom > 0
        });

        const computedStyle = window.getComputedStyle(section);
        console.log('Section styles:', {
            display: computedStyle.display,
            visibility: computedStyle.visibility,
            opacity: computedStyle.opacity,
            height: computedStyle.height,
            overflow: computedStyle.overflow
        });
    }

    const grid = document.querySelector('.publications-grid');
    if (grid) {
        const gridRect = grid.getBoundingClientRect();
        const gridStyle = window.getComputedStyle(grid);
        console.log('Grid info:', {
            position: gridRect,
            styles: {
                display: gridStyle.display,
                visibility: gridStyle.visibility,
                opacity: gridStyle.opacity,
                height: gridStyle.height,
                minHeight: gridStyle.minHeight
            },
            hasContent: grid.innerHTML.length > 0,
            contentLength: grid.innerHTML.length
        });
    }
};

window.debugScrollToPublications = () => {
    const section = document.querySelector('.publications-section');
    if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'center' });
        console.log('📜 Scrolled to publications section');
        setTimeout(() => {
            debugCheckDOM();
        }, 500);
    } else {
        console.error('❌ Publications section not found');
    }
};
