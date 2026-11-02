# 脚本函数测试弹框按层级填写参数

## 需求理解

脚本函数测试弹框按详情接口 `params.fields` 展示输入参数层级。没有下级的参数可以填写值；有下级的节点只展示名称和类型。执行时 `parameters` 保持同一层级：叶子为 `{ paramName, paramValue }`，父级为 `{ paramName, fields }`。基础函数测试弹框不改。

## 修改范围

脚本函数测试入参的生成、更新、请求组装和测试弹框展示。

## 新增、修改和删除文件

- 修改 `src/utils/mapOntologyFunctionTest.ts`
- 修改 `src/types/apis/testOntologyFunctionType.ts`
- 修改 `src/views/FunctionOperatorPanel/components/FunctionOperatorScriptTestDialog.vue`
- 新增 `src/views/FunctionOperatorPanel/components/FunctionOperatorScriptTestParamTree.vue`
- 修改 `src/views/FunctionOperatorPanel/composables/useFunctionOperatorWorkspace.ts`
- 修改 `tests/test-ontology-function-api.test.mjs`

## 核心实现方式

- 入参行递归保留 `fields`，每层按 `paramOrder` 排序；空 `fields` 视为叶子，`paramValue` 初始为空字符串。
- 测试参数项增加可选 `fields`；仅叶子提交 `paramValue`。
- 弹框用缩进树展示；叶子输入框按从根到当前节点的序号路径回写，避免同名参数互相覆盖。
- 不新增依赖。

## 新增依赖及必要性

无。

## 验证方式

- 先补充嵌套生成与请求组装测试并确认失败，再实现后通过 `node --test --experimental-strip-types tests/test-ontology-function-api.test.mjs`。
- `npm run check:types-conventions`
- `npm run type-check`
- `npm run build:verify`
- `npm test` 与 `npm run test:coverage`：记录既有失败，确认本次测试文件通过。
- 对本次修改且受 Prettier 支持的文件执行 `format` 与 `format:check`。
