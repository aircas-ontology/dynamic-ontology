# 关系表格对接 link_category/tree 的 links

## 需求理解

从分类树 `links` 映射关系列表；`name`/`ontologyNameFrom`/`ontologyNameTo` 有值，其余列保留但为空；创建成功后 reload。

## 修改范围

- mapOntologyRelationCategoryTree：导出 links 映射
- useSpaceRelationWorkspace：填充 relations
- SpaceRelationWorkspace：列文案源本体/目标本体；create 后 reload
- 测试更新

## 新增依赖

无

## 验证方式

- tests + type-check + format:check
