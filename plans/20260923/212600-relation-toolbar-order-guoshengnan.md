# 空间关系筛选与视图切换位置

## 需求理解

空间内关系页把筛选条件放到「添加」按钮左边，把关系图和列表的切换放到「添加」按钮右边。筛选对象和重置仍是原来的筛选条件，只调整位置，不改筛选结果。

## 修改范围

- 去掉标题下方单独的筛选条。
- 标题行右侧顺序改为：筛选对象、重置、添加、视图切换。
- 对象内关系复用同一工作区，工具栏一起调整。

## 新增、修改和删除文件

- 修改 `src/views/OntologySpaceManagementDetail/relationComponents/SpaceRelationWorkspace.vue`
- 修改 `tests/ontology-space-relation.test.mjs`
- 新增本 Plan

## 核心实现方式

把筛选控件移入 `space-relation-workspace__actions`，放在添加按钮之前；视图切换单选组放在添加按钮之后。筛选不再使用独立底栏背景。

## 新增依赖及必要性

无。

## 验证方式

- 先运行顺序断言并确认失败，再实现后确认通过。
- 对本次修改文件执行格式检查。
- 执行 `npm run type-check` 和 `npm run build:verify`。
