// LibreTV V2.0 播放器组件
class PlayerComponent {
    constructor() {
        this.artPlayer = null;
        this.currentVideo = null;
        this.episodes = [];
        this.currentEpisodeIndex = 0;
        this.isPlaying = false;
        this.playbackPosition = 0;
        this.progressSaveInterval = null;
        
        this.init();
    }

    init() {
        this.bindEvents();
        
        // 监听视图激活和离开
        window.addEventListener('viewActivated', (e) => {
            if (e.detail.viewId === 'playerView') {
                this.onViewActivated();
            }
        });
        
        // 监听视图切换，自动暂停播放器
        window.addEventListener('beforeunload', () => this.cleanup());
    }

    bindEvents() {        // 退出播放器按钮
        const exitBtn = document.getElementById('exitPlayerBtn');
        if (exitBtn) {
            exitBtn.addEventListener('click', () => this.exitPlayer());
        }

        // 剧集列表按钮
        const episodeListBtn = document.getElementById('episodeListBtn');
        if (episodeListBtn) {
            episodeListBtn.addEventListener('click', () => this.toggleEpisodePanel());
        }

        // 关闭剧集面板
        const closeEpisodeBtn = document.getElementById('closeEpisodeBtn');
        if (closeEpisodeBtn) {
            closeEpisodeBtn.addEventListener('click', () => this.closeEpisodePanel());
        }

        // 监听路由变化，离开播放器页面时自动暂停
        window.addEventListener('hashchange', (e) => {
            const newHash = window.location.hash;
            const oldHash = e.oldURL ? e.oldURL.split('#')[1] : '';
            
            // 如果从播放器页面离开，自动暂停
            if (oldHash && oldHash.includes('player') && !newHash.includes('player')) {
                console.log('离开播放器页面，自动暂停播放');
                this.pauseVideo();
            }
        });

        // 监听页面可见性变化
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.artPlayer && this.isPlaying) {
                console.log('页面隐藏，自动暂停播放');
                this.pauseVideo();
            }
        });

        // 监听选集点击事件 - 自动跳转播放界面
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('episode-btn') || e.target.closest('.episode-btn')) {
                const episodeBtn = e.target.classList.contains('episode-btn') ? e.target : e.target.closest('.episode-btn');
                const videoData = JSON.parse(episodeBtn.dataset.video || '{}');
                const episodeIndex = parseInt(episodeBtn.dataset.index || '0');
                
                if (videoData.id && videoData.source) {
                    console.log('选集后自动跳转播放界面');
                    this.playFromEpisodeSelection(videoData, episodeIndex);
                }
            }
        });

        // 监听历史记录点击事件 - 自动跳转播放界面
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('history-item') || e.target.closest('.history-item')) {
                const historyItem = e.target.classList.contains('history-item') ? e.target : e.target.closest('.history-item');
                const historyData = JSON.parse(historyItem.dataset.history || '{}');
                
                if (historyData.id && historyData.source) {
                    console.log('历史记录点击，自动跳转播放界面');
                    this.playFromHistory(historyData);
                }
            }
        });
    }

    // 从选集选择播放
    async playFromEpisodeSelection(videoData, episodeIndex = 0) {
        // 构建播放器URL参数
        const params = new URLSearchParams({
            title: videoData.title || '未知标题',
            source: videoData.source,
            id: videoData.id,
            index: episodeIndex.toString()
        });

        // 跳转到播放器页面
        window.router.navigate(`player?${params.toString()}`);
    }

    // 从历史记录播放
    async playFromHistory(historyData) {
        // 构建播放器URL参数
        const params = new URLSearchParams({
            title: historyData.title || '未知标题',
            source: historyData.source,
            id: historyData.id,
            index: (historyData.episodeIndex || 0).toString(),
            time: (historyData.position || 0).toString()
        });

        // 跳转到播放器页面
        window.router.navigate(`player?${params.toString()}`);
    }    onViewActivated() {
        // 解析URL参数
        const params = this.parseUrlParams();
        if (params.title && params.source && params.id) {
            this.loadVideo(params);
        } else {
            // 显示播放器占位符
            this.showPlayerPlaceholder();
        }
    }

    parseUrlParams() {
        const hash = window.location.hash;
        const queryIndex = hash.indexOf('?');
        if (queryIndex === -1) return {};

        const queryString = hash.slice(queryIndex + 1);
        const params = {};
        
        queryString.split('&').forEach(param => {
            const [key, value] = param.split('=');
            if (key && value) {
                params[decodeURIComponent(key)] = decodeURIComponent(value);
            }
        });

        return params;
    }

    async loadVideo(params) {
        const { title, source, id, index = 0, time = 0 } = params;
        
        window.ui.showLoading('加载视频中...');
        
        try {
            // 获取视频详情和播放链接
            const videoData = await this.fetchVideoData(source, id);
            
            if (!videoData || !videoData.episodes || videoData.episodes.length === 0) {
                throw new Error('没有找到可播放的视频源');
            }

            // 保存当前视频信息
            this.currentVideo = {
                title: title,
                source: source,
                id: id,
                detail: videoData.detail,
                episodes: videoData.episodes
            };

            // 更新播放器标题
            this.updatePlayerTitle(title);

            // 渲染剧集列表
            this.renderEpisodeList();

            // 播放指定集数
            const episodeIndex = Math.max(0, Math.min(parseInt(index), videoData.episodes.length - 1));
            await this.playEpisode(episodeIndex);

            // 如果有指定时间，跳转到该位置
            if (time > 0 && this.artPlayer) {
                this.artPlayer.currentTime = parseFloat(time);
            }

            console.log(`加载视频成功: ${title} - 第${episodeIndex + 1}集`);
              } catch (error) {
            console.error('加载视频失败:', error);
            this.showPlayerError(error.message || '视频加载失败');
            window.ui.showToast('视频加载失败，请稍后重试', 'error');
        } finally {
            window.ui.hideLoading();
        }
    }

    async fetchVideoData(source, id) {
        // 构建详情API URL
        let detailUrl;
        if (source.startsWith('custom_')) {
            const customIndex = source.replace('custom_', '');
            const customAPIs = JSON.parse(localStorage.getItem('customAPIs') || '[]');
            const customApi = customAPIs[customIndex];
            if (!customApi) throw new Error('自定义API配置无效');
            detailUrl = customApi.url + API_CONFIG.detail.path + id;
        } else {
            if (!API_SITES[source]) throw new Error('API源不存在');
            detailUrl = API_SITES[source].api + API_CONFIG.detail.path + id;
        }

        const response = await fetch(PROXY_URL + encodeURIComponent(detailUrl), {
            headers: API_CONFIG.detail.headers
        });

        if (!response.ok) throw new Error('获取视频详情失败');

        const data = await response.json();
        if (!data || !data.list || !data.list[0]) {
            throw new Error('视频详情数据无效');
        }

        const videoDetail = data.list[0];
        const episodes = this.parseEpisodes(videoDetail.vod_play_url || '');

        return {
            detail: videoDetail,
            episodes
        };
    }

    parseEpisodes(playUrl) {
        if (!playUrl) return [];
        
        try {
            const sources = playUrl.split('$$$');
            if (sources.length === 0) return [];
            
            const episodes = sources[0].split('#');
            return episodes.map(ep => {
                const parts = ep.split('$');
                return {
                    name: parts[0] || '未知',
                    url: parts.length > 1 ? parts[1] : ''
                };
            }).filter(ep => ep.url && ep.url.startsWith('http'));
        } catch (e) {
            return [];
        }
    }

    async initPlayer(episode) {
        const container = document.getElementById('videoPlayer');
        if (!container) return;

        // 销毁之前的播放器实例
        if (this.artPlayer) {
            this.artPlayer.destroy();
        }

        try {
            // 动态加载播放器库
            if (!window.Artplayer) {
                await this.loadPlayerLibs();
            }

            // 创建播放器实例
            this.artPlayer = new Artplayer({
                container: container,
                url: PROXY_URL + encodeURIComponent(episode.url),
                title: this.currentVideo.title,
                poster: this.currentVideo.detail?.vod_pic,
                volume: 0.7,
                autoplay: true,
                autoSize: true,
                autoOrientation: true,
                fullscreen: true,
                fullscreenWeb: true,
                subtitleOffset: true,
                miniProgressBar: true,
                mutex: true,
                backdrop: true,
                playsInline: true,
                autoPlayback: true,
                airplay: true,
                theme: '#00ccff',
                lang: 'zh-cn',
                moreVideoAttr: {
                    crossOrigin: 'anonymous',
                },
                customType: {
                    m3u8: (video, url) => {
                        if (window.Hls && Hls.isSupported()) {
                            const hls = new Hls({
                                enableWorker: false,
                                lowLatencyMode: true,
                                backBufferLength: 90
                            });
                            hls.loadSource(url);
                            hls.attachMedia(video);
                        }
                    }
                },
                plugins: [],
                contextmenu: [
                    {
                        name: '关于播放器',
                        click: () => {
                            window.ui.showToast('LibreTV Player V2.0', 'info');
                        }
                    }
                ],
                settings: [
                    {
                        name: 'quality',
                        title: '画质',
                        tooltip: '画质',
                        icon: '<svg>...</svg>',
                        selector: [
                            {
                                name: '自动',
                                value: 'auto',
                                default: true
                            }
                        ]
                    }
                ]
            });

            // 绑定播放器事件
            this.bindPlayerEvents();

        } catch (error) {
            console.error('初始化播放器失败:', error);
            this.showPlayerError('播放器初始化失败');
        }
    }

    async loadPlayerLibs() {
        // 加载 ArtPlayer
        if (!window.Artplayer) {
            await this.loadScript('libs/artplayer.min.js');
        }

        // 加载 HLS.js
        if (!window.Hls) {
            await this.loadScript('libs/hls.min.js');
        }
    }

    loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    bindPlayerEvents() {
        if (!this.artPlayer) return;

        // 播放状态监听
        this.artPlayer.on('play', () => {
            this.isPlaying = true;
            this.startProgressSaveInterval();
        });

        this.artPlayer.on('pause', () => {
            this.isPlaying = false;
            this.stopProgressSaveInterval();
        });

        // 进度监听
        this.artPlayer.on('timeupdate', () => {
            this.playbackPosition = this.artPlayer.currentTime;
        });

        // 播放结束
        this.artPlayer.on('ended', () => {
            this.onVideoEnded();
        });

        // 错误处理
        this.artPlayer.on('error', (error) => {
            console.error('播放器错误:', error);
            this.showPlayerError('播放出错，请尝试刷新或更换片源');
        });

        // 全屏状态监听
        this.artPlayer.on('fullscreen', (fullscreen) => {
            if (fullscreen) {
                document.body.classList.add('player-fullscreen');
            } else {
                document.body.classList.remove('player-fullscreen');
            }
        });
    }

    onVideoEnded() {
        // 自动播放下一集
        if (this.currentEpisodeIndex < this.episodes.length - 1) {
            setTimeout(() => {
                this.playEpisode(this.currentEpisodeIndex + 1);
            }, 3000);
        } else {
            window.ui.showToast('全部播放完毕', 'success');
        }
    }

    updatePlayerTitle(title) {
        const titleEl = document.getElementById('playerTitle');
        if (titleEl) {
            titleEl.textContent = title;
        }
    }

    renderEpisodeList() {
        const episodeList = document.getElementById('episodeList');
        if (!episodeList || this.episodes.length === 0) return;

        episodeList.innerHTML = this.episodes.map((episode, index) => `
            <button onclick="window.player.playEpisode(${index})"
                    class="episode-btn px-3 py-2 bg-[#222] hover:bg-[#00ccff] hover:text-black border border-[#333] rounded text-sm transition-colors ${index === this.currentEpisodeIndex ? 'bg-[#00ccff] text-black' : ''}">
                第${index + 1}集
            </button>
        `).join('');
    }

    async playEpisode(index) {
        if (index < 0 || index >= this.episodes.length) return;

        this.currentEpisodeIndex = index;
        this.playbackPosition = 0;

        // 更新URL参数
        const params = this.parseUrlParams();
        params.index = index;
        const queryString = Object.entries(params)
            .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
            .join('&');
        
        window.history.replaceState(null, '', `#/player?${queryString}`);

        // 重新初始化播放器
        await this.initPlayer(this.episodes[index]);

        // 更新剧集列表
        this.renderEpisodeList();

        // 关闭剧集面板
        this.closeEpisodePanel();
    }

    toggleEpisodePanel() {
        const panel = document.getElementById('episodePanel');
        if (panel) {
            if (panel.classList.contains('translate-x-0')) {
                this.closeEpisodePanel();
            } else {
                this.openEpisodePanel();
            }
        }
    }

    openEpisodePanel() {
        const panel = document.getElementById('episodePanel');
        if (panel) {
            panel.classList.remove('translate-x-full');
            panel.classList.add('translate-x-0');
        }
    }

    closeEpisodePanel() {
        const panel = document.getElementById('episodePanel');
        if (panel) {
            panel.classList.add('translate-x-full');
            panel.classList.remove('translate-x-0');
        }
    }

    pauseVideo() {
        if (this.artPlayer && this.isPlaying) {
            this.artPlayer.pause();
        }
    }

    exitPlayer() {
        this.cleanup();
        window.router.navigate('search');
    }

    cleanup() {
        // 暂停播放
        this.pauseVideo();
        
        // 停止进度保存
        this.stopProgressSaveInterval();
        
        // 保存当前播放进度
        this.saveCurrentProgress();
        
        // 销毁播放器
        if (this.artPlayer) {
            this.artPlayer.destroy();
            this.artPlayer = null;
        }
        
        // 重置状态
        this.isPlaying = false;
        document.body.classList.remove('player-fullscreen');
    }

    showPlayerPlaceholder() {
        const container = document.getElementById('videoPlayer');
        if (container) {
            container.innerHTML = `
                <div class="w-full h-full flex items-center justify-center bg-black text-white">
                    <div class="text-center">
                        <svg class="w-24 h-24 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <h3 class="text-xl mb-2">暂无播放内容</h3>
                        <p class="text-gray-400">请从搜索或豆瓣热门中选择视频播放</p>
                        <button onclick="window.router.navigate('search')" 
                                class="mt-4 bg-[#00ccff] hover:bg-[#33d6ff] text-black px-6 py-2 rounded-lg transition-colors">
                            去搜索
                        </button>
                    </div>
                </div>
            `;
        }
    }

    showPlayerError(message) {
        const container = document.getElementById('videoPlayer');
        if (container) {
            container.innerHTML = `
                <div class="w-full h-full flex items-center justify-center bg-black text-white">
                    <div class="text-center">
                        <svg class="w-24 h-24 mx-auto mb-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                        </svg>
                        <h3 class="text-xl mb-2">播放出错</h3>
                        <p class="text-gray-400 mb-4">${message}</p>
                        <div class="space-x-4">
                            <button onclick="window.location.reload()" 
                                    class="bg-[#00ccff] hover:bg-[#33d6ff] text-black px-6 py-2 rounded-lg transition-colors">
                                刷新重试
                            </button>
                            <button onclick="window.router.navigate('search')" 
                                    class="bg-[#333] hover:bg-[#444] text-white px-6 py-2 rounded-lg transition-colors">
                                返回搜索
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    startProgressSaveInterval() {
        this.stopProgressSaveInterval();
        this.progressSaveInterval = setInterval(() => {
            this.saveCurrentProgress();
        }, 10000); // 每10秒保存一次进度
    }

    stopProgressSaveInterval() {
        if (this.progressSaveInterval) {
            clearInterval(this.progressSaveInterval);
            this.progressSaveInterval = null;
        }
    }    saveCurrentProgress() {
        if (!this.currentVideo || !this.artPlayer) return;

        const videoData = {
            title: this.currentVideo.title,
            url: this.currentVideo.detail?.vod_play_url || '',
            poster: this.currentVideo.detail?.vod_pic,
            episodeName: this.currentEpisodes[this.currentEpisodeIndex] || `第${this.currentEpisodeIndex + 1}集`,
            currentTime: this.playbackPosition,
            duration: this.artPlayer.duration,
            episodes: this.currentEpisodes
        };

        // 使用HistoryComponent来更新进度
        if (window.history) {
            window.history.updateProgress(videoData);
        }
    }    saveToHistory() {
        if (!this.currentVideo) return;

        const videoData = {
            title: this.currentVideo.title,
            url: this.currentVideo.detail?.vod_play_url || '',
            poster: this.currentVideo.detail?.vod_pic,
            episodeName: this.currentEpisodes[this.currentEpisodeIndex] || `第${this.currentEpisodeIndex + 1}集`,
            currentTime: 0,
            duration: 0,
            episodes: this.currentEpisodes
        };

        // 使用HistoryComponent来保存历史
        if (window.history) {
            window.history.addToHistory(videoData);
        }
    }    // 获取观看历史
    getViewingHistory() {
        if (window.history) {
            return window.history.getHistory();
        }
        return [];
    }

    // 从历史记录播放
    playFromHistory(historyItem) {
        const params = {
            title: historyItem.title,
            source: historyItem.source,
            id: historyItem.id,
            index: historyItem.episodeIndex || 0
        };

        const queryString = Object.entries(params)
            .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
            .join('&');
        
        window.router.navigate(`player?${queryString}`);
    }
}

// 创建全局播放器实例
window.player = new PlayerComponent();
