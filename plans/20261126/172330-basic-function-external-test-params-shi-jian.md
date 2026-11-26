# Plan：基础函数测试弹框 EXTERNAL 条件入参

## 需求理解

- 基础行为 · 基础函数过滤条件含 `source: "EXTERNAL"` 时，测试弹框需填写对应值。
- `params` 键为 `propertyApiName`（见 `docs/20261126/api.md` §3）；执行接口 `POST /ontology/action/test` 携带 `params`。
- 不依赖已移除的 `paramName`。

## 修改范围

- 新增：收集 EXTERNAL 条件与组装 `params` 的工具函数及测试。
- 修改：`BehaviorTestDialog.vue` 表单区与 `buildBasicFunctionTestRequestParams`。
- 修改：`testOntologyActionType.ts` 中 `params` 注释对齐文档（类型已有）。
- 修改：相关断言测试。

## 新增、修改和删除文件

| 动作 | 路径                                                                       |
| ---- | -------------------------------------------------------------------------- |
| 新增 | `src/utils/behaviorParameters/collectBasicFunctionExternalFilterParams.ts` |
| 新增 | `tests/basic-function-external-filter-params.test.mjs`                     |
| 修改 | `src/components/BehaviorTestDialog/BehaviorTestDialog.vue`                 |
| 修改 | `src/types/apis/testOntologyActionType.ts`                                 |
| 修改 | `tests/ontology-space-behavior.test.mjs`（必要时）                         |
| 新增 | `plans/20261126/172330-basic-function-external-test-params-shi-jian.md`    |

## 核心实现方式

1. 递归遍历 `basicFunction.filters`，收集 EXTERNAL 且需要取值的条件（`propertyApiName` + `op`）。
2. 测试弹框增加「外部输入条件」；`BETWEEN`/`NOT_BETWEEN` 双值，`IN`/`NOT_IN` 逗号分隔，其余单值。
3. `buildBasicFunctionTestRequestParams` 校验后写入 `params`。
4. 清空测试上下文时重置草稿。

## 新增依赖及必要性

无。

## 验证方式

- TDD：先写工具与弹框源码断言失败测试，再实现。
- `npm test`、`test:coverage`、`type-check`、`build:verify`、任务文件 format。
