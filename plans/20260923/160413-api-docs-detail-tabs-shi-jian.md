# Plan：应用管理接口详情 Tab 布局

## 需求理解

将 `ApiDocsEndpointDetail` 中请求参数、请求体、响应、200 响应结构改为 Tab 展示，对齐原型布局；不改数据解析与左侧列表。

## 修改范围

- `ApiDocsEndpointDetail.vue`：头部保留，主体改为 `el-tabs.aircas-tabs`
- `tests/application-management-page.test.mjs`：Tabs 接线断言

## 核心实现方式

Tabs：`parameters` / `body` / `responses` / `schema200`；切换接口时重置到首 Tab；200 结构取 `status === "200"`。

## 新增依赖

无。

## 验证方式

- 相关测试 + `format:check`
- `type-check`（记录既有无关失败）
