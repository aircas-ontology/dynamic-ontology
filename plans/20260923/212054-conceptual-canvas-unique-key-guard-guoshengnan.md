# 概念画布属性主键和名称键唯一

## 需求理解

概念模型画布里给某个对象的属性勾选主键或名称键时，只检查该对象自己的属性。对象里已经有主键时，不能再把另一条属性设为主键；名称键同样只能有一条。冲突时提示已有属性名称，复选框保持未勾选。正在编辑的属性如果本来就是该键，可以继续保留。同一条属性仍可以同时是主键和名称键。

## 修改范围

- 在概念画布属性工具中增加冲突查找和提示文案。
- 画布页修改属性时，打开主键或名称键前执行该判断。
- 不改对象详情页已有的属性表单校验，也不改未使用的画布 composable。

## 新增、修改和删除文件

- 修改 `src/views/OntologyConceptualModelCreate/utils/groupConceptualAttributes.ts`
- 修改 `src/views/OntologyConceptualModelCreate/index.vue`
- 修改 `tests/ontology-conceptual-model-create.test.mjs`
- 新增本 Plan

## 核心实现方式

- `findConflictingConceptualAttributeKey` 在当前对象属性中查找其他已占用主键或名称键的属性。
- `formatConceptualAttributeKeyConflictMessage` 生成与属性表单相同的提示：「当前对象已存在主键/名称键「名称」，不能同时设置两个主键/名称键」。
- `updateAttribute` 在写入 `isPrimary` 或 `isNameKey` 前调用上述判断，冲突时用 `ElMessage.warning` 提示并返回。

## 新增依赖及必要性

无。

## 验证方式

- 先运行新增断言并确认失败，再实现后确认通过。
- 对本次修改文件执行格式检查。
- 执行 `npm run type-check` 和 `npm run build:verify`。
