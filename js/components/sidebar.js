// LibreTV V2.0 侧边栏组件
class Sidebar {
    constructor() {
        this.isOpen = false;
        this.init();
    }

    init() {
        this.bindEvents();
        this.updateSidebarState();
    }

    bindEvents() {
        // 移动端菜单按钮
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        if (mobileMenuBtn) {
            mobileMenuBtn.addEventListener('click', () => this.toggle());
        }

        // 侧边栏遮罩点击关闭
        const overlay = document.getElementById('sidebarOverlay');
        if (overlay) {
            overlay.addEventListener('click', () => this.close());
        }

        // 导航项点击
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const route = item.dataset.route;
                if (route) {
                    window.router.navigate(route);
                    
                    // 移动端点击后自动关闭侧边栏
                    if (window.innerWidth < 1024) {
                        this.close();
                    }
                }
            });
        });

        // 监听窗口大小变化
        window.addEventListener('resize', () => this.handleResize());

        // ESC键关闭侧边栏
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen && window.innerWidth < 1024) {
                this.close();
            }
        });
    }

    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    open() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');
        
        if (sidebar && overlay) {
            sidebar.classList.remove('-translate-x-full');
            overlay.classList.remove('hidden');
            this.isOpen = true;
            
            // 防止背景滚动
            document.body.style.overflow = 'hidden';
        }
    }

    close() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');
        
        if (sidebar && overlay) {
            sidebar.classList.add('-translate-x-full');
            overlay.classList.add('hidden');
            this.isOpen = false;
            
            // 恢复背景滚动
            document.body.style.overflow = '';
        }
    }

    handleResize() {
        // 大屏幕时自动关闭移动端侧边栏状态
        if (window.innerWidth >= 1024) {
            this.close();
            document.body.style.overflow = '';
        }
    }

    updateSidebarState() {
        // 初始化时根据屏幕大小设置状态
        if (window.innerWidth < 1024) {
            this.close();
        }
    }

    // 高亮当前导航项
    setActiveNavigation(route) {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const activeItem = document.querySelector(`[data-route="${route}"]`);
        if (activeItem) {
            activeItem.classList.add('active');
        }
    }

    // 添加导航项
    addNavigationItem(route, label, icon, position = 'bottom') {
        const navList = document.querySelector('#sidebar ul');
        if (!navList) return;

        const listItem = document.createElement('li');
        listItem.innerHTML = `
            <a href="#/${route}" class="nav-item flex items-center p-3 rounded-lg hover:bg-[#1a2332] transition-colors" data-route="${route}">
                ${icon}
                ${label}
            </a>
        `;

        if (position === 'top') {
            navList.insertBefore(listItem, navList.firstChild);
        } else {
            navList.appendChild(listItem);
        }

        // 绑定事件
        const newNavItem = listItem.querySelector('.nav-item');
        newNavItem.addEventListener('click', (e) => {
            e.preventDefault();
            window.router.navigate(route);
            
            if (window.innerWidth < 1024) {
                this.close();
            }
        });
    }

    // 移除导航项
    removeNavigationItem(route) {
        const navItem = document.querySelector(`[data-route="${route}"]`);
        if (navItem && navItem.parentElement) {
            navItem.parentElement.remove();
        }
    }

    // 更新版本信息
    updateVersionInfo(version) {
        const versionEl = document.getElementById('versionInfo');
        if (versionEl) {
            versionEl.textContent = version;
        }
    }

    // 获取当前激活的导航项
    getActiveNavigation() {
        const activeItem = document.querySelector('.nav-item.active');
        return activeItem ? activeItem.dataset.route : null;
    }
}

// 创建全局侧边栏实例
window.sidebar = new Sidebar();
