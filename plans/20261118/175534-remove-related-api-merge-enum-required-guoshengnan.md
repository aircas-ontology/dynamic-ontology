# 移除关联属性 API，并将是否必填并入枚举值

## 需求理解

1. 元数据原型去掉「关联属性 API」表单字段、表格列及类型字段 `relatedApiName`。
2. 规则类型去掉独立的「是否必填」；并入「枚举值」：枚举规则同时配置是否必填 + 枚举值列表。
3. 规则类型变为三类：`input` / `range` / `enum`。

## 修改范围

元数据类型、Mock、operations、添加表单、管理弹窗、测试；不改 API / public / html。

## 新增、修改和删除文件

| 动作 | 路径                                                                           |
| ---- | ------------------------------------------------------------------------------ |
| 修改 | `src/types/pages/ontologyAttributeMetadataType.ts`                             |
| 修改 | `src/types/index.ts`（若导出清单变化）                                         |
| 修改 | `src/mocks/ontologyAttributeMetadataMock/ontologyAttributeMetadataMock.ts`     |
| 修改 | `src/views/OntologyObjectAttributePanel/utils/metadataOperations.ts`           |
| 修改 | `src/views/OntologyObjectAttributePanel/components/MetadataRuleFormDialog.vue` |
| 修改 | `src/views/OntologyObjectAttributePanel/components/MetadataManageDialog.vue`   |
| 修改 | `tests/ontology-attribute-metadata.test.mjs`                                   |
| 新增 | 本 Plan 文件                                                                   |

## 核心实现方式

- 条目与写入载荷删除 `relatedApiName`。
- 删除 `required` 独立规则类型与 `OntologyAttributeMetadataRequired*`。
- `OntologyAttributeMetadataEnumPayload` 增加 `required: boolean`；表单在选择枚举值时展示「是否必填」+ 枚举值列表。
- 摘要文案示例：`必填；启用 / 停用 / 退役`。
- Mock：原「飞机名称必填」改为枚举规则（含必填标志与枚举值），状态枚举同步带 `required`。

## 新增依赖及必要性

无。

## 验证方式

- `node --test --experimental-strip-types tests/ontology-attribute-metadata.test.mjs`
- 覆盖率对本任务相关模块 ≥80%
- `npm run type-check`（关注本次文件）
- `npm run check:types-conventions`
- `npm run format:check -- <改动文件>`
- 必要时 `npm run build:verify`
