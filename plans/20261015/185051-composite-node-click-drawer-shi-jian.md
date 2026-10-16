# 编排画布节点单击右侧抽屉

## 需求理解

函数节点与逻辑节点均由「双击中心弹框」改为「单击右侧抽屉」展示配置/详情；单击画布空白关闭抽屉。

## 修改范围

- `useCompositeWorkflowCanvas.ts`：`node:dbclick` → `node:click`；`blank:click` 清空编辑态（互斥打开时清另一类）
- `FunctionOperatorCompositeFunctionNodeDialog.vue`：`el-dialog` → `el-drawer`
- `FunctionOperatorCompositeLogicNodeDialog.vue`：`el-dialog` → `el-drawer`
- `FunctionOperatorCompositeWorkflowDialog.vue`：引导文案

## 新增 / 修改 / 删除文件

- 仅修改上述文件；无新增依赖；无删除。

## 核心实现方式

1. 单击函数节点：打开函数详情抽屉（含入参绑定）。
2. 单击逻辑节点：打开逻辑配置抽屉；同时清空函数编辑态（反之亦然）。
3. 抽屉 `append-to-body`、`size≈520px`、标题栏沿用现有详情抽屉背景样式约定。
4. 空白单击：`clearNodeEditState`。

## 新增依赖及必要性

无。

## 验证方式

- format:check 改动文件
- 手工：单击函数/逻辑出右侧抽屉；点空白关闭；连线与拖拽不受影响
