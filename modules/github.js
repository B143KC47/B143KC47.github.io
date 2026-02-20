// GitHub项目模块实现 - 使用全局对象而非ES模块
const GitHubModule = {
    username: 'B143KC47',
    CACHE_KEY: 'github_repos_cache',
    CACHE_DURATION: 10 * 60 * 1000,

    async init() {
        await Promise.all([
            this.fetchGitHubProjects(),
            this.updateNavDropdown()
        ]);
    },

    getCachedData() {
        try {
            const cached = localStorage.getItem(this.CACHE_KEY);
            if (!cached) return null;
            const { data, timestamp } = JSON.parse(cached);
            if (Date.now() - timestamp > this.CACHE_DURATION) {
                localStorage.removeItem(this.CACHE_KEY);
                return null;
            }
            return data;
        } catch (e) {
            return null;
        }
    },

    setCachedData(data) {
        try {
            localStorage.setItem(this.CACHE_KEY, JSON.stringify({
                data,
                timestamp: Date.now()
            }));
        } catch (e) {}
    },

    async fetchGitHubProjects() {
        const projectsGrid = document.querySelector('.projects-grid');
        if (!projectsGrid) return;

        // Show bento-grid-aware skeleton loaders
        this.showBentoSkeletons(projectsGrid);

        try {
            const cachedRepos = this.getCachedData();
            let repos;

            if (cachedRepos) {
                repos = cachedRepos;
            } else {
                const response = await fetch(`https://api.github.com/users/${this.username}/repos?sort=stars&per_page=20`);
                if (!response.ok) {
                    throw new Error(`GitHub API returned ${response.status}`);
                }
                repos = await response.json();
                this.setCachedData(repos);
            }

            // Filter out forks and the special profile repo
            let filteredRepos = repos.filter(repo => !repo.fork && repo.name !== 'B143KC47');

            // Smart Curation: Prioritize 'AdsBlock' or other significant projects if they exist
            const pinnedProjects = ['AdsBlock', 'Ultratranslate', 'claudeCO-webui'];
            
            // Sort strictly by stars (descending)
            filteredRepos.sort((a, b) => b.stargazers_count - a.stargazers_count);

            // Clear skeletons
            projectsGrid.innerHTML = '';

            // 如果没有项目，显示提示信息
            if (filteredRepos.length === 0) {
                projectsGrid.innerHTML = `
                    <div class="empty-message">
                        <i class="fas fa-folder-open"></i>
                        <p>暂无公开项目</p>
                    </div>
                `;
                return filteredRepos;
            }

            // 创建项目卡片并添加渐进式加载和延迟动画效果
            filteredRepos.forEach((repo, index) => {
                const card = this.createProjectCard(repo);

                // Bento Grid Layout Logic
                if (index === 0) {
                    card.classList.add('card-hero');
                } else if (index < 3) {
                    card.classList.add('card-featured');
                } else {
                    card.classList.add('card-standard');
                }

                // 添加延迟动画效果，创建瀑布流显示效果
                const delay = index * 0.1;
                card.style.animationDelay = `${delay}s`;
                card.classList.add('content-reveal');

                projectsGrid.appendChild(card);
            });

            // Initialize Spotlight Effect
            this.setupSpotlightEffect();

            return filteredRepos;
        } catch (error) {
            console.error('Error fetching GitHub projects:', error);
            projectsGrid.innerHTML = `
                <div class="error-message" style="grid-column: 1 / -1; text-align: center; padding: 2rem;">
                    <i class="fas fa-exclamation-circle" style="font-size: 2rem; color: #ff4444; margin-bottom: 1rem; display: block;"></i>
                    <p style="color: var(--text-secondary);">加载项目时出现错误</p>
                    <p style="color: var(--text-secondary); font-size: 0.9rem; margin-top: 0.5rem;">请稍后重试</p>
                    <button onclick="GitHubModule.fetchGitHubProjects()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: var(--accent-color); color: white; border: none; border-radius: 4px; cursor: pointer;">重试</button>
                </div>
            `;
            throw error;
        }
    },

    createProjectCard(repo) {
        const card = document.createElement('div');
        card.className = 'project-card';
        // Initialize CSS variables for spotlight to center to avoid jump on first hover
        card.style.setProperty('--mouse-x', '50%');
        card.style.setProperty('--mouse-y', '50%');
        
        // 处理过长的项目名称
        const displayName = repo.name.length > 25 ? repo.name.substring(0, 22) + '...' : repo.name;
        
        // 确保项目描述不为空，并处理过长的描述
        let description = repo.description || '暂无项目描述';
        if (description.length > 120) {
            description = description.substring(0, 117) + '...';
        }
        
        const languageColor = this.getLanguageColor(repo.language);
        
        // Generate topics tags (limit to 3)
        const topicsHtml = repo.topics && repo.topics.length > 0 
            ? `<div class="project-topics">
                ${repo.topics.slice(0, 3).map(topic => `<span class="tech-tag">${topic}</span>`).join('')}
               </div>` 
            : '';

        // 优化HTML结构 - Avant-Garde Style
        card.innerHTML = `
            <div class="card-glow"></div>
            <div class="card-content">
                <div class="project-header">
                    <div class="header-top">
                        <i class="far fa-folder-open project-icon"></i>
                        <div class="project-links">
                            <a href="${repo.html_url}" target="_blank" class="icon-link" title="View Code">
                                <i class="fab fa-github"></i>
                            </a>
                            ${repo.homepage ? `<a href="${repo.homepage}" target="_blank" class="icon-link" title="View Demo"><i class="fas fa-external-link-alt"></i></a>` : ''}
                        </div>
                    </div>
                    <a href="${repo.html_url}" target="_blank" class="project-title" title="${repo.name}">${displayName}</a>
                </div>
                
                <p class="project-description">${description}</p>
                
                ${topicsHtml}

                <div class="project-footer">
                    ${repo.language ? `
                        <div class="project-language">
                            <span class="language-dot" style="background-color: ${languageColor}; box-shadow: 0 0 8px ${languageColor}66;"></span>
                            ${repo.language}
                        </div>
                    ` : '<div class="project-language"><span class="language-dot" style="background-color: #8b8b8b"></span>N/A</div>'}
                    
                    <div class="project-stats">
                        <div class="stat-item" title="Stars">
                            <i class="far fa-star"></i>
                            <span>${repo.stargazers_count}</span>
                        </div>
                        <div class="stat-item" title="Forks">
                            <i class="fas fa-code-branch"></i>
                            <span>${repo.forks_count}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        return card;
    },

    setupSpotlightEffect() {
        const grid = document.querySelector('.projects-grid');
        if (!grid) return;

        grid.addEventListener('mousemove', (e) => {
            const cards = grid.querySelectorAll('.project-card');
            cards.forEach(card => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                card.style.setProperty('--mouse-x', `${x}px`);
                card.style.setProperty('--mouse-y', `${y}px`);
            });
        });
    },

    getLanguageColor(language) {
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
    },

    async fetchTopRepositories() {
        try {
            const cachedRepos = this.getCachedData();
            let repos;

            if (cachedRepos) {
                repos = cachedRepos;
            } else {
                const response = await fetch(`https://api.github.com/users/${this.username}/repos?sort=stars&per_page=15`);
                repos = await response.json();
            }
            
            // 获取5个最热门的项目
            const topRepos = repos
                .filter(repo => !repo.fork)
                .sort((a, b) => b.stargazers_count - a.stargazers_count)
                .slice(0, 5);
                
            return topRepos;
        } catch (error) {
            console.error('Error fetching top repositories:', error);
            return [];
        }
    },

    async updateNavDropdown() {
        const dropdownContent = document.querySelector('.dropdown-content');
        if (!dropdownContent) return;

        try {
            // Show skeleton loaders for dropdown
            dropdownContent.innerHTML = Array(5).fill().map((_, i) => `
                <div class="skeleton-dropdown-item" style="animation-delay: ${i * 0.05}s">
                    <div class="skeleton-dropdown-title"></div>
                    <div class="skeleton-dropdown-stat"></div>
                </div>
            `).join('');

            const topRepos = await this.fetchTopRepositories();

            if (topRepos.length === 0) {
                dropdownContent.innerHTML = '<a href="https://github.com/B143KC47">访问我的 GitHub</a>';
                return;
            }

            // Fade out skeletons and fade in content
            dropdownContent.style.opacity = '0';
            setTimeout(() => {
                dropdownContent.innerHTML = topRepos.map(repo => `
                    <a href="${repo.html_url}" target="_blank" class="fade-in">
                        ${repo.name}
                        <span class="repo-stars">
                            <i class="fas fa-star"></i> ${repo.stargazers_count}
                        </span>
                    </a>
                `).join('') + '<a href="https://github.com/B143KC47" class="view-more fade-in">查看更多 <i class="fas fa-external-link-alt"></i></a>';
                dropdownContent.style.opacity = '1';
            }, 150);
        } catch (error) {
            console.error('Error updating dropdown:', error);
            dropdownContent.innerHTML = '<a href="https://github.com/B143KC47">访问我的 GitHub</a>';
        }
    },

    showBentoSkeletons(container) {
        container.innerHTML = '';

        // Create bento grid layout matching actual project layout
        const skeletonLayouts = [
            { variant: '2x2', delay: 0 },    // Hero (Top 1)
            { variant: '2x1', delay: 50 },   // Featured (Top 2)
            { variant: '2x1', delay: 100 },  // Featured (Top 3)
            { variant: '1x1', delay: 150 },  // Standard
            { variant: '1x1', delay: 200 },
            { variant: '1x1', delay: 250 },
            { variant: '1x1', delay: 300 },
            { variant: '1x1', delay: 350 }
        ];

        skeletonLayouts.forEach(({ variant, delay }) => {
            const skeleton = UIModule.createProjectCardSkeleton(variant);
            skeleton.style.animationDelay = `${delay}ms`;
            container.appendChild(skeleton);
        });
    }
};