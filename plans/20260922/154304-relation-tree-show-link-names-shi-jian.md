# 关系分类树挂载关系名称节点

## 需求理解

左侧关系分类树在分类下展示该分类的关系，文案取 links[].name（页面侧 displayName），交互与样式对齐对象树中的对象节点。

## 修改范围

- `src/views/OntologySpaceManagementDetail/relationComponents/RelationCategoryPanel.vue`
- `tests/ontology-relation-category-tree-api.test.mjs`

## 新增、修改和删除文件

- 修改：上述两个文件
- 新增：本 Plan
- 删除：无

## 核心实现方式

1. 将 `props.relations` 按 `categoryId === 分类.id` 挂到对应分类 children 末尾。
2. 节点区分 `kind: "category" | "relation"`；关系节点展示圆点 + displayName，无增删改按钮。
3. 点击关系节点时选中其所属分类；搜索可匹配关系名。
4. 分类计数逻辑保持子树关系数。

## 新增依赖及必要性

无。

## 验证方式

- 相关关系分类树测试
- 任务文件 `format:check`
- `npm run type-check`
