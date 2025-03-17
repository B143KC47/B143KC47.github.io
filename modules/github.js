// GitHub项目模块实现 - 使用全局对象而非ES模块
const GitHubModule = {
    username: 'B143KC47',

    async init() {
        await this.fetchGitHubProjects();
        await this.updateNavDropdown();
    },

    async fetchGitHubProjects() {
        try {
            // 增加获取的项目数量到10个
            const response = await fetch(`https://api.github.com/users/${this.username}/repos?sort=stars&per_page=10`);
            const repos = await response.json();
            
            const filteredRepos = repos.filter(repo => !repo.fork);
            
            const projectsGrid = document.querySelector('.projects-grid');
            if (!projectsGrid) return;

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
            
            // 创建项目卡片
            filteredRepos.forEach(repo => {
                const card = this.createProjectCard(repo);
                projectsGrid.appendChild(card);
            });
            
            return filteredRepos;
        } catch (error) {
            console.error('Error fetching GitHub projects:', error);
            const projectsGrid = document.querySelector('.projects-grid');
            if (projectsGrid) {
                projectsGrid.innerHTML = `
                    <div class="error-message">
                        <i class="fas fa-exclamation-circle"></i>
                        <p>加载项目时出现错误</p>
                    </div>
                `;
            }
            throw error;
        }
    },

    createProjectCard(repo) {
        const card = document.createElement('div');
        card.className = 'project-card';
        card.style.opacity = '1';
        card.style.visibility = 'visible';
        
        const languageColor = this.getLanguageColor(repo.language);
        
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
            dropdownContent.innerHTML = '<div class="dropdown-loading"><div class="loading-spinner"></div><span>加载热门项目中...</span></div>';
            
            const topRepos = await this.fetchTopRepositories();
            
            if (topRepos.length === 0) {
                dropdownContent.innerHTML = '<a href="https://github.com/B143KC47">访问我的 GitHub</a>';
                return;
            }

            dropdownContent.innerHTML = topRepos.map(repo => `
                <a href="${repo.html_url}" target="_blank">
                    ${repo.name}
                    <span class="repo-stars">
                        <i class="fas fa-star"></i> ${repo.stargazers_count}
                    </span>
                </a>
            `).join('') + '<a href="https://github.com/B143KC47" class="view-more">查看更多 <i class="fas fa-external-link-alt"></i></a>';
        } catch (error) {
            console.error('Error updating dropdown:', error);
            dropdownContent.innerHTML = '<a href="https://github.com/B143KC47">访问我的 GitHub</a>';
        }
    }
};