# 嵌入模式布局隐藏方案

## 需求理解

当访问 `/workspace/ontology-space-management` 路由且 URL 携带 `userName` 查询参数时（如 `?userName=123124112312`），页面需进入"嵌入模式"：隐藏顶部栏（HeaderBar）和左侧导航栏（NavigationMenu），使内容区域占满全屏。该场景用于将本体空间管理页面嵌入到外部系统（如 iframe）中，无需展示应用自身导航框架。

## 修改范围

仅修改 `src/layout/index.vue`，无需修改路由配置、HeaderBar/NavigationMenu 组件内部。

## 新增、修改和删除文件

| 文件 | 操作 |
|---|---|
| `src/layout/index.vue` | 修改 |

## 核心实现方式

1. 引入 `useRoute`，创建 `isEmbedded` 计算属性：`!!route.query.userName`
2. 对 `HeaderBar` 和 `NavigationMenu` 增加 `v-if="!isEmbedded"`
3. 根容器 `.layout-shell` 和 `.layout-workspace` 增加 `is-embedded` 修饰类，动态调整 CSS Grid：
   - `.layout-shell.is-embedded`：`grid-template-rows: minmax(0, 1fr)`（去掉 50px 顶部行）
   - `.layout-workspace.is-embedded`：`grid-template-columns: minmax(0, 1fr)`（去掉 60px/200px 左侧列）

## 新增依赖

无。

## 验证方式

1. `npm run type-check` 通过
2. `npm run build:verify` 通过
3. `npm run format:check -- src/layout/index.vue` 通过
4. 浏览器验证：访问带 `userId` 和不带 `userId` 的 URL，对比布局差异
