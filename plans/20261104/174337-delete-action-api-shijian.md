# 对接删除行为接口

## 需求理解

按 `docs/20261104/deleteAction.md` 对接行为删除接口。删除确认弹窗只保留“是否删除 XXX 行为”的提示与取消/确认操作，移除影响范围、名称输入确认等冗余内容；点击确认后调用 `DELETE /ontology/action`，成功后刷新行为列表。

## 修改范围

- 新增删除行为请求类型并接入统一类型出口。
- 在 `ontologyActionApi.ts` 新增删除接口函数并从 `@/apis` 统一出口导出。
- `useSpaceBehaviorWorkspace` 的 `deleteBehavior` 改为调用真实接口，不再仅写本地 Mock。
- 简化 `BehaviorDeleteDialog` 并同步调整 `SpaceBehaviorWorkspace/index.vue` 的调用与提示。
- 更新相关单测断言并新增删除接口测试。

## 新增、修改和删除文件

新增：

- `src/types/apis/deleteOntologyActionType.ts`
- `tests/delete-ontology-action-api.test.mjs`

修改：

- `src/types/index.ts`
- `src/apis/ontologyActionApi.ts`
- `src/apis/index.ts`
- `src/views/SpaceBehaviorWorkspace/composables/useSpaceBehaviorWorkspace.ts`
- `src/views/SpaceBehaviorWorkspace/index.vue`
- `src/views/SpaceBehaviorWorkspace/components/BehaviorDeleteDialog.vue`
- `tests/ontology-space-behavior.test.mjs`

删除：无。

## 核心实现方式

- 类型：`DeleteOntologyActionParams { ontologySpaceId: string; actionApi: string }`，响应 `data` 为 `null`。
- 接口：`deleteOntologyActionInterface` 使用 `request<DeleteOntologyActionData>`，`method: "delete"`，参数通过 `params` 传递。
- 删除流程：按 `behaviorId` 找到行为，读取 `behaviorApiName` 作为 `actionApi`；请求成功（`code` 为 `0` 或 `200`）后刷新列表；失败返回 `false` 并沿用页面 `ElMessage.error` 反馈。
- 弹窗：标题“删除行为”，正文“确定删除行为「XXX」吗？”，底部“取消 / 确认删除”；保留 `loading` 防重复提交。

## 新增依赖

无。

## 验证方式

```sh
npm test
npm run test:coverage
npm run check:types-conventions
npm run type-check
npm run build:verify
npm run format:check -- <本次改动文件>
```

人工验证：行为列表点击“删除”仅出现简短确认提示；确认后请求 `DELETE /ontology/action`，成功后列表刷新并提示“行为已删除”。
