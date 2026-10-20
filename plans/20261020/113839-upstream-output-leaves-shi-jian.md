# Plan：下游入参可选上游 OUTPUT 叶子

## 需求理解

有前驱时，「来自上游」下拉应列出上游 OUTPUT 的最底层叶子（如 `Output.id`），而不是只可选顶层对象；默认同名映射与类型校验按叶子进行。

## 修改范围

函数节点入参绑定的上游选项、默认映射、修复与校验；逻辑节点上游引用本次不动。

## 新增、修改和删除文件

| 操作 | 路径                                                                                         |
| ---- | -------------------------------------------------------------------------------------------- |
| 修改 | `src/types/pages/ontologyCompositeWorkflowType.ts`                                           |
| 修改 | `src/views/FunctionOperatorPanel/utils/compositeWorkflowGraph.ts`                            |
| 修改 | `src/views/FunctionOperatorPanel/components/FunctionOperatorCompositeInputBindingTree.vue`   |
| 修改 | `src/views/FunctionOperatorPanel/components/FunctionOperatorCompositeFunctionNodeDialog.vue` |
| 修改 | `tests/composite-workflow-utils.test.mjs`                                                    |

## 核心实现方式

1. 复用参数树叶子遍历；上游 OUTPUT 展平为叶子选项。
2. `fromUpstream` 增加 `upstreamParamPath: string[]`；保留 `upstreamParamName` 为叶子名。
3. 下拉以路径键展示；默认同名按叶子名匹配；校验/修复按路径查叶子。
4. 旧绑定无路径时尽量按顶层名兼容，否则降为 manual。

## 新增依赖及必要性

无。

## 验证方式

- TDD：嵌套 OUTPUT 叶子选项、默认同名路径、类型按叶子比较。
- 相关 format:check、单测、type-check、build:verify；类型目录变更执行 check:types-conventions。
