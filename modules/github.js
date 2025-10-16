// GitHub项目模块实现 - 使用全局对象而非ES模块
const GitHubModule = {
    username: 'B143KC47',

    async init() {
        await Promise.all([
            this.fetchUserProfile(),
            this.fetchGitHubProjects(),
            this.updateNavDropdown()
        ]);
    },

    async fetchUserProfile() {
        try {
            const response = await fetch(`https://api.github.com/users/${this.username}`);

            if (!response.ok) {
                throw new Error(`GitHub API returned ${response.status}`);
            }

            const userData = await response.json();

            if (userData.avatar_url) {
                const profileImg = document.querySelector('.profile-image');
                if (profileImg) {
                    const img = new Image();
                    img.onload = () => {
                        profileImg.src = userData.avatar_url;
                        profileImg.style.transition = 'opacity 0.3s ease';
                    };
                    img.onerror = () => {
                        // Silent fallback to avatar.png
                    };
                    img.src = userData.avatar_url;
                }
            }

            console.log('✅ GitHub profile loaded');
            return userData;
        } catch (error) {
            // Silent - fallback to static avatar
            return null;
        }
    },

    async fetchGitHubProjects() {
        const projectsGrid = document.querySelector('.projects-grid');
        if (!projectsGrid) return;

        // Show bento-grid-aware skeleton loaders
        this.showBentoSkeletons(projectsGrid);

        try {
            // Add a minimum delay to show skeletons for better UX
            const [response] = await Promise.all([
                fetch(`https://api.github.com/users/${this.username}/repos?sort=stars&per_page=16`),
                new Promise(resolve => setTimeout(resolve, 600))
            ]);

            // Check if response is ok
            if (!response.ok) {
                throw new Error(`GitHub API returned ${response.status}`);
            }
            const repos = await response.json();

            const filteredRepos = repos.filter(repo => !repo.fork);

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

                // 添加延迟动画效果，创建瀑布流显示效果
                const row = Math.floor(index / 2); // 假设每行大约2个卡片
                const col = index % 2;
                card.style.animationDelay = `${row * 0.1 + col * 0.05}s`;
                card.classList.add('content-reveal');

                projectsGrid.appendChild(card);
            });

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
        card.style.opacity = '1';
        card.style.visibility = 'visible';
        
        // 处理过长的项目名称
        const displayName = repo.name.length > 25 ? repo.name.substring(0, 22) + '...' : repo.name;
        
        // 确保项目描述不为空，并处理过长的描述
        let description = repo.description || '暂无项目描述';
        if (description.length > 100) {
            description = description.substring(0, 97) + '...';
        }
        
        const languageColor = this.getLanguageColor(repo.language);
        
        // 优化HTML结构
        card.innerHTML = `
            <div class="project-header">
                <i class="far fa-folder-open project-icon"></i>
                <a href="${repo.html_url}" target="_blank" class="project-title" title="${repo.name}">${displayName}</a>
            </div>
            <p class="project-description">${description}</p>
            <div class="project-footer">
                ${repo.language ? `
                    <div class="project-language">
                        <span class="language-dot" style="background-color: ${languageColor}"></span>
                        ${repo.language}
                    </div>
                ` : '<div class="project-language"><span class="language-dot" style="background-color: #8b8b8b"></span>未指定</div>'}
                <div class="project-stats">
                    <div class="stat-item" title="Stars">
                        <i class="far fa-star"></i>
                        ${repo.stargazers_count}
                    </div>
                    <div class="stat-item" title="Forks">
                        <i class="fas fa-code-branch"></i>
                        ${repo.forks_count}
                    </div>
                    <div class="stat-item" title="Watchers">
                        <i class="far fa-eye"></i>
                        ${repo.watchers_count}
                    </div>
                </div>
            </div>
        `;
        
        return card;
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
            const response = await fetch(`https://api.github.com/users/${this.username}/repos?sort=stars&per_page=15`);
            const repos = await response.json();
            
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

            const [topRepos] = await Promise.all([
                this.fetchTopRepositories(),
                new Promise(resolve => setTimeout(resolve, 400))
            ]);

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
            { variant: '2x2', delay: 0 },    // First large card
            { variant: '2x2', delay: 50 },   // Second large card
            { variant: '1x1', delay: 100 },  // Regular cards
            { variant: '1x1', delay: 150 },
            { variant: '1x1', delay: 200 },
            { variant: '1x1', delay: 250 },
            { variant: '2x1', delay: 300 },  // Wide card
            { variant: '1x1', delay: 350 }   // More regular cards
        ];

        skeletonLayouts.forEach(({ variant, delay }) => {
            const skeleton = UIModule.createProjectCardSkeleton(variant);
            skeleton.style.animationDelay = `${delay}ms`;
            container.appendChild(skeleton);
        });
    }
};