# 获取对象空间画布内容接口说明计划

## 需求理解

根据在线 OpenAPI 文档，为 `GET /space/canvas` 生成一份独立的 API Markdown 说明，覆盖请求参数、响应包裹结构以及画布对象、属性和关系字段。

## 修改范围

- 新增 `docs/20261103/2.getSpaceCanvasContentApi.md`。
- 不修改业务源码、接口实现、Mock、依赖或受保护目录。

## 核心实现方式

- 按 `docs/readme.md` 的 API Prompt 命名约定归档。
- 原样记录接口方法、路径、参数类型、响应模型和 OpenAPI 中定义的字段约束。
- 对嵌套模型 `CanvasOntology`、`CanvasProperty`、`CanvasLink` 进行分层字段说明。
- 标注在线文档未提供完整响应示例，示例仅使用文档中明确给出的字段和值。

## 新增依赖

无。

## 验证方式

- 使用 Prettier 检查新增 Markdown 文件。
- 使用 `git diff --check` 检查空白和格式问题。
- 检查任务相关 diff 和工作区状态，确认仅包含本次新增文档及计划。
