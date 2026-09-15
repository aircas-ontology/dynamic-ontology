# Composables 目录规范建设 Plan

## 需求理解

在 `src/composables` 建立项目级全局 composables 的目录规范，明确文件命名、分类、职责边界和引用方式；同时在 Views 规范中说明页面可直接引用全局 composables，并同步根规范中的目录导航。

## 修改范围

- 为 `src/composables` 新增目录规范。
- 更新 `src/views/readme.md` 中页面私有与全局 composables 的依赖边界。
- 更新 `AGENTS.md` 中的仓库导航和 `src` 目录结构。
- 不新增实际 composable，不修改应用代码、配置、依赖或其他目录规范。

## 文件变更

- 新增：`src/composables/readme.md`
- 修改：`src/views/readme.md`
- 修改：`AGENTS.md`
- 新增：`plans/20260915/105108-composables-directory-guidelines.md`
- 删除：无

## 核心实现方式

1. 将全局 composables 按 `shared` 或业务领域分类，分类目录使用 camelCase。
2. 文件与具名导出统一采用 `use<Name>.ts` 和 `use<Name>`。
3. 只有具有明确跨页面或公共组件复用需求的项目级响应式逻辑进入 `src/composables`；页面、组件、工具函数和共享状态分别遵循其现有归属。
4. 业务代码通过 `@/composables/<category>/use<Name>` 显式导入，不引入自动导入机制。
5. 规范类型、响应式状态、副作用清理、异步行为、错误处理、依赖边界及测试要求。
6. Views 规范通过链接引用 Composables 规范，不重复其详细规则。

## 新增依赖及必要性

无新增依赖。

## 验证方式

- 执行 `npm run check:project-conventions`，检查 Markdown 链接及项目规范。
- 执行 `git diff --check`。
- 检查任务相关 diff 与 `git status --short`，确认没有计划外文件或受保护目录变更。

