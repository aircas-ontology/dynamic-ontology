# 需求理解

- 空间内关系与对象内关系共用关系分类树。
- 关系作为分类下的子节点展示后，父分类需要可以展开和收起。
- 行点击仍只选中分类，展开收起由树箭头完成。

# 修改范围

- 只调整关系分类树的节点数据和展开行为。
- 不改关系列表、关系图、分类增删改和两个页面的路由。

# 文件范围

## 新增

- 无。

## 修改

- `src/views/OntologySpaceManagementDetail/relationComponents/RelationCategoryPanel.vue`
- `tests/ontology-relation-category-tree-api.test.mjs`

## 删除

- 无。

# 核心实现方式

- 关系叶子不设置 `children`。分类仅在存在子分类或关系时设置 `children`。
- 用分类节点 id 作为 `default-expanded-keys`，去掉 `default-expand-all`。
- 自定义行改为 `flex: 1`，展开箭头 `flex-shrink: 0`，叶子箭头保持透明。
- 保留 `:expand-on-click-node="false"`。

# 新增依赖

- 无。

# 验证方式

- 先运行关系分类树契约测试，确认缺少展开键和空 children 断言失败。
- 实现后重新运行 `tests/ontology-relation-category-tree-api.test.mjs` 与 `tests/ontology-space-relation.test.mjs`。
- 对本次修改文件执行格式化检查。
