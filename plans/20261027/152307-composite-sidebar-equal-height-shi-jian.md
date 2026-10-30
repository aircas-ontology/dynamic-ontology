# 编排侧栏逻辑与空间函数各占 50% 高度

## 需求理解

函数编排工作流左侧「逻辑」与「当前空间函数」两块区域高度一致，各占约 50%。

## 修改范围

- `FunctionOperatorCompositeWorkflowDialog.vue` 模板与 scoped 样式

## 新增、修改和删除文件

**修改**

- `src/views/FunctionOperatorPanel/components/FunctionOperatorCompositeWorkflowDialog.vue`

## 核心实现方式

两块 section 均 `flex: 1 1 0`；逻辑列表可滚动；左栏 `overflow: hidden`。

## 新增依赖

无。

## 验证方式

- `npm run format:check -- <本任务文件>`
- 人工目视暗亮主题下侧栏对半与列表溢出滚动
