# 用 link/list 替换行为表单关系列表

## 需求理解

应用行为「绑定关系」、基础行为-关系实例「关系选择」改为 `GET /ontology/link/list`，支持每页 10 条与按关系名称搜索，保持单选与保存回填不变。

## 修改范围

- 新增 API / Types / Mock（`docs/20261117/linkListApi.md`）
- 映射 list records → `OntologyRelationClass`
- `BehaviorFormDialog.vue`：搜索 + 分页 + 换数据源
- 相关测试

## 新增、修改和删除文件

- 新增：`getOntologyLinkListType.ts`、fixture、映射工具
- 修改：`ontologyManageApi.ts`、`apis/index.ts`、`types/index.ts`、`routes.json`、`BehaviorFormDialog.vue`、测试

## 核心实现方式

`selectedRelationId` 仍为 `uniqueIdentifier`；列表角标用接口 `total`。

## 新增依赖及必要性

无。

## 验证方式

- 相关单测、`check:types-conventions`、`type-check`、`build:verify`、format:check
