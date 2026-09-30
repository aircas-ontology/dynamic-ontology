# 展示全部分类下的本体对象

## 需求理解

空间对象列表中，名为「全部」的根分类如果挂有本体对象，需要作为分组展示。没有本体的分类继续不展示。

## 修改范围

- 调整分类树到右侧对象列表的映射，根分类有本体时写入分区。
- 补充映射测试：根分类有对象时展示，空子分类仍被过滤。

## 新增、修改和删除文件

- 修改 `src/views/OntologySpaceManagementDetail/utils/mapOntologyCategoryTree.ts`
- 修改 `tests/ontology-category-tree-api.test.mjs`
- 不新增、不删除文件

## 核心实现方式

`mapOntologyCategorySections` 只按当前节点 `ontologyMetaInfos` 是否非空决定是否生成分区，不再因为根节点 `categoryId` 为 0 或名称为「全部」而丢弃对象。空分类和没有本体的「全部」根节点仍不进入右侧列表。

## 新增依赖

- 无

## 验证方式

- 先运行新增映射测试确认当前实现失败，再完成最小修改并复跑该测试。
- 对本次修改文件执行格式检查。
