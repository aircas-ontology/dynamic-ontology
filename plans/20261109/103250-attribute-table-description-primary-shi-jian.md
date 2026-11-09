# 属性选择表增加描述与主键列

## 需求理解

基础行为、行为类型为「属性值」、基础操作为新增/修改/删除时，创建/编辑弹框中的「属性选择」表格增加两个只读展示列，对应接口属性字段：

- `description` → 列名「属性描述」
- `isPrimaryKey` → 列名「是否为主键」（布尔展示为「是/否」）

插入位置：在「属性」与「类型」之间。

## 修改范围

- `src/views/SpaceBehaviorWorkspace/components/BehaviorFormDialog.vue`：属性选择 `el-table` 增加两列
- `tests/ontology-space-behavior.test.mjs`：补充源码断言

不改接口、类型与提交逻辑：`OntologyPropertyInfo` 已含 `description?`、`isPrimaryKey?`。

## 新增、修改和删除文件

- 修改：`BehaviorFormDialog.vue`、相关测试
- 无新增/删除文件

## 核心实现方式

在「属性」与「类型」列之间插入「属性描述」「是否为主键」两列；布尔值展示为「是/否」。该表已由 `showAttributeValueObjectSection` 控制，仅属性值场景可见。

## 新增依赖

无

## 验证方式

- 更新/运行相关 `ontology-space-behavior` 测试
- `npm run format:check -- <改动文件>`
- `npm run type-check`、`npm run build:verify`（记录既有失败）
