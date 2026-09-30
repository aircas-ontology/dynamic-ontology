# 概念模型属性增加存储分组

## 需求理解

在概念模型画布的属性检查器中增加存储分组选项。新属性默认使用 `main`，用户可以输入新的分组值；新值仅保存在当前页面会话中，并可在后续属性的存储分组下拉选项中复用。

## 修改范围

- 为概念模型画布属性增加 `storageGroup` 字段。
- 在当前画布状态中维护去重的存储分组选项，初始值为 `main`。
- 属性检查器增加可筛选、可创建的存储分组下拉框。
- 新建属性默认分组为 `main`，画布保存请求携带该字段。
- 更新概念模型页面定向测试和画布请求类型。

## 文件变更

- 修改 `src/views/OntologyConceptualModelCreate/index.vue`。
- 修改 `src/types/apis/createOntologySpaceWithCanvasContentType.ts`。
- 修改 `tests/ontology-conceptual-model-create.test.mjs`。

不新增依赖，不修改接口路径、路由和受保护目录。

## 核心实现方式

使用 `storageGroupOptions` 响应式数组保存本地选项，初始为 `["main"]`。选择或创建分组时统一去除首尾空白并加入数组；属性创建时写入 `storageGroup: "main"`。Element Plus `el-select` 开启 `filterable`、`allow-create` 和 `default-first-option`，支持输入新值后直接复用。`mapCanvasProperty` 将分组值映射到 `CanvasProperty.storageGroup`。

## 验证方式

- 先运行新增断言确认测试能识别缺失实现，再完成实现并运行定向测试。
- 对本次修改文件执行 Prettier 格式检查。
- 执行类型约定检查、类型检查、验证构建和 `git diff --check`。
