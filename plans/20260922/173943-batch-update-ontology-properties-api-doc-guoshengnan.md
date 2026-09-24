# 批量修改本体属性接口说明文档实施方案

## 需求理解

- 根据 Knife4j 在线接口 `OntologyPropertyController#batchUpdateProperties` 生成独立 API 说明文档。
- 文档遵循仓库 `docs/readme.md` 的日期目录和顺序命名规范。
- 接口路径按项目约定增加 `/ontology` 前缀，并补充 types、apis、mocks 示例。

## 修改范围

- 新增 `docs/20260922/1.batchUpdateOntologyPropertiesApi.md`。
- 不修改业务源码、接口实现、类型或 Mock 文件。

## 核心内容

- 记录 `PUT /ontology/property/batch` 的请求方式和路径。
- 记录请求体数组、属性更新项及可选数据源对象的完整字段。
- 记录标准响应结构、状态码和错误消息约定。
- 提供批量修改属性所需的 TypeScript 类型、请求函数和 Mock 示例。

## 依赖

- 无新增依赖。

## 验证方式

- 对新增文档和方案执行定向 Prettier 格式检查。
- 检查接口字段、路径、方法和示例与在线文档一致。
- 运行 `git diff --check` 并检查工作区状态，确认未修改受保护目录或无关文件。
