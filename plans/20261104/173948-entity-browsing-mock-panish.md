# Plan：实体浏览外网 Mock 样例

## 需求理解

- 外网无后端时用本地 Mock 搭起「实体浏览」页面。
- 当前报错「未匹配到 Mock 路由」：37003 被其他项目 Mock 占用，本仓库路由未生效；同时需补齐空间 23 样例数据。

## 修改范围

- 更新 `src/mockData` 中空间列表、分类树、空间统计、概览 fixture。
- 新增实体浏览 Mock 相关测试。
- 结束占用 37003 的异项目进程，启动本仓库 `scripts/mock-server.mjs`。
- 不修改 `public/`（`USE_MOCK` 已由用户打开）。

## 新增 / 修改文件

- 修改：`space.get.json`、`category/tree.get.json`、`space/statistic.get.json`、`overview/count.get.json`
- 新增：`tests/entity-browsing-mock.test.mjs`

## 核心实现方式

1. 空间列表包含 `spaceId: 23`（战场情报领域），保留原 `spaceId: 1`。
2. 分类树提供多级概念 + 对象卡片指标，供对象工作区渲染。
3. 统计与概览数字与样例规模大致一致。

## 新增依赖

- 无。

## 验证方式

- Mock 相关测试；对本机 `37003` 探测 `/ontology/space`；`format:check`。
