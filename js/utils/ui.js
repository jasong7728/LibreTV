// LibreTV V2.0 UI工具类
class UIUtils {
    constructor() {
        this.toastQueue = [];
        this.isToastShowing = false;
    }

    // 显示Toast消息
    showToast(message, type = 'info', duration = 3000) {
        this.toastQueue.push({ message, type, duration });
        if (!this.isToastShowing) {
            this.processToastQueue();
        }
    }

    processToastQueue() {
        if (this.toastQueue.length === 0) {
            this.isToastShowing = false;
            return;
        }

        this.isToastShowing = true;
        const { message, type, duration } = this.toastQueue.shift();

        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toastMessage');

        if (!toast || !toastMessage) return;

        // 设置消息和样式
        toastMessage.textContent = message;
        
        // 根据类型设置样式
        toast.className = 'fixed top-4 left-1/2 -translate-x-1/2 px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 z-50';
        
        switch (type) {
            case 'success':
                toast.classList.add('bg-green-500', 'text-white');
                break;
            case 'error':
                toast.classList.add('bg-red-500', 'text-white');
                break;
            case 'warning':
                toast.classList.add('bg-yellow-500', 'text-black');
                break;
            default:
                toast.classList.add('bg-blue-500', 'text-white');
        }

        // 显示Toast
        toast.classList.remove('opacity-0', '-translate-y-full');
        toast.classList.add('opacity-100', 'translate-y-0');

        // 隐藏Toast
        setTimeout(() => {
            toast.classList.remove('opacity-100', 'translate-y-0');
            toast.classList.add('opacity-0', '-translate-y-full');
            
            setTimeout(() => {
                this.processToastQueue();
            }, 300);
        }, duration);
    }

    // 显示Loading
    showLoading(message = '加载中...') {
        const loading = document.getElementById('loading');
        const loadingText = loading?.querySelector('p');
        
        if (loading && loadingText) {
            loadingText.textContent = message;
            loading.classList.remove('hidden');
            loading.classList.add('flex');
        }
    }

    // 隐藏Loading
    hideLoading() {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.classList.add('hidden');
            loading.classList.remove('flex');
        }
    }

    // 显示模态框
    showModal(title, content, buttons = []) {
        const modal = document.getElementById('modal');
        const modalContent = document.getElementById('modalContent');
        
        if (!modal || !modalContent) return;

        const titleElement = modal.querySelector('h3');
        if (titleElement) titleElement.textContent = title;

        let modalHTML = `<div class="modal-body">${content}</div>`;
        
        if (buttons.length > 0) {
            modalHTML += `
                <div class="flex justify-end space-x-3 mt-6 pt-4 border-t border-[#333]">
                    ${buttons.map(btn => `
                        <button id="${btn.id}" class="${btn.class || 'px-4 py-2 bg-[#333] hover:bg-[#444] rounded-lg transition-colors'}">
                            ${btn.text}
                        </button>
                    `).join('')}
                </div>
            `;
        }

        modalContent.innerHTML = modalHTML;
        modal.classList.remove('hidden');
        modal.classList.add('flex');

        // 绑定按钮事件
        buttons.forEach(btn => {
            if (btn.onClick) {
                const buttonElement = document.getElementById(btn.id);
                if (buttonElement) {
                    buttonElement.addEventListener('click', btn.onClick);
                }
            }
        });
    }

    // 隐藏模态框
    hideModal() {
        const modal = document.getElementById('modal');
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }
    }

    // 确认对话框
    showConfirm(title, message, onConfirm, onCancel) {
        this.showModal(title, `<p class="text-gray-300">${message}</p>`, [
            {
                id: 'cancelBtn',
                text: '取消',
                class: 'px-4 py-2 bg-[#333] hover:bg-[#444] rounded-lg transition-colors',
                onClick: () => {
                    this.hideModal();
                    if (onCancel) onCancel();
                }
            },
            {
                id: 'confirmBtn',
                text: '确认',
                class: 'px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors',
                onClick: () => {
                    this.hideModal();
                    if (onConfirm) onConfirm();
                }
            }
        ]);
    }

    // 信息对话框
    showAlert(title, message, onClose) {
        this.showModal(title, `<p class="text-gray-300">${message}</p>`, [
            {
                id: 'closeBtn',
                text: '关闭',
                class: 'px-4 py-2 bg-[#00ccff] hover:bg-[#33d6ff] text-black rounded-lg transition-colors',
                onClick: () => {
                    this.hideModal();
                    if (onClose) onClose();
                }
            }
        ]);
    }

    // 格式化时间
    formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        } else {
            return `${minutes}:${secs.toString().padStart(2, '0')}`;
        }
    }

    // 格式化文件大小
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // 格式化日期
    formatDate(date) {
        if (!(date instanceof Date)) {
            date = new Date(date);
        }
        
        const now = new Date();
        const diff = now - date;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        
        if (days === 0) {
            const hours = Math.floor(diff / (1000 * 60 * 60));
            if (hours === 0) {
                const minutes = Math.floor(diff / (1000 * 60));
                return minutes < 1 ? '刚刚' : `${minutes}分钟前`;
            }
            return `${hours}小时前`;
        } else if (days === 1) {
            return '昨天';
        } else if (days < 7) {
            return `${days}天前`;
        } else {
            return date.toLocaleDateString('zh-CN');
        }
    }

    // 防抖函数
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // 节流函数
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // 复制到剪贴板
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showToast('已复制到剪贴板', 'success');
            return true;
        } catch (err) {
            console.error('复制失败:', err);
            this.showToast('复制失败', 'error');
            return false;
        }
    }

    // 滚动到顶部
    scrollToTop(smooth = true) {
        window.scrollTo({
            top: 0,
            behavior: smooth ? 'smooth' : 'auto'
        });
    }

    // 获取元素在视口中的位置
    isElementInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }

    // 创建空状态组件
    createEmptyState(title, message, icon = '📭') {
        return `
            <div class="text-center py-12">
                <div class="text-6xl mb-4">${icon}</div>
                <h3 class="text-xl font-semibold text-gray-300 mb-2">${title}</h3>
                <p class="text-gray-500">${message}</p>
            </div>
        `;
    }

    // 创建加载骨架屏
    createSkeleton(count = 3) {
        return Array(count).fill(0).map(() => `
            <div class="bg-[#222] rounded-lg p-4 animate-pulse">
                <div class="flex space-x-4">
                    <div class="w-16 h-16 bg-[#333] rounded-lg"></div>
                    <div class="flex-1 space-y-2">
                        <div class="h-4 bg-[#333] rounded w-3/4"></div>
                        <div class="h-3 bg-[#333] rounded w-1/2"></div>
                        <div class="h-3 bg-[#333] rounded w-1/4"></div>
                    </div>
                </div>
            </div>
        `).join('');
    }
}

// 创建全局UI工具实例
window.ui = new UIUtils();
