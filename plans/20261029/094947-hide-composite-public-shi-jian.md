# 函数编排暂时不对外开放

## 需求理解

隐藏「函数编排」新建类型卡片与列表筛选入口；不删除 COMPOSITE 业务代码。已有编排函数仍可编辑/测试。

## 修改范围

- `src/types/pages/ontologyFunctionOperatorType.ts`：公开开关与公开类型选项
- `src/types/index.ts`：导出新常量
- `FunctionOperatorFormDialog.vue` / `FunctionOperatorPanel/index.vue`：改用公开选项
- 相关测试断言

## 新增、修改和删除文件

- 修改上述文件；无新增依赖；无删除业务编排代码

## 核心实现方式

`FUNCTION_OPERATOR_COMPOSITE_PUBLIC = false`，`FUNCTION_OPERATOR_PUBLIC_TYPE_OPTIONS` 过滤 composite；UI 入口用公开选项。

## 新增依赖及必要性

无。

## 验证方式

- function-operator 相关测试
- format:check
