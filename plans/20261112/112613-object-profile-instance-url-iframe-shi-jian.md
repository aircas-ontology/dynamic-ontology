# 实体详情 iframe 改用实例 URL 接口

## 需求理解

点击实体列表「详情」后，在嵌入区展示 iframe；地址由 `GET /instance/url/list` 返回。`objectId` 取实例 `ontologyUniqueIdentifier`，`instanceId` 取实例 `primaryKey`（兼容 `entityPrimaryKey`），`spaceId` 取路由空间 id。

## 修改范围

- 新增 types / apis / mock 路由与 fixture
- `mapObjectProfileEntityRows.ts`、`ObjectProfileEntityList.vue`、`index.vue`
- 相关单测
- 本 Plan

## 新增、修改和删除文件

- 新增：`src/types/apis/getOntologyInstanceUrlListType.ts`、API、mock fixture/routes、本 Plan
- 修改：实体列表映射与详情嵌入、`types/index.ts`、`apis/index.ts`、单测
- 无删除

## 核心实现方式

1. 实现 `getOntologyInstanceUrlListInterface`
2. 行数据保留 `ontologyUniqueIdentifier` / `instanceId`
3. 详情点击请求 URL 后写入 iframe；失败展示错误

## 新增依赖及必要性

无。

## 验证方式

- 相关 `npm test` / 覆盖适用检查
- `format:check`、`check:types-conventions`、`type-check`、`build:verify`
