// LibreTV V2.1 观看历史组件
class HistoryComponent {
    constructor(router, playerComponent) {
        this.router = router;
        this.playerComponent = playerComponent;
        this.history = this.loadHistory();
        this.init();
    }

    // 加载历史记录，处理数据格式兼容性
    loadHistory() {
        try {
            const rawData = localStorage.getItem('viewingHistory');
            if (!rawData) return [];
            
            const data = JSON.parse(rawData);
            if (!Array.isArray(data)) return [];
            
            // 转换旧格式数据到新格式
            return data.map(item => {
                // 如果是新格式，直接返回
                if (item.id && item.title && item.watchTime) {
                    return item;
                }
                
                // 转换旧格式到新格式
                return {
                    id: this.generateId(item.title, item.episodeName || (item.episodeIndex !== undefined ? `第${item.episodeIndex + 1}集` : '')),
                    title: item.title || '',
                    url: item.url || item.directVideoUrl || '',
                    poster: item.cover || item.poster || 'image/nomedia.png',
                    episodeName: item.episodeName || (item.episodeIndex !== undefined ? `第${item.episodeIndex + 1}集` : ''),
                    currentTime: item.position || item.playbackPosition || item.currentTime || 0,
                    duration: item.duration || 0,
                    progress: this.calculateProgress(item.position || item.playbackPosition || item.currentTime || 0, item.duration || 0),
                    watchTime: item.timestamp || item.watchTime || Date.now(),
                    episodes: item.episodes || []
                };
            });
        } catch (e) {
            console.error('加载观看历史失败:', e);
            return [];
        }
    }

    calculateProgress(currentTime, duration) {
        if (!duration || duration <= 0) return 0;
        return Math.round((currentTime / duration) * 100);
    }

    init() {
        this.bindEvents();
        
        // 监听视图激活事件
        window.addEventListener('viewActivated', (e) => {
            if (e.detail.viewId === 'historyView') {
                this.render();
            }
        });
    }

    bindEvents() {
        // 清空历史按钮
        const clearHistoryBtn = document.getElementById('clearAllHistoryBtn');
        if (clearHistoryBtn) {
            clearHistoryBtn.addEventListener('click', () => this.clearAllHistory());
        }
    }

    render() {
        const historyList = document.getElementById('historyList');
        if (!historyList) return;

        if (this.history.length === 0) {
            historyList.innerHTML = `
                <div class="text-center py-12">
                    <svg class="w-16 h-16 mx-auto text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <h3 class="text-lg font-medium text-gray-400 mb-2">暂无观看历史</h3>
                    <p class="text-gray-500">开始观看视频，记录将出现在这里</p>
                </div>
            `;
            return;
        }

        historyList.innerHTML = this.history.map((item, index) => `
            <div class="bg-[#111] rounded-lg p-4 hover:bg-[#1a1a1a] transition-colors group">
                <div class="flex items-start space-x-4">
                    <!-- 缩略图 -->
                    <div class="flex-shrink-0 w-20 h-28 bg-[#222] rounded overflow-hidden relative">
                        <img src="${item.poster || 'image/nomedia.png'}" 
                             alt="${item.title}" 
                             class="w-full h-full object-cover"
                             onerror="this.src='image/nomedia.png'">
                        <!-- 播放进度条 -->
                        ${item.progress > 0 ? `
                            <div class="absolute bottom-0 left-0 right-0 h-1 bg-black/50">
                                <div class="h-full bg-[#00ccff] transition-all" style="width: ${item.progress}%"></div>
                            </div>
                        ` : ''}
                    </div>
                    
                    <!-- 视频信息 -->
                    <div class="flex-1 min-w-0">
                        <h3 class="font-medium text-white mb-1 truncate group-hover:text-[#00ccff] transition-colors">
                            ${item.title}
                        </h3>
                        
                        <div class="space-y-1 text-sm text-gray-400">
                            ${item.episodeName ? `
                                <p class="truncate">集数: ${item.episodeName}</p>
                            ` : ''}
                            
                            <p>观看时间: ${this.formatTime(item.watchTime)}</p>
                            
                            ${item.currentTime > 0 ? `
                                <p>播放位置: ${this.formatDuration(item.currentTime)}</p>
                            ` : ''}
                            
                            ${item.duration > 0 ? `
                                <p>总时长: ${this.formatDuration(item.duration)}</p>
                            ` : ''}
                        </div>
                        
                        <!-- 操作按钮 -->
                        <div class="flex items-center space-x-2 mt-3">
                            <button class="continue-btn bg-[#00ccff] hover:bg-[#33d6ff] text-black px-3 py-1 rounded text-sm font-medium transition-colors"
                                    data-item="${item.id}">
                                继续观看
                            </button>
                            <button class="remove-btn text-gray-500 hover:text-red-400 p-1 transition-colors"
                                    data-index="${index}"
                                    title="删除记录">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        // 绑定事件
        this.bindHistoryEvents();
    }

    bindHistoryEvents() {
        const historyList = document.getElementById('historyList');
        if (!historyList) return;

        // 继续观看按钮
        historyList.addEventListener('click', (e) => {
            if (e.target.matches('.continue-btn')) {
                const itemId = e.target.dataset.item;
                const historyItem = this.history.find(item => item.id === itemId);
                if (historyItem) {
                    this.continueWatching(historyItem);
                }
            }
            
            // 删除记录按钮
            if (e.target.closest('.remove-btn')) {
                const index = parseInt(e.target.closest('.remove-btn').dataset.index);
                this.removeHistoryItem(index);
            }
        });
    }

    continueWatching(historyItem) {
        // 创建播放数据
        const playData = {
            title: historyItem.title,
            url: historyItem.url,
            poster: historyItem.poster,
            episodeName: historyItem.episodeName,
            currentTime: historyItem.currentTime || 0,
            episodes: historyItem.episodes || []
        };

        // 设置播放器数据并跳转
        if (this.playerComponent) {
            this.playerComponent.setPlayData(playData);
        }
        
        // 跳转到播放页面
        this.router.navigate('player');
    }

    removeHistoryItem(index) {
        if (index >= 0 && index < this.history.length) {
            this.history.splice(index, 1);
            this.saveHistory();
            this.render();
            
            // 显示删除成功提示
            this.showToast('已删除观看记录');
        }
    }

    clearAllHistory() {
        if (this.history.length === 0) return;
        
        if (confirm('确定要清空所有观看历史吗？')) {
            this.history = [];
            this.saveHistory();
            this.render();
            this.showToast('已清空所有观看历史');
        }
    }

    // 添加观看记录
    addToHistory(videoData) {
        if (!videoData.title || !videoData.url) return;

        const historyItem = {
            id: this.generateId(videoData.title, videoData.episodeName),
            title: videoData.title,
            url: videoData.url,
            poster: videoData.poster || 'image/nomedia.png',
            episodeName: videoData.episodeName || '',
            currentTime: videoData.currentTime || 0,
            duration: videoData.duration || 0,
            progress: videoData.duration > 0 ? Math.round((videoData.currentTime / videoData.duration) * 100) : 0,
            watchTime: Date.now(),
            episodes: videoData.episodes || []
        };

        // 移除已存在的相同记录
        this.history = this.history.filter(item => item.id !== historyItem.id);
        
        // 添加到开头
        this.history.unshift(historyItem);
        
        // 限制历史记录数量（最多50条）
        if (this.history.length > 50) {
            this.history = this.history.slice(0, 50);
        }
        
        this.saveHistory();
    }

    // 更新播放进度
    updateProgress(videoData) {
        const itemId = this.generateId(videoData.title, videoData.episodeName);
        const historyItem = this.history.find(item => item.id === itemId);
        
        if (historyItem) {
            historyItem.currentTime = videoData.currentTime || 0;
            historyItem.duration = videoData.duration || 0;
            historyItem.progress = historyItem.duration > 0 ? 
                Math.round((historyItem.currentTime / historyItem.duration) * 100) : 0;
            historyItem.watchTime = Date.now();
            this.saveHistory();
        }
    }

    generateId(title, episodeName) {
        return `${title}-${episodeName || 'main'}`.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_');
    }

    saveHistory() {
        localStorage.setItem('viewingHistory', JSON.stringify(this.history));
    }

    getHistory() {
        return this.history;
    }

    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) { // 1分钟内
            return '刚刚';
        } else if (diff < 3600000) { // 1小时内
            return `${Math.floor(diff / 60000)}分钟前`;
        } else if (diff < 86400000) { // 24小时内
            return `${Math.floor(diff / 3600000)}小时前`;
        } else if (diff < 2592000000) { // 30天内
            return `${Math.floor(diff / 86400000)}天前`;
        } else {
            return date.toLocaleDateString();
        }
    }

    formatDuration(seconds) {
        if (!seconds || seconds < 0) return '00:00';
        
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        
        if (hours > 0) {
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    showToast(message) {
        // 创建toast元素
        const toast = document.createElement('div');
        toast.className = 'fixed top-4 right-4 bg-[#222] border border-[#333] text-white px-4 py-2 rounded-lg z-50 transition-opacity';
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        // 3秒后移除
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }
}

// 导出组件
window.HistoryComponent = HistoryComponent;
