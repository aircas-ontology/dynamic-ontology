# Plan：行为分类编辑支持调整父级（parentId）

## 需求理解

`PUT /ontology/action_category` 新增可选 `parentId`，用于调整行为分类父节点。编辑弹窗与逻辑对齐关系分类树：可选父分类、排除自身及子树，提交时带上 `parentId`。

## 修改范围

- `src/types/apis/updateActionCategoryType.ts`
- `src/views/SpaceBehaviorWorkspace/components/BehaviorCategoryFormDialog.vue`
- `src/views/SpaceBehaviorWorkspace/index.vue`
- `src/views/SpaceBehaviorWorkspace/utils/spaceBehaviorOperations.ts`
- `src/views/SpaceBehaviorWorkspace/composables/useSpaceBehaviorWorkspace.ts`
- 相关单测

## 新增、修改和删除文件

- 修改上述文件；无新增依赖文件删除。

## 核心实现方式

1. 类型增加可选 `parentId?: number`。
2. 弹窗使用 `el-tree-select`；创建/编辑均可选父分类；`submit` 传 `(name, parentId)`。
3. 编辑回显当前父级；`buildCategoryParentTree` 排除自身及子树。
4. `renameBehaviorCategory` 转发 `parentId`（根映射为 0）。

## 新增依赖及必要性

无。

## 验证方式

- 相关单测
- format:check
