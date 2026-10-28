# 根节点新建子分类按钮与弹框

## 需求理解

概念层级树已有数据时，在根节点行右侧（截图红框）放一个「新建子分类」小按钮。点击后弹出对话框，表单项为「输入子分类名称」。本次确认只关闭弹框，不调用创建接口。

## 修改范围

只改对象工作区的概念层级树和子分类弹框。空树时的「添加分类树」、已有创建接口和右侧总览不动。

## 文件

- 修改 `ConceptHierarchyTree.vue`：仅顶层根节点行右侧增加 22px 加号按钮。
- 新增 `CategoryTreeChildDialog.vue`。
- 修改 `ObjectWorkspacePanel.vue`：挂上弹框。
- 修改 `tests/ontology-object-workspace.test.mjs`。

## 核心实现

按钮 `aria-label` 为「新建子分类」，点击阻止冒泡。弹框复用 `aircas-dialog`、`aircas-form`、`aircas-input`。名称为空时确认不关闭。

## 新增依赖

无。

## 验证

相关测试先失败再通过；随后类型检查、任务文件格式检查，并在页面上点按钮确认弹框。
