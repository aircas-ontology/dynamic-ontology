# 元数据统一为树表（取消分类树）

## 需求理解

取消左侧分类树与「添加分类」。元数据为父子树结构。添加字段：元数据名称、父级、类型（枚举 / 输入值 / 范围）、值。列表为树形表格，列与上述字段一致。

## 修改范围

元数据类型、Mock、operations、管理弹窗与添加表单；删除分类表单组件；更新测试。

## 新增、修改和删除文件

| 动作 | 路径                                                                       |
| ---- | -------------------------------------------------------------------------- |
| 重写 | `src/types/pages/ontologyAttributeMetadataType.ts`                         |
| 修改 | `src/types/index.ts`                                                       |
| 重写 | `src/mocks/ontologyAttributeMetadataMock/ontologyAttributeMetadataMock.ts` |
| 重写 | `src/views/OntologyObjectAttributePanel/utils/metadataOperations.ts`       |
| 重写 | `MetadataManageDialog.vue`、`MetadataRuleFormDialog.vue`（统一添加表单）   |
| 删除 | `MetadataCategoryFormDialog.vue`                                           |
| 重写 | `tests/ontology-attribute-metadata.test.mjs`                               |
| 新增 | 本 Plan                                                                    |

## 核心实现方式

- 扁平记录 + `buildMetadataTree` 生成树表数据。
- 类型：`input` | `enum` | `range`；值随类型变化。
- 父级 TreeSelect 可选「顶级」或其他元数据节点。
- 单栏树形 `el-table`（`tree-props`）。

## 新增依赖及必要性

无。

## 验证方式

元数据单测与覆盖率、format、type-check（本次文件）、必要时 build:verify
