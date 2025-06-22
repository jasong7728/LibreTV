// 全局变量
let selectedAPIs = JSON.parse(localStorage.getItem('selectedAPIs') || '["tyyszy","dyttzy", "bfzy", "ruyi"]'); // 默认选中资源
let customAPIs = JSON.parse(localStorage.getItem('customAPIs') || '[]'); // 存储自定义API列表

// 添加当前播放的集数索引
let currentEpisodeIndex = 0;
// 添加当前视频的所有集数
let currentEpisodes = [];
// 添加当前视频的标题
let currentVideoTitle = '';
// 全局变量用于倒序状态
let episodesReversed = false;

// 页面初始化
document.addEventListener('DOMContentLoaded', function () {
    // 初始化API复选框
    initAPICheckboxes();

    // 初始化自定义API列表
    renderCustomAPIsList();

    // 初始化显示选中的API数量
    updateSelectedApiCount();

    // 渲染搜索历史
    renderSearchHistory();

    // 设置默认API选择（如果是第一次加载）
    if (!localStorage.getItem('hasInitializedDefaults')) {
        // 默认选中资源
        selectedAPIs = ["tyyszy", "bfzy", "dyttzy", "ruyi"];
        localStorage.setItem('selectedAPIs', JSON.stringify(selectedAPIs));

        // 默认选中过滤开关
        localStorage.setItem('yellowFilterEnabled', 'true');
        localStorage.setItem(PLAYER_CONFIG.adFilteringStorage, 'true');

        // 默认启用豆瓣功能
        localStorage.setItem('doubanEnabled', 'true');

        // 标记已初始化默认值
        localStorage.setItem('hasInitializedDefaults', 'true');
    }

    // 设置黄色内容过滤器开关初始状态
    const yellowFilterToggle = document.getElementById('yellowFilterToggle');
    if (yellowFilterToggle) {
        yellowFilterToggle.checked = localStorage.getItem('yellowFilterEnabled') === 'true';
    }

    // 设置广告过滤开关初始状态
    const adFilterToggle = document.getElementById('adFilterToggle');
    if (adFilterToggle) {
        adFilterToggle.checked = localStorage.getItem(PLAYER_CONFIG.adFilteringStorage) !== 'false'; // 默认为true
    }

    // 设置事件监听器
    setupEventListeners();

    // 初始检查成人API选中状态
    setTimeout(checkAdultAPIsSelected, 100);
});

// 初始化API复选框
function initAPICheckboxes() {
    const container = document.getElementById('apiCheckboxes');
    container.innerHTML = '';

    // 添加普通API组标题
    const normaldiv = document.createElement('div');
    normaldiv.id = 'normaldiv';
    normaldiv.className = 'grid grid-cols-2 gap-2';
    const normalTitle = document.createElement('div');
    normalTitle.className = 'api-group-title';
    normalTitle.textContent = '普通资源';
    normaldiv.appendChild(normalTitle);

    // 创建普通API源的复选框
    Object.keys(API_SITES).forEach(apiKey => {
        const api = API_SITES[apiKey];
        if (api.adult) return; // 跳过成人内容API，稍后添加

        const checked = selectedAPIs.includes(apiKey);

        const checkbox = document.createElement('div');
        checkbox.className = 'flex items-center';
        checkbox.innerHTML = `
            <input type="checkbox" id="api_${apiKey}" 
                   class="form-checkbox h-3 w-3 text-blue-600 bg-[#222] border border-[#333]" 
                   ${checked ? 'checked' : ''} 
                   data-api="${apiKey}">
            <label for="api_${apiKey}" class="ml-1 text-xs text-gray-400 truncate">${api.name}</label>
        `;
        normaldiv.appendChild(checkbox);

        // 添加事件监听器
        checkbox.querySelector('input').addEventListener('change', function () {
            updateSelectedAPIs();
            checkAdultAPIsSelected();
        });
    });
    container.appendChild(normaldiv);

    // 添加成人API列表
    addAdultAPI();

    // 初始检查成人内容状态
    checkAdultAPIsSelected();
}

// 添加成人API列表
function addAdultAPI() {
    // 仅在隐藏设置为false时添加成人API组
    if (!HIDE_BUILTIN_ADULT_APIS && (localStorage.getItem('yellowFilterEnabled') === 'false')) {
        const container = document.getElementById('apiCheckboxes');

        // 添加成人API组标题
        const adultdiv = document.createElement('div');
        adultdiv.id = 'adultdiv';
        adultdiv.className = 'grid grid-cols-2 gap-2';
        const adultTitle = document.createElement('div');
        adultTitle.className = 'api-group-title adult';
        adultTitle.innerHTML = `黄色资源采集站 <span class="adult-warning">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
        </span>`;
        adultdiv.appendChild(adultTitle);

        // 创建成人API源的复选框
        Object.keys(API_SITES).forEach(apiKey => {
            const api = API_SITES[apiKey];
            if (!api.adult) return; // 仅添加成人内容API

            const checked = selectedAPIs.includes(apiKey);

            const checkbox = document.createElement('div');
            checkbox.className = 'flex items-center';
            checkbox.innerHTML = `
                <input type="checkbox" id="api_${apiKey}" 
                       class="form-checkbox h-3 w-3 text-blue-600 bg-[#222] border border-[#333] api-adult" 
                       ${checked ? 'checked' : ''} 
                       data-api="${apiKey}">
                <label for="api_${apiKey}" class="ml-1 text-xs text-pink-400 truncate">${api.name}</label>
            `;
            adultdiv.appendChild(checkbox);

            // 添加事件监听器
            checkbox.querySelector('input').addEventListener('change', function () {
                updateSelectedAPIs();
                checkAdultAPIsSelected();
            });
        });
        container.appendChild(adultdiv);
    }
}

// 检查是否有成人API被选中
function checkAdultAPIsSelected() {
    // 查找所有内置成人API复选框
    const adultBuiltinCheckboxes = document.querySelectorAll('#apiCheckboxes .api-adult:checked');

    // 查找所有自定义成人API复选框
    const customApiCheckboxes = document.querySelectorAll('#customApisList .api-adult:checked');

    const hasAdultSelected = adultBuiltinCheckboxes.length > 0 || customApiCheckboxes.length > 0;

    const yellowFilterToggle = document.getElementById('yellowFilterToggle');
    const yellowFilterContainer = yellowFilterToggle.closest('div').parentNode;
    const filterDescription = yellowFilterContainer.querySelector('p.filter-description');

    // 如果选择了成人API，禁用黄色内容过滤器
    if (hasAdultSelected) {
        yellowFilterToggle.checked = false;
        yellowFilterToggle.disabled = true;
        localStorage.setItem('yellowFilterEnabled', 'false');

        // 添加禁用样式
        yellowFilterContainer.classList.add('filter-disabled');

        // 修改描述文字
        if (filterDescription) {
            filterDescription.innerHTML = '<strong class="text-pink-300">选中黄色资源站时无法启用此过滤</strong>';
        }

        // 移除提示信息（如果存在）
        const existingTooltip = yellowFilterContainer.querySelector('.filter-tooltip');
        if (existingTooltip) {
            existingTooltip.remove();
        }
    } else {
        // 启用黄色内容过滤器
        yellowFilterToggle.disabled = false;
        yellowFilterContainer.classList.remove('filter-disabled');

        // 恢复原来的描述文字
        if (filterDescription) {
            filterDescription.innerHTML = '过滤"伦理片"等黄色内容';
        }

        // 移除提示信息
        const existingTooltip = yellowFilterContainer.querySelector('.filter-tooltip');
        if (existingTooltip) {
            existingTooltip.remove();
        }
    }
}

// 渲染自定义API列表
function renderCustomAPIsList() {
    const container = document.getElementById('customApisList');
    if (!container) return;

    if (customAPIs.length === 0) {
        container.innerHTML = '<p class="text-xs text-gray-500 text-center my-2">未添加自定义API</p>';
        return;
    }

    container.innerHTML = '';
    customAPIs.forEach((api, index) => {
        const apiItem = document.createElement('div');
        apiItem.className = 'flex items-center justify-between p-1 mb-1 bg-[#222] rounded';
        const textColorClass = api.isAdult ? 'text-pink-400' : 'text-white';
        const adultTag = api.isAdult ? '<span class="text-xs text-pink-400 mr-1">(18+)</span>' : '';
        // 新增 detail 地址显示
        const detailLine = api.detail ? `<div class="text-xs text-gray-400 truncate">detail: ${api.detail}</div>` : '';
        apiItem.innerHTML = `
            <div class="flex items-center flex-1 min-w-0">
                <input type="checkbox" id="custom_api_${index}" 
                       class="form-checkbox h-3 w-3 text-blue-600 mr-1 ${api.isAdult ? 'api-adult' : ''}" 
                       ${selectedAPIs.includes('custom_' + index) ? 'checked' : ''} 
                       data-custom-index="${index}">
                <div class="flex-1 min-w-0">
                    <div class="text-xs font-medium ${textColorClass} truncate">
                        ${adultTag}${api.name}
                    </div>
                    <div class="text-xs text-gray-500 truncate">${api.url}</div>
                    ${detailLine}
                </div>
            </div>
            <div class="flex items-center">
                <button class="text-blue-500 hover:text-blue-700 text-xs px-1" onclick="editCustomApi(${index})">✎</button>
                <button class="text-red-500 hover:text-red-700 text-xs px-1" onclick="removeCustomApi(${index})">✕</button>
            </div>
        `;
        container.appendChild(apiItem);
        apiItem.querySelector('input').addEventListener('change', function () {
            updateSelectedAPIs();
            checkAdultAPIsSelected();
        });
    });
}

// 编辑自定义API
function editCustomApi(index) {
    if (index < 0 || index >= customAPIs.length) return;
    const api = customAPIs[index];
    document.getElementById('customApiName').value = api.name;
    document.getElementById('customApiUrl').value = api.url;
    document.getElementById('customApiDetail').value = api.detail || '';
    const isAdultInput = document.getElementById('customApiIsAdult');
    if (isAdultInput) isAdultInput.checked = api.isAdult || false;
    const form = document.getElementById('addCustomApiForm');
    if (form) {
        form.classList.remove('hidden');
        const buttonContainer = form.querySelector('div:last-child');
        buttonContainer.innerHTML = `
            <button onclick="updateCustomApi(${index})" class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs">更新</button>
            <button onclick="cancelEditCustomApi()" class="bg-[#444] hover:bg-[#555] text-white px-3 py-1 rounded text-xs">取消</button>
        `;
    }
}

// 更新自定义API
function updateCustomApi(index) {
    if (index < 0 || index >= customAPIs.length) return;
    const nameInput = document.getElementById('customApiName');
    const urlInput = document.getElementById('customApiUrl');
    const detailInput = document.getElementById('customApiDetail');
    const isAdultInput = document.getElementById('customApiIsAdult');
    const name = nameInput.value.trim();
    let url = urlInput.value.trim();
    const detail = detailInput ? detailInput.value.trim() : '';
    const isAdult = isAdultInput ? isAdultInput.checked : false;
    if (!name || !url) {
        showToast('请输入API名称和链接', 'warning');
        return;
    }
    if (!/^https?:\/\/.+/.test(url)) {
        showToast('API链接格式不正确，需以http://或https://开头', 'warning');
        return;
    }
    if (url.endsWith('/')) url = url.slice(0, -1);
    // 保存 detail 字段
    customAPIs[index] = { name, url, detail, isAdult };
    localStorage.setItem('customAPIs', JSON.stringify(customAPIs));
    renderCustomAPIsList();
    checkAdultAPIsSelected();
    restoreAddCustomApiButtons();
    nameInput.value = '';
    urlInput.value = '';
    if (detailInput) detailInput.value = '';
    if (isAdultInput) isAdultInput.checked = false;
    document.getElementById('addCustomApiForm').classList.add('hidden');
    showToast('已更新自定义API: ' + name, 'success');
}

// 取消编辑自定义API
function cancelEditCustomApi() {
    // 清空表单
    document.getElementById('customApiName').value = '';
    document.getElementById('customApiUrl').value = '';
    document.getElementById('customApiDetail').value = '';
    const isAdultInput = document.getElementById('customApiIsAdult');
    if (isAdultInput) isAdultInput.checked = false;

    // 隐藏表单
    document.getElementById('addCustomApiForm').classList.add('hidden');

    // 恢复添加按钮
    restoreAddCustomApiButtons();
}

// 恢复自定义API添加按钮
function restoreAddCustomApiButtons() {
    const form = document.getElementById('addCustomApiForm');
    const buttonContainer = form.querySelector('div:last-child');
    buttonContainer.innerHTML = `
        <button onclick="addCustomApi()" class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs">添加</button>
        <button onclick="cancelAddCustomApi()" class="bg-[#444] hover:bg-[#555] text-white px-3 py-1 rounded text-xs">取消</button>
    `;
}

// 更新选中的API列表
function updateSelectedAPIs() {
    // 获取所有内置API复选框
    const builtInApiCheckboxes = document.querySelectorAll('#apiCheckboxes input:checked');

    // 获取选中的内置API
    const builtInApis = Array.from(builtInApiCheckboxes).map(input => input.dataset.api);

    // 获取选中的自定义API
    const customApiCheckboxes = document.querySelectorAll('#customApisList input:checked');
    const customApiIndices = Array.from(customApiCheckboxes).map(input => 'custom_' + input.dataset.customIndex);

    // 合并内置和自定义API
    selectedAPIs = [...builtInApis, ...customApiIndices];

    // 保存到localStorage
    localStorage.setItem('selectedAPIs', JSON.stringify(selectedAPIs));

    // 更新显示选中的API数量
    updateSelectedApiCount();
}

// 更新选中的API数量显示
function updateSelectedApiCount() {
    const countEl = document.getElementById('selectedApiCount');
    if (countEl) {
        countEl.textContent = selectedAPIs.length;
    }
}

// 全选或取消全选API
function selectAllAPIs(selectAll = true, excludeAdult = false) {
    const checkboxes = document.querySelectorAll('#apiCheckboxes input[type="checkbox"]');

    checkboxes.forEach(checkbox => {
        if (excludeAdult && checkbox.classList.contains('api-adult')) {
            checkbox.checked = false;
        } else {
            checkbox.checked = selectAll;
        }
    });

    updateSelectedAPIs();
    checkAdultAPIsSelected();
}

// 显示添加自定义API表单
function showAddCustomApiForm() {
    const form = document.getElementById('addCustomApiForm');
    if (form) {
        form.classList.remove('hidden');
    }
}

// 取消添加自定义API - 修改函数来重用恢复按钮逻辑
function cancelAddCustomApi() {
    const form = document.getElementById('addCustomApiForm');
    if (form) {
        form.classList.add('hidden');
        document.getElementById('customApiName').value = '';
        document.getElementById('customApiUrl').value = '';
        document.getElementById('customApiDetail').value = '';
        const isAdultInput = document.getElementById('customApiIsAdult');
        if (isAdultInput) isAdultInput.checked = false;

        // 确保按钮是添加按钮
        restoreAddCustomApiButtons();
    }
}

// 添加自定义API
function addCustomApi() {
    const nameInput = document.getElementById('customApiName');
    const urlInput = document.getElementById('customApiUrl');
    const detailInput = document.getElementById('customApiDetail');
    const isAdultInput = document.getElementById('customApiIsAdult');
    const name = nameInput.value.trim();
    let url = urlInput.value.trim();
    const detail = detailInput ? detailInput.value.trim() : '';
    const isAdult = isAdultInput ? isAdultInput.checked : false;
    if (!name || !url) {
        showToast('请输入API名称和链接', 'warning');
        return;
    }
    if (!/^https?:\/\/.+/.test(url)) {
        showToast('API链接格式不正确，需以http://或https://开头', 'warning');
        return;
    }
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    // 保存 detail 字段
    customAPIs.push({ name, url, detail, isAdult });
    localStorage.setItem('customAPIs', JSON.stringify(customAPIs));
    const newApiIndex = customAPIs.length - 1;
    selectedAPIs.push('custom_' + newApiIndex);
    localStorage.setItem('selectedAPIs', JSON.stringify(selectedAPIs));

    // 重新渲染自定义API列表
    renderCustomAPIsList();
    updateSelectedApiCount();
    checkAdultAPIsSelected();
    nameInput.value = '';
    urlInput.value = '';
    if (detailInput) detailInput.value = '';
    if (isAdultInput) isAdultInput.checked = false;
    document.getElementById('addCustomApiForm').classList.add('hidden');
    showToast('已添加自定义API: ' + name, 'success');
}

// 移除自定义API
function removeCustomApi(index) {
    if (index < 0 || index >= customAPIs.length) return;

    const apiName = customAPIs[index].name;

    // 从列表中移除API
    customAPIs.splice(index, 1);
    localStorage.setItem('customAPIs', JSON.stringify(customAPIs));

    // 从选中列表中移除此API
    const customApiId = 'custom_' + index;
    selectedAPIs = selectedAPIs.filter(id => id !== customApiId);

    // 更新大于此索引的自定义API索引
    selectedAPIs = selectedAPIs.map(id => {
        if (id.startsWith('custom_')) {
            const currentIndex = parseInt(id.replace('custom_', ''));
            if (currentIndex > index) {
                return 'custom_' + (currentIndex - 1);
            }
        }
        return id;
    });

    localStorage.setItem('selectedAPIs', JSON.stringify(selectedAPIs));

    // 重新渲染自定义API列表
    renderCustomAPIsList();

    // 更新选中的API数量
    updateSelectedApiCount();

    // 重新检查成人API选中状态
    checkAdultAPIsSelected();

    showToast('已移除自定义API: ' + apiName, 'info');
}

function toggleSettings(e) {
    const settingsPanel = document.getElementById('settingsPanel');
    if (!settingsPanel) return;

    // 检查是否有管理员密码
    const hasAdminPassword = window.__ENV__?.ADMINPASSWORD && 
                           window.__ENV__.ADMINPASSWORD.length === 64 && 
                           !/^0+$/.test(window.__ENV__.ADMINPASSWORD);

    if (settingsPanel.classList.contains('show')) {
        settingsPanel.classList.remove('show');
    } else {
        // 只有设置了管理员密码且未验证时才拦截
        if (hasAdminPassword && !isAdminVerified()) {
            e.preventDefault();
            e.stopPropagation();
            showAdminPasswordModal();
            return;
        }
        settingsPanel.classList.add('show');
    }

    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
}

// 设置事件监听器
function setupEventListeners() {
    // 回车搜索
    document.getElementById('searchInput').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            search();
        }
    });

    // 黄色内容过滤开关事件绑定
    const yellowFilterToggle = document.getElementById('yellowFilterToggle');
    if (yellowFilterToggle) {
        yellowFilterToggle.addEventListener('change', function (e) {
            localStorage.setItem('yellowFilterEnabled', e.target.checked);

            // 控制黄色内容接口的显示状态
            const adultdiv = document.getElementById('adultdiv');
            if (adultdiv) {
                if (e.target.checked === true) {
                    adultdiv.style.display = 'none';
                } else if (e.target.checked === false) {
                    adultdiv.style.display = ''
                }
            } else {
                // 添加成人API列表
                addAdultAPI();
            }

            // 更新开关外观
            updateToggleAppearance(yellowFilterToggle);            // 警告提示处理（如果开关关闭，显示警告）
            checkAdultAPIsSelected();
        });
    }

    // 广告过滤开关事件绑定
    const adFilterToggle = document.getElementById('adFilterToggle');
    if (adFilterToggle) {
        adFilterToggle.addEventListener('change', function (e) {
            localStorage.setItem(PLAYER_CONFIG.adFilteringStorage, e.target.checked);
            
            // 更新开关外观
            updateToggleAppearance(adFilterToggle);
        });
    }
}

// 清空搜索输入框
function clearSearchInput() {
    const searchInput = document.getElementById('searchInput');
    const clearButton = document.getElementById('clearSearchInput');
    
    if (searchInput) {
        searchInput.value = '';
        searchInput.focus();
    }
    
    if (clearButton) {
        clearButton.classList.add('hidden');
    }
}

// 切换清空按钮显示/隐藏
function toggleClearButton() {
    const searchInput = document.getElementById('searchInput');
    const clearButton = document.getElementById('clearSearchInput');
    
    if (searchInput && clearButton) {
        if (searchInput.value.trim() !== '') {
            clearButton.classList.remove('hidden');
        } else {
            clearButton.classList.add('hidden');
        }
    }
}

// 重置搜索区域
function resetSearchArea() {
    // 清理搜索结果
    document.getElementById('results').innerHTML = '';
    document.getElementById('searchInput').value = '';

    // 恢复搜索区域的样式
    document.getElementById('searchArea').classList.add('flex-1');
    document.getElementById('searchArea').classList.remove('mb-8');
    document.getElementById('resultsArea').classList.add('hidden');

    // 确保页脚正确显示，移除相对定位
    const footer = document.querySelector('.footer');
    if (footer) {
        footer.style.position = '';
    }    // 如果有豆瓣功能，检查是否需要显示豆瓣推荐区域（已移除，现在豆瓣有独立界面）
    // if (typeof updateDoubanVisibility === 'function') {
    //     updateDoubanVisibility();
    // }

    // 重置URL为主页
    try {
        window.history.pushState(
            {},
            `LibreTV - 免费在线视频搜索与观看平台`,
            `/`
        );
        // 更新页面标题
        document.title = `LibreTV - 免费在线视频搜索与观看平台`;
    } catch (e) {
        console.error('更新浏览器历史失败:', e);
    }
}

// 获取自定义API信息
function getCustomApiInfo(customApiIndex) {
    const index = parseInt(customApiIndex);
    if (isNaN(index) || index < 0 || index >= customAPIs.length) {
        return null;
    }
    return customAPIs[index];
}

// 搜索功能 - 修改为支持多选API和多页结果
async function search() {
    // 密码保护校验
    if (window.isPasswordProtected && window.isPasswordVerified) {
        if (window.isPasswordProtected() && !window.isPasswordVerified()) {
            showPasswordModal && showPasswordModal();
            return;
        }
    }
    
    const query = document.getElementById('searchInput').value.trim();

    if (!query) {
        showToast('请输入搜索内容', 'info');
        return;
    }

    if (selectedAPIs.length === 0) {
        showToast('请至少选择一个API源', 'warning');
        return;
    }

    // 使用增强的加载状态管理
    LoadingStateManager.show('search', `正在搜索 "${query}"...`);
    
    // 性能监控开始
    if (typeof PerformanceMonitor !== 'undefined') {
        PerformanceMonitor.mark('search_start');
    }

    try {
        // 保存搜索历史
        saveSearchHistory(query);

        // 检查网络状态
        if (typeof NetworkUtils !== 'undefined' && !NetworkUtils.isOnline()) {
            throw new Error('网络连接不可用，请检查网络设置');
        }

        // 从所有选中的API源搜索
        let allResults = [];
        const searchPromises = selectedAPIs.map(async (apiId) => {
            try {
                const results = await searchByAPIAndKeyWord(apiId, query);
                return results || [];
            } catch (error) {
                console.warn(`API ${apiId} 搜索失败:`, error);
                return [];
            }
        });

        // 等待所有搜索请求完成，设置超时保护
        const resultsArray = await Promise.race([
            Promise.all(searchPromises),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('搜索超时')), 15000)
            )
        ]);

        // 合并所有结果
        resultsArray.forEach(results => {
            if (Array.isArray(results) && results.length > 0) {
                allResults = allResults.concat(results);
            }
        });

        // 性能监控
        if (typeof PerformanceMonitor !== 'undefined') {
            PerformanceMonitor.measure('搜索完成', 'search_start');
        }

        // 对搜索结果进行排序：按名称优先，名称相同时按接口源排序
        allResults.sort((a, b) => {
            // 首先按照视频名称排序
            const nameCompare = (a.vod_name || '').localeCompare(b.vod_name || '');
            if (nameCompare !== 0) return nameCompare;
            
            // 如果名称相同，则按照来源排序
            return (a.source_name || '').localeCompare(b.source_name || '');
        });

        // 更新搜索结果计数
        const searchResultsCount = document.getElementById('searchResultsCount');
        if (searchResultsCount) {
            searchResultsCount.textContent = allResults.length;
        }

        // 显示结果区域，调整搜索区域
        document.getElementById('searchArea').classList.remove('flex-1');
        document.getElementById('searchArea').classList.add('mb-8');
        document.getElementById('resultsArea').classList.remove('hidden');

        // 隐藏豆瓣推荐区域（如果存在）
        const doubanArea = document.getElementById('doubanArea');
        if (doubanArea) {
            doubanArea.classList.add('hidden');
        }

        const resultsDiv = document.getElementById('results');        // 如果没有结果
        if (!allResults || allResults.length === 0) {
            resultsDiv.innerHTML = `
                <div class="col-span-full text-center py-16">
                    <svg class="mx-auto h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 class="mt-2 text-lg font-medium text-gray-400">没有找到匹配的结果</h3>
                    <p class="mt-1 text-sm text-gray-500">请尝试其他关键词或更换数据源</p>
                    <button onclick="search()" class="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        重新搜索
                    </button>
                </div>
            `;
            LoadingStateManager.hide('search');
            return;
        }

        // 有搜索结果时，才更新URL
        try {
            // 使用URI编码确保特殊字符能够正确显示
            const encodedQuery = encodeURIComponent(query);
            // 使用HTML5 History API更新URL，不刷新页面
            window.history.pushState(
                { search: query },
                `搜索: ${query} - LibreTV`,
                `/s=${encodedQuery}`
            );
            // 更新页面标题
            document.title = `搜索: ${query} - LibreTV`;
        } catch (e) {
            console.error('更新浏览器历史失败:', e);
            // 如果更新URL失败，继续执行搜索
        }

        // 处理搜索结果过滤：如果启用了黄色内容过滤，则过滤掉分类含有敏感内容的项目
        const yellowFilterEnabled = localStorage.getItem('yellowFilterEnabled') === 'true';
        if (yellowFilterEnabled) {
            const banned = ['伦理片', '福利', '里番动漫', '门事件', '萝莉少女', '制服诱惑', '国产传媒', 'cosplay', '黑丝诱惑', '无码', '日本无码', '有码', '日本有码', 'SWAG', '网红主播', '色情片', '同性片', '福利视频', '福利片'];
            allResults = allResults.filter(item => {
                const typeName = item.type_name || '';
                return !banned.some(keyword => typeName.includes(keyword));
            });
        }

        // 添加XSS保护，使用textContent和属性转义
        const safeResults = allResults.map(item => {
            const safeId = item.vod_id ? item.vod_id.toString().replace(/[^\w-]/g, '') : '';
            const safeName = (item.vod_name || '').toString()
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;');
            const sourceInfo = item.source_name ?
                `<span class="bg-[#222] text-xs px-1.5 py-0.5 rounded-full">${item.source_name}</span>` : '';
            const sourceCode = item.source_code || '';

            // 添加API URL属性，用于详情获取
            const apiUrlAttr = item.api_url ?
                `data-api-url="${item.api_url.replace(/"/g, '&quot;')}"` : '';

            // 修改为水平卡片布局，图片在左侧，文本在右侧，并优化样式
            const hasCover = item.vod_pic && item.vod_pic.startsWith('http');

            return `
                <div class="card-hover bg-[#111] rounded-lg overflow-hidden cursor-pointer transition-all hover:scale-[1.02] h-full shadow-sm hover:shadow-md" 
                     onclick="showDetails('${safeId}','${safeName}','${sourceCode}')" ${apiUrlAttr}>
                    <div class="flex h-full">
                        ${hasCover ? `
                        <div class="relative flex-shrink-0 search-card-img-container">
                            <img src="${item.vod_pic}" alt="${safeName}" 
                                 class="h-full w-full object-cover transition-transform hover:scale-110" 
                                 onerror="this.onerror=null; this.src='https://via.placeholder.com/300x450?text=无封面'; this.classList.add('object-contain');" 
                                 loading="lazy">
                            <div class="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent"></div>
                        </div>` : ''}
                        
                        <div class="p-2 flex flex-col flex-grow">
                            <div class="flex-grow">
                                <h3 class="font-semibold mb-2 break-words line-clamp-2 ${hasCover ? '' : 'text-center'}" title="${safeName}">${safeName}</h3>
                                
                                <div class="flex flex-wrap ${hasCover ? '' : 'justify-center'} gap-1 mb-2">
                                    ${(item.type_name || '').toString().replace(/</g, '&lt;') ?
                    `<span class="text-xs py-0.5 px-1.5 rounded bg-opacity-20 bg-blue-500 text-blue-300">
                                          ${(item.type_name || '').toString().replace(/</g, '&lt;')}
                                      </span>` : ''}
                                    ${(item.vod_year || '') ?
                    `<span class="text-xs py-0.5 px-1.5 rounded bg-opacity-20 bg-purple-500 text-purple-300">
                                          ${item.vod_year}
                                      </span>` : ''}
                                </div>
                                <p class="text-gray-400 line-clamp-2 overflow-hidden ${hasCover ? '' : 'text-center'} mb-2">
                                    ${(item.vod_remarks || '暂无介绍').toString().replace(/</g, '&lt;')}
                                </p>
                            </div>
                            
                            <div class="flex justify-between items-center mt-1 pt-1 border-t border-gray-800">
                                ${sourceInfo ? `<div>${sourceInfo}</div>` : '<div></div>'}
                                <!-- 接口名称过长会被挤变形
                                <div>
                                    <span class="text-gray-500 flex items-center hover:text-blue-400 transition-colors">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                        </svg>
                                        播放
                                    </span>
                                </div>
                                -->
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        resultsDiv.innerHTML = safeResults;    } catch (error) {
        console.error('搜索错误:', error);
        
        // 使用增强的错误处理
        let errorMessage = '搜索失败，请稍后重试';
        if (typeof NetworkUtils !== 'undefined') {
            errorMessage = NetworkUtils.formatError(error);
        } else if (error.name === 'AbortError') {
            errorMessage = '搜索请求超时，请检查网络连接';
        } else if (error.message.includes('超时')) {
            errorMessage = '搜索超时，请稍后重试';
        } else if (error.message.includes('网络')) {
            errorMessage = error.message;
        }
        
        showToast(errorMessage, 'error');
        
        // 显示重试按钮
        const resultsDiv = document.getElementById('results');
        if (resultsDiv) {
            resultsDiv.innerHTML = `
                <div class="col-span-full text-center py-16">
                    <svg class="mx-auto h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <h3 class="mt-2 text-lg font-medium text-red-400">搜索失败</h3>
                    <p class="mt-1 text-sm text-gray-500">${errorMessage}</p>
                    <button onclick="search()" class="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        重新搜索
                    </button>
                </div>
            `;
        }
    } finally {
        LoadingStateManager.hide('search');
    }
}

// 显示视频详情模态框
async function showDetails(vod_id, vod_name, sourceCode) {
    if (!vod_id || !vod_name || !sourceCode) {
        showToast('参数错误，无法获取详情', 'error');
        return;
    }

    // 获取模态框元素
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modalTitle');
    const modalContent = document.getElementById('modalContent');
    
    if (!modal || !modalTitle || !modalContent) {
        showToast('界面元素未找到', 'error');
        return;
    }

    // 设置标题并显示模态框
    modalTitle.textContent = vod_name;
    modalContent.innerHTML = '<div class="text-center py-8 text-gray-400">正在加载详情...</div>';
    modal.classList.remove('hidden');

    try {
        // 构建详情请求URL
        let detailUrl = '';
        let apiUrl = '';
        
        if (sourceCode.startsWith('custom_')) {
            // 自定义API处理
            const customIndex = parseInt(sourceCode.replace('custom_', ''));
            const customApi = getCustomApiInfo(customIndex);
            if (!customApi) {
                throw new Error('自定义API配置无效');
            }
            apiUrl = customApi.url;
            detailUrl = `${apiUrl}/index.php/vod/detail/id/${vod_id}.html`;
        } else {
            // 内置API处理
            if (!API_SITES[sourceCode]) {
                throw new Error('API源不存在');
            }
            apiUrl = API_SITES[sourceCode].api;
            detailUrl = `${apiUrl}/index.php/vod/detail/id/${vod_id}.html`;
        }

        // 发送详情请求
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        
        const response = await fetch(`${PROXY_URL}${encodeURIComponent(detailUrl)}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error(`请求失败: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (!data || data.code !== 200 || !data.list || !Array.isArray(data.list) || data.list.length === 0) {
            throw new Error('详情数据格式错误或无数据');
        }
        
        const videoInfo = data.list[0];
        
        // 解析播放链接
        let episodes = [];
        if (videoInfo.vod_play_url) {
            const playUrls = videoInfo.vod_play_url.split('#').filter(url => url.trim());
            episodes = playUrls.map(url => url.split('$')[1] || url).filter(url => url);
        }
        
        // 保存到全局变量供其他函数使用
        currentEpisodes = episodes;
        currentVideoTitle = vod_name;
        
        // 渲染详情内容
        const episodeCount = episodes.length;
        const hasEpisodes = episodeCount > 0;
        
        modalContent.innerHTML = `
            <div class="space-y-4">
                <!-- 基本信息 -->
                <div class="bg-[#0f0f0f] rounded-lg p-4 border border-[#333]">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        ${videoInfo.type_name ? `
                        <div class="flex">
                            <span class="text-gray-400 min-w-16">类型:</span>
                            <span class="text-white">${videoInfo.type_name}</span>
                        </div>` : ''}
                        ${videoInfo.vod_year ? `
                        <div class="flex">
                            <span class="text-gray-400 min-w-16">年份:</span>
                            <span class="text-white">${videoInfo.vod_year}</span>
                        </div>` : ''}
                        ${videoInfo.vod_area ? `
                        <div class="flex">
                            <span class="text-gray-400 min-w-16">地区:</span>
                            <span class="text-white">${videoInfo.vod_area}</span>
                        </div>` : ''}
                        ${videoInfo.vod_lang ? `
                        <div class="flex">
                            <span class="text-gray-400 min-w-16">语言:</span>
                            <span class="text-white">${videoInfo.vod_lang}</span>
                        </div>` : ''}
                        ${videoInfo.vod_director ? `
                        <div class="flex">
                            <span class="text-gray-400 min-w-16">导演:</span>
                            <span class="text-white">${videoInfo.vod_director}</span>
                        </div>` : ''}
                        ${videoInfo.vod_actor ? `
                        <div class="flex">
                            <span class="text-gray-400 min-w-16">演员:</span>
                            <span class="text-white">${videoInfo.vod_actor}</span>
                        </div>` : ''}
                        <div class="flex">
                            <span class="text-gray-400 min-w-16">来源:</span>
                            <span class="text-white">${API_SITES[sourceCode]?.name || '自定义源'}</span>
                        </div>
                        ${hasEpisodes ? `
                        <div class="flex">
                            <span class="text-gray-400 min-w-16">集数:</span>
                            <span class="text-white">${episodeCount} 集</span>
                        </div>` : ''}
                    </div>
                </div>
                
                <!-- 简介 -->
                ${videoInfo.vod_content ? `
                <div class="bg-[#0f0f0f] rounded-lg p-4 border border-[#333]">
                    <h4 class="text-gray-400 mb-2">简介</h4>
                    <div class="text-gray-300 text-sm leading-relaxed max-h-32 overflow-y-auto">
                        ${videoInfo.vod_content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}
                    </div>
                </div>` : ''}
                
                <!-- 集数列表 -->
                ${hasEpisodes ? `
                <div class="bg-[#0f0f0f] rounded-lg p-4 border border-[#333]">
                    <div class="flex justify-between items-center mb-4">
                        <h4 class="text-gray-400">选集播放</h4>
                        <div class="flex gap-2">
                            <button onclick="toggleEpisodeOrder('${sourceCode}', '${vod_id}')" 
                                    class="px-3 py-1 bg-[#222] hover:bg-[#333] border border-[#333] rounded text-xs text-gray-300 flex items-center gap-1">
                                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"></path>
                                </svg>
                                <span>${episodesReversed ? '正序排列' : '倒序排列'}</span>
                            </button>
                            <button onclick="copyLinks()" 
                                    class="px-3 py-1 bg-[#222] hover:bg-[#333] border border-[#333] rounded text-xs text-gray-300">
                                复制链接
                            </button>
                        </div>
                    </div>
                    <div id="episodesGrid" class="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                        ${renderEpisodes(vod_name, sourceCode, vod_id)}
                    </div>
                </div>` : `
                <div class="bg-[#0f0f0f] rounded-lg p-4 border border-[#333] text-center">
                    <div class="text-gray-400 py-8">
                        <svg class="w-12 h-12 mx-auto mb-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p>暂无播放资源</p>
                    </div>
                </div>`}
            </div>
        `;
          } catch (error) {
        console.error('获取详情失败:', error);
        
        // 使用增强的错误处理
        let errorMessage = '获取详情失败';
        if (typeof NetworkUtils !== 'undefined') {
            errorMessage = NetworkUtils.formatError(error);
        } else if (error.name === 'AbortError') {
            errorMessage = '请求超时，请稍后重试';
        } else if (error.message.includes('网络')) {
            errorMessage = error.message;
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        modalContent.innerHTML = `
            <div class="text-center py-8">
                <svg class="w-12 h-12 mx-auto mb-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <p class="text-red-400 mb-4">${errorMessage}</p>
                <div class="flex gap-2 justify-center">
                    <button onclick="showDetails('${vod_id}', '${vod_name}', '${sourceCode}')" 
                            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors">
                        重试
                    </button>
                    <button onclick="closeModal()" 
                            class="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors">
                        关闭
                    </button>
                </div>
            </div>
        `;
        
        // 显示toast提示
        showToast(errorMessage, 'error');
    }
}

// 渲染集数按钮（用于详情模态框）
function renderEpisodes(vod_name, sourceCode, id) {
    if (!currentEpisodes || currentEpisodes.length === 0) {
        return '<div class="col-span-full text-center text-gray-400 py-8">没有可用的集数</div>';
    }

    const episodes = episodesReversed ? [...currentEpisodes].reverse() : currentEpisodes;
    let html = '';

    episodes.forEach((episode, index) => {
        // 根据倒序状态计算真实的剧集索引
        const realIndex = episodesReversed ? currentEpisodes.length - 1 - index : index;

        html += `
            <button onclick="playVideo('${episode.replace(/'/g, "\\'")}', '${vod_name.replace(/'/g, "\\'")}', '${sourceCode}', ${realIndex}, '${id}')" 
                    class="px-4 py-2 bg-[#222] hover:bg-[#333] border border-[#333] rounded-lg transition-colors text-center">
                ${realIndex + 1}
            </button>
        `;
    });

    return html;
}

// 切换集数排序（用于详情模态框）
function toggleEpisodeOrder(sourceCode, id) {
    episodesReversed = !episodesReversed;
    
    // 保存到localStorage
    localStorage.setItem('episodesReversed', episodesReversed);
    
    // 重新渲染集数列表
    const episodesGrid = document.getElementById('episodesGrid');
    if (episodesGrid) {
        episodesGrid.innerHTML = renderEpisodes(currentVideoTitle, sourceCode, id);
    }
    
    // 更新排序按钮文字
    const buttons = document.querySelectorAll('button[onclick*="toggleEpisodeOrder"]');
    buttons.forEach(button => {
        const span = button.querySelector('span');
        const svg = button.querySelector('svg');
        if (span) {
            span.textContent = episodesReversed ? '正序排列' : '倒序排列';
        }
        if (svg) {
            svg.style.transform = episodesReversed ? 'rotate(180deg)' : '';
        }
    });
}

// 复制链接功能（用于详情模态框）
function copyLinks() {
    if (currentEpisodes && currentEpisodes.length > 0) {
        const linksText = currentEpisodes.map((episode, index) => `第${index + 1}集: ${episode}`).join('\n');
        navigator.clipboard.writeText(linksText).then(() => {
            showToast('播放链接已复制', 'success');
        }).catch(err => {
            showToast('复制失败，请检查浏览器权限', 'error');
        });
    } else {
        showToast('暂无可复制的链接', 'warning');
    }
}

// 播放视频函数
function playVideo(videoUrl, videoTitle, sourceCode, episodeIndex, vod_id) {
    try {
        // 构建播放器URL参数
        const params = new URLSearchParams({
            url: videoUrl,
            title: videoTitle,
            source: sourceCode,
            index: episodeIndex,
            id: vod_id || ''
        });
        
        // 如果有集数列表，添加到参数中
        if (currentEpisodes && currentEpisodes.length > 0) {
            params.set('episodes', encodeURIComponent(JSON.stringify(currentEpisodes)));
        }
        
        // 保存当前页面URL到localStorage，供播放器返回时使用
        localStorage.setItem('lastPageUrl', window.location.href);
        
        // 关闭模态框
        closeModal();
        
        // 如果是在iframe中或者是单页应用，在播放器界面显示
        if (typeof showVideoPlayer === 'function') {
            showVideoPlayer(`player.html?${params.toString()}`);
        } else if (typeof switchView === 'function') {
            // 在播放器界面显示嵌入式播放器
            switchView('player');
            setTimeout(() => {
                if (typeof showEmbeddedPlayer === 'function') {
                    showEmbeddedPlayer(`player.html?${params.toString()}`, videoTitle);
                }
            }, 100);
        } else {
            // 跳转到播放器页面
            window.location.href = `player.html?${params.toString()}`;
        }
        
    } catch (error) {
        console.error('播放视频失败:', error);
        showToast('播放失败，请稍后重试', 'error');
    }
}

// Enhanced error handling and user experience utilities
const NetworkUtils = {
    // 网络状态检查
    isOnline() {
        return navigator.onLine;
    },

    // 检查API响应是否有效
    validateResponse(response) {
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response;
    },

    // 带重试的fetch封装
    async fetchWithRetry(url, options = {}, maxRetries = 3) {
        const { timeout = 10000, ...fetchOptions } = options;
        
        for (let i = 0; i <= maxRetries; i++) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), timeout);
                
                const response = await fetch(url, {
                    ...fetchOptions,
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                return this.validateResponse(response);
                
            } catch (error) {
                if (i === maxRetries) {
                    if (error.name === 'AbortError') {
                        throw new Error('请求超时，请检查网络连接');
                    } else if (!this.isOnline()) {
                        throw new Error('网络连接不可用，请检查网络设置');
                    } else {
                        throw error;
                    }
                }
                
                // 等待一段时间后重试
                await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
            }
        }
    },

    // 格式化错误信息
    formatError(error) {
        if (error.name === 'AbortError') {
            return '请求超时，请稍后重试';
        } else if (error.message.includes('Failed to fetch')) {
            return '网络连接失败，请检查网络设置';
        } else if (error.message.includes('404')) {
            return '请求的资源不存在';
        } else if (error.message.includes('500')) {
            return '服务器内部错误，请稍后重试';
        } else {
            return error.message || '未知错误';
        }
    }
};

// 加载状态管理
const LoadingManager = {
    activeLoaders: new Set(),
    
    show(id, message = '加载中...') {
        this.activeLoaders.add(id);
        
        if (typeof showLoading === 'function') {
            showLoading(message);
        } else if (typeof showToast === 'function') {
            showToast(message, 'info');
        }
    },
    
    hide(id) {
        this.activeLoaders.delete(id);
        
        if (this.activeLoaders.size === 0 && typeof hideLoading === 'function') {
            hideLoading();
        }
    },
    
    isLoading() {
        return this.activeLoaders.size > 0;
    }
};

// Performance monitoring
const PerformanceMonitor = {
    markers: new Map(),
    
    mark(name) {
        this.markers.set(name, performance.now());
    },
    
    measure(name, startMark) {
        const startTime = this.markers.get(startMark);
        if (startTime) {
            const duration = performance.now() - startTime;
            console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);
            return duration;
        }
        return 0;
    }
};

// Global loading state management
window.LoadingStateManager = {
    activeLoaders: new Set(),
    loadingElement: null,
    
    init() {
        // 创建全局加载提示元素
        if (!this.loadingElement) {
            this.loadingElement = document.createElement('div');
            this.loadingElement.className = 'loading-overlay';
            this.loadingElement.innerHTML = `
                <div class="loading-content">
                    <div class="loading-spinner"></div>
                    <div class="loading-text">加载中...</div>
                </div>
            `;
            this.loadingElement.style.display = 'none';
            document.body.appendChild(this.loadingElement);
        }
    },
    
    show(id, message = '加载中...') {
        this.init();
        this.activeLoaders.add(id);
        
        const textElement = this.loadingElement.querySelector('.loading-text');
        if (textElement) {
            textElement.textContent = message;
        }
        
        this.loadingElement.style.display = 'flex';
        
        // 防止长时间加载
        setTimeout(() => {
            if (this.activeLoaders.has(id)) {
                this.hide(id);
                if (typeof showToast === 'function') {
                    showToast('加载超时，请稍后重试', 'warning');
                }
            }
        }, 15000);
    },
    
    hide(id) {
        this.activeLoaders.delete(id);
        
        if (this.activeLoaders.size === 0 && this.loadingElement) {
            this.loadingElement.style.display = 'none';
        }
    },
    
    isLoading() {
        return this.activeLoaders.size > 0;
    }
};

// Enhanced showLoading and hideLoading functions
window.showLoading = function(message = '加载中...') {
    LoadingStateManager.show('global', message);
};

window.hideLoading = function() {
    LoadingStateManager.hide('global');
};

// Performance monitoring utilities
window.PerformanceUtils = {
    // 监控长任务
    observeLongTasks() {
        if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver((list) => {
                list.getEntries().forEach((entry) => {
                    if (entry.duration > 50) { // 超过50ms的任务
                        console.warn(`长任务检测: ${entry.name}, 耗时: ${entry.duration.toFixed(2)}ms`);
                    }
                });
            });
            
            try {
                observer.observe({ entryTypes: ['longtask'] });
            } catch (error) {
                console.warn('长任务监控不支持:', error);
            }
        }
    },
    
    // 内存使用监控
    checkMemoryUsage() {
        if ('memory' in performance) {
            const memory = performance.memory;
            const used = (memory.usedJSHeapSize / 1024 / 1024).toFixed(2);
            const total = (memory.totalJSHeapSize / 1024 / 1024).toFixed(2);
            const limit = (memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2);
            
            console.log(`内存使用: ${used}MB / ${total}MB (限制: ${limit}MB)`);

            // 内存使用过高时警告
            if (memory.usedJSHeapSize / memory.jsHeapSizeLimit > 0.8) {
                console.warn('内存使用率过高，可能影响性能');
            }
        }
    }
};

// Initialize performance monitoring
if (typeof window !== 'undefined') {
    // 初始化性能监控
    PerformanceUtils.observeLongTasks();
    
    // 定期检查内存使用
    setInterval(() => {
        PerformanceUtils.checkMemoryUsage();
    }, 30000); // 每30秒检查一次
}
