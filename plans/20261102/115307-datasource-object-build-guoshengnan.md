# 数据源构建对象

- 用户已确认：迁移 github-project 原型的模拟数据源构建流程。
- 需求：创建对象入口增加数据源构建，包含数据库类型、模拟连接与历史连接、主子表、字段和外键校验。
- 修改：ObjectWorkspacePanel/index.vue、components/OntologyObjectCreateDialog.vue；src/types/pages/ontologyWorkspaceType.ts（如已有页面类型可直接扩展）及类型出口。
- 新增：页面私有 DatasourceBuildDialog.vue、composables/useDatasourceBuild.ts；页面类型、src/mocks/datasourceBuildMock/datasourceBuildMock.ts、tests/datasource-build.test.mjs。
- 删除：无。依赖：无。
- 实现：MySQL/PostgreSQL 四步向导；显式模拟标记；只调用现有对象创建流程并刷新列表，不向未定义接口提交连接、字段、外键。历史连接限当前页面会话，不持久化密码。
- 状态：防重复操作，关闭/修改连接后废弃过期响应；错误明确可重试；返回步骤保留有效选择。
- 验证：TDD 行为测试，npm test、test:coverage、check:types-conventions、type-check、build:verify、check:project-conventions，限定文件格式检查和 git diff --check。浏览器仅检查本次向导、暗亮主题、键盘和溢出；UI 视觉不适合以当前 Node 测试入口自动化，以浏览器检查替代（项目无 E2E 入口）。人工最终验收待用户。
- 保留已有 SpaceActions.vue 和 plans/20261030 修改；不触碰 public、html，不修改原型项目。
