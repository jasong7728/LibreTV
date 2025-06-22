# LibreTV v1 到 v2 迁移指南

## 版本概述

LibreTV v2 是对 v1 的重大升级，从多页面应用（MPA）重构为单页面应用（SPA），提供更现代化的用户体验。

## 主要变化

### 1. 架构变化
- **v1**: 多个 HTML 页面 (index.html, player.html, watch.html, about.html)
- **v2**: 单个 index.html 页面 + 多个视图

### 2. 导航变化
- **v1**: 顶部导航栏
- **v2**: 左侧边栏导航

### 3. 页面结构变化
- **v1**: 每个页面都有页脚，显示版本信息
- **v2**: 无页脚，版本信息移至关于页面

## 迁移步骤

### 对于新部署

直接使用 `/libretv-v2/` 目录即可，无需特殊配置。

### 对于现有部署升级

#### 1. 备份现有配置
```bash
# 备份用户设置和历史记录
# 这些数据存储在浏览器 localStorage 中，升级不会丢失
```

#### 2. 部署 v2 版本

##### Vercel 部署
```bash
# 使用 v2 目录
cd libretv-v2

# 确保 vercel.json 配置正确
# 已包含 SPA 路由重定向规则
```

##### Netlify 部署
```bash
# 使用 v2 目录
cd libretv-v2

# 确保 netlify.toml 配置正确
# 已包含 SPA 路由处理和函数配置
```

##### Cloudflare Pages 部署
```bash
# 使用 v2 目录
cd libretv-v2

# 确保环境变量配置正确
# 已包含中间件和函数支持
```

##### Docker 部署
```bash
# 使用 v2 的 docker-compose.yml
cd libretv-v2

# 端口已修改为 8900 避免与 v1 冲突
docker-compose up -d
```

#### 3. 环境变量配置

v2 版本使用与 v1 相同的环境变量：

```bash
# 基础配置
PASSWORD=your_password          # 普通用户密码
ADMINPASSWORD=your_admin_pwd    # 管理员密码

# 代理配置（可选）
DEBUG=false                     # 调试模式
CACHE_TTL=86400                # 缓存时间（秒）
MAX_RECURSION=5                # 最大递归深度
USER_AGENTS_JSON=["UA1","UA2"] # 用户代理列表（JSON格式）
```

#### 4. DNS 和域名配置

如果使用自定义域名：

```bash
# 方式1: 更新域名指向 v2 部署
your-domain.com -> libretv-v2 部署

# 方式2: 使用子域名
v2.your-domain.com -> libretv-v2 部署
classic.your-domain.com -> libretv-v1 部署（保留）
```

## 功能对比

| 功能 | v1 | v2 | 说明 |
|------|----|----|------|
| 搜索 | ✅ | ✅ | 功能保持一致 |
| 播放 | ✅ | ✅ | 增加离开自动暂停 |
| 豆瓣热门 | ✅ | ✅ | 增强懒加载和批量加载 |
| 历史记录 | ✅ | ✅ | 增加直接跳转播放 |
| 设置管理 | ✅ | ✅ | 界面更清晰 |
| API 管理 | ✅ | ✅ | 功能无变化 |
| PWA 支持 | ✅ | ✅ | 保持一致 |
| 代理功能 | ✅ | ✅ | 代码优化 |

## 数据迁移

### 用户设置和历史记录

v2 版本会自动读取 v1 的用户数据：

- **API 配置**: 存储在 `localStorage`，自动继承
- **播放历史**: 存储在 `localStorage`，自动继承  
- **用户设置**: 存储在 `localStorage`，自动继承
- **自定义 API**: 如有配置，自动继承

### 书签更新

用户需要更新书签地址：

```bash
# 旧地址示例
https://your-domain.com/player.html?url=xxx
https://your-domain.com/watch.html

# 新地址（v2 SPA 会自动处理这些路由）
https://your-domain.com/player.html?url=xxx  # 自动重定向到播放视图
https://your-domain.com/watch.html           # 自动重定向到历史视图
https://your-domain.com/                     # 主页（搜索视图）
```

## 兼容性说明

### 1. 浏览器兼容性
- **最低要求**: 与 v1 相同
- **推荐浏览器**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

### 2. 移动端兼容性
- v2 优化了移动端侧边栏体验
- 触摸操作更友好
- 响应式设计改进

### 3. PWA 功能
- Service Worker 保持兼容
- 离线功能正常
- 安装到主屏幕功能正常

## 故障排除

### 1. 页面空白或加载失败
```bash
# 检查控制台错误
# 确保所有 JS/CSS 文件正确加载
# 检查网络请求是否正常
```

### 2. 代理功能异常
```bash
# 检查环境变量配置
# 确保 API 函数正确部署
# 检查 CORS 配置
```

### 3. 设置丢失
```bash
# 检查浏览器是否清除了 localStorage
# 尝试重新导入配置文件
# 检查域名是否变化
```

### 4. 播放问题
```bash
# 检查播放器初始化
# 确保代理功能正常
# 检查控制台播放相关错误
```

## 回滚方案

如果需要回滚到 v1：

### 1. 保持 v1 部署
```bash
# 建议在升级时保留 v1 部署
# 可以快速切换回 v1
```

### 2. 域名切换
```bash
# 修改 DNS 记录指向 v1 部署
# 或使用不同的子域名
```

### 3. 数据保留
```bash
# v2 不会修改 v1 的用户数据
# localStorage 数据可在两个版本间共享
```

## 技术支持

### 1. 问题反馈
- 创建 Issue 描述问题
- 提供浏览器控制台错误信息
- 说明部署平台和配置

### 2. 功能建议
- 提交 Feature Request
- 详细描述需求场景
- 说明预期效果

### 3. 贡献代码
- Fork 项目仓库
- 创建功能分支
- 提交 Pull Request

## 总结

LibreTV v2 提供了更现代化的用户体验，建议所有用户升级。升级过程简单，数据无损，功能增强。如有问题，可参考本指南或寻求技术支持。

---

迁移指南版本: v2.0
最后更新: 2025-06-22
