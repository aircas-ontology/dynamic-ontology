# 查询本体对象接口说明文档计划

## 需求理解

根据在线 Knife4j 文档 `OntologyMetaController_getByCategoryId` 和现有创建接口说明，在 `docs/20260919/` 新增本体对象查询接口说明 Markdown。当前任务只生成接口契约文档，不修改业务源码。

## 修改范围

- 新增查询接口说明，记录 `GET /meta/category`、可选 `categoryId` 查询参数、响应字段、类型示例和 Mock 示例。
- 以 `DOMAIN_CONFIG.ONTOLOGYMANAGE_URL` 作为接口 domain，并沿用项目统一 `ApiResponse` 的 `success` 字段约定；同时注明在线文档 Schema 未展示该字段。

## 文件

- 新增：`docs/20260919/3.getOntologyObjectByCategoryIdApi.md`
- 不修改已有创建接口文档及业务源码。

## 验证方式

- 对新增 Markdown 执行 Prettier 格式化和格式检查。
- 执行 `git diff --check` 与 `git status --short`，确认仅包含任务范围内文件。
