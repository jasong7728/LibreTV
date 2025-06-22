// 导航和视图管理相关功能

// 当前活跃的视图
let currentView = 'search';

// 初始化导航
function initNavigation() {
    // 设置默认视图
    switchView('search');
    
    // 初始化豆瓣功能
    if (typeof initDouban === 'function') {
        initDouban();
    }
    
    // 加载观看历史
    if (typeof loadViewingHistory === 'function') {
        loadViewingHistory();
    }
}

// 切换视图
function switchView(viewName) {
    // 隐藏所有视图
    const views = document.querySelectorAll('.view-container');
    views.forEach(view => {
        view.classList.remove('active');
    });
    
    // 移除所有导航项的活跃状态
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.classList.remove('active');
    });
    
    // 显示目标视图
    const targetView = document.getElementById(viewName + 'View');
    if (targetView) {
        targetView.classList.add('active');
    }
    
    // 设置对应导航项为活跃状态
    const targetNavItem = document.querySelector(`.nav-item[data-view="${viewName}"]`);
    if (targetNavItem) {
        targetNavItem.classList.add('active');
    }
    
    // 更新当前视图
    currentView = viewName;
      // 根据不同视图执行特定初始化
    switch(viewName) {
        case 'douban':
            initDoubanView();
            break;
        case 'history':
            initHistoryView();
            break;
        case 'search':
            initSearchView();
            break;
        case 'settings':
            initSettingsView();
            break;
        case 'about':
            initAboutView();
            break;
        case 'player':
            initPlayerView();
            break;
    }
    
    // 滚动到顶部
    window.scrollTo(0, 0);
}

// 初始化搜索视图
function initSearchView() {
    // 渲染搜索历史
    if (typeof renderSearchHistory === 'function') {
        renderSearchHistory();
    }
    
    // 重置搜索状态
    if (typeof resetSearchArea === 'function') {
        resetSearchArea();
    }
}

// 初始化豆瓣视图
function initDoubanView() {
    // 确保豆瓣功能已初始化
    if (typeof initDouban === 'function') {
        // 强制显示豆瓣内容
        if (typeof renderRecommend === 'function') {
            renderRecommend(doubanCurrentTag || '热门', doubanPageSize || 16, doubanPageStart || 0);
        }
    }
}

// 初始化历史记录视图
function initHistoryView() {
    if (typeof loadViewingHistory === 'function') {
        loadViewingHistory();
    }
}

// 初始化设置视图
function initSettingsView() {
    // 重新渲染设置项状态
    updateSettingsState();
}

// 初始化关于视图
function initAboutView() {
    // 关于页面不需要特殊初始化
}

// 初始化播放器视图
function initPlayerView() {
    // 检查是否有正在播放的视频
    const currentVideoUrl = localStorage.getItem('currentVideoUrl');
    const currentVideoTitle = localStorage.getItem('currentVideoTitle');
    
    if (currentVideoUrl && currentVideoTitle) {
        // 如果有正在播放的视频，显示播放器
        showEmbeddedPlayer(currentVideoUrl, currentVideoTitle);
    } else {
        // 否则显示默认的空状态
        showPlayerEmptyState();
    }
}

// 显示嵌入式播放器
function showEmbeddedPlayer(videoUrl, videoTitle) {
    const playerContainer = document.getElementById('playerContainer');
    if (!playerContainer) return;
    
    playerContainer.innerHTML = `
        <div class="player-header flex justify-between items-center mb-4">
            <h3 class="text-xl font-bold text-white">${videoTitle}</h3>
            <button onclick="closeEmbeddedPlayer()" class="text-gray-400 hover:text-white">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
            </button>
        </div>
        <div class="relative bg-black rounded-lg overflow-hidden" style="aspect-ratio: 16/9;">
            <iframe 
                src="/player.html?url=${encodeURIComponent(videoUrl)}" 
                class="w-full h-full border-0" 
                allowfullscreen>
            </iframe>
        </div>
        <div class="mt-4 flex gap-4">
            <button onclick="openPlayerInNewTab('${videoUrl}', '${videoTitle}')" 
                    class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                在新窗口打开
            </button>
            <button onclick="showPlayerControls()" 
                    class="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors">
                播放控制
            </button>
        </div>
    `;
}

// 显示播放器空状态
function showPlayerEmptyState() {
    const playerContainer = document.getElementById('playerContainer');
    if (!playerContainer) return;
    
    playerContainer.innerHTML = `
        <div class="text-center py-16">
            <div class="flex items-center justify-center mb-6">
                <svg class="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293H15M6 20l4-16m4 16l4-16"></path>
                </svg>
            </div>
            <h3 class="text-2xl font-bold text-white mb-4">播放器</h3>
            <p class="text-gray-400 mb-8">从搜索结果或豆瓣热门中选择视频进行播放</p>
            <div class="flex flex-col sm:flex-row gap-4 justify-center">
                <button onclick="switchView('search')" class="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-lg transition-all duration-300 shadow-md hover:shadow-lg">
                    去搜索视频
                </button>
                <button onclick="switchView('douban')" class="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg transition-all duration-300 shadow-md hover:shadow-lg">
                    浏览豆瓣热门
                </button>
            </div>
        </div>
    `;
}

// 关闭嵌入式播放器
function closeEmbeddedPlayer() {
    localStorage.removeItem('currentVideoUrl');
    localStorage.removeItem('currentVideoTitle');
    showPlayerEmptyState();
}

// 在新标签页打开播放器
function openPlayerInNewTab(videoUrl, videoTitle) {
    const playerUrl = `/player.html?url=${encodeURIComponent(videoUrl)}&title=${encodeURIComponent(videoTitle)}`;
    window.open(playerUrl, '_blank');
}

// 显示播放控制
function showPlayerControls() {
    // 这里可以添加播放控制相关的功能
    showToast('播放控制功能开发中...', 'info');
}

// 更新设置状态
function updateSettingsState() {
    // 更新API复选框状态
    if (typeof updateSelectedApiCount === 'function') {
        updateSelectedApiCount();
    }
    
    // 更新过滤器开关状态
    const yellowFilterToggle = document.getElementById('yellowFilterToggle');
    if (yellowFilterToggle) {
        yellowFilterToggle.checked = localStorage.getItem('yellowFilterEnabled') === 'true';
        updateToggleAppearance(yellowFilterToggle);
    }
    
    const adFilterToggle = document.getElementById('adFilterToggle');
    if (adFilterToggle) {
        adFilterToggle.checked = localStorage.getItem(PLAYER_CONFIG?.adFilteringStorage || 'adFilteringEnabled') !== 'false';
        updateToggleAppearance(adFilterToggle);
    }
}

// 更新切换开关外观
function updateToggleAppearance(toggle) {
    if (!toggle) return;
    
    const toggleBg = toggle.nextElementSibling;
    const toggleDot = toggleBg?.nextElementSibling;
    
    if (toggle.checked) {
        toggleBg?.classList.add('bg-pink-600');
        toggleDot?.classList.add('translate-x-6');
    } else {
        toggleBg?.classList.remove('bg-pink-600');
        toggleDot?.classList.remove('translate-x-6');
    }
}

// 重写resetToHome函数以适配新的导航结构
function resetToHome() {
    switchView('search');
    
    // 清理搜索结果
    if (document.getElementById('results')) {
        document.getElementById('results').innerHTML = '';
    }
    if (document.getElementById('searchInput')) {
        document.getElementById('searchInput').value = '';
    }
    
    // 隐藏搜索结果区域
    const resultsArea = document.getElementById('resultsArea');
    if (resultsArea) {
        resultsArea.classList.add('hidden');
    }
    
    // 恢复搜索区域样式
    const searchArea = document.getElementById('searchArea');
    if (searchArea) {
        searchArea.classList.add('flex-1');
        searchArea.classList.remove('mb-8');
    }
    
    // 重置URL
    try {
        window.history.pushState(
            {},
            'LibreTV - 免费在线视频搜索与观看平台',
            window.location.pathname
        );
    } catch (e) {
        console.error('URL更新失败:', e);
    }
}

// 覆盖原有的toggleHistory和toggleSettings函数
function toggleHistory(e) {
    if (e) e.stopPropagation();
    switchView('history');
}

function toggleSettings(e) {
    // 密码保护校验
    if (window.isPasswordProtected && window.isPasswordVerified) {
        if (window.isPasswordProtected() && !window.isPasswordVerified()) {
            if (window.showPasswordModal) {
                window.showPasswordModal();
            }
            return;
        }
    }
    
    if (e) e.stopPropagation();
    switchView('settings');
}

// 页面加载完成后初始化导航
document.addEventListener('DOMContentLoaded', function() {
    initNavigation();
});
