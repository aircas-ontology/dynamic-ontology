# Fix action category tree counts and leaves

## 需求理解

行为分类树徽章目前恒为 `0`，且不展示行为叶子。接口 `docs/20261015/2.getActionCategoryTreeApi.md` 在分类节点上返回 `actionInfos[]`。本轮：

- 分类节点 `count` = 本节点 `actionInfos.length` + 子孙分类累计
- 将每条 `actionInfos` 映射为树叶子，标签用 `displayName`
- 叶子不展示分类增删改按钮、不展示 count 徽章
- 点击叶子时选中其父分类（右侧列表仍按分类筛选；本轮不接行为详情）

## 修改范围

- 类型 `src/types/apis/getActionCategoryTreeType.ts`：补充 `ActionCategoryActionInfo` 与 `actionInfos?`
- 页面节点 `src/types/pages/ontologySpaceBehaviorType.ts`：`SpaceBehaviorCategoryNode` 增加 `kind`，行为叶子可选 `parentCategoryId` / `actionApi`
- 映射抽到 `src/views/SpaceBehaviorWorkspace/utils/mapActionCategoryTree.ts`，`useSpaceBehaviorWorkspace.ts` 改用该工具
- `BehaviorCategoryPanel.vue`：按 `kind` 渲染
- `collectSpaceBehaviorCategoryIds` / 删除校验跳过 `kind==="action"`
- 测试：`tests/ontology-space-behavior.test.mjs` + `get-action-category-tree-api.test.mjs`

## 新增、修改和删除文件

- 新增：`mapActionCategoryTree.ts`
- 修改：类型、composable、panel、operations、mock 分类节点、相关测试

## 核心实现方式

见已确认 Plan：`actionInfos` → action 叶子；`count` 递归累计；叶子点击选中父分类。

## 新增依赖

无。

## 验证方式

- 组装/映射单元测试；`format:check`；`check:types-conventions`；`build:verify`
