// LibreTV V2.0 API工具类
class APIUtils {
    constructor() {
        this.proxyUrl = PROXY_URL;
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5分钟缓存
    }

    // 构建API URL
    buildApiUrl(baseUrl, params = {}) {
        try {
            const url = new URL(baseUrl);
            Object.keys(params).forEach(key => {
                if (params[key] !== undefined && params[key] !== null) {
                    url.searchParams.set(key, params[key]);
                }
            });
            return url.toString();
        } catch (error) {
            console.error('构建API URL失败:', error);
            return baseUrl;
        }
    }

    // 获取代理URL
    getProxyUrl(targetUrl) {
        try {
            // 移除协议前缀
            const cleanUrl = targetUrl.replace(/^https?:\/\//, '');
            return `${this.proxyUrl}${encodeURIComponent(cleanUrl)}`;
        } catch (error) {
            console.error('构建代理URL失败:', error);
            return targetUrl;
        }
    }

    // 通用HTTP请求方法
    async request(url, options = {}) {
        const defaultOptions = {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (compatible; LibreTV/2.0)'
            },
            timeout: 10000,
            ...options
        };

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), defaultOptions.timeout);

            const response = await fetch(url, {
                ...defaultOptions,
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const contentType = response.headers.get('content-type');
            if (contentType?.includes('application/json')) {
                return await response.json();
            } else {
                return await response.text();
            }

        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('请求超时');
            }
            throw error;
        }
    }

    // 带缓存的请求
    async requestWithCache(url, options = {}, cacheKey = null) {
        const key = cacheKey || url;
        const cached = this.cache.get(key);

        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }

        try {
            const data = await this.request(url, options);
            this.cache.set(key, {
                data,
                timestamp: Date.now()
            });
            return data;
        } catch (error) {
            // 如果有缓存数据，在请求失败时返回缓存
            if (cached) {
                console.warn('请求失败，返回缓存数据:', error);
                return cached.data;
            }
            throw error;
        }
    }

    // 搜索视频
    async searchVideos(query, apiList = [], page = 1) {
        if (!query.trim()) {
            throw new Error('搜索关键词不能为空');
        }

        if (apiList.length === 0) {
            throw new Error('没有可用的API源');
        }

        const results = [];
        const errors = [];

        // 并行请求所有API
        const promises = apiList.map(async (apiId) => {
            try {
                const apiInfo = this.getApiInfo(apiId);
                if (!apiInfo) {
                    throw new Error(`API ${apiId} 不存在`);
                }

                const searchUrl = this.buildSearchUrl(apiInfo, query, page);
                const proxyUrl = this.getProxyUrl(searchUrl);
                
                const data = await this.request(proxyUrl);
                const parsedData = this.parseApiResponse(data);
                
                // 为每个结果添加来源信息
                parsedData.list?.forEach(item => {
                    item.source = apiInfo.name;
                    item.sourceId = apiId;
                });

                return parsedData.list || [];
            } catch (error) {
                errors.push({ apiId, error: error.message });
                return [];
            }
        });

        const allResults = await Promise.all(promises);
        
        // 合并所有结果
        allResults.forEach(apiResults => {
            results.push(...apiResults);
        });

        return {
            list: results,
            total: results.length,
            page,
            errors
        };
    }

    // 获取API信息
    getApiInfo(apiId) {
        if (apiId.startsWith('custom_')) {
            const index = parseInt(apiId.replace('custom_', ''));
            const customAPIs = JSON.parse(localStorage.getItem('customAPIs') || '[]');
            return customAPIs[index];
        } else {
            return API_SITES[apiId];
        }
    }

    // 构建搜索URL
    buildSearchUrl(apiInfo, query, page = 1) {
        const baseUrl = apiInfo.api;
        const searchPath = '/api.php/provide/vod';
        
        const params = {
            ac: 'videolist',
            wd: query
        };

        if (page > 1) {
            params.pg = page;
        }

        return this.buildApiUrl(`${baseUrl}${searchPath}`, params);
    }

    // 解析API响应
    parseApiResponse(data) {
        try {
            if (typeof data === 'string') {
                data = JSON.parse(data);
            }

            if (data && data.list) {
                return data;
            } else if (data && Array.isArray(data)) {
                return { list: data };
            } else {
                return { list: [] };
            }
        } catch (error) {
            console.error('解析API响应失败:', error);
            return { list: [] };
        }
    }

    // 获取视频详情
    async getVideoDetail(apiId, videoId) {
        try {
            const apiInfo = this.getApiInfo(apiId);
            if (!apiInfo) {
                throw new Error('API不存在');
            }

            const detailUrl = this.buildApiUrl(`${apiInfo.api}/api.php/provide/vod`, {
                ac: 'videolist',
                ids: videoId
            });

            const proxyUrl = this.getProxyUrl(detailUrl);
            const data = await this.request(proxyUrl);
            const parsedData = this.parseApiResponse(data);

            return parsedData.list?.[0] || null;
        } catch (error) {
            console.error('获取视频详情失败:', error);
            throw error;
        }
    }

    // 获取播放地址
    async getPlayUrls(videoDetail) {
        try {
            if (!videoDetail || !videoDetail.vod_play_url) {
                throw new Error('无播放地址');
            }

            const playUrls = {};
            const urlSets = videoDetail.vod_play_url.split('$$$');
            
            urlSets.forEach((urlSet, index) => {
                if (urlSet.trim()) {
                    const episodes = [];
                    const urlPairs = urlSet.split('#');
                    
                    urlPairs.forEach(pair => {
                        const [name, url] = pair.split('$');
                        if (name && url) {
                            episodes.push({
                                name: name.trim(),
                                url: url.trim()
                            });
                        }
                    });

                    if (episodes.length > 0) {
                        playUrls[`播放组${index + 1}`] = episodes;
                    }
                }
            });

            return playUrls;
        } catch (error) {
            console.error('解析播放地址失败:', error);
            return {};
        }
    }

    // 验证URL有效性
    isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }

    // 清除缓存
    clearCache() {
        this.cache.clear();
    }

    // 清除过期缓存
    clearExpiredCache() {
        const now = Date.now();
        for (const [key, value] of this.cache.entries()) {
            if (now - value.timestamp > this.cacheTimeout) {
                this.cache.delete(key);
            }
        }
    }

    // 获取缓存统计
    getCacheStats() {
        return {
            size: this.cache.size,
            timeout: this.cacheTimeout
        };
    }
}

// 创建全局API工具实例
window.api = new APIUtils();
