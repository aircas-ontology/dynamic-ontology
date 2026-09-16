# 本体空间管理页面样式与 Mock 整理

## 需求理解
参考原型页面调整本体空间管理页面展示，去除渐变视觉，复用 Aircas 主题变量；按项目规范整理并使用页面 Mock。

## 修改范围
- 页面及其私有组件的布局、背景、边框、按钮和弹窗样式。
- 本体空间管理页面现有 Mock 的目录、命名、类型复用和引用方式。
- 不修改公共样式，不新增依赖，不触碰 public/html。

## 核心实现
- 将页面私有渐变背景替换为主题变量纯色。
- 检查 WelcomePanel、StatCard、SectionToolbar、SpaceTable、SpaceActions、SpaceFormDialog 及弹窗组件中的渐变，替换为纯色主题变量。
- 保留原有内容、操作和响应式结构。
- 确保 Mock 位于 src/mocks/ontologySpaceManagementMock/ontologySpaceManagementMock.ts，并复用正式类型。

## 验证
npm run type-check
npm run build:verify
npm run check:project-conventions
git diff --check
