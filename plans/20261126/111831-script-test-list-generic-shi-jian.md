# 函数算子测试 List 多组参数

## 需求理解

脚本/IDE 函数算子测试中，`paramType` 以 `List`/`Array` 开头（含 `List<Point>`、`List<List<Point>>`、`List<Double>`）时，应能在各级增加/删除元素组，运行测试时把完整嵌套结构写入 `parameters[].paramValue`。

## 修改范围

| 动作 | 文件                                                                                 |
| ---- | ------------------------------------------------------------------------------------ |
| 修改 | `src/utils/mapOntologyFunctionTest.ts`                                               |
| 修改 | `src/views/FunctionOperatorPanel/components/FunctionOperatorScriptTestParamTree.vue` |
| 修改 | `tests/test-ontology-function-api.test.mjs`                                          |
| 新增 | `plans/20261126/111831-script-test-list-generic-shi-jian.md`                         |

## 核心实现方式

1. 列表类型判断支持 `LIST`/`ARRAY` 及 `LIST<`/`ARRAY<` 泛型；导出供 UI 复用。
2. 有 fields 的 List 初始化 listItems；无 fields 的标量 List 用元素类型生成单叶子模板。
3. 序列化：单叶子组输出标量；多字段组输出对象。
4. UI 复用导出判断。

## 新增依赖

无。

## 验证方式

- `node --test tests/test-ontology-function-api.test.mjs`
- format / type-check / build:verify
