# 自动关联数据源回显

## 需求理解

对象属性“关联数据源”弹窗触发自动关联成功后，保持弹窗打开，并立即以服务端最新属性数据回显数据源字段与属性之间的连线。

## 修改范围

- `src/views/OntologyObjectDetail/components/OntologyObjectAttributePanel.vue`
- `src/views/OntologyObjectDetail/components/DataSourceAssociateDialog.vue`
- `tests/data-source-associate-dialog.test.mjs`
- 本 Plan 文件

不修改 API 合约、公共类型、主题、依赖、`public/` 或 `html/`。

## 核心实现方式

1. 自动关联接口成功后，重新查询当前空间的数据源表、当前对象的属性详情和所有已关联表的字段。
2. 由父组件基于最新详情重建传给弹窗的属性映射数据。
3. 为关联弹窗提供显式同步方法，在弹窗保持打开时将服务端映射设为保存基线和草稿映射，更新已显示表、清理当前选择并重新计算连线。
4. 刷新完成后显示成功提示；若自动关联已成功但回显刷新失败，保留弹窗并明确提示结果刷新失败。
5. 自动关联以服务端结果为准，清除弹窗中尚未提交的手动映射草稿。

## 文件变更

- 修改 `OntologyObjectAttributePanel.vue`：编排自动关联后的重查、字段加载和弹窗同步。
- 修改 `DataSourceAssociateDialog.vue`：增加受控的服务端映射同步公开方法。
- 修改 `data-source-associate-dialog.test.mjs`：先覆盖自动关联回显所需的重查和同步调用，再实现逻辑；同时修正已失效的初始加载接口断言。
- 新增本 Plan 文件。

## 新增依赖

无。复用现有 API、响应类型、Element Plus 消息提示和 Vue 响应式能力。

## 验证方式

1. 先运行更新后的定向测试，确认在实现前失败，再确认通过。
2. 执行 `npm test` 和 `npm run test:coverage`。
3. 执行 `npm run type-check` 与 `npm run build:verify`。
4. 对任务文件执行受限 Prettier 格式化及格式检查。
5. 检查任务相关 diff、`git diff --check` 和 `git status --short`，确认不含计划外改动。
