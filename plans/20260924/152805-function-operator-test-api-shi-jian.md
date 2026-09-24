# Plan：基础函数算子测试（testFun）

确认范围（用户 2026-09-24）：

1. 测试结果暂不展示，仅调用测试接口并给出成功/失败提示。
2. Mock `message` 用「查询成功」；`data` 暂为 `null`（输出未知）。

## 需求理解

打开测试弹框 → 拉函数详情生成 `variableBindings` 键 → 选空间对象与属性填值 → 预览完整请求 JSON → 运行时 POST `/ontology/function/test`。

## 修改范围

- Types / API / Mock：`testOntologyFunction*`；详情类型补 `paramRole`
- Utils：binding keys + 请求体组装
- 测试弹框 UI + workspace openTest/runTest
- 对象：分类树扁平化；属性：`getOntologyPropertyByOntologyIdInterface`
- 相关单测

## 新增依赖

无。

## 验证方式

TDD + format + types-conventions + type-check + build:verify + 相关单测。
