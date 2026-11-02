# 源函数下拉独立拉列表

## 需求理解

新建算子弹窗「源函数」改为独立调用函数列表接口；筛选仅传当前类型对应 API type；pageNum=1、pageSize=1000；仍传必填 ontologySpaceId。

## 修改范围

表单数据流、类型映射工具、workspace 复用、相关测试；不改 mockData/public。

## 新增、修改和删除文件

- 新增：src/utils/mapFunctionOperatorTypeToApi.ts
- 修改：useFunctionOperatorWorkspace.ts、FunctionOperatorFormDialog.vue、index.vue、tests/function-operator-workspace.test.mjs

## 核心实现方式

弹窗打开/切换类型时请求 getOntologyFunctionListInterface；generation 防过期；选项 label=displayName、value=functionApi；移除 operators prop。

## 新增依赖及必要性

无。

## 验证方式

TDD 更新契约测试；node --test tests/function-operator-workspace.test.mjs；type-check；build:verify；format:check。
