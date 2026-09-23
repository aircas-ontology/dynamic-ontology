# 概念构建仅在对象为 0 时展示

## 需求理解

空间列表「更多」里的概念构建，只在该空间本体对象数量为 0 时显示。对象数量不为 0 时隐藏。卡片和表格共用同一操作组件。

## 修改范围

- `src/views/OntologySpaceManagement/components/SpaceActions.vue`
- `tests/ontology-space-management.test.mjs`

## 核心实现方式

用 `space.metrics.ontology === 0` 控制菜单项。命令处理在对象不为 0 时不发出概念构建动作。

## 新增依赖

无。

## 验证

先更新测试再实现。随后跑空间列表相关测试、任务文件 `format:check`、`type-check`、`build:verify`。
