# 属性分类树属性展开与样式调整

## 需求理解

属性分类树的分类节点在存在属性信息时，需要支持单独展开和收起其属性树叶；属性树叶左侧图标改为当前主题色圆点。

## 修改范围

- 修改属性分类树节点模板，增加属性列表的展开与收起按钮及其可访问名称。
- 为页面内分类节点维护属性列表展开状态，默认展开。
- 修改属性树叶私有样式，用主题色圆点替代图标。
- 更新属性页面测试，覆盖展开状态和圆点样式结构。

## 新增、修改和删除文件

- 修改 `src/views/OntologyObjectDetail/components/OntologyObjectAttributePanel.vue`。
- 修改 `tests/ontology-object-attribute-panel.test.mjs`。
- 新增本 Plan 文件。

## 核心实现方式

接口映射时为每个分类节点设置默认展开状态。只有分类含属性时展示状态切换按钮；切换仅影响该分类的属性树叶，不影响分类节点本身和右侧属性列表查询。属性树叶使用 `--aircas-color-accent-cyan` 绘制圆点。

## 新增依赖及必要性

无。

## 验证方式

- 先补充属性页面测试并确认失败。
- 完成实现后运行属性页面测试。
- 对任务文件执行格式化与格式检查。
- 执行 `npm test`、`npm run test:coverage`、`npm run type-check`、`npm run build:verify` 与 `git diff --check`。
