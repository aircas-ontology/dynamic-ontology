# 需求理解

依据已确认任务，为 `OntologyActionController_delete` 生成接口说明文档，参照行为分类接口文档格式，并为接口路径补充 `/ontology` 前缀。

# 修改范围

新增 API Prompt 文档及对应实施计划；不修改业务源码、配置或受保护目录。

# 新增、修改和删除文件

- 新增 `docs/20261019/3.deleteOntologyActionApi.md`
- 新增本计划文件
- 不修改或删除其他文件。

# 核心实现方式

根据仓库缓存的 OpenAPI 定义整理 DELETE `/action/{actionApi}`，路径补全为 `/ontology/action/{actionApi}`，请求参数为必填 path 参数 `actionApi`，响应模型为 `RestResult`，并补充 API、类型和 Mock 示例。

# 新增依赖及必要性

无。

# 验证方式

执行新增 Markdown 文件的 Prettier 格式检查和 `git diff --check`，复核工作区变更范围。
