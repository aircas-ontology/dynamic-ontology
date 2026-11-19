# LIST 组头增加折叠按钮

## 需求理解

脚本函数测试参数树中，LIST 每一组「第 N 组」标题与「删除」之间增加折叠按钮，用于收起/展开该组参数字段展示。

## 修改范围

仅 `FunctionOperatorScriptTestParamTree.vue` 及对应源码断言测试。

## 新增、修改和删除文件

- 修改 `src/views/FunctionOperatorPanel/components/FunctionOperatorScriptTestParamTree.vue`
- 修改 `tests/test-ontology-function-api.test.mjs`

## 核心实现方式

- 组头增加折叠/展开按钮（文案 + `aria-expanded`）
- 组件内按组 key 记录折叠态，默认展开；折叠时 `v-show` 隐藏字段树
- 不改请求数据结构；无新依赖

## 新增依赖及必要性

无。

## 验证方式

- 更新源码断言并运行 `tests/test-ontology-function-api.test.mjs`
- 对本任务文件执行 `format` / `format:check`
