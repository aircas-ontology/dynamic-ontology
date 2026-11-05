# 数据源构建说明传参

- 需求：对象 description 使用主表说明，属性 columns[].description 使用对应字段说明，缺失说明传空字符串；保留 displayName 现有映射。
- 修改：src/views/ObjectWorkspacePanel/composables/useObjectWorkspaceObjectActions.ts、src/types/apis/buildObjectFromDatasourceType.ts、tests/datasource-create-error.test.mjs。
- 新增：本方案；无删除文件，无新增依赖。
- 实现：组装请求时从所选主表 comment 和字段 description 获取说明，属性类型补充 description。
- 验证：先更新行为测试确认失败，再实现；运行相关测试、npm test、test:coverage、check:types-conventions、type-check、build:verify、限定文件格式检查及 git diff --check；接口及界面由人工最终验收。
- 用户已确认，保留其他工作区修改，不触碰受保护目录。
