# Plan：关系工作台增加 1跳/2跳选择（默认 1跳）

- 时间：2026-10-19 16:00（Asia/Shanghai）
- git-user：guoshengnan
- 状态：已经用户确认（1跳语义采用"无向关联：源或目标都算"）

## 需求理解

空间内关系页（`/workspace/ontology-space-management/:spaceId/relation`）与对象详情关系页（`/workspace/ontology-object/:objectId/relation`）共用 `SpaceRelationWorkspace`，需增加"1跳/2跳"切换控件，默认选中 1跳：

- 1跳（默认）：与中心对象直接相连的全部关系（源或目标，无向）。
- 2跳：再向外扩展一层，保留相邻跳层扩展边（0↔1、1↔2），不含同层互连（沿用现有 `filterRelationsByHop` 规则）。
- 跳数同时作用于关系图、列表和标题计数（共用 `visibleSpaceRelations`，保证一致）。
- 三维关系图布局已支持按跳数分环（L1/L2 半径递增、节点标注 L2），`RelationGraphView` 已接收 `maxHop`，接线即可生效。

## 现状要点

- `useSpaceRelationWorkspace` 的 `relationFilter.maxHop` 已存在（默认 1）但被 `applyRelationFilter` 硬编码为 1，无 UI 入口。
- 现有种子筛选为有向"以对象为源"（`filterRelationsBySourceObject`），语义确认后改为无向跳数过滤。
- 工具层已有无向 `filterRelationsByHop`（未接线，已有相邻跳层测试）。
- 对象页接口原传 `ontologyUniqueIdentifierFrom`（后端仅返回该对象关联的关系），2跳需要"邻居对象之间的关系"，该请求拿不到 → 对象页改为拉取空间全量关系 + 前端过滤（与空间页一致；三维图本就按对象显示名建图，名称唯一为既有假设）。

## 文件变更

### 修改

1. `src/views/SpaceRelationWorkspace/composables/useSpaceRelationWorkspace.ts`
   - `visibleSpaceRelations` 改用 `filterRelationsByHop(byCategory, graphSeedNames, maxHop)`（`graphSeedNames` 负责 value→label 解析，移到该 computed 之前声明）。
   - `applyRelationFilter` 保留当前 `maxHop`，不再重置为 1（对象页数据刷新后保持用户选择）。
   - 新增 `setRelationFilterMaxHop(hop: SpaceRelationHopLevel)` 并导出。
   - `loadSpaceRelationWorkspaceFromApi` 移除 `ontologyUniqueIdentifierFrom` 参数及条件赋值。
2. `src/views/SpaceRelationWorkspace/index.vue`
   - header 筛选区（对象下拉之后、添加按钮之前）新增跳数按钮组：`el-radio-group`（`ariaLabel="关系跳数"`、`:model-value="relationFilter.maxHop"`），`v-if="relationFilter.applied"`（空间页选中对象或对象页自动应用后显示），选项 `1跳`/`2跳`。
   - 新增 `handleMaxHopChange`（校验值后调用 `setRelationFilterMaxHop`）。
   - `resetFilter` 同时复位跳数为 1跳。
3. `src/views/SpaceRelationWorkspace/utils/spaceRelationGraph.ts`
   - 删除不再被引用的 `filterRelationsBySourceObject`（无向语义下 composable 不再使用；保留 `computeHopDistances`、`filterRelationsByHop`）。
4. `src/types/apis/ontologyRelationCategoryTreeType.ts`
   - 移除不再使用的 `ontologyUniqueIdentifierFrom` 可选字段及注释。
5. `tests/ontology-space-relation.test.mjs`（TDD，先改测试确认失败）
   - 更新原"source object filter"测试：改为断言 composable 使用 `filterRelationsByHop` 与 `setRelationFilterMaxHop`、不再引用 `filterRelationsBySourceObject`。
   - 新增 2跳行为测试（复用关系 mock 数据，种子"福特级航空母舰(CVN)"）：
     - 1跳：包含入边（如 巡洋舰→福特），不含二跳边。
     - 2跳：新增 舰载机联队→舰载战斗机、驱逐舰→攻击型核潜艇、海军基地→海军造船厂、联合任务部队→海上巡逻机 等；排除三跳边（海军造船厂→区域维修中心）与同层互连边（伯克→巡洋舰）。
     - 1跳结果 ⊆ 2跳结果（单调性）。
   - 新增 index.vue 控件源码断言（ariaLabel、选项、v-if、handler、重置复位）。

## 新增依赖

无。

## 验证方式

1. TDD：先更新/新增测试并运行确认因功能未实现而失败，再实施至通过。
2. `npm test`、`npm run test:coverage`（统计范围：本次涉及的 `SpaceRelationWorkspace` utils/composables，行/函数/分支 ≥80%）。
3. `npm run type-check`、`npm run build:verify`。
4. `npm run format:check -- src/views/SpaceRelationWorkspace/composables/useSpaceRelationWorkspace.ts src/views/SpaceRelationWorkspace/index.vue src/views/SpaceRelationWorkspace/utils/spaceRelationGraph.ts src/types/apis/ontologyRelationCategoryTreeType.ts tests/ontology-space-relation.test.mjs`。
5. 浏览器冒烟：空间内关系页选对象切换 1/2跳、对象详情关系页切换 1/2跳，核对关系图/列表/计数一致、默认 1跳、重置复位，检查 Console 无报错；人工验收最终 UI/UX。

## 行为变化说明

- 对象页与空间页 1跳默认视图由"仅作为源"改为"源或目标"（用户已确认），显示的关系数量会增加（含入边）。
- 对象页请求数据由"该对象关联的关系"改为"空间全量关系 + 前端过滤"，展示结果仍以中心对象跳数过滤收敛。

## 变更记录 1：对象详情页左侧分类树同步按当前对象过滤（2026-10-19 追加，用户已确认"隐藏无关分类"）

### 需求理解

对象详情关系页要求：

1. 左侧分类树与右侧展示列表只展示源或目标是当前对象的关系；
2. 选择 2跳时，左侧分类树与右侧列表都展示与对象相关的 2跳关系。

用户已确认：过滤后未包含相关关系的分类节点直接隐藏（仅保留命中分类及其父级路径）。

### 修改范围（在原 Plan 基础上追加）

1. `src/views/SpaceRelationWorkspace/utils/relationOperations.ts`
   - 新增 `pruneRelationCategoryTree(nodes, relations)`：递归裁剪分类树，移除自身及子树均不含给定关系的分支，保留命中分类的完整父级路径。
2. `src/views/SpaceRelationWorkspace/composables/useSpaceRelationWorkspace.ts`
   - 新增 `isObjectRelationFilterActive`（对象页且已应用中心对象筛选）。
   - 新增 `categoryPanelRelations`：激活时对全量关系做 `filterRelationsByHop`（不叠加分类过滤，树展示全部分类的命中关系），否则返回全量。
   - 新增 `categoryPanelTreeData`：激活时用 `pruneRelationCategoryTree` 裁剪分类树，否则返回原树。
3. `src/views/SpaceRelationWorkspace/index.vue`
   - `RelationCategoryPanel` 的 `:tree-data` 改传 `categoryPanelTreeData`、`:relations` 改传 `categoryPanelRelations`。
   - 管理类逻辑（分类删除阻断 `categoryDeleteBlocked`、树叶子点击定位 `openRelationFromTree`）仍使用全量 `relations`，不受展示过滤影响。
4. `tests/ontology-space-relation.test.mjs`
   - 新增裁剪行为测试：仅保留命中关系所属分类的祖先路径（与原树路径严格一致）。
   - 新增接线源码断言：composable 两个 computed 与 gating、页面绑定改传新 computed。
5. 空间内关系页行为不变（`isObjectRelationPage` 为 false 时树与关系保持全量）。

### 验证方式（追加部分同原 Plan）

- 单文件红灯→绿灯：`node --test tests/ontology-space-relation.test.mjs`（新增 2 用例先失败后通过）。
- 完整验证沿用原 Plan：`npm test`、`npm run test:coverage`、`npm run type-check`、`npm run build:verify`、`npm run format:check -- <本次改动文件>`、浏览器冒烟对象页 1/2跳切换核对树/图/列表一致。
