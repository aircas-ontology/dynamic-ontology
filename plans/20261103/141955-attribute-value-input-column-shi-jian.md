# Add 新增值 / 修改值 column and group by storageGroup

## 需求理解

属性表在「属性」与「类型」之间增加可编辑列：新增显示「新增值」，修改显示「修改值」，删除不显示；单元格为 el-input。属性按存储分组聚合排序。录入值写入草稿，提交不强制非空。

## 修改范围

- `src/types/pages/ontologySpaceBehaviorType.ts`
- `src/views/SpaceBehaviorWorkspace/utils/sortPropertyInfosByStorageGroup.ts`（新增）
- `src/views/SpaceBehaviorWorkspace/components/BehaviorFormDialog.vue`
- `src/views/ObjectBehaviorWorkspace/components/ObjectBehaviorFormDialog.vue`
- `tests/ontology-space-behavior.test.mjs`

## 核心实现方式

Draft 增加 `selectedPropertyValues`；加载属性后按 storageGroup 排序；条件列绑定输入。

## 新增依赖及必要性

无。

## 验证方式

`ontology-space-behavior`、`format:check`、`build:verify`。
