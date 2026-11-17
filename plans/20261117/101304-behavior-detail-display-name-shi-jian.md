# 行为详情面板展示行为名称

## 需求理解

行为详情抽屉摘要区将「行为 ID」改为展示「行为名称」（`displayName`）。

## 修改范围

- `BehaviorDetailDrawer.vue`
- `tests/ontology-space-behavior.test.mjs`

## 新增、修改和删除文件

- 修改：上述文件
- 无新增/删除

## 核心实现方式

标签改为「行为名称」，值绑 `viewState.displayName`。

## 新增依赖及必要性

无。

## 验证方式

- 相关单测 + format:check
