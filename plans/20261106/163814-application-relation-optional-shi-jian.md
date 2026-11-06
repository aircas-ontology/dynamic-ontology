# 应用行为绑定关系可选并按出参隐藏

## 需求理解

创建/编辑应用行为：任一出参为 WRITE_PROPERTY 时不展示绑定关系；绑定关系非必选。

## 修改范围

- `BehaviorFormDialog.vue`
- `buildApplicationCreateActionParams.ts`
- `tests/ontology-space-behavior.test.mjs`

## 新增、修改和删除文件

- 修改上述文件

## 核心实现方式

- `showApplicationRelationSection`：无 WRITE_PROPERTY 出参时展示
- 隐藏时清空 selectedRelationId
- 组装请求仅在有关系 id 时带 linkMapping

## 新增依赖

无

## 验证方式

- 相关测试、`format:check`；type-check / build:verify

## 风险

与 createActionApi 文档「必须绑定关系」不一致；按用户明确要求改前端。
