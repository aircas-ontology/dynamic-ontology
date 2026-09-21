# 对接删除本体之间关系 API

## 需求理解

DELETE `/ontology/link/{linkUniqIdentifier}`；表格与三维图删除均经 `handleRelationDelete`，成功后刷新关系树。

## 修改范围

- 新增 types/API/mock/测试
- 修改 ontologyManageApi、index、types barrel、SpaceRelationWorkspace

## URI

`/ontology/link/{linkUniqIdentifier}`（文档已修正）

## 新增依赖

无

## 验证

tests + type-check + format:check
