# 运行配置模板删除与启停接口

- 需求理解：分别生成删除、启用、停用接口说明，并对接弹框对应操作；用户已明确确认。
- 新增文件：docs/20261026/3.deleteFunctionRateLimitTemplateApi.md、4.enableFunctionRateLimitTemplateApi.md、5.disableFunctionRateLimitTemplateApi.md；三个对应 src/types/apis/*FunctionRateLimitTemplateType.ts、src/mocks/*FunctionRateLimitTemplateMock/*FunctionRateLimitTemplateMock.ts；本方案。
- 修改文件：src/apis/functionRateLimitTemplateApi.ts、src/apis/index.ts、src/types/index.ts、src/mockData/routes.json、RuntimeConfigTemplateDialog.vue、runtimeTemplateState.ts、tests/runtime-config-template.test.mjs。
- 删除文件：无。新增依赖：无。
- 契约映射：删除 DELETE /ontology/function/rate_limit_template；启用 PUT /ontology/function/rate_limit_template/enable；停用 PUT /ontology/function/rate_limit_template/disable。均为必填 query id（integer/int64），无 body，RestResultVoid 的 data 未定义具体结构，以 unknown 表示；Mock 复用 common/success.json，演示值不视为固定契约。
- 核心方式：删除先确认，启停按目标值选接口；请求成功后刷新全部列表，失败保留原记录与状态并显示错误；提交期间禁用其他操作与关闭，查询刷新失败独立显示，避免误报命令失败或重复提交。
- 验证：先写并运行失败测试，再实现；覆盖请求方法路径及 query、成功刷新、业务与网络失败、重复调用、非法 ID、启停目标值、删除取消不发请求。执行 npm test、test:coverage、check:types-conventions、type-check、build:verify、格式检查和 diff 检查；浏览器或真实后端验证未执行时明确记录。
- 边界：不顺带修改前序发现的列表字段校验和 Mock 持久化问题；不触碰 public 与 html。
