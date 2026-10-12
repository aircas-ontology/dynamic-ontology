# 本体空间管理局部样式修复

- 确认日期：2026-10-10（Asia/Shanghai）。
- 用户已确认实施；以上次未提交的主题更新为基线，保留所有已有修改。

## 需求理解

修复本体空间管理页面 SectionToolbar 操作区挤成窄列，以及 WelcomePanel 内容区出现滚动条的问题。仅调整展示布局，不改变业务逻辑、数据流或交互。

## 修改范围与文件

- 修改 `src/views/OntologySpaceManagement/components/SectionToolbar.vue`。
- 修改 `src/views/OntologySpaceManagement/components/WelcomePanel.vue`。
- 新增本 Plan 文件；无删除文件。
- 不修改页面入口、全局主题、依赖、`public/` 或 `html/`。

## 核心实现方式

1. 将操作区上误用的 148px 宽度恢复为排序下拉框的局部宽度，保留搜索框 260px 宽度、间距和原有换行能力。
2. 欢迎卡片内容区依赖 Element Plus 卡片的 Flex 填充，移除多余的百分比高度，调整内边距和内容间距，使标题、说明及新建按钮完整容纳在现有 150px 卡片内。保留默认溢出能力，避免通过隐藏内容消除滚动条。
3. 保留新版主题、官方组件默认外观和此前未提交的所有其他更新。

## 新增依赖

无；现有 Vue、Element Plus 与 SCSS 能力足够。

## 验证方式

- 当前问题已在浏览器中复现：工具栏纵向堆叠、欢迎卡片可见滚动条。
- 本次为纯展示样式修改，按 AGENTS.md 7.2 免除单元测试、覆盖率和 E2E；现有源码文本检查无法验证实际几何布局，以浏览器视觉检查作为主要验证。
- 使用 code-formatting Skill，仅格式化与检查两个修改组件及本 Plan 文件。
- 执行 `npm run type-check`、`npm run build:verify`（产物仅写系统临时目录）。
- 执行 `npm run check:project-conventions` 检查局部样式是否符合当前主题规范。
- 浏览器检查受影响页面的暗亮主题、工具栏排列、欢迎卡片完整内容和滚动条，以及控件焦点、排序浮层与视图切换；缺少正式 Lint/E2E 入口如实记录。
- 交付前检查任务增量 diff、`git diff --check` 与 `git status --short`；既有无关检查失败单独说明，不扩大范围。
- 自动化检查、浏览器验证和人工最终验收分别报告。
