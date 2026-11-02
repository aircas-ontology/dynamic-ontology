# 行为分类修改删除接口对接计划

## 需求理解

依据 `docs/20261015/3.updateActionCategoryApi.md` 和 `docs/20261015/4.deleteActionCategoryApi.md`，将行为分类重命名和删除操作对接真实接口。

## 修改范围

- 增加修改、删除请求类型及 API 导出。
- 工作区编辑分类调用 PUT，删除分类调用 DELETE。
- 保留现有根节点、子节点和关联行为的删除前置判断，成功后刷新分类树。

## 文件变更

- 新增 `src/types/apis/updateActionCategoryType.ts`、`src/types/apis/deleteActionCategoryType.ts`。
- 修改 `src/apis/actionCategoryApi.ts`、`src/apis/index.ts`、`src/types/index.ts`、`src/views/SpaceBehaviorWorkspace/composables/useSpaceBehaviorWorkspace.ts`、`src/views/SpaceBehaviorWorkspace/index.vue`。
- 增加接口契约测试。

## 核心实现

PUT 与 DELETE 均使用 `/ontology/action_category` JSON 请求体，成功码兼容 0 和 200；请求成功后重新查询分类树。

## 验证方式

执行接口测试、行为工作区测试、格式检查、类型约定检查和 diff 检查，不新增依赖。
