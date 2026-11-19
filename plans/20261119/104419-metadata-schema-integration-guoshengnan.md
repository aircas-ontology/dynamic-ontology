# 元数据接口对接

- 需求：保留输入、枚举、范围三种类型；每行增加编辑，对接四个元数据接口。
- 范围：属性面板元数据组件、页面私有适配工具、API、API 类型及统一出口、相关测试、四份接口 MD。
- 新增：metadataSchemaApi.ts、metadataSchemaType.ts、metadataSchemaAdapter.ts、metadata-schema-api.test.mjs；修改现有元数据组件、页面入口、API/类型出口及接口文档；不删除文件。
- 实现：GET 接收 unknown 并校验结构，支持嵌套对象或数组；无法构建树时明确提示缺失字段。POST/PUT 使用 valueType/value；DELETE 使用 JSON 请求体。编辑复用表单并锁定父级。补齐查询与命令状态、防重复提交、过期响应保护及销毁处理；不使用 Mock 回落。
- 在线业务读取返回 401，真实数据结构需登录环境验证，不假称已验证；不访问凭据存储。
- 无新增依赖。保留工作区既有修改，不触碰 public/html。
- 验证：TDD 先验证适配与序列化失败再实现；运行 npm test、test:coverage、check:types-conventions、type-check、build:verify、限定文件格式检查和 diff 检查。浏览器工具可用时仅冒烟受影响流程；人工验收另行执行。
