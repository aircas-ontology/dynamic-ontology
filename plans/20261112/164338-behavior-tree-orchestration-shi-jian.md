# 行为树编排功能（两期）

## 需求理解

将 `behavior-tree-editor/index.html` 中未排除能力迁入 Vue3 全屏弹框；从创建行为「行为树编排」进入。元数据来自创建表单。

## 用户确认决策

1. 创建仅「保存」(POST)，成功后显示「更新」(PUT)。
2. 编辑已有行为树同样打开编排并自动 `GET /action` 加载。
3. 保存成功后停留在编排页继续改。
4. 代码放独立目录 `src/views/BehaviorTreeOrchestration/`。
5. 分两期实施。

## 一期范围（本次）

- 全屏弹框壳、工具栏（清空 / 布局 / 适应 / 导入导出入口；保存按钮 UI，实际保存二期）。
- 打开时自动 `GET /action/tree/node-defs`。
- 左侧节点 + 可绑定行为面板；X6 画布交互。
- 右侧：节点配置、黑板、定义 JSON。
- 入口：`BehaviorFormDialog` 打开弹框并传入元数据。

## 二期范围（后续）

- POST/PUT `/action`（`actionKind: TREE` + `treeDefinition`）。
- 编辑模式自动加载详情。
- 保存成功后切换为更新态并刷新状态。

## 修改范围 / 文件

见实施：`BehaviorTreeOrchestration/**`、apis/types/mocks、`BehaviorFormDialog`、测试。

## 核心实现方式

Vue3 + `@antv/x6`；Graph 生命周期对齐概念模型画布；请求走现有 `request`；Aircas 主题样式。

## 新增依赖

无。

## 验证方式

一期：模型/序列化/校验单测 + format + type-check + build:verify + 打开编排冒烟。
