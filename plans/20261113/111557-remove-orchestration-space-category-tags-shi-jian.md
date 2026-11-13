# 去除编排顶栏空间/分类标签

## 需求理解

删除行为树编排顶栏红框内的「空间」「分类」标签展示。

## 修改范围

- `BehaviorTreeOrchestrationDialog.vue`：删除两个 `el-tag`
- 测试按需补充负向断言

## 核心实现方式

仅去掉 UI 展示；`meta.spaceId` / `meta.categoryId` 仍用于保存与加载。

## 新增依赖及必要性

无。

## 验证方式

format:check；behavior-tree-orchestration 相关测试。
