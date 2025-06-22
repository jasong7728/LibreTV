// LibreTV V2.0 存储工具类
class StorageUtils {
    constructor() {
        this.prefix = 'libretv_';
    }

    // 带前缀的键名
    getKey(key) {
        return this.prefix + key;
    }

    // 设置数据
    set(key, value) {
        try {
            const data = {
                value,
                timestamp: Date.now()
            };
            localStorage.setItem(this.getKey(key), JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('存储数据失败:', error);
            return false;
        }
    }

    // 获取数据
    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(this.getKey(key));
            if (!item) return defaultValue;

            const data = JSON.parse(item);
            return data.value;
        } catch (error) {
            console.error('读取数据失败:', error);
            return defaultValue;
        }
    }

    // 获取带时间戳的数据
    getWithTimestamp(key) {
        try {
            const item = localStorage.getItem(this.getKey(key));
            if (!item) return null;

            return JSON.parse(item);
        } catch (error) {
            console.error('读取数据失败:', error);
            return null;
        }
    }

    // 删除数据
    remove(key) {
        try {
            localStorage.removeItem(this.getKey(key));
            return true;
        } catch (error) {
            console.error('删除数据失败:', error);
            return false;
        }
    }

    // 清空所有数据
    clear() {
        try {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith(this.prefix)) {
                    localStorage.removeItem(key);
                }
            });
            return true;
        } catch (error) {
            console.error('清空数据失败:', error);
            return false;
        }
    }

    // 检查数据是否存在
    exists(key) {
        return localStorage.getItem(this.getKey(key)) !== null;
    }

    // 获取存储大小
    getSize() {
        let total = 0;
        const keys = Object.keys(localStorage);
        
        keys.forEach(key => {
            if (key.startsWith(this.prefix)) {
                total += localStorage.getItem(key).length;
            }
        });

        return total;
    }

    // 获取所有键
    getAllKeys() {
        return Object.keys(localStorage)
            .filter(key => key.startsWith(this.prefix))
            .map(key => key.replace(this.prefix, ''));
    }

    // 批量设置
    setBatch(data) {
        const results = {};
        Object.keys(data).forEach(key => {
            results[key] = this.set(key, data[key]);
        });
        return results;
    }

    // 批量获取
    getBatch(keys, defaultValues = {}) {
        const results = {};
        keys.forEach(key => {
            results[key] = this.get(key, defaultValues[key]);
        });
        return results;
    }

    // 设置带过期时间的数据
    setWithExpiry(key, value, expiryTime) {
        const data = {
            value,
            timestamp: Date.now(),
            expiry: Date.now() + expiryTime
        };
        
        try {
            localStorage.setItem(this.getKey(key), JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('存储数据失败:', error);
            return false;
        }
    }

    // 获取带过期检查的数据
    getWithExpiry(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(this.getKey(key));
            if (!item) return defaultValue;

            const data = JSON.parse(item);
            
            // 检查是否过期
            if (data.expiry && Date.now() > data.expiry) {
                this.remove(key);
                return defaultValue;
            }

            return data.value;
        } catch (error) {
            console.error('读取数据失败:', error);
            return defaultValue;
        }
    }

    // 清理过期数据
    cleanExpired() {
        const keys = Object.keys(localStorage);
        let cleaned = 0;

        keys.forEach(fullKey => {
            if (fullKey.startsWith(this.prefix)) {
                try {
                    const data = JSON.parse(localStorage.getItem(fullKey));
                    if (data.expiry && Date.now() > data.expiry) {
                        localStorage.removeItem(fullKey);
                        cleaned++;
                    }
                } catch (error) {
                    // 数据格式错误，删除
                    localStorage.removeItem(fullKey);
                    cleaned++;
                }
            }
        });

        return cleaned;
    }

    // 数组操作：添加项目
    addToArray(key, item, maxLength = null) {
        const array = this.get(key, []);
        
        // 移除重复项
        const index = array.findIndex(existing => 
            JSON.stringify(existing) === JSON.stringify(item)
        );
        
        if (index > -1) {
            array.splice(index, 1);
        }

        // 添加到开头
        array.unshift(item);

        // 限制数组长度
        if (maxLength && array.length > maxLength) {
            array.splice(maxLength);
        }

        this.set(key, array);
        return array;
    }

    // 数组操作：移除项目
    removeFromArray(key, predicate) {
        const array = this.get(key, []);
        const newArray = array.filter(item => !predicate(item));
        this.set(key, newArray);
        return newArray;
    }

    // 对象操作：更新属性
    updateObject(key, updates) {
        const obj = this.get(key, {});
        const updatedObj = { ...obj, ...updates };
        this.set(key, updatedObj);
        return updatedObj;
    }

    // 计数器操作
    increment(key, step = 1) {
        const current = this.get(key, 0);
        const newValue = current + step;
        this.set(key, newValue);
        return newValue;
    }

    decrement(key, step = 1) {
        return this.increment(key, -step);
    }

    // 导出数据
    export() {
        const data = {};
        const keys = this.getAllKeys();

        keys.forEach(key => {
            data[key] = this.getWithTimestamp(key);
        });

        return {
            version: '2.0.0',
            timestamp: Date.now(),
            data
        };
    }

    // 导入数据
    import(exportData) {
        if (!exportData || !exportData.data) {
            throw new Error('无效的导入数据');
        }

        const results = {};
        Object.keys(exportData.data).forEach(key => {
            try {
                const item = exportData.data[key];
                localStorage.setItem(this.getKey(key), JSON.stringify(item));
                results[key] = true;
            } catch (error) {
                results[key] = false;
                console.error(`导入 ${key} 失败:`, error);
            }
        });

        return results;
    }

    // 获取统计信息
    getStats() {
        const keys = this.getAllKeys();
        let totalSize = 0;
        let expiredCount = 0;
        const now = Date.now();

        keys.forEach(key => {
            const fullKey = this.getKey(key);
            const item = localStorage.getItem(fullKey);
            
            if (item) {
                totalSize += item.length;
                
                try {
                    const data = JSON.parse(item);
                    if (data.expiry && now > data.expiry) {
                        expiredCount++;
                    }
                } catch (error) {
                    // 忽略解析错误
                }
            }
        });

        return {
            totalKeys: keys.length,
            totalSize,
            expiredCount,
            formatSize: this.formatBytes(totalSize)
        };
    }

    // 格式化字节数
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// 创建全局存储工具实例
window.storage = new StorageUtils();
