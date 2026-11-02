# 运行配置模板查询与保存刷新

- 需求理解：每次打开弹框查询全部模板，创建与编辑保存成功后重新查询。
- 用户已确认：同时接入 PUT 更新接口；删除和启停保持本地逻辑。
- 修改文件：functionRateLimitTemplateApi.ts 及 API 出口、类型出口、运行配置弹框与状态工具、HTTP Mock routes.json、runtime-config-template.test.mjs。
- 新增文件：列表和更新类型、列表样例 Mock、GET 与 PUT fixture、本方案。
- 删除文件：无。新增依赖：无。
- 契约映射：GET /ontology/function/rate_limit_template/list 使用可选 query enabled，弹框调用省略参数；data 为 FunctionRateLimitTemplate 数组。PUT /ontology/function/rate_limit_template 使用 JSON FunctionRateLimitTemplate，携带原模板 id，响应同模型。复用现有创建模型结构；列表类型独立命名。API 使用 getListFunctionRateLimitTemplateInterface 与 putUpdateFunctionRateLimitTemplateInterface。
- 核心方式：打开监听触发查询，关闭或销毁令请求失效；列表包含 loading、empty、error 和重试；保存失败保留草稿，保存成功关闭草稿再刷新，刷新失败单独提示避免重复保存；请求中阻止重复操作。
- 验证：先写行为失败测试，再实现查询映射、空数据、业务及网络失败、重复请求、过期响应、更新失败与保存刷新流程。运行 npm test、test:coverage、类型规范、type-check、build:verify、格式与 diff 检查。运行时浏览器检查若受环境限制如实记录。
