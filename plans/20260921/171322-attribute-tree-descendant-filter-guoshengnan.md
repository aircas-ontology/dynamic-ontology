# 属性分类树展示后代属性

## 需求理解

属性页初始显示全部属性后，用户点击分类树任意分类节点时，右侧应显示该分类及其所有子分类的属性；点击根分类应恢复全部属性展示。

## 修改范围

- 修改属性列表查询逻辑，识别当前选中分类的全部后代分类标识。
- 叶子分类继续使用按分类查询接口；含子分类的节点改为查询本体全部属性后按分类标识集合筛选。
- 更新属性页面测试，覆盖后代分类收集和集合筛选逻辑。

## 新增、修改和删除文件

- 修改 `src/views/OntologyObjectDetail/components/OntologyObjectAttributePanel.vue`。
- 修改 `tests/ontology-object-attribute-panel.test.mjs`。
- 新增本 Plan 文件。

## 核心实现方式

递归收集选中分类节点及其后代分类的 id。对于含子分类的节点，使用已有“查询全部属性”接口取得完整属性数据，再按收集到的分类 id 过滤；叶子分类保留已有按分类查询接口。请求序列号继续防止旧响应覆盖新选择。

## 新增依赖及必要性

无。

## 验证方式

- 先补充属性页面测试并确认失败。
- 完成最小实现后运行属性页面测试。
- 对任务文件执行格式化与格式检查。
- 执行 `npm test`、`npm run test:coverage`、`npm run type-check`、`npm run build:verify` 与 `git diff --check`。
