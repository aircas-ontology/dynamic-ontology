# Plan：取消自动匹配，上游可选任意参数/任意层级

## 需求理解

1. 不要自动匹配：有前驱时不按同名自动填 `fromUpstream`；切到「来自上游」时不预选第一项。
2. 上游 OUTPUT 多个顶层参数、多级 `fields` 时，下拉可选任意节点（含中间 OBJECT）。

## 修改范围

函数节点入参绑定的默认生成、上游选项、模式切换；逻辑节点不动。

## 新增、修改和删除文件

| 操作 | 路径                                                                                         |
| ---- | -------------------------------------------------------------------------------------------- |
| 修改 | `src/views/FunctionOperatorPanel/utils/compositeWorkflowGraph.ts`                            |
| 修改 | `src/views/FunctionOperatorPanel/components/FunctionOperatorCompositeFunctionNodeDialog.vue` |
| 修改 | `src/views/FunctionOperatorPanel/components/FunctionOperatorCompositeInputBindingTree.vue`   |
| 修改 | `tests/composite-workflow-utils.test.mjs`                                                    |

## 核心实现方式

1. 新增全树节点遍历；下游绑定位仍用叶子。
2. 默认绑定全部 manual。
3. 上游下拉用全节点列表；切换「来自上游」不预填路径。
4. 修复/校验按路径在全节点中查找；去掉同名叶子兜底猜测。

## 新增依赖及必要性

无。

## 验证方式

- TDD：默认无同名自动绑；多顶层+多级均在选项中；切换模式不预填。
- format:check、相关单测、type-check、build:verify。
