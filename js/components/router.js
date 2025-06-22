// LibreTV V2.0 路由管理器
class Router {
    constructor() {
        this.routes = {};
        this.currentRoute = null;
        this.init();
    }

    init() {
        // 监听hash变化
        window.addEventListener('hashchange', () => this.handleRoute());
        // 监听页面加载
        window.addEventListener('load', () => this.handleRoute());
        
        // 注册默认路由
        this.register('search', () => this.showView('searchView'));
        this.register('douban', () => this.showView('doubanView'));
        this.register('player', () => this.showView('playerView'));
        this.register('settings', () => this.showView('settingsView'));
        this.register('about', () => this.showView('aboutView'));
    }

    register(path, handler) {
        this.routes[path] = handler;
    }

    navigate(path) {
        window.location.hash = `#/${path}`;
    }

    handleRoute() {
        const hash = window.location.hash.slice(2) || 'search'; // 默认到搜索页
        const [route, ...params] = hash.split('/');
        
        if (this.routes[route]) {
            this.currentRoute = route;
            this.updateActiveNavigation(route);
            this.routes[route](params);
        } else {
            // 未知路由，重定向到搜索页
            this.navigate('search');
        }
    }

    showView(viewId) {
        // 隐藏所有视图
        document.querySelectorAll('.view-content').forEach(view => {
            view.classList.add('hidden');
        });
        
        // 显示目标视图
        const targetView = document.getElementById(viewId);
        if (targetView) {
            targetView.classList.remove('hidden');
            
            // 触发视图激活事件
            const event = new CustomEvent('viewActivated', { 
                detail: { viewId, route: this.currentRoute } 
            });
            window.dispatchEvent(event);
        }
    }

    updateActiveNavigation(route) {
        // 更新导航栏活跃状态
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const activeItem = document.querySelector(`[data-route="${route}"]`);
        if (activeItem) {
            activeItem.classList.add('active');
        }
    }

    getCurrentRoute() {
        return this.currentRoute;
    }

    getRouteParams() {
        const hash = window.location.hash.slice(2) || '';
        const [, ...params] = hash.split('/');
        return params;
    }

    // 解析查询参数
    getQueryParams() {
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

    // 更新查询参数
    updateQuery(params) {
        const hash = window.location.hash;
        const hashBase = hash.split('?')[0];
        
        const queryParams = { ...this.getQueryParams(), ...params };
        const queryString = Object.entries(queryParams)
            .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
            .join('&');
        
        const newHash = queryString ? `${hashBase}?${queryString}` : hashBase;
        window.history.replaceState(null, '', newHash);
    }
}

// 创建全局路由实例
window.router = new Router();
