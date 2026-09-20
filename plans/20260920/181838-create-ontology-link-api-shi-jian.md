# 对接创建本体之间关系 API

## 需求理解

按 `docs/20260920/创建本体之间关系Api-shijian.md` 新增 POST `/ontology/link`，接线「添加关系」；`categoryId` 非必填；源/目标提交 `uniqueIdentifier`。

## 修改范围

- 新增 types/API/mock/测试
- 修改 ontologyManageApi、表单、workspace、mapper、relationOperations、页面类型

## 新增依赖

无

## 核心实现方式

见已确认 Plan：create 调 API 后本地 `createRelationClass` 追加；不整页 reload。

## 验证方式

- `node --test --experimental-strip-types tests/create-ontology-link-api.test.mjs tests/ontology-space-relation.test.mjs`
- `npm run type-check`
- `npm run format:check --` 任务相关文件
