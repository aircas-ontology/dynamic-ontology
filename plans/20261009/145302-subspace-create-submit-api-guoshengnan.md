# 子空间创建按钮接口对接方案

## 需求理解

按照提供的 JSON 请求示例，在子空间创建页面点击创建按钮时组织父空间、子空间基础信息、已选对象实例、已选属性筛选条件和已选关系，并调用 `POST /ontology/space/subspace`。

## 修改范围

- 新增子空间创建 API 请求类型与 `POST /ontology/space/subspace` 封装。
- 新增子空间创建请求体映射工具，负责将页面状态转换为接口字段。
- 修改子空间创建页面的创建按钮提交逻辑，增加 submitting、success、error 状态和重复提交保护。
- 更新子空间创建定向测试，覆盖请求体字段、属性筛选值和关系映射。

## 核心实现方式

复用当前页面的对象、实例、属性、关系状态：对象标识写入 `sourceOntologyUniqueIdentifier`，已选实例 id 写入 `selectedInstancePrimaryKeys`，已选属性写入 `sourcePropertyUniqueIdentifier` 及筛选对象，关系写入 `sourceLinkUniqueIdentifier` 并保留接口返回的关系信息。创建成功后返回父空间，失败时保留页面状态并显示错误。

## 新增依赖

无。

## 验证方式

先运行新增映射测试确认请求体失败，再完成实现并运行子空间定向测试、格式检查、类型规范检查、类型检查、构建验证和 `git diff --check`。
