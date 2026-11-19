# 关系图 2D 快速收敛布局

## 需求理解

`OntologyRelationGraph2d` 现用 D3 默认力导向：圆周初值 + `alpha(1)` 慢冷却，首屏抖动久、收敛慢。需要更快稳定，并让以种子节点为中心的结构更清晰。

## 修改范围

- `src/components/OntologyRelationGraph2d/createRelationGraph2d.ts`
- 新增 `src/components/OntologyRelationGraph2d/layoutRelationGraph2d.ts`
- `tests/relation-graph-2d.test.mjs`
- 不新增依赖；不改 3D 图与页面交互 API

## 新增、修改和删除文件

- 新增：`src/components/OntologyRelationGraph2d/layoutRelationGraph2d.ts`
- 修改：`src/components/OntologyRelationGraph2d/createRelationGraph2d.ts`
- 修改：`tests/relation-graph-2d.test.mjs`
- 无删除

## 核心实现方式

1. 同心圆初值：以 seed（或最高度数节点）为中心，按边无向 BFS 分层；同层均匀角分布，半径随 hop 递增。仅新节点写初值，已有坐标保留。
2. 同步预热：`simulation.stop()` 后连续 `tick(N)`（约 80–120），再一次性渲染，首屏接近稳态。
3. 调参：提高 `alphaDecay` / `velocityDecay`；link 距离略按度数调节；charge 略加强；保留 collide、中心锚定与拖拽。

## 新增依赖及必要性

无（复用已有 `d3`）。

## 验证方式

- TDD：布局函数测 seed 居中、邻居同环、空图/无 seed；先红后绿。
- `npm test` 相关用例、`npm run test:coverage`、`npm run type-check`、`npm run build:verify`
- `npm run format:check --` 任务文件列表
- 人工：切换 graph2d，首屏应基本稳定、节点更少重叠
