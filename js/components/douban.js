// LibreTV V2.1 豆瓣热门组件 - 增强懒加载版本
class DoubanComponent {
    constructor() {
        this.currentType = 'movie'; // 'movie' or 'tv'
        this.currentTag = '热门';
        this.currentPage = 0;
        this.pageSize = 20; // 每页20个内容
        this.isLoading = false;
        this.hasMore = true;
        this.items = [];
        this.cache = new Map(); // 缓存机制
        this.intersectionObserver = null;
        
        // 标签配置
        this.movieTags = ['热门', '高分', '新上映', '经典', '科幻', '动作', '喜剧', '爱情', '悬疑', '动画'];
        this.tvTags = ['热门', '高分', '新剧', '经典', '科幻', '动作', '喜剧', '爱情', '悬疑', '动画'];
        
        // 懒加载配置
        this.lazyLoadConfig = {
            preloadCount: 20,      // 预加载数量
            loadThreshold: 200,    // 触发加载的距离
            maxRetries: 3          // 最大重试次数
        };
        
        this.init();
    }    init() {
        this.bindEvents();
        this.setupInfiniteScroll();
        
        // 监听视图激活
        window.addEventListener('viewActivated', (e) => {
            if (e.detail.viewId === 'doubanView') {
                this.onViewActivated();
            }
        });
        
        // 页面隐藏时清理资源
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.cleanup();
            }
        });
    }

    bindEvents() {
        // 电影/电视剧切换按钮
        const movieToggle = document.getElementById('douban-movie-toggle');
        const tvToggle = document.getElementById('douban-tv-toggle');
        
        if (movieToggle) {
            movieToggle.addEventListener('click', () => this.switchType('movie'));
        }
        
        if (tvToggle) {
            tvToggle.addEventListener('click', () => this.switchType('tv'));
        }
        
        // 加载更多按钮（备用方案）
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', () => this.loadMore());
        }
    }

    setupInfiniteScroll() {
        // 销毁之前的观察器
        if (this.intersectionObserver) {
            this.intersectionObserver.disconnect();
        }
        
        // 创建新的观察器
        this.intersectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && this.hasMore && !this.isLoading) {
                    this.loadMore();
                }
            });
        }, {
            rootMargin: `${this.lazyLoadConfig.loadThreshold}px`,
            threshold: 0.1
        });
    }

    onViewActivated() {
        // 首次进入时加载内容
        if (this.items.length === 0) {
            this.renderTags();
            this.loadContent();
        }
    }

    switchType(type) {
        if (this.currentType === type) return;
        
        this.currentType = type;
        this.currentTag = '热门';
        this.currentPage = 0;
        this.items = [];
        this.hasMore = true;
        
        // 更新按钮状态
        this.updateToggleButtons();
        
        // 重新渲染标签和内容
        this.renderTags();
        this.loadContent();
    }

    updateToggleButtons() {
        const movieToggle = document.getElementById('douban-movie-toggle');
        const tvToggle = document.getElementById('douban-tv-toggle');
        
        if (movieToggle && tvToggle) {
            if (this.currentType === 'movie') {
                movieToggle.classList.add('bg-pink-600', 'text-white');
                movieToggle.classList.remove('text-gray-300');
                tvToggle.classList.remove('bg-pink-600', 'text-white');
                tvToggle.classList.add('text-gray-300');
            } else {
                tvToggle.classList.add('bg-pink-600', 'text-white');
                tvToggle.classList.remove('text-gray-300');
                movieToggle.classList.remove('bg-pink-600', 'text-white');
                movieToggle.classList.add('text-gray-300');
            }
        }
    }

    renderTags() {
        const tagsContainer = document.getElementById('douban-tags');
        if (!tagsContainer) return;
        
        const tags = this.currentType === 'movie' ? this.movieTags : this.tvTags;
        
        tagsContainer.innerHTML = tags.map(tag => `
            <button class="tag ${tag === this.currentTag ? 'active' : ''}" 
                    onclick="window.douban.switchTag('${tag}')">
                ${tag}
            </button>
        `).join('');
    }

    switchTag(tag) {
        if (this.currentTag === tag) return;
        
        this.currentTag = tag;
        this.currentPage = 0;
        this.items = [];
        this.hasMore = true;
        
        this.renderTags();
        this.loadContent();
    }

    async loadContent() {
        if (this.isLoading || !this.hasMore) return;
        
        this.isLoading = true;
        this.showLoading();
        
        try {
            const cacheKey = `${this.currentType}_${this.currentTag}_${this.currentPage}`;
            
            // 检查缓存
            if (this.cache.has(cacheKey)) {
                const cachedData = this.cache.get(cacheKey);
                this.appendItems(cachedData);
                this.currentPage++;
                return;
            }
            
            // 模拟豆瓣API数据（实际应用中需要连接真实API）
            const data = await this.fetchDoubanData();
            
            // 缓存数据
            this.cache.set(cacheKey, data);
            
            this.appendItems(data);
            this.currentPage++;
            
        } catch (error) {
            console.error('加载豆瓣数据失败:', error);
            window.ui.showToast('加载失败，请稍后重试', 'error');
        } finally {
            this.isLoading = false;
            this.hideLoading();
        }
    }

    async fetchDoubanData() {
        // 模拟API延迟
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 生成模拟数据
        const mockData = [];
        for (let i = 0; i < this.pageSize; i++) {
            const id = this.currentPage * this.pageSize + i + 1;
            mockData.push({
                id: `douban_${id}`,
                title: `${this.currentType === 'movie' ? '电影' : '电视剧'} ${this.currentTag} ${id}`,
                poster: `https://via.placeholder.com/300x450/1f2937/ffffff?text=${encodeURIComponent(`${this.currentTag}${id}`)}`,
                rating: (8.0 + Math.random() * 2).toFixed(1),
                year: 2020 + Math.floor(Math.random() * 4),
                genre: ['剧情', '动作', '喜剧', '科幻', '悬疑'][Math.floor(Math.random() * 5)],
                director: `导演${id}`,
                actors: [`演员${id}A`, `演员${id}B`],
                description: `这是一部精彩的${this.currentTag}${this.currentType === 'movie' ? '电影' : '电视剧'}，讲述了...`
            });
        }
        
        // 模拟最后一页
        if (this.currentPage >= 4) {
            this.hasMore = false;
            return mockData.slice(0, Math.random() * this.pageSize);
        }
        
        return mockData;
    }

    appendItems(newItems) {
        this.items = [...this.items, ...newItems];
        this.renderContent();
    }

    renderContent() {
        const content = document.getElementById('douban-content');
        if (!content) return;
        
        const itemsHtml = this.items.map(item => this.createItemCard(item)).join('');
        content.innerHTML = itemsHtml;
        
        // 更新加载更多按钮状态
        this.updateLoadMoreButton();
    }

    createItemCard(item) {
        return `
            <div class="card-hover bg-[#111] rounded-lg overflow-hidden cursor-pointer group"
                 onclick="window.douban.showItemDetails('${item.id}')">
                <div class="relative aspect-[3/4] overflow-hidden">
                    <img src="${item.poster}" alt="${item.title}" 
                         class="w-full h-full object-cover transition-transform group-hover:scale-110"
                         onerror="this.src='image/nomedia.png'; this.classList.add('object-contain');"
                         loading="lazy">
                    
                    <!-- 评分标签 -->
                    <div class="absolute top-2 right-2 bg-black/80 text-yellow-400 px-2 py-1 rounded-full text-xs font-bold">
                        ⭐ ${item.rating}
                    </div>
                    
                    <!-- 悬停信息 -->
                    <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                        <div class="absolute bottom-2 left-2 right-2">
                            <p class="text-white text-xs line-clamp-2">${item.description}</p>
                        </div>
                    </div>
                </div>
                
                <div class="p-3">
                    <h3 class="font-medium line-clamp-1 mb-1" title="${item.title}">${item.title}</h3>
                    <div class="flex items-center justify-between text-xs text-gray-400">
                        <span>${item.year}</span>
                        <span>${item.genre}</span>
                    </div>
                </div>
            </div>
        `;
    }

    showItemDetails(itemId) {
        const item = this.items.find(i => i.id === itemId);
        if (!item) return;
        
        const modal = document.getElementById('modal');
        const modalContent = document.getElementById('modalContent');
        
        modalContent.innerHTML = `
            <div class="flex flex-col md:flex-row gap-6">
                <div class="flex-shrink-0">
                    <img src="${item.poster}" alt="${item.title}" 
                         class="w-full md:w-48 h-auto rounded-lg object-cover"
                         onerror="this.src='image/nomedia.png'">
                </div>
                
                <div class="flex-1">
                    <div class="flex items-center gap-3 mb-3">
                        <h3 class="text-xl font-bold">${item.title}</h3>
                        <div class="bg-yellow-400 text-black px-2 py-1 rounded-full text-sm font-bold">
                            ⭐ ${item.rating}
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-2 text-sm mb-4">
                        <p><span class="text-gray-400">年份:</span> ${item.year}</p>
                        <p><span class="text-gray-400">类型:</span> ${item.genre}</p>
                        <p><span class="text-gray-400">导演:</span> ${item.director}</p>
                        <p><span class="text-gray-400">演员:</span> ${item.actors.join(', ')}</p>
                    </div>
                    
                    <div class="mb-4">
                        <h4 class="text-sm font-medium text-gray-400 mb-2">简介</h4>
                        <p class="text-sm text-gray-300 leading-relaxed">${item.description}</p>
                    </div>
                    
                    <div class="flex gap-3">
                        <button onclick="window.douban.searchTitle('${item.title}')"
                                class="bg-[#00ccff] hover:bg-[#33d6ff] text-black px-4 py-2 rounded-lg transition-colors">
                            搜索资源
                        </button>
                        <button onclick="window.douban.addToWishlist('${item.id}')"
                                class="bg-[#333] hover:bg-[#444] text-white px-4 py-2 rounded-lg transition-colors">
                            加入收藏
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        modal.classList.remove('hidden');
    }

    searchTitle(title) {
        // 关闭详情弹窗
        document.getElementById('modal').classList.add('hidden');
        
        // 跳转到搜索页面并执行搜索
        window.router.navigate('search');
        
        setTimeout(() => {
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                searchInput.value = title;
                window.search.updateClearButton();
                window.search.performSearch();
            }
        }, 100);
    }

    addToWishlist(itemId) {
        // 实现收藏功能
        let wishlist = JSON.parse(localStorage.getItem('doubanWishlist') || '[]');
        
        if (!wishlist.includes(itemId)) {
            wishlist.push(itemId);
            localStorage.setItem('doubanWishlist', JSON.stringify(wishlist));
            window.ui.showToast('已加入收藏', 'success');
        } else {
            window.ui.showToast('已经在收藏中', 'info');
        }
        
        document.getElementById('modal').classList.add('hidden');
    }

    // 清理资源
    cleanup() {
        if (this.intersectionObserver) {
            this.intersectionObserver.disconnect();
            this.intersectionObserver = null;
        }
    }

    // 加载更多内容
    async loadMore() {
        if (this.isLoading || !this.hasMore) return;
        
        console.log(`加载更多 ${this.currentType} - ${this.currentTag} - 第${this.currentPage + 1}页`);
        await this.loadContent();
    }

    // 显示加载状态
    showLoading() {
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        if (loadMoreBtn) {
            loadMoreBtn.textContent = '加载中...';
            loadMoreBtn.disabled = true;
            loadMoreBtn.classList.add('opacity-50');
        }
    }

    // 隐藏加载状态
    hideLoading() {
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        if (loadMoreBtn) {
            loadMoreBtn.textContent = this.hasMore ? '加载更多' : '没有更多了';
            loadMoreBtn.disabled = !this.hasMore;
            loadMoreBtn.classList.toggle('opacity-50', !this.hasMore);
        }
    }

    // 图片懒加载
    setupImageLazyLoading() {
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    const src = img.dataset.src;
                    if (src) {
                        img.src = src;
                        img.removeAttribute('data-src');
                        imageObserver.unobserve(img);
                    }
                }
            });
        }, {
            rootMargin: '50px'
        });

        // 观察所有带有data-src的图片
        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }

    // 重试加载机制
    async retryLoad(retryCount = 0) {
        if (retryCount >= this.lazyLoadConfig.maxRetries) {
            window.ui.showToast('加载失败，请刷新页面重试', 'error');
            return;
        }

        try {
            await this.loadContent();
        } catch (error) {
            console.warn(`加载重试 ${retryCount + 1}/${this.lazyLoadConfig.maxRetries}`);
            setTimeout(() => this.retryLoad(retryCount + 1), 1000 * Math.pow(2, retryCount));
        }
    }

    // 刷新当前内容
    refresh() {
        this.currentPage = 0;
        this.items = [];
        this.hasMore = true;
        this.cache.clear();
        this.loadContent();
    }

    // 获取收藏列表
    getWishlist() {
        return JSON.parse(localStorage.getItem('doubanWishlist') || '[]');
    }

    // 清空缓存
    clearCache() {
        this.cache.clear();
        window.ui.showToast('缓存已清空', 'success');
    }
}

// 创建全局豆瓣实例
window.douban = new DoubanComponent();
