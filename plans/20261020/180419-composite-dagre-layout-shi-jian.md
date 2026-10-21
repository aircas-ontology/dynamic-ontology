# 编排画布自动布局改为 Dagre

## 需求理解

将组合工作流「自动布局」从网格占位改为基于边关系的 Dagre 左右分层布局。

## 修改范围

- `src/views/FunctionOperatorPanel/utils/compositeWorkflowDagreLayout.ts`（新增）
- `src/views/FunctionOperatorPanel/composables/useCompositeWorkflowCanvas.ts`
- `tests/composite-workflow-dagre-layout.test.mjs`（新增）

## 新增、修改和删除文件

### 新增

- Dagre 布局纯函数与测试

### 修改

- `autoLayoutCompositeWorkflowCanvas` 接入 Dagre

### 删除

- 无

## 核心实现方式

`layoutCompositeWorkflowNodesWithDagre` + 画布 async 写回坐标并 fit；失败提示。

## 新增依赖及必要性

无（复用 `@antv/layout`）。

## 验证方式

相关 test、`type-check`、`build:verify`、format:check。
