# Plan：对接创建空间关系分类

确认范围（用户 2026-09-20）：颜色处理选 1；编辑本轮不动。

## 需求理解

- POST `/ontology/link_category` 创建关系分类
- 空树根分类 `parentId=0`；子分类 `parentId=父节点 categoryId`
- 仅提交 `spaceId/parentId/name`，不传颜色
- 成功后刷新查询树；编辑仍本地

## 修改范围

- types / mock / api + barrel
- `SpaceRelationWorkspace` 创建走 API + reload
- 相关测试

## 契约映射

- spaceId: number, parentId: number, name: string
- 响应 `{code:200,message:"SUCCESS"}`，mock 同样例
- 函数名 `postCreateOntologyRelationCategoryTreeInterface`

## 新增依赖

无

## 验证方式

TDD + 相关测试 + type-check + format
