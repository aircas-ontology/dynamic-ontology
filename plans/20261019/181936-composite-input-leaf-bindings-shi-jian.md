# 函数节点入参绑定展开到叶子

## 需求理解

函数编排中函数节点的入参绑定按参数树展示到最底层。有下级字段的参数只显示名称和类型；叶子显示类型，并保留手动输入与来自上游。上游选项仍是前驱顶层输出。

## 修改范围

绑定增加从根到叶子的 `paramPath`。默认绑定、修复和保存校验只处理叶子。已保存的顶层绑定若对应叶子则保留，若对应仍有下级的对象则改为该对象叶子的默认绑定。

## 新增、修改和删除文件

- 修改 `src/types/pages/ontologyCompositeWorkflowType.ts`
- 修改 `src/views/FunctionOperatorPanel/utils/compositeWorkflowGraph.ts`
- 修改 `src/views/FunctionOperatorPanel/components/FunctionOperatorCompositeFunctionNodeDialog.vue`
- 新增 `src/views/FunctionOperatorPanel/components/FunctionOperatorCompositeInputBindingTree.vue`
- 修改 `tests/composite-workflow-utils.test.mjs`

不删除文件。

## 核心实现方式

递归收集无 `fields` 的叶子生成绑定。对话框按同一棵树渲染，用 `paramPath` 更新对应叶子。

## 新增依赖及必要性

无。

## 验证方式

先更新绑定断言并确认失败，再实现。执行 `tests/composite-workflow-utils.test.mjs`、`npm run type-check`、`npm run build:verify`，以及对本次文件的 `npm run format:check`。
