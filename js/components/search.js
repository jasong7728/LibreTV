// LibreTV V2.0 搜索组件
class SearchComponent {
    constructor() {
        this.searchHistory = [];
        this.selectedAPIs = [];
        this.customAPIs = [];
        this.isSearching = false;
        this.abortController = null;
        this.init();
    }    init() {
        this.loadSettings();
        this.bindEvents();
        this.renderSearchHistory();
        this.setupSearchInput();
        
        // 监听视图激活
        window.addEventListener('viewActivated', (e) => {
            if (e.detail.viewId === 'searchView') {
                this.onViewActivated();
            }
        });
    }

    loadSettings() {
        // 加载选中的API
        this.selectedAPIs = JSON.parse(localStorage.getItem('selectedAPIs') || '["tyyszy","dyttzy", "bfzy", "ruyi"]');
        this.customAPIs = JSON.parse(localStorage.getItem('customAPIs') || '[]');
        this.searchHistory = this.getSearchHistory();
    }

    bindEvents() {
        // 搜索按钮
        const searchBtn = document.getElementById('searchBtn');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => this.performSearch());
        }

        // 搜索输入框回车
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.performSearch();
                }
            });

            // 输入框内容变化
            searchInput.addEventListener('input', () => {
                this.updateClearButton();
            });
        }

        // 清空按钮
        const clearBtn = document.getElementById('clearBtn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearSearch());
        }        // 清空历史按钮
        const clearHistoryBtn = document.getElementById('clearHistoryBtn');
        if (clearHistoryBtn) {
            clearHistoryBtn.addEventListener('click', () => this.clearSearchHistory());
        }

        // 返回搜索按钮
        const backToSearchBtn = document.getElementById('backToSearchBtn');
        if (backToSearchBtn) {
            backToSearchBtn.addEventListener('click', () => this.showSearchArea());
        }
    }

    setupSearchInput() {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            // 检查URL参数中的搜索关键词
            const urlParams = window.router.getQueryParams();
            if (urlParams.q) {
                searchInput.value = urlParams.q;
                this.updateClearButton();
                // 延迟执行搜索，确保页面加载完成
                setTimeout(() => this.performSearch(), 100);
            }
        }
    }    onViewActivated() {
        // 搜索视图激活时的处理
        this.updateClearButton();
        
        // 如果有URL参数，执行搜索
        const urlParams = window.router.getQueryParams();
        if (urlParams.q) {
            const searchInput = document.getElementById('searchInput');
            if (searchInput && searchInput.value !== urlParams.q) {
                searchInput.value = urlParams.q;
                this.performSearch();
            }
        }
    }

    async performSearch() {
        const searchInput = document.getElementById('searchInput');
        const query = searchInput.value.trim();

        if (!query) {
            window.ui.showToast('请输入搜索内容', 'info');
            return;
        }

        if (this.selectedAPIs.length === 0) {
            window.ui.showToast('请先在设置中选择API源', 'warning');
            window.router.navigate('settings');
            return;
        }

        // 检查密码保护
        if (window.passwordManager && !window.passwordManager.isVerified()) {
            window.passwordManager.showModal();
            return;
        }

        // 取消之前的搜索
        if (this.abortController) {
            this.abortController.abort();
        }
        this.abortController = new AbortController();

        this.isSearching = true;
        window.ui.showLoading('搜索中...');

        try {
            // 更新URL
            window.router.updateQuery({ q: query });

            // 保存搜索历史
            this.saveSearchHistory(query);

            // 执行搜索
            const searchPromises = this.selectedAPIs.map(apiId => 
                this.searchByAPI(apiId, query)
            );

            const resultsArray = await Promise.all(searchPromises);
            
            // 合并结果
            let allResults = [];
            resultsArray.forEach(results => {
                if (Array.isArray(results) && results.length > 0) {
                    allResults = allResults.concat(results);
                }
            });

            // 排序结果
            allResults.sort((a, b) => {
                const nameCompare = (a.vod_name || '').localeCompare(b.vod_name || '');
                if (nameCompare !== 0) return nameCompare;
                return (a.source_name || '').localeCompare(b.source_name || '');
            });

            // 过滤黄色内容
            if (localStorage.getItem('yellowFilterEnabled') === 'true') {
                allResults = this.filterAdultContent(allResults);
            }

            this.displayResults(allResults, query);

        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('搜索错误:', error);
                window.ui.showToast('搜索失败，请稍后重试', 'error');
            }
        } finally {
            this.isSearching = false;
            window.ui.hideLoading();
        }
    }

    async searchByAPI(apiId, query) {
        try {
            let apiUrl, apiName;
            
            if (apiId.startsWith('custom_')) {
                const customIndex = apiId.replace('custom_', '');
                const customApi = this.customAPIs[customIndex];
                if (!customApi) return [];
                
                apiUrl = customApi.url + API_CONFIG.search.path + encodeURIComponent(query);
                apiName = customApi.name;
            } else {
                if (!API_SITES[apiId]) return [];
                apiUrl = API_SITES[apiId].api + API_CONFIG.search.path + encodeURIComponent(query);
                apiName = API_SITES[apiId].name;
            }

            const response = await fetch(PROXY_URL + encodeURIComponent(apiUrl), {
                headers: API_CONFIG.search.headers,
                signal: this.abortController.signal
            });

            if (!response.ok) return [];

            const data = await response.json();
            if (!data || !Array.isArray(data.list)) return [];

            // 添加源信息
            return data.list.map(item => ({
                ...item,
                source_name: apiName,
                source_code: apiId,
                api_url: apiUrl
            }));

        } catch (error) {
            if (error.name !== 'AbortError') {
                console.warn(`API ${apiId} 搜索失败:`, error);
            }
            return [];
        }
    }

    displayResults(results, query) {
        const resultsArea = document.getElementById('resultsArea');
        const searchArea = document.getElementById('searchArea');
        const resultsDiv = document.getElementById('results');
        const searchResultsCount = document.getElementById('searchResultsCount');

        if (!results || results.length === 0) {
            resultsDiv.innerHTML = `
                <div class="col-span-full text-center py-16">
                    <svg class="mx-auto h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 class="mt-2 text-lg font-medium text-gray-400">没有找到匹配的结果</h3>
                    <p class="mt-1 text-sm text-gray-500">请尝试其他关键词或更换数据源</p>
                </div>
            `;
        } else {
            const resultsHtml = results.map(item => this.createResultCard(item)).join('');
            resultsDiv.innerHTML = resultsHtml;
        }

        // 更新计数
        if (searchResultsCount) {
            searchResultsCount.textContent = results.length;
        }

        // 显示结果区域
        searchArea.classList.add('compact');
        resultsArea.classList.remove('hidden');

        // 更新搜索历史
        this.renderSearchHistory();
    }

    createResultCard(item) {
        const safeId = item.vod_id ? item.vod_id.toString().replace(/[^\w-]/g, '') : '';
        const safeName = (item.vod_name || '').toString()
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
        
        const sourceInfo = item.source_name ? 
            `<span class="bg-[#222] text-xs px-1.5 py-0.5 rounded-full">${item.source_name}</span>` : '';
        
        const hasCover = item.vod_pic && item.vod_pic.startsWith('http');
        
        return `
            <div class="card-hover bg-[#111] rounded-lg overflow-hidden cursor-pointer transition-all hover:scale-[1.02] h-full shadow-sm hover:shadow-md" 
                 onclick="window.search.showDetails('${safeId}','${safeName}','${item.source_code}')">
                <div class="flex h-full">
                    ${hasCover ? `
                    <div class="relative flex-shrink-0 w-32 h-48">
                        <img src="${item.vod_pic}" alt="${safeName}" 
                             class="h-full w-full object-cover transition-transform hover:scale-110" 
                             onerror="this.onerror=null; this.src='image/nomedia.png'; this.classList.add('object-contain');" 
                             loading="lazy">
                        <div class="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent"></div>
                    </div>` : ''}
                    
                    <div class="p-4 flex flex-col flex-grow">
                        <div class="flex-grow">
                            <h3 class="font-semibold mb-2 line-clamp-2 ${hasCover ? '' : 'text-center'}" title="${safeName}">${safeName}</h3>
                            
                            <div class="flex flex-wrap ${hasCover ? '' : 'justify-center'} gap-1 mb-2">
                                ${item.type_name ? 
                                    `<span class="text-xs py-0.5 px-1.5 rounded bg-opacity-20 bg-blue-500 text-blue-300">
                                        ${item.type_name.replace(/</g, '&lt;')}
                                    </span>` : ''}
                                ${item.vod_year ? 
                                    `<span class="text-xs py-0.5 px-1.5 rounded bg-opacity-20 bg-purple-500 text-purple-300">
                                        ${item.vod_year}
                                    </span>` : ''}
                            </div>
                            
                            <p class="text-gray-400 line-clamp-2 ${hasCover ? '' : 'text-center'} mb-2">
                                ${(item.vod_remarks || '暂无介绍').toString().replace(/</g, '&lt;')}
                            </p>
                        </div>
                        
                        <div class="flex justify-between items-center mt-1 pt-1 border-t border-gray-800">
                            ${sourceInfo ? `<div>${sourceInfo}</div>` : '<div></div>'}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async showDetails(id, vodName, sourceCode) {
        window.ui.showLoading('获取详情中...');
        
        try {
            // 构建详情API URL
            let detailUrl;
            if (sourceCode.startsWith('custom_')) {
                const customIndex = sourceCode.replace('custom_', '');
                const customApi = this.customAPIs[customIndex];
                if (!customApi) throw new Error('自定义API配置无效');
                detailUrl = customApi.url + API_CONFIG.detail.path + id;
            } else {
                if (!API_SITES[sourceCode]) throw new Error('API源不存在');
                detailUrl = API_SITES[sourceCode].api + API_CONFIG.detail.path + id;
            }

            const response = await fetch(PROXY_URL + encodeURIComponent(detailUrl), {
                headers: API_CONFIG.detail.headers
            });

            if (!response.ok) throw new Error('获取详情失败');

            const data = await response.json();
            if (!data || !data.list || !data.list[0]) {
                throw new Error('详情数据无效');
            }

            this.displayDetails(data.list[0], sourceCode);

        } catch (error) {
            console.error('获取详情错误:', error);
            window.ui.showToast('获取详情失败', 'error');
        } finally {
            window.ui.hideLoading();
        }
    }

    displayDetails(detail, sourceCode) {
        const modal = document.getElementById('modal');
        const modalContent = document.getElementById('modalContent');

        const episodes = this.parseEpisodes(detail.vod_play_url || '');
        
        modalContent.innerHTML = `
            <div class="flex flex-col md:flex-row gap-6">
                ${detail.vod_pic ? `
                <div class="flex-shrink-0">
                    <img src="${detail.vod_pic}" alt="${detail.vod_name}" 
                         class="w-full md:w-48 h-auto rounded-lg object-cover"
                         onerror="this.style.display='none'">
                </div>` : ''}
                
                <div class="flex-1">
                    <h3 class="text-xl font-bold mb-3">${detail.vod_name}</h3>
                    
                    <div class="grid grid-cols-2 gap-2 text-sm mb-4">
                        ${detail.type_name ? `<p><span class="text-gray-400">类型:</span> ${detail.type_name}</p>` : ''}
                        ${detail.vod_year ? `<p><span class="text-gray-400">年份:</span> ${detail.vod_year}</p>` : ''}
                        ${detail.vod_area ? `<p><span class="text-gray-400">地区:</span> ${detail.vod_area}</p>` : ''}
                        ${detail.vod_director ? `<p><span class="text-gray-400">导演:</span> ${detail.vod_director}</p>` : ''}
                        ${detail.vod_actor ? `<p><span class="text-gray-400">演员:</span> ${detail.vod_actor}</p>` : ''}
                    </div>
                    
                    ${detail.vod_content ? `
                    <div class="mb-4">
                        <h4 class="text-sm font-medium text-gray-400 mb-2">剧情简介</h4>
                        <p class="text-sm text-gray-300 leading-relaxed">${detail.vod_content}</p>
                    </div>` : ''}
                    
                    ${episodes.length > 0 ? `
                    <div>
                        <h4 class="text-sm font-medium text-gray-400 mb-2">选集播放</h4>
                        <div class="grid grid-cols-4 md:grid-cols-6 gap-2 max-h-40 overflow-y-auto">
                            ${episodes.map((episode, index) => `
                                <button onclick="window.search.playEpisode('${detail.vod_name}', '${sourceCode}', '${detail.vod_id}', ${index})"
                                        class="px-3 py-2 bg-[#222] hover:bg-[#00ccff] hover:text-black border border-[#333] rounded text-sm transition-colors">
                                    第${index + 1}集
                                </button>
                            `).join('')}
                        </div>
                    </div>` : ''}
                </div>
            </div>
        `;

        modal.classList.remove('hidden');
    }

    parseEpisodes(playUrl) {
        if (!playUrl) return [];
        
        try {
            const sources = playUrl.split('$$$');
            if (sources.length === 0) return [];
            
            const episodes = sources[0].split('#');
            return episodes.map(ep => {
                const parts = ep.split('$');
                return parts.length > 1 ? parts[1] : '';
            }).filter(url => url && url.startsWith('http'));
        } catch (e) {
            return [];
        }
    }

    playEpisode(title, sourceCode, vodId, episodeIndex) {
        // 关闭详情弹窗
        document.getElementById('modal').classList.add('hidden');
        
        // 构建播放器URL参数
        const params = new URLSearchParams({
            title: title,
            source: sourceCode,
            id: vodId,
            index: episodeIndex
        });
        
        // 跳转到播放器界面
        window.router.navigate(`player?${params.toString()}`);
    }

    filterAdultContent(results) {
        const bannedKeywords = ['伦理片', '福利', '里番动漫', '门事件', '萝莉少女', '制服诱惑', 
                               '国产传媒', 'cosplay', '黑丝诱惑', '无码', '日本无码', '有码', 
                               '日本有码', 'SWAG', '网红主播', '色情片', '同性片', '福利视频', '福利片'];
        
        return results.filter(item => {
            const typeName = item.type_name || '';
            return !bannedKeywords.some(keyword => typeName.includes(keyword));
        });
    }

    showSearchArea() {
        const resultsArea = document.getElementById('resultsArea');
        const searchArea = document.getElementById('searchArea');
        
        resultsArea.classList.add('hidden');
        searchArea.classList.remove('compact');
        
        // 清除URL查询参数
        window.router.updateQuery({ q: '' });
    }

    clearSearch() {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.value = '';
            this.updateClearButton();
            this.showSearchArea();
        }
    }

    updateClearButton() {
        const searchInput = document.getElementById('searchInput');
        const clearBtn = document.getElementById('clearBtn');
        
        if (searchInput && clearBtn) {
            if (searchInput.value.trim()) {
                clearBtn.classList.remove('hidden');
            } else {
                clearBtn.classList.add('hidden');
            }
        }
    }

    // 搜索历史相关方法
    getSearchHistory() {
        try {
            const data = localStorage.getItem(SEARCH_HISTORY_KEY);
            if (!data) return [];
            
            const parsed = JSON.parse(data);
            if (!Array.isArray(parsed)) return [];
            
            return parsed.map(item => {
                if (typeof item === 'string') {
                    return { text: item, timestamp: 0 };
                }
                return item;
            }).filter(item => item && item.text);
        } catch (e) {
            return [];
        }
    }

    saveSearchHistory(query) {
        if (!query || !query.trim()) return;
        
        query = query.trim().substring(0, 50);
        let history = this.getSearchHistory();
        
        // 移除重复项
        history = history.filter(item => item.text !== query);
        
        // 添加到开头
        history.unshift({
            text: query,
            timestamp: Date.now()
        });
        
        // 限制数量
        if (history.length > MAX_HISTORY_ITEMS) {
            history = history.slice(0, MAX_HISTORY_ITEMS);
        }
        
        try {
            localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
            this.searchHistory = history;
        } catch (e) {
            console.error('保存搜索历史失败:', e);
        }
    }

    renderSearchHistory() {
        const historyContainer = document.getElementById('searchHistory');
        if (!historyContainer) return;
        
        const history = this.getSearchHistory();
        
        if (history.length === 0) {
            historyContainer.innerHTML = '<p class="text-sm text-gray-500">暂无搜索历史</p>';
            return;
        }
        
        historyContainer.innerHTML = history.map(item => `
            <button onclick="window.search.searchFromHistory('${item.text.replace(/'/g, "\\'")}')"
                    class="px-3 py-1 bg-[#222] hover:bg-[#333] text-sm rounded-full border border-[#333] transition-colors">
                ${item.text}
            </button>
        `).join('');
    }

    searchFromHistory(query) {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.value = query;
            this.updateClearButton();
            this.performSearch();
        }
    }

    clearSearchHistory() {
        if (!confirm('确定要清空搜索历史吗？')) return;
        
        try {
            localStorage.removeItem('searchHistory');
            this.searchHistory = [];
            this.renderSearchHistory();
            window.ui.showToast('搜索历史已清空', 'success');
        } catch (e) {
            window.ui.showToast('清空失败', 'error');
        }
    }
}

// 搜索组件将在主初始化脚本中创建
