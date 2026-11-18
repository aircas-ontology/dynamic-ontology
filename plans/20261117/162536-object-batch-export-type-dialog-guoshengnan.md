# 对象批量导出增加类型选择弹窗

## 需求理解

批量导出在选完对象后，先弹出与单独导出同款的类型选择（仅结构 SCHEMA / 含实例数据 INSTANCE），确认后再按所选 `exportType` 调用同一导出接口；去掉硬编码 `SCHEMA`。

## 修改范围

仅 `ObjectWorkspacePanel` 导出链路；不改空间导出、不碰无关脏文件。

## 新增、修改和删除文件

| 操作 | 路径                                                                            |
| ---- | ------------------------------------------------------------------------------- |
| 修改 | `src/views/ObjectWorkspacePanel/components/OntologyObjectExportDialog.vue`      |
| 修改 | `src/views/ObjectWorkspacePanel/composables/useObjectWorkspaceObjectActions.ts` |
| 修改 | `src/views/ObjectWorkspacePanel/index.vue`                                      |
| 修改 | `tests/export-ontology-api.test.mjs`                                            |

## 核心实现方式

1. 复用 `OntologyObjectExportDialog`：SCHEMA/INSTANCE 单选、默认 INSTANCE、loading/error 与单导出一致；批量文案为「导出已选的 N 个对象」。
2. composable 增加 `pendingBatchExportIds`；`openBatchOntologyObjectExportDialog` 打开弹窗；确认时 `uniqueIdentifier` 为逗号拼接 id，并传入用户所选 `exportType`。
3. 单/批共用弹窗可见性；打开一方时清理另一方上下文。
4. 列表仍在 emit 后清空勾选（与现状一致）。

## 新增依赖及必要性

无。

## 验证方式

1. 更新 `tests/export-ontology-api.test.mjs`（TDD）。
2. 运行相关测试、`type-check`、`build:verify`、任务文件 `format:check`。
