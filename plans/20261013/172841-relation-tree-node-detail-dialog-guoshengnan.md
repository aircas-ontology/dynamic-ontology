# Plan：关系分类树节点点击打开关系详情弹窗

- 日期：2026-10-13 17:28:41 (Asia/Shanghai)
- 分支：dev_sthq_1012_only
- 状态：已确认

## 需求理解

关系分类树的关系叶子节点点击当前打开关系编辑弹窗（`openRelationFromTree` → `openRelationEdit`），需改为打开只读关系详情弹窗。表格中的"编辑"按钮仍打开编辑弹窗，行为不变。

参照现有模式：`OntologyObjectAttributePanel` 的属性分类树节点点击打开只读 `AttributePropertyDetailDialog`（el-dialog + el-descriptions）。

## 修改范围

| 文件                                                                 | 变更                                                    |
| -------------------------------------------------------------------- | ------------------------------------------------------- |
| src/views/SpaceRelationWorkspace/components/RelationDetailDialog.vue | 新增：只读详情弹窗组件                                  |
| src/views/SpaceRelationWorkspace/index.vue                           | 修改：注册详情弹窗，`openRelationFromTree` 改为打开详情 |
| tests/ontology-space-relation.test.mjs                               | 新增行为断言                                            |

## 核心实现方式

1. `RelationDetailDialog.vue`：props 为 `visible` 与 `relation: OntologyRelationClass | null`，emit `update:visible`；el-descriptions 只读展示 关系名称 / API / 关系分类 / 源对象 / 目标对象 / 基数 / 关系描述，底部"关闭"按钮；`append-to-body` + `destroy-on-close`，与 AttributePropertyDetailDialog 保持一致。
2. `index.vue`：导入并注册 `RelationDetailDialog`，新增 `relationDetailVisible` 状态；`openRelationFromTree` 设置 `activeRelation` 与 `relationDetailVisible`，不再调用 `openRelationEdit`；`openRelationEdit` 保留给表格编辑按钮。
3. 测试：在 ontology-space-relation.test.mjs 新增断言——index.vue 引用 `RelationDetailDialog` 与 `relationDetailVisible`，`openRelationFromTree` 不再调用 `openRelationEdit`。

## 新增依赖

无。

## 验证方式

1. TDD：先新增断言运行确认失败，再实现并通过。
2. `npm test`（11 项基线预存失败单独记录）。
3. format（三个涉及文件）。
4. type-check、build:verify（已知预存错误单独记录）。
5. 浏览器冒烟：关系工作台点击分类树关系叶子节点，确认打开详情弹窗；表格"编辑"仍打开编辑弹窗。
