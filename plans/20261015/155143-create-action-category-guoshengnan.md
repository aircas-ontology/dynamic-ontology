# 创建行为分类接口对接计划

## 需求理解

依据 `docs/20261015/1.createActionCategoryApi.md`，将行为工作区新增分类操作对接真实创建接口。

## 修改范围

- 增加创建行为分类的请求类型、API 出口和 Mock 样例。
- 将空间行为工作区新增分类切换为异步接口调用，根节点父 id 映射为 0。
- 更新页面提交逻辑并补充接口与行为测试。

## 文件变更

- 新增 `src/types/apis/createActionCategoryType.ts`、`src/mocks/createActionCategoryMock/createActionCategoryMock.ts`。
- 修改 `src/apis/actionCategoryApi.ts`、`src/apis/index.ts`、`src/types/index.ts`、`src/views/SpaceBehaviorWorkspace/composables/useSpaceBehaviorWorkspace.ts`、`src/views/SpaceBehaviorWorkspace/index.vue`。
- 新增或更新对应测试文件。

## 核心实现

使用 POST `/ontology/action_category`，请求体包含 `spaceId`、`parentId`、`name`；创建成功后重新加载分类树，保留现有其他本地操作。

## 依赖与验证

不新增依赖。执行接口测试、行为工作区测试、格式检查、类型约定检查、类型检查、构建验证和 diff 检查。
