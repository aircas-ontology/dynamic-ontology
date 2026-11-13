# 行为树连线方向箭头

## 需求理解

父子连线需可见方向标识（指向子节点）。

## 修改范围

- `useBehaviorTreeGraph.ts`
- `tests/behavior-tree-orchestration.test.mjs`

## 核心实现方式

1. 节点增加顶部 `in`、底部 `out` 端口；连线 `out → in`。
2. 加大 `targetMarker`，并在 `connecting.createEdge` 中复用。
3. 同步时更新已有边的端口与箭头属性。

## 新增依赖及必要性

无。

## 验证方式

源码断言 + format:check + behavior-tree-orchestration 测试。
