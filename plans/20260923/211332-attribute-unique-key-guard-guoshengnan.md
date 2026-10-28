# 属性主键和名称键不可重复

## 需求理解

新增或编辑属性时，勾选主键或名称键前先看当前对象的全部属性。对象里已经有主键时，不能再把另一条属性设为主键；名称键同样只能有一条。冲突时提示已有属性名称，并保持开关为否。正在编辑的那条属性如果本来就是主键或名称键，可以继续保存。同一条属性仍可以同时是主键和名称键。

## 修改范围

- 增加冲突查找和提示文案。
- 表单开关改为通知父组件，由属性列表逻辑决定是否写入草稿。
- 保存前再检查一次，避免重复提交。

## 新增、修改和删除文件

- 修改 `src/views/OntologyObjectDetail/utils/attributePanelHelpers.ts`
- 修改 `src/views/OntologyObjectDetail/composables/useAttributePropertyList.ts`
- 修改 `src/views/OntologyObjectDetail/components/AttributePropertyFormDialog.vue`
- 修改 `src/views/OntologyObjectDetail/components/OntologyObjectAttributePanel.vue`
- 修改 `tests/ontology-object-attribute-panel.test.mjs`
- 新增本 Plan

## 核心实现方式

- `findConflictingAttributeKey` 在当前对象属性中查找其他已占用主键或名称键的属性，编辑中的属性自身除外。
- `formatAttributeKeyConflictMessage` 生成「当前对象已存在主键/名称键「名称」，不能同时设置两个主键/名称键」。
- 开关打开时若有冲突，用警告提示并保持关闭；保存前重复该判断。

## 新增依赖及必要性

无。

## 验证方式

- 先运行冲突判断测试并确认失败，再实现后确认通过。
- 对本次修改文件执行格式检查。
- 执行 `npm run type-check` 和 `npm run build:verify`。
