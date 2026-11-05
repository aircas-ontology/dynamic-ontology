# 数据源构建第一步对象信息

- 需求：在向导第一步 schema 选择上方填写对象名称和对象分类；外部入口移除分类选择。
- 修改：DatasourceBuildDialog.vue、OntologyObjectCreateDialog.vue，以及 tests/asset-entry-flow.test.mjs、tests/datasource-schema-flow.test.mjs、必要的向导相关测试。
- 实现：向导接收分类树，第一步填写名称和分类并校验必填及分类有效性；上下步切换保留信息；最终事件携带名称及分类，草稿 displayName/categoryId 使用填写值，apiName 保持主表现有规则。
- 新增：本方案；无删除文件，无新增依赖。保留已有字段说明等工作区修改。
- 验证：先更新测试确认失败，再实现并验证；执行相关测试、npm test、test:coverage、type-check、build:verify、限定文件格式检查及 git diff --check。浏览器工具不可用时记录缺口并交人工验收。
- 已获用户确认，不修改受保护目录，不进行无关重构。
