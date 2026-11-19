# 空间列表列宽调整

## 需求理解

对象空间列表（空间管理 / 空间浏览共用表格）中，「空间名称」偏宽、「描述」偏窄；将名称列收窄、描述列加宽，改善字段分布。

## 修改范围

- 仅改 `src/views/OntologySpaceManagement/components/SpaceTableView.vue` 两列 `min-width`
- 不改卡片视图、主题空间列表、其它固定宽度列（对象/行为/关系/属性/时间/操作）
- 无新增依赖；不新增/删除文件

## 新增、修改和删除文件

- 修改：`src/views/OntologySpaceManagement/components/SpaceTableView.vue`
- 无新增、无删除

## 核心实现方式

- 空间名称：`min-width` `280` → `200`
- 描述：`min-width` `180` → `300`

## 新增依赖及必要性

无。

## 验证方式

- 目视：表格视图下名称列变窄、描述列更宽，溢出仍靠 `show-overflow-tooltip`
- `npm run format:check --` 针对该文件
- 无行为/逻辑变更，不强制跑全量单测
