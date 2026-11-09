# 对象画像对齐 ppp20261109：实体列表与标准应用

## 需求理解

将空间浏览对象画像页的「实体列表」「标准应用情况」内容及对应页面表现对齐到 `origin/ppp20261109`。

用户确认：

- 当前页面已不再关注关系图内容，本次不移植、不调整关系图实现。
- 实体列表暂用 Mock 数据展示，后续再对接真实接口。

## 修改范围

- 实体列表组件、配置弹窗、composable、行映射工具。
- 标准应用情况组件与 Mock。
- 页面壳与统计图主题表现中与 PPP 对齐且不影响关系图的部分（`index.vue` 侧图展示、`ObjectProfileEntityStats` 主题色 fallback）。
- 相关测试替换/更新。

不修改：`ObjectProfileRelationGraph.vue`、`buildObjectProfileRelationOption.ts`、Overview/Toc/PropertyDetail 中与关系图无关的既有演进（除非 checkout 目标文件时被 PPP 版本覆盖且仍属本范围外——本范围明确不改关系图相关文件）。

## 新增、修改和删除文件

修改（以 PPP 版本为准覆盖）：

- `src/views/EntityBrowsingObjectProfile/components/ObjectProfileEntityList.vue`
- `src/views/EntityBrowsingObjectProfile/components/ObjectProfileEntityListConfigDialog.vue`
- `src/views/EntityBrowsingObjectProfile/components/ObjectProfileStandardUsage.vue`
- `src/views/EntityBrowsingObjectProfile/components/ObjectProfileEntityStats.vue`
- `src/views/EntityBrowsingObjectProfile/composables/useObjectProfileEntityList.ts`
- `src/views/EntityBrowsingObjectProfile/utils/mapObjectProfileEntityRows.ts`
- `src/views/EntityBrowsingObjectProfile/index.vue`
- `src/mocks/entityBrowsingObjectProfileMock/entityBrowsingObjectProfileStandardUsageMock.ts`
- `src/types/pages/entityBrowsingObjectProfileType.ts`（若 PPP 仅有格式差异则一并对齐）

新增：

- `tests/entity-browsing-object-profile-entity-list.test.mjs`（来自 PPP）

删除或收缩：

- `tests/object-profile-entity-api.test.mjs` 中与「强制真实接口 / 可注入 loader」冲突的断言；若整文件被 PPP 测试替代则删除该文件。

## 核心实现方式

1. 从 `origin/ppp20261109` checkout 上述目标文件。
2. 实体列表 composable 保留 `isUseMockEnabled()` 时走 `createObjectProfileEntityListMockRecords()`；非 Mock 仍走 `getOntologyEntitiesInterface`，便于后续接真接口。
3. 补齐 PPP 侧缺失的「配置」按钮与 `ObjectProfileEntityListConfigDialog` 挂载；同步 PPP 的 `list.get.json` 中文属性样例；引入 `src/utils/isUseMockEnabled.ts`。
4. 标准应用组件与 Mock 以 PPP 为准。
5. 不改动关系图文件。

## 新增依赖及必要性

无。

## 验证方式

- 跑对象画像相关测试：`node --test --experimental-strip-types tests/entity-browsing-object-profile-entity-list.test.mjs` 及受影响用例。
- `npm run format:check -- <本次文件列表>`
- `npm run type-check`、`npm run build:verify`
- 浏览器冒烟：空间浏览 → 对象画像 → 实体列表（Mock）与标准应用情况。
