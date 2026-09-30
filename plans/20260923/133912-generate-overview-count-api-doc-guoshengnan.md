# 生成本体概览统计接口说明

## 需求理解

根据在线接口 `OntologyOverviewController_getCount` 生成符合项目规范的 API Markdown 说明，放入 `docs/20260923/`。

## 修改范围

- 新增本体概览统计接口说明文档。
- 记录接口路径、请求方式、无参请求、响应结构、字段说明及示例。
- 文档补充项目实现所需的 types、apis 和 mocks 示例，便于后续按文档接入。

## 文件变更

- 新增 `docs/20260923/3.getOntologyOverviewCountApi.md`。

不修改源码、接口实现、依赖或受保护目录。

## 核心实现方式

根据在线文档读取到的 `/overview/count` OpenAPI 路径和 `OverviewCountVO` 字段，结合项目服务前缀约定，将完整请求 URI 记录为 `/ontology/overview/count`。无请求参数和请求体；响应示例使用在线文档给出的 0 值统计数据。

## 验证方式

- 检查文档路径、命名和接口字段与在线文档一致。
- 对新增 Markdown 文件执行格式检查和 `git diff --check`。
