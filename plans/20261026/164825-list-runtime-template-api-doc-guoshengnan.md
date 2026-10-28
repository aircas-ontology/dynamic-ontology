# 限流配置模板列表接口说明生成方案

- 需求理解：根据用户指定的 listTemplates 接口生成说明，结构参考 `docs/20261019/1.createOntologyActionApi.md`。
- 确认记录：用户已明确确认本方案。
- 修改范围：仅新增接口说明和本方案记录，不接入业务代码。
- 新增文件：`docs/20261026/2.listFunctionRateLimitTemplateApi.md`、本方案文件。
- 修改、删除文件：无。
- 核心实现：依据已读取的 OpenAPI，说明 GET 路径、可选 enabled 查询条件、数组响应和模板字段，提供 types、apis、mocks 示例，区分接口契约与演示值。
- 新增依赖：无。
- 验证方式：核对字段、路径、方法与来源定义一致；对新增 Markdown 执行定向格式检查和 git diff --check。纯文档不运行应用测试和构建。
