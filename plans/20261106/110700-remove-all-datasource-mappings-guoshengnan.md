# 需求理解

在属性关联数据源弹窗的关联区域右下角增加“全部删除”，将当前对象所有属性的数据源关联临时移入操作缓存，由缓存区提交时统一保存。

# 修改范围

- 修改 `src/views/OntologyObjectAttributePanel/components/DataSourceAssociateDialog.vue`，增加按钮和批量清空关联草稿的操作。
- 修改 `tests/data-source-associate-dialog.test.mjs`，通过真实组件状态逻辑测试批量删除、已暂存新增或替换、回退、重复点击和提交失败后的重试。
- 新增本计划，不删除文件，不修改接口或其他业务模块。

# 核心实现方式

对弹窗全部属性的当前草稿关联执行一次批量清空，包括未显示连线的关联。已保存的关联通过现有差异计算显示为删除操作；新建但未提交的关联取消添加。沿用现有回退、提交、失败提示与批量更新接口。提交中或没有当前关联时禁用按钮。

# 新增依赖

无，使用现有 Vue 和 Element Plus。

# 验证方式

先编写行为测试并确认目标行为未实现时失败，再完成实现。执行相关测试、`npm test`、`npm run test:coverage`、`npm run type-check`、`npm run build:verify`、任务文件格式检查、`git diff --check` 和改动范围检查。尽可能对弹窗执行浏览器冒烟验证，并记录无法执行的项目。
