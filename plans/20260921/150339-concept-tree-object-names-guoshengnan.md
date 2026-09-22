# 概念层级节点展示本体对象名称

## 需求理解

概念层级树的每个分类节点下增加该分类所包含的本体对象名称展示，保留现有分类名称、对象数量、操作按钮和点击定位行为。

## 修改范围

- `src/types/pages/ontologySpaceManagementDetailType.ts`：为概念节点增加可选对象名称列表字段。
- `src/views/OntologySpaceManagementDetail/utils/mapOntologyCategoryTree.ts`：将分类树接口中的本体元信息显示名称映射到节点。
- `src/views/OntologySpaceManagementDetail/components/ConceptHierarchyTree.vue`：在节点下渲染本体对象名称列表并补充主题样式。
- 新增/更新概念层级树相关测试。

## 验证

运行概念层级树和对象工作区相关测试、格式检查、类型检查、临时构建及 `git diff --check`。
