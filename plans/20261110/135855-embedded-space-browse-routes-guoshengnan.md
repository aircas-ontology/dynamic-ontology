# 对象与主题空间浏览嵌入模式

## 需求理解

对象空间浏览和主题空间浏览路由进入空间后应继续保留 `userName`，使嵌入式自动登录和布局状态在后续页面持续生效；主题管理嵌入模式保留创建入口。

## 修改范围

- 对象空间浏览跳转透传当前 `userName`。
- 主题空间浏览跳转透传当前 `userName`。
- 新增路由跳转回归测试。

## 文件

- 修改 `src/views/OntologySpaceManagement/index.vue`
- 修改 `src/views/OntologySpaceManagement/composables/useSpaceManagementActions.ts`
- 修改 `src/views/ThemeSpaceManagement/index.vue`
- 修改 `tests/space-browse.test.mjs`

## 核心实现

从当前路由读取非空 `userName`，仅在浏览模式进入空间的目标查询参数中追加该值；管理模式和主题管理创建入口保持现状。

## 依赖与验证

不新增依赖。执行相关测试、格式检查、类型检查、构建验证和 `git diff --check`。

## 实施与验证记录

- 对象空间浏览和主题空间浏览进入空间时会透传当前非空 `userName`；主题管理创建入口保持原有 `:show-create="!browseOnly"` 行为。
- `node --test tests/space-browse.test.mjs`：10 个测试全部通过，包含嵌入用户参数透传断言。
- 相关文件 Prettier 检查、`git diff --check`：通过。
- `npm run build:verify`：通过，产物写入系统临时目录。
- `npm run type-check`：失败，错误均来自现有未修改文件（Agent API、应用文档、概念层级树、行为表单及主题空间既有类型问题）；未扩大范围修复。
