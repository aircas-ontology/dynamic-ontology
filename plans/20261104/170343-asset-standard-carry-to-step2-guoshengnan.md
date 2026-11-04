# 资产构建第一步已选标准带入第二步属性列表

## 需求理解

第一步勾选资产标准后，进入第二步时属性列表应展示已选数据元。当前因 `v-if` 销毁第一步表格触发 `selection-change([])`，已选被清空。

## 修改范围

- `src/views/ObjectWorkspacePanel/components/AssetModelBuildDialog.vue`
- `src/views/ObjectWorkspacePanel/utils/buildAssetModelConfiguration.ts`
- `tests/asset-model-build.test.mjs`

## 新增、修改和删除文件

- 修改上述三个文件；无新增依赖。

## 核心实现方式

1. 抽取 `pickAssetStandardProperties`，按已选标识从模型属性中取出列表。
2. 「下一步」时快照到 `objectPropertyList`，第二步表格绑定该快照。
3. `selection-change` 仅在第一步生效，避免销毁表格时清空已选。

## 新增依赖及必要性

无

## 验证方式

- `node --test --experimental-strip-types tests/asset-model-build.test.mjs`
- 任务文件 `format:check`
