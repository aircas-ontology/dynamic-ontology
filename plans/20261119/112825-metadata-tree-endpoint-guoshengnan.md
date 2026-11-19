# 元数据树查询接口切换

- 需求：使用新树查询接口并同步接口 MD。
- 范围：修改 `src/apis/metadataSchemaApi.ts`、`tests/metadata-schema-api.test.mjs`、`docs/20261119/1.getMetadataSchemaApi.md`；新增本 Plan，不删除文件。
- 实现：GET 改为 `/ontology/property/metadata_schema/tree`，保留参数和运行时校验，文档记录递归 VO 结构及在线模型未标记必填的事实；其他三个接口保持现状。
- 依赖：无新增依赖。
- 验证：先更新请求测试并确认旧地址失败，再实现并运行测试；执行全量测试、覆盖率、类型检查、临时构建、限定文件格式检查与 diff 检查。真实接口需登录，无法取得真实响应时明确说明。
