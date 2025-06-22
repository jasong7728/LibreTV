// LibreTV V2.0 关于组件
class AboutComponent {
    constructor() {
        this.init();
    }

    init() {
        this.bindEvents();
        
        // 监听视图激活
        window.addEventListener('viewActivated', (e) => {
            if (e.detail.viewId === 'aboutView') {
                this.onViewActivated();
            }
        });
    }

    bindEvents() {
        // 处理链接点击事件
        const handleLinkClick = (e) => {
            if (e.target.matches('a[href]')) {
                e.preventDefault();
                window.open(e.target.href, '_blank', 'noopener,noreferrer');
            }
        };

        document.addEventListener('click', handleLinkClick);
    }

    onViewActivated() {
        this.renderContent();
        this.loadStats();
    }

    renderContent() {
        const container = document.getElementById('aboutContent');
        if (!container) return;

        container.innerHTML = `
            <div class="space-y-8">
                <!-- 项目简介 -->
                <div class="bg-[#111] rounded-lg p-6">
                    <div class="flex items-center mb-4">
                        <img src="image/logo.png" alt="LibreTV" class="w-12 h-12 mr-4">
                        <div>
                            <h2 class="text-2xl font-bold gradient-text">LibreTV</h2>
                            <p class="text-gray-400">v${SITE_CONFIG.version || '2.0.0'}</p>
                        </div>
                    </div>
                    <p class="text-gray-300 leading-relaxed">
                        ${SITE_CONFIG.description || '免费在线视频搜索与观看平台'}，致力于为用户提供简洁、高效的视频内容搜索体验。
                        通过整合多个影视资源API，实现全网资源一站式搜索，同时支持豆瓣热门推荐，帮助用户发现优质内容。
                    </p>
                </div>

                <!-- 功能特性 -->
                <div class="bg-[#111] rounded-lg p-6">
                    <h3 class="text-lg font-semibold mb-4">✨ 核心特性</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div class="flex items-start space-x-3">
                            <div class="w-2 h-2 bg-[#00ccff] rounded-full mt-2 flex-shrink-0"></div>
                            <div>
                                <strong class="text-white">多源聚合搜索</strong>
                                <p class="text-gray-400 mt-1">整合多个优质资源站点，提供丰富的影视内容</p>
                            </div>
                        </div>
                        <div class="flex items-start space-x-3">
                            <div class="w-2 h-2 bg-[#00ccff] rounded-full mt-2 flex-shrink-0"></div>
                            <div>
                                <strong class="text-white">豆瓣热门推荐</strong>
                                <p class="text-gray-400 mt-1">基于豆瓣数据的智能推荐，发现优质内容</p>
                            </div>
                        </div>
                        <div class="flex items-start space-x-3">
                            <div class="w-2 h-2 bg-[#00ccff] rounded-full mt-2 flex-shrink-0"></div>
                            <div>
                                <strong class="text-white">在线播放</strong>
                                <p class="text-gray-400 mt-1">支持多种视频格式，无需下载即可观看</p>
                            </div>
                        </div>
                        <div class="flex items-start space-x-3">
                            <div class="w-2 h-2 bg-[#00ccff] rounded-full mt-2 flex-shrink-0"></div>
                            <div>
                                <strong class="text-white">观看历史</strong>
                                <p class="text-gray-400 mt-1">自动记录观看进度，续播更便捷</p>
                            </div>
                        </div>
                        <div class="flex items-start space-x-3">
                            <div class="w-2 h-2 bg-[#00ccff] rounded-full mt-2 flex-shrink-0"></div>
                            <div>
                                <strong class="text-white">自定义API</strong>
                                <p class="text-gray-400 mt-1">支持添加自定义资源站点，扩展更多内容</p>
                            </div>
                        </div>
                        <div class="flex items-start space-x-3">
                            <div class="w-2 h-2 bg-[#00ccff] rounded-full mt-2 flex-shrink-0"></div>
                            <div>
                                <strong class="text-white">无广告体验</strong>
                                <p class="text-gray-400 mt-1">纯净的观看环境，专注内容本身</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 版本更新 -->
                <div class="bg-[#111] rounded-lg p-6">
                    <h3 class="text-lg font-semibold mb-4">🚀 V2.0 更新日志</h3>
                    <div class="space-y-3 text-sm">
                        <div class="border-l-2 border-[#00ccff] pl-4">
                            <div class="font-medium text-white">全新SPA架构</div>
                            <p class="text-gray-400 mt-1">单页面应用设计，侧边栏导航，流畅的用户体验</p>
                        </div>
                        <div class="border-l-2 border-green-500 pl-4">
                            <div class="font-medium text-white">豆瓣热门增强</div>
                            <p class="text-gray-400 mt-1">支持懒加载、分页、标签筛选和收藏功能</p>
                        </div>
                        <div class="border-l-2 border-yellow-500 pl-4">
                            <div class="font-medium text-white">播放器优化</div>
                            <p class="text-gray-400 mt-1">自动暂停、进度保存、历史记录联动</p>
                        </div>
                        <div class="border-l-2 border-purple-500 pl-4">
                            <div class="font-medium text-white">设置系统重构</div>
                            <p class="text-gray-400 mt-1">API管理、配置导入导出、一键重置等功能</p>
                        </div>
                    </div>
                </div>

                <!-- 使用统计 -->
                <div class="bg-[#111] rounded-lg p-6">
                    <h3 class="text-lg font-semibold mb-4">📊 使用统计</h3>
                    <div id="statsContainer" class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div class="bg-[#222] rounded-lg p-4">
                            <div class="text-2xl font-bold text-[#00ccff]" id="searchCount">-</div>
                            <div class="text-xs text-gray-400 mt-1">总搜索次数</div>
                        </div>
                        <div class="bg-[#222] rounded-lg p-4">
                            <div class="text-2xl font-bold text-green-500" id="playCount">-</div>
                            <div class="text-xs text-gray-400 mt-1">总播放次数</div>
                        </div>
                        <div class="bg-[#222] rounded-lg p-4">
                            <div class="text-2xl font-bold text-yellow-500" id="apiCount">-</div>
                            <div class="text-xs text-gray-400 mt-1">已配置API</div>
                        </div>
                        <div class="bg-[#222] rounded-lg p-4">
                            <div class="text-2xl font-bold text-purple-500" id="historyCount">-</div>
                            <div class="text-xs text-gray-400 mt-1">观看历史</div>
                        </div>
                    </div>
                </div>

                <!-- 技术栈 -->
                <div class="bg-[#111] rounded-lg p-6">
                    <h3 class="text-lg font-semibold mb-4">🛠 技术栈</h3>
                    <div class="flex flex-wrap gap-2">
                        ${this.getTechStack().map(tech => `
                            <span class="px-3 py-1 bg-[#222] rounded-full text-sm text-gray-300 border border-[#333]">
                                ${tech}
                            </span>
                        `).join('')}
                    </div>
                </div>

                <!-- 开源信息 -->
                <div class="bg-[#111] rounded-lg p-6">
                    <h3 class="text-lg font-semibold mb-4">📋 开源协议</h3>
                    <div class="space-y-3 text-sm">
                        <p class="text-gray-300">
                            本项目基于 <strong class="text-white">MIT License</strong> 开源协议发布，
                            允许自由使用、修改和分发。
                        </p>
                        <div class="flex flex-wrap gap-4">
                            <a href="https://github.com/dlee2008/LibreTV" 
                               class="inline-flex items-center text-[#00ccff] hover:text-[#33d6ff] transition-colors">
                                <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                                </svg>
                                GitHub 仓库
                            </a>
                            <a href="https://github.com/dlee2008/LibreTV/issues" 
                               class="inline-flex items-center text-[#00ccff] hover:text-[#33d6ff] transition-colors">
                                <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                </svg>
                                问题反馈
                            </a>
                        </div>
                    </div>
                </div>

                <!-- 免责声明 -->
                <div class="bg-gradient-to-r from-red-900/20 to-orange-900/20 rounded-lg p-6 border border-red-900/30">
                    <h3 class="text-lg font-semibold mb-4 text-red-400">⚠️ 免责声明</h3>
                    <div class="space-y-3 text-sm text-gray-300">
                        <p>
                            本站提供的所有影视资源均来源于互联网，仅供学习交流使用。
                            我们不存储任何视频文件，所有内容均由第三方API提供。
                        </p>
                        <p>
                            如果您认为本站展示的内容侵犯了您的版权，请及时联系我们，
                            我们将在第一时间进行处理。
                        </p>
                        <p class="font-medium">
                            请支持正版，前往官方网站观看正版内容。
                        </p>
                    </div>
                </div>

                <!-- 联系方式 -->
                <div class="bg-[#111] rounded-lg p-6">
                    <h3 class="text-lg font-semibold mb-4">📧 联系我们</h3>
                    <div class="space-y-2 text-sm">
                        <p class="text-gray-300">
                            如有任何问题或建议，欢迎通过以下方式联系：
                        </p>
                        <div class="flex flex-col space-y-2 mt-4">
                            <a href="mailto:contact@libretv.is-an.org" 
                               class="inline-flex items-center text-[#00ccff] hover:text-[#33d6ff] transition-colors">
                                <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                                </svg>
                                contact@libretv.is-an.org
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getTechStack() {
        return [
            'HTML5', 'CSS3', 'JavaScript ES6+',
            'Tailwind CSS', 'ArtPlayer', 'HLS.js',
            'Web APIs', 'LocalStorage', 'Fetch API',
            'Service Worker', 'PWA', 'Responsive Design'
        ];
    }

    loadStats() {
        try {
            // 搜索历史统计
            const searchHistory = JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY) || '[]');
            const searchCount = searchHistory.length;
            document.getElementById('searchCount').textContent = searchCount;

            // 观看历史统计
            const viewingHistory = JSON.parse(localStorage.getItem('viewingHistory') || '[]');
            const historyCount = viewingHistory.length;
            document.getElementById('historyCount').textContent = historyCount;

            // 播放次数统计（基于历史记录中的播放次数）
            const playCount = viewingHistory.reduce((total, item) => {
                return total + (item.playCount || 1);
            }, 0);
            document.getElementById('playCount').textContent = playCount;

            // API统计
            const selectedAPIs = JSON.parse(localStorage.getItem('selectedAPIs') || '[]');
            const customAPIs = JSON.parse(localStorage.getItem('customAPIs') || '[]');
            const apiCount = selectedAPIs.length + customAPIs.length;
            document.getElementById('apiCount').textContent = apiCount;

        } catch (error) {
            console.error('加载统计数据失败:', error);
        }
    }

    // 获取系统信息
    getSystemInfo() {
        return {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            cookieEnabled: navigator.cookieEnabled,
            onlineStatus: navigator.onLine,
            screenResolution: `${screen.width}x${screen.height}`,
            viewportSize: `${window.innerWidth}x${window.innerHeight}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        };
    }

    // 显示系统信息（调试用）
    showSystemInfo() {
        const info = this.getSystemInfo();
        const infoText = Object.entries(info)
            .map(([key, value]) => `${key}: ${value}`)
            .join('\n');
        
        window.ui.showModal('系统信息', `<pre class="text-xs text-gray-300 whitespace-pre-wrap">${infoText}</pre>`);
    }
}

// 创建全局关于组件实例
window.about = new AboutComponent();
