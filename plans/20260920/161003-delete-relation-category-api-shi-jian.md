# Plan：对接删除关系分类

确认范围（用户 2026-09-20）：spaceId / categoryId 用 number。

## 需求理解

- DELETE `/ontology/link_category` 删除关系分类
- 入参 spaceId/categoryId 均为 number
- 成功后刷新查询树；右侧关系类删除本轮不动

## 修改范围

- types / mock / api + barrel
- SpaceRelationWorkspace 删除分类分支走 API
- 相关测试

## 新增依赖

无

## 验证方式

TDD + 相关测试 + type-check + format
