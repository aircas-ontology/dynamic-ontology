# 需求理解

依据已确认的任务，为 Knife4j 操作 `OntologyActionController_createAction` 生成接口说明 Prompt，参照 `docs/20261015/1.createActionCategoryApi.md`，并将接口路径补充 `/ontology` 前缀。

# 修改范围

新增一个日期归档目录下的 API Markdown 文档；不修改业务源码、配置或受保护目录。

# 新增、修改和删除文件

- 新增 `docs/20261019/1.createOntologyActionApi.md`
- 不修改或删除其他文件。

# 核心实现方式

根据仓库内缓存的 OpenAPI 文档数据提取 POST `/action` 的请求模型 `ActionCreateOrUpdateParam` 与响应模型 `RestResult`，整理请求字段、嵌套映射模型、响应结构、状态码和实现示例；最终 URI 写为 `/ontology/action`。

# 新增依赖及必要性

无。

# 验证方式

执行针对新增 Markdown 文件的 Prettier 格式检查、`git diff --check`，并检查工作区变更范围。
