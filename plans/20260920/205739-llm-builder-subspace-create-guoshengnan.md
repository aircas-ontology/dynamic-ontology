# 本体大模型构建与子空间构建页面

## 需求理解

新增本体大模型构建页面和子空间构建页面，页面视觉和基础交互参考原型；接入现有本体新建弹窗的大模型构建入口，以及空间列表更多菜单中的子空间入口。本轮不新增后端接口，页面使用现有空间/分类数据能力或页面内示例状态完成原型交互。

## 修改范围

- 新增 `OntologyLlmBuilder` 页面：流程步骤、第一步表单、Copilot 建议、推荐资料、上下步操作和返回空间。
- 新增 `OntologySubspaceCreate` 页面：子空间名称/API 名称、分类树搜索与勾选、全选/清空、步骤信息和返回/下一步。
- 在空间内管理路由下增加两个懒加载子路由。
- 将对象新建弹窗的大模型入口改为跳转大模型构建页。
- 将空间列表的子空间操作改为跳转子空间构建页，并传递空间标识和名称。

## 文件

新增：

- `src/views/OntologyLlmBuilder/index.vue`
- `src/views/OntologySubspaceCreate/index.vue`
- `plans/YYYYMMDD/HHmmss-llm-builder-subspace-create-guoshengnan.md`

修改：

- `src/router/modules/workspaceRoutes.ts`
- `src/views/OntologySpaceManagementDetail/components/ObjectWorkspacePanel.vue`
- `src/views/OntologySpaceManagement/composables/useSpaceManagementActions.ts`

## 核心实现

- 复用现有 `layout`、面包屑、Element Plus 控件、`aircas-*` 类和主题变量。
- 大模型页维护当前步骤、表单草稿、标签选择、目标粒度和语言状态；下一步推进步骤并在末步给出完成反馈，返回按钮回到空间详情。
- 子空间页维护分类树筛选和勾选状态，显示选中数量；树节点使用递归数据，完成全选、清空、搜索和下一步提示；返回回到空间管理列表。
- 处理按钮禁用、空选择、移动端溢出和可访问名称。
- 不新增依赖、不修改 `html/` 和 `public/`。

## 验证

- 运行相关文件的 Prettier 检查。
- 运行 `npm test`、`npm run test:coverage`、`npm run type-check`、`npm run build:verify`、`git diff --check`。
- 检查 `git status --short`，确认只包含本任务变更和既有用户修改。
