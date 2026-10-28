# Views 目录规范更新 Plan

## 需求理解

总结并补充 `src/views` 的页面组织、页面私有模块边界及公共目录引用规则，同时避免与现有目录规范冲突。

## 修改范围

- 仅更新 `src/views/readme.md`。
- 将用户确认的冲突处理结果写入规范：使用 `src/router`、`@/utils`，页面私有样式就近维护，页面内部实现类型允许遵循 `src/types` 规范就近定义。

## 文件变更

- 新增：本 Plan 文件。
- 修改：`src/views/readme.md`。
- 删除：无。

## 核心实现方式

- 明确 `src/views` 的直接子目录为页面目录，每个页面以 `index.vue` 为主入口。
- 说明页面私有组件、工具函数和 composables 的推荐组织方式。
- 禁止页面之间直接引用私有组件、函数或其他私有实现。
- 通过链接指向 types、stores、apis、assets、mocks、router、styles、utils 和 components 的现行目录规范，不在 Views 规范中重复或覆盖其详细规则。
- 明确全局组件仅在用户决定提取后进入 `src/components`；已注册组件可直接使用。

## 新增依赖及必要性

无。

## 验证方式

- 检查 Markdown 结构和内部相对链接。
- 执行 `git diff --check`。
- 检查任务相关 diff 与 `git status --short`，确认无计划外修改。
