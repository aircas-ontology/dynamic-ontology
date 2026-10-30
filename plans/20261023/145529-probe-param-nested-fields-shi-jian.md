# 容器探查参数嵌套 fields 展示

## 需求理解

探查结果入/出参在 object/array 时可带递归 `fields`，需在「已发现接口」展开区树表展示；保存仍提交原接口项（去掉展示用 `_rowKey`）。

## 修改范围

- 类型增加 `fields?`
- Mock / fixture 补嵌套样例
- FormDialog 树表展示并注入 `_rowKey`；保存时剥离

## 新增、修改和删除文件

- 修改 `src/types/apis/probeOntologyFunctionContainerInterfacesType.ts`
- 修改 `src/mocks/probeOntologyFunctionContainerInterfacesMock/probeOntologyFunctionContainerInterfacesMock.ts`
- 修改 `src/mockData/fixtures/ontology/function/container/probe_interfaces.post.json`（若存在）
- 修改 `src/views/FunctionOperatorPanel/components/FunctionOperatorFormDialog.vue`
- 修改 `tests/probe-ontology-function-container-interfaces-api.test.mjs`

## 核心实现方式

`el-table` + `tree-props.children=fields` + `default-expand-all`；探查赋值前递归注入 `_rowKey`；组装创建请求时递归删除 `_rowKey`。

## 新增依赖及必要性

无。

## 验证方式

先更新断言再实现；跑相关测试、`format:check`、`type-check`、`build:verify`。
