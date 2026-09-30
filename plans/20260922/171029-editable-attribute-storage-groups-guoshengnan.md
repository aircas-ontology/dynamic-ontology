# 对象属性存储分组可输入与动态选项实施方案

## 需求理解

- 对象属性新增弹窗中的存储分组支持手动输入，也支持从下拉列表选择。
- 下拉列表从当前本体对象全部属性的存储分组值中提取，过滤空值并去重。
- 保留新增属性默认值 `main`，界面显示“主存储”；后端返回“主存储”时统一映射为 `main`。

## 修改范围

- 调整对象属性表单弹窗的存储分组选择器交互。
- 调整属性列表 composable 中存储分组选项的生成方式。
- 增加定向测试，覆盖可输入选择器和动态去重选项。

## 文件变更

- 修改 `src/views/OntologyObjectDetail/components/AttributePropertyFormDialog.vue`。
- 修改 `src/views/OntologyObjectDetail/composables/useAttributePropertyList.ts`。
- 修改 `tests/ontology-object-attribute-panel.test.mjs`。
- 修改 `tests/ontology-property-api.test.mjs`，更新固定存储分组选项的旧断言。
- 不新增或删除业务源码文件。

## 核心实现方式

- 使用 Element Plus `el-select` 的 `filterable` 和 `allow-create` 能力支持输入新分组与选择已有分组。
- 从完整属性分类树递归收集全部属性，不受当前分类筛选影响。
- 对存储分组执行标准化、去空值和 `Set` 去重，再生成现有选项类型；`main` 显示为“主存储”。
- 保留当前创建和编辑请求体的 `storageGroup` 字段传递方式。

## 依赖

- 无新增依赖，复用 Vue `computed`、Element Plus `el-select` 和现有属性树工具函数。

## 验证方式

- 按 TDD 先运行新增定向测试并确认失败，再实施并确认通过。
- 运行属性页面与属性接口定向测试。
- 对本次文件执行格式化和格式检查。
- 运行 `npm run type-check`、`npm run build:verify`、`npm test` 和 `npm run test:coverage`。
- 运行 `git diff --check` 并检查任务相关 diff 与工作区状态。
