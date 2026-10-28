# 创建后返回上一路由

## 需求理解

点击创建并通过校验后，返回进入创建页之前的路由。校验失败时留在当前页。左侧返回仍进入空间列表。

## 修改范围

- `src/views/OntologySubspaceCreate/index.vue`：`createSubspace` 成功后调用 `router.back()`。
- `tests/ontology-subspace-create.test.mjs`：断言创建成功后返回上一页。

## 新增依赖

无。

## 验证

先更新测试再实现。随后跑子空间创建测试、任务文件 `format:check`、`type-check`、`build:verify`。
