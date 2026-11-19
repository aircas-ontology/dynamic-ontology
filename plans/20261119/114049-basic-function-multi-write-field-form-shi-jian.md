# Plan: 多对象基础函数「写入字段」表单（仅表单）

## 需求理解

多对象时增加「写入字段」：对象 + 属性；对象下拉为全空间对象（与单对象写入一致）；属性仅 `storageGroup=main`。本轮只做表单与校验，不改 create API 请求体。

## 修改范围

`BehaviorFormDialog.vue`、草稿类型与映射、相关测试。不改 `buildBasicFunctionCreateActionParams` 请求体。

## 新增、修改和删除文件

- 修改：`src/types/pages/ontologySpaceBehaviorType.ts`
- 修改：`src/views/SpaceBehaviorWorkspace/components/BehaviorFormDialog.vue`
- 修改：`src/views/SpaceBehaviorWorkspace/utils/mapOntologyActionInfoToFormState.ts`
- 修改：`tests/ontology-space-behavior.test.mjs`
- 如需：`src/types/index.ts`

## 核心实现方式

1. 多对象展示一行「写入字段」：对象（`objectOptions`）+ 属性（main only）。
2. 独立加载/缓存 main 属性选项，避免影响 Application 全量属性下拉。
3. 草稿增加 `basicFunctionMultiWriteField`；对象选择变化时清空；提交校验须选齐；不写入 create 请求体。

## 新增依赖及必要性

无

## 验证方式

先更新测试并确认失败，再实现；相关测试；`format:check`；人工冒烟。
