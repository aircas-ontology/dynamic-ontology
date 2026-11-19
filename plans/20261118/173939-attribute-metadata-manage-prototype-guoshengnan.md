# 属性页「元数据管理」原型（Mock）

## 需求理解

在对象属性管理页工具栏「关联数据源」旁增加「元数据管理」按钮。点击后打开弹窗：左侧为元数据分类树，右侧用表格列出属性校验规则（一条规则 = 一条元数据）。添加时区分「分类」（父级 + 名称）与「元数据」（父级 + 规则内容）。仅本地 Mock，不对接接口。

规则类型包含四类：

- `input`：输入说明（文字描述）
- `required`：是否必填
- `range`：范围/长度限制（如 1~8）
- `enum`：枚举值列表

## 修改范围

仅 `OntologyObjectAttributePanel` 及相关 types / mocks / tests；不改 API、mock-server、`public/`、`html/`。

## 新增、修改和删除文件

| 动作 | 路径                                                                               |
| ---- | ---------------------------------------------------------------------------------- |
| 新增 | `src/types/pages/ontologyAttributeMetadataType.ts`                                 |
| 修改 | `src/types/index.ts`                                                               |
| 新增 | `src/mocks/ontologyAttributeMetadataMock/ontologyAttributeMetadataMock.ts`         |
| 新增 | `src/views/OntologyObjectAttributePanel/components/MetadataManageDialog.vue`       |
| 新增 | `src/views/OntologyObjectAttributePanel/components/MetadataCategoryFormDialog.vue` |
| 新增 | `src/views/OntologyObjectAttributePanel/components/MetadataRuleFormDialog.vue`     |
| 修改 | `src/views/OntologyObjectAttributePanel/components/AttributePropertyTable.vue`     |
| 修改 | `src/views/OntologyObjectAttributePanel/index.vue`                                 |
| 新增 | `tests/ontology-attribute-metadata.test.mjs`                                       |

## 核心实现方式

1. 工具栏增加「元数据管理」按钮，打开宽弹窗（左分类树 + 右规则表）。
2. 选中分类过滤表格；支持本地添加分类与元数据规则、编辑/删除（内存态）。
3. 分类表单：父级 + 名称；元数据表单：父级 + 规则类型及对应字段（含枚举值多项编辑）。
4. Mock 覆盖四类规则样例（含 name 输入/必填/长度，以及状态枚举）。

## 新增依赖及必要性

无新依赖。

## 验证方式

- TDD：`tests/ontology-attribute-metadata.test.mjs`
- `npm test`、`npm run test:coverage`
- `npm run type-check`、`npm run build:verify`
- `npm run format:check -- <改动文件>`
- `npm run check:types-conventions`（类型目录变更）
- 人工：属性页打开弹窗、切分类、添加分类/规则可见
