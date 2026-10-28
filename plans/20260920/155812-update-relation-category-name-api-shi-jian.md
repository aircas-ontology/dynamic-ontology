# Plan：对接修改关系分类名称

确认范围（用户 2026-09-20）：spaceId 用 number；颜色不传。

## 需求理解

- PUT `/ontology/link_category` 修改关系分类名称
- 入参 spaceId/categoryId/name；成功后刷新查询树
- 编辑确认走 API；创建逻辑不动；删除仍本地

## 修改范围

- types / mock / api + barrel
- SpaceRelationWorkspace 编辑分支走 API
- 相关测试

## 新增依赖

无

## 验证方式

TDD + 相关测试 + type-check + format
