// LibreTV V2.0 设置组件
class SettingsComponent {
    constructor() {
        this.selectedAPIs = [];
        this.customAPIs = [];
        this.settings = {};
        this.init();
    }

    init() {
        this.loadSettings();
        this.bindEvents();
        
        // 监听视图激活
        window.addEventListener('viewActivated', (e) => {
            if (e.detail.viewId === 'settingsView') {
                this.onViewActivated();
            }
        });
    }

    loadSettings() {
        // 加载API设置
        this.selectedAPIs = JSON.parse(localStorage.getItem('selectedAPIs') || '["tyyszy","dyttzy", "bfzy", "ruyi"]');
        this.customAPIs = JSON.parse(localStorage.getItem('customAPIs') || '[]');
        
        // 加载其他设置
        this.settings = {
            yellowFilterEnabled: localStorage.getItem('yellowFilterEnabled') === 'true',
            adFilteringEnabled: localStorage.getItem('adFilteringEnabled') !== 'false', // 默认开启
            doubanEnabled: localStorage.getItem('doubanEnabled') !== 'false' // 默认开启
        };
    }

    bindEvents() {
        // API批量操作按钮
        const selectAllBtn = document.getElementById('selectAllBtn');
        const selectNoneBtn = document.getElementById('selectNoneBtn');
        const selectNormalBtn = document.getElementById('selectNormalBtn');
        
        if (selectAllBtn) selectAllBtn.addEventListener('click', () => this.selectAllAPIs(true));
        if (selectNoneBtn) selectNoneBtn.addEventListener('click', () => this.selectAllAPIs(false));
        if (selectNormalBtn) selectNormalBtn.addEventListener('click', () => this.selectAllAPIs(true, true));

        // 添加自定义API按钮
        const addCustomApiBtn = document.getElementById('addCustomApiBtn');
        if (addCustomApiBtn) {
            addCustomApiBtn.addEventListener('click', () => this.showAddCustomApiModal());
        }

        // 设置开关
        const yellowFilterToggle = document.getElementById('yellowFilterToggle');
        const adFilterToggle = document.getElementById('adFilterToggle');
        const doubanToggle = document.getElementById('doubanToggle');

        if (yellowFilterToggle) {
            yellowFilterToggle.addEventListener('change', (e) => {
                this.updateSetting('yellowFilterEnabled', e.target.checked);
                this.renderAPICheckboxes(); // 重新渲染以显示/隐藏成人API
            });
        }

        if (adFilterToggle) {
            adFilterToggle.addEventListener('change', (e) => {
                this.updateSetting('adFilteringEnabled', e.target.checked);
            });
        }

        if (doubanToggle) {
            doubanToggle.addEventListener('change', (e) => {
                this.updateSetting('doubanEnabled', e.target.checked);
            });
        }

        // 配置管理按钮
        const exportConfigBtn = document.getElementById('exportConfigBtn');
        const importConfigBtn = document.getElementById('importConfigBtn');

        if (exportConfigBtn) exportConfigBtn.addEventListener('click', () => this.exportConfig());
        if (importConfigBtn) importConfigBtn.addEventListener('click', () => this.importConfig());
    }

    onViewActivated() {
        this.renderAPICheckboxes();
        this.renderCustomAPIsList();
        this.updateToggleStates();
        this.updateSelectedApiCount();
    }

    renderAPICheckboxes() {
        const container = document.getElementById('apiCheckboxes');
        if (!container) return;

        let html = '';

        // 普通API组
        html += '<div class="mb-4">';
        html += '<h4 class="text-sm font-medium text-gray-400 mb-2 border-b border-[#333] pb-1">普通资源</h4>';
        html += '<div class="grid grid-cols-2 gap-2">';
        
        Object.keys(API_SITES).forEach(apiKey => {
            const api = API_SITES[apiKey];
            if (api.adult) return; // 跳过成人内容

            const checked = this.selectedAPIs.includes(apiKey);
            html += this.createCheckboxHtml(apiKey, api.name, checked);
        });
        
        html += '</div></div>';

        // 成人API组（仅在黄色内容过滤关闭时显示）
        if (!this.settings.yellowFilterEnabled && !HIDE_BUILTIN_ADULT_APIS) {
            const adultAPIs = Object.keys(API_SITES).filter(key => API_SITES[key].adult);
            
            if (adultAPIs.length > 0) {
                html += '<div class="mb-4">';
                html += '<h4 class="text-sm font-medium text-pink-400 mb-2 border-b border-pink-400/30 pb-1">成人资源 (18+)</h4>';
                html += '<div class="grid grid-cols-2 gap-2">';
                
                adultAPIs.forEach(apiKey => {
                    const api = API_SITES[apiKey];
                    const checked = this.selectedAPIs.includes(apiKey);
                    html += this.createCheckboxHtml(apiKey, api.name, checked, true);
                });
                
                html += '</div></div>';
            }
        }

        container.innerHTML = html;

        // 绑定复选框事件
        container.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', () => this.updateSelectedAPIs());
        });
    }

    createCheckboxHtml(apiKey, apiName, checked, isAdult = false) {
        const textColor = isAdult ? 'text-pink-400' : 'text-white';
        return `
            <div class="checkbox-container">
                <label class="flex items-center cursor-pointer">
                    <input type="checkbox" data-api="${apiKey}" ${checked ? 'checked' : ''} 
                           class="mr-2 accent-[#00ccff]">
                    <span class="${textColor} text-sm">${apiName}</span>
                    ${isAdult ? '<span class="ml-1 text-xs text-pink-400">(18+)</span>' : ''}
                </label>
            </div>
        `;
    }

    renderCustomAPIsList() {
        const container = document.getElementById('customApisList');
        if (!container) return;

        if (this.customAPIs.length === 0) {
            container.innerHTML = '<p class="text-sm text-gray-500 text-center py-4">暂无自定义API</p>';
            return;
        }

        container.innerHTML = this.customAPIs.map((api, index) => `
            <div class="flex items-center justify-between p-3 bg-[#222] rounded-lg">
                <div class="flex-1 min-w-0">
                    <div class="flex items-center">
                        <input type="checkbox" data-custom-index="${index}" 
                               ${this.selectedAPIs.includes(`custom_${index}`) ? 'checked' : ''} 
                               class="mr-3 accent-[#00ccff]">
                        <div class="min-w-0 flex-1">
                            <p class="font-medium truncate ${api.isAdult ? 'text-pink-400' : 'text-white'}">
                                ${api.name}
                                ${api.isAdult ? '<span class="text-xs ml-1">(18+)</span>' : ''}
                            </p>
                            <p class="text-xs text-gray-400 truncate">${api.url}</p>
                            ${api.detail ? `<p class="text-xs text-gray-500 truncate">详情: ${api.detail}</p>` : ''}
                        </div>
                    </div>
                </div>
                <div class="flex items-center space-x-2 ml-3">
                    <button onclick="window.settings.editCustomApi(${index})" 
                            class="p-1 text-gray-400 hover:text-white">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                        </svg>
                    </button>
                    <button onclick="window.settings.removeCustomApi(${index})" 
                            class="p-1 text-red-400 hover:text-red-300">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                    </button>
                </div>
            </div>
        `).join('');

        // 绑定自定义API复选框事件
        container.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', () => this.updateSelectedAPIs());
        });
    }

    updateSelectedAPIs() {
        // 获取选中的内置API
        const builtInCheckboxes = document.querySelectorAll('#apiCheckboxes input[type="checkbox"]:checked');
        const builtInApis = Array.from(builtInCheckboxes).map(cb => cb.dataset.api);

        // 获取选中的自定义API
        const customCheckboxes = document.querySelectorAll('#customApisList input[type="checkbox"]:checked');
        const customApis = Array.from(customCheckboxes).map(cb => `custom_${cb.dataset.customIndex}`);

        // 合并并保存
        this.selectedAPIs = [...builtInApis, ...customApis];
        localStorage.setItem('selectedAPIs', JSON.stringify(this.selectedAPIs));

        this.updateSelectedApiCount();
    }

    updateSelectedApiCount() {
        const countEl = document.getElementById('selectedApiCount');
        if (countEl) {
            countEl.textContent = this.selectedAPIs.length;
        }
    }

    selectAllAPIs(selectAll = true, excludeAdult = false) {
        const checkboxes = document.querySelectorAll('#apiCheckboxes input[type="checkbox"], #customApisList input[type="checkbox"]');
        
        checkboxes.forEach(checkbox => {
            if (excludeAdult) {
                // 只选择普通资源
                const apiKey = checkbox.dataset.api;
                if (apiKey && API_SITES[apiKey] && API_SITES[apiKey].adult) {
                    checkbox.checked = false;
                    return;
                }
                
                // 检查自定义API是否是成人内容
                if (checkbox.dataset.customIndex !== undefined) {
                    const index = parseInt(checkbox.dataset.customIndex);
                    if (this.customAPIs[index] && this.customAPIs[index].isAdult) {
                        checkbox.checked = false;
                        return;
                    }
                }
            }
            
            checkbox.checked = selectAll;
        });

        this.updateSelectedAPIs();
    }

    showAddCustomApiModal() {
        const modal = document.getElementById('modal');
        const modalContent = document.getElementById('modalContent');

        modalContent.innerHTML = `
            <div class="space-y-4">
                <h3 class="text-lg font-semibold mb-4">添加自定义API</h3>
                
                <div>
                    <label class="block text-sm font-medium mb-2">API名称</label>
                    <input type="text" id="customApiName" placeholder="请输入API名称" 
                           class="w-full px-3 py-2 bg-[#222] border border-[#333] rounded-lg">
                </div>
                
                <div>
                    <label class="block text-sm font-medium mb-2">API地址</label>
                    <input type="text" id="customApiUrl" placeholder="https://example.com/api.php/provide/vod" 
                           class="w-full px-3 py-2 bg-[#222] border border-[#333] rounded-lg">
                    <p class="text-xs text-gray-400 mt-1">请输入完整的API基础地址</p>
                </div>
                
                <div>
                    <label class="block text-sm font-medium mb-2">详情地址（可选）</label>
                    <input type="text" id="customApiDetail" placeholder="https://example.com" 
                           class="w-full px-3 py-2 bg-[#222] border border-[#333] rounded-lg">
                    <p class="text-xs text-gray-400 mt-1">用于特殊源的详情页面地址</p>
                </div>
                
                <div class="flex items-center">
                    <input type="checkbox" id="customApiIsAdult" class="mr-2 accent-[#00ccff]">
                    <label for="customApiIsAdult" class="text-sm">成人内容 (18+)</label>
                </div>
                
                <div class="flex justify-end space-x-3 pt-4">
                    <button onclick="document.getElementById('modal').classList.add('hidden')" 
                            class="px-4 py-2 bg-[#333] hover:bg-[#444] rounded-lg transition-colors">
                        取消
                    </button>
                    <button onclick="window.settings.addCustomApi()" 
                            class="px-4 py-2 bg-[#00ccff] hover:bg-[#33d6ff] text-black rounded-lg transition-colors">
                        添加
                    </button>
                </div>
            </div>
        `;

        modal.classList.remove('hidden');
    }

    addCustomApi() {
        const name = document.getElementById('customApiName').value.trim();
        const url = document.getElementById('customApiUrl').value.trim();
        const detail = document.getElementById('customApiDetail').value.trim();
        const isAdult = document.getElementById('customApiIsAdult').checked;

        if (!name || !url) {
            window.ui.showToast('请输入API名称和地址', 'warning');
            return;
        }

        if (!/^https?:\/\/.+/.test(url)) {
            window.ui.showToast('API地址格式不正确', 'warning');
            return;
        }

        // 移除URL末尾的斜杠
        const cleanUrl = url.endsWith('/') ? url.slice(0, -1) : url;

        const newApi = {
            name,
            url: cleanUrl,
            detail: detail || '',
            isAdult
        };

        this.customAPIs.push(newApi);
        localStorage.setItem('customAPIs', JSON.stringify(this.customAPIs));

        // 自动选中新添加的API
        const newApiIndex = this.customAPIs.length - 1;
        this.selectedAPIs.push(`custom_${newApiIndex}`);
        localStorage.setItem('selectedAPIs', JSON.stringify(this.selectedAPIs));

        // 关闭模态框并重新渲染
        document.getElementById('modal').classList.add('hidden');
        this.renderCustomAPIsList();
        this.updateSelectedApiCount();

        window.ui.showToast(`已添加API: ${name}`, 'success');
    }

    editCustomApi(index) {
        const api = this.customAPIs[index];
        if (!api) return;

        const modal = document.getElementById('modal');
        const modalContent = document.getElementById('modalContent');

        modalContent.innerHTML = `
            <div class="space-y-4">
                <h3 class="text-lg font-semibold mb-4">编辑自定义API</h3>
                
                <div>
                    <label class="block text-sm font-medium mb-2">API名称</label>
                    <input type="text" id="editApiName" value="${api.name}" 
                           class="w-full px-3 py-2 bg-[#222] border border-[#333] rounded-lg">
                </div>
                
                <div>
                    <label class="block text-sm font-medium mb-2">API地址</label>
                    <input type="text" id="editApiUrl" value="${api.url}" 
                           class="w-full px-3 py-2 bg-[#222] border border-[#333] rounded-lg">
                </div>
                
                <div>
                    <label class="block text-sm font-medium mb-2">详情地址（可选）</label>
                    <input type="text" id="editApiDetail" value="${api.detail || ''}" 
                           class="w-full px-3 py-2 bg-[#222] border border-[#333] rounded-lg">
                </div>
                
                <div class="flex items-center">
                    <input type="checkbox" id="editApiIsAdult" ${api.isAdult ? 'checked' : ''} class="mr-2 accent-[#00ccff]">
                    <label for="editApiIsAdult" class="text-sm">成人内容 (18+)</label>
                </div>
                
                <div class="flex justify-end space-x-3 pt-4">
                    <button onclick="document.getElementById('modal').classList.add('hidden')" 
                            class="px-4 py-2 bg-[#333] hover:bg-[#444] rounded-lg transition-colors">
                        取消
                    </button>
                    <button onclick="window.settings.updateCustomApi(${index})" 
                            class="px-4 py-2 bg-[#00ccff] hover:bg-[#33d6ff] text-black rounded-lg transition-colors">
                        保存
                    </button>
                </div>
            </div>
        `;

        modal.classList.remove('hidden');
    }

    updateCustomApi(index) {
        const name = document.getElementById('editApiName').value.trim();
        const url = document.getElementById('editApiUrl').value.trim();
        const detail = document.getElementById('editApiDetail').value.trim();
        const isAdult = document.getElementById('editApiIsAdult').checked;

        if (!name || !url) {
            window.ui.showToast('请输入API名称和地址', 'warning');
            return;
        }

        if (!/^https?:\/\/.+/.test(url)) {
            window.ui.showToast('API地址格式不正确', 'warning');
            return;
        }

        const cleanUrl = url.endsWith('/') ? url.slice(0, -1) : url;

        this.customAPIs[index] = {
            name,
            url: cleanUrl,
            detail: detail || '',
            isAdult
        };

        localStorage.setItem('customAPIs', JSON.stringify(this.customAPIs));

        document.getElementById('modal').classList.add('hidden');
        this.renderCustomAPIsList();

        window.ui.showToast('API已更新', 'success');
    }

    removeCustomApi(index) {
        if (!confirm('确定要删除这个API吗？')) return;

        // 从选中列表中移除
        const customApiId = `custom_${index}`;
        this.selectedAPIs = this.selectedAPIs.filter(id => id !== customApiId);
        
        // 更新其他自定义API的索引
        this.selectedAPIs = this.selectedAPIs.map(id => {
            if (id.startsWith('custom_')) {
                const currentIndex = parseInt(id.replace('custom_', ''));
                if (currentIndex > index) {
                    return `custom_${currentIndex - 1}`;
                }
            }
            return id;
        });

        // 从列表中移除
        this.customAPIs.splice(index, 1);

        // 保存更改
        localStorage.setItem('customAPIs', JSON.stringify(this.customAPIs));
        localStorage.setItem('selectedAPIs', JSON.stringify(this.selectedAPIs));

        // 重新渲染
        this.renderCustomAPIsList();
        this.updateSelectedApiCount();

        window.ui.showToast('API已删除', 'success');
    }

    updateToggleStates() {
        const yellowFilterToggle = document.getElementById('yellowFilterToggle');
        const adFilterToggle = document.getElementById('adFilterToggle');
        const doubanToggle = document.getElementById('doubanToggle');

        if (yellowFilterToggle) yellowFilterToggle.checked = this.settings.yellowFilterEnabled;
        if (adFilterToggle) adFilterToggle.checked = this.settings.adFilteringEnabled;
        if (doubanToggle) doubanToggle.checked = this.settings.doubanEnabled;
    }

    updateSetting(key, value) {
        this.settings[key] = value;
        localStorage.setItem(key, value.toString());
        
        if (key === 'yellowFilterEnabled') {
            // 黄色内容过滤改变时，检查是否需要取消选中成人API
            if (value) {
                this.selectedAPIs = this.selectedAPIs.filter(apiId => {
                    if (apiId.startsWith('custom_')) {
                        const index = parseInt(apiId.replace('custom_', ''));
                        return !this.customAPIs[index]?.isAdult;
                    } else {
                        return !API_SITES[apiId]?.adult;
                    }
                });
                localStorage.setItem('selectedAPIs', JSON.stringify(this.selectedAPIs));
            }
        }
    }

    async exportConfig() {
        try {
            const configData = {
                selectedAPIs: this.selectedAPIs,
                customAPIs: this.customAPIs,
                yellowFilterEnabled: this.settings.yellowFilterEnabled,
                adFilteringEnabled: this.settings.adFilteringEnabled,
                doubanEnabled: this.settings.doubanEnabled,
                viewingHistory: JSON.parse(localStorage.getItem('viewingHistory') || '[]'),
                searchHistory: JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY) || '[]')
            };

            // 计算哈希值
            const dataString = JSON.stringify(configData);
            const hash = await this.sha256(dataString);

            const config = {
                name: 'LibreTV-Settings',
                version: '2.0.0',
                timestamp: Date.now(),
                hash: hash,
                data: configData
            };

            // 下载配置文件
            const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `LibreTV-Config-${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            URL.revokeObjectURL(url);

            window.ui.showToast('配置已导出', 'success');

        } catch (error) {
            console.error('导出配置失败:', error);
            window.ui.showToast('导出失败', 'error');
        }
    }

    importConfig() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            try {
                const text = await file.text();
                const config = JSON.parse(text);

                if (config.name !== 'LibreTV-Settings') {
                    throw new Error('配置文件格式不正确');
                }

                // 验证哈希值
                const dataString = JSON.stringify(config.data);
                const hash = await this.sha256(dataString);
                
                if (hash !== config.hash) {
                    throw new Error('配置文件已损坏');
                }

                // 确认导入
                if (!confirm('确定要导入此配置吗？这将覆盖当前设置。')) {
                    return;
                }

                // 导入配置
                const data = config.data;
                
                localStorage.setItem('selectedAPIs', JSON.stringify(data.selectedAPIs || []));
                localStorage.setItem('customAPIs', JSON.stringify(data.customAPIs || []));
                localStorage.setItem('yellowFilterEnabled', data.yellowFilterEnabled?.toString() || 'false');
                localStorage.setItem('adFilteringEnabled', data.adFilteringEnabled?.toString() || 'true');
                localStorage.setItem('doubanEnabled', data.doubanEnabled?.toString() || 'true');
                
                if (data.viewingHistory) {
                    localStorage.setItem('viewingHistory', JSON.stringify(data.viewingHistory));
                }
                
                if (data.searchHistory) {
                    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(data.searchHistory));
                }

                // 重新加载设置
                this.loadSettings();
                this.onViewActivated();

                window.ui.showToast('配置已导入，页面将在3秒后刷新', 'success');
                
                setTimeout(() => {
                    window.location.reload();
                }, 3000);

            } catch (error) {
                console.error('导入配置失败:', error);
                window.ui.showToast('导入失败: ' + error.message, 'error');
            }
        };

        input.click();
    }

    async sha256(message) {
        const msgBuffer = new TextEncoder().encode(message);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // 重置所有设置
    resetAllSettings() {
        if (!confirm('确定要重置所有设置吗？这将清除所有自定义配置。')) {
            return;
        }

        // 清除所有设置
        const keysToRemove = [
            'selectedAPIs', 'customAPIs', 'yellowFilterEnabled', 
            'adFilteringEnabled', 'doubanEnabled', 'viewingHistory', 
            SEARCH_HISTORY_KEY
        ];
        
        keysToRemove.forEach(key => localStorage.removeItem(key));

        window.ui.showToast('设置已重置，页面将刷新', 'success');
        
        setTimeout(() => {
            window.location.reload();
        }, 2000);
    }

    // 获取当前设置摘要
    getSettingsSummary() {
        return {
            selectedAPIs: this.selectedAPIs.length,
            customAPIs: this.customAPIs.length,
            yellowFilter: this.settings.yellowFilterEnabled,
            adFilter: this.settings.adFilteringEnabled,
            douban: this.settings.doubanEnabled
        };
    }
}

// 创建全局设置实例
window.settings = new SettingsComponent();
