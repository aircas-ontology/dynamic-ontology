# 属性分类树使用原生树节点

## 需求理解

属性分类树中的属性应作为分类节点的真实树叶，由 Element Plus 树组件统一提供缩进、展开箭头和收起行为；属性树叶继续使用主题色圆点。

## 修改范围

- 修改属性页分类树节点模型，将分类和属性表示为可区分的树节点。
- 将接口返回的 `propertyInfos` 转换为分类节点的子级属性树叶。
- 移除手工的属性展开状态与按钮，复用 `el-tree` 原生展开、收起交互。
- 限制分类选择及分类操作按钮仅作用于分类节点。
- 更新属性页面测试，覆盖原生树叶模型和分类节点保护。

## 新增、修改和删除文件

- 修改 `src/views/OntologyObjectDetail/components/OntologyObjectAttributePanel.vue`。
- 修改 `tests/ontology-object-attribute-panel.test.mjs`。
- 新增本 Plan 文件。

## 核心实现方式

分类节点映射时先保留分类子节点，再附加由属性信息生成的叶子节点。`el-tree` 使用统一的 `children` 字段渲染层级，默认展开及用户收起均由组件处理。模板根据节点类型展示分类操作或属性圆点，并在点击属性树叶时不触发右侧分类查询。

## 新增依赖及必要性

无。

## 验证方式

- 先调整属性页面测试并确认失败。
- 完成最小实现后运行属性页面测试。
- 对任务文件执行格式化与格式检查。
- 执行 `npm test`、`npm run test:coverage`、`npm run type-check`、`npm run build:verify` 与 `git diff --check`。
