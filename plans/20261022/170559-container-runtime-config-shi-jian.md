# 函数算子「运行配置」全屏列表

## 需求理解

在函数算子筛选栏「新建函数」左侧增加「运行配置」；全屏弹框调用容器运行实例列表接口，表格展示 `displayName` / `phaseLabel`。

## 修改范围

- 新增：`getOntologyFunctionContainerRuntimeListType.ts`、Mock、契约测试、`FunctionOperatorContainerRuntimeDialog.vue`
- 修改：`functionApi.ts`、`apis/index.ts`、`types/index.ts`、`FunctionOperatorPanel/index.vue`
- 无新增依赖

## 核心实现方式

GET `/ontology/function/container/runtime/list`；打开弹框时按当前 `spaceId` 拉取；loading/success/empty/error。

## 新增依赖及必要性

无。

## 验证方式

`npm test`、`format:check`、`type-check`、`build:verify`；人工打开弹框核对两列。
