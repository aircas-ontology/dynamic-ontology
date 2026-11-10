# 应用行为测试：入参与关系多选

## 需求理解

以选中稿为准：`inputParams` 为参数名→绑定对象数组；`outputParams` 仍单对象；`entityPrimaryKeys.from/to` 为主键数组。

## 修改范围

- `src/types/apis/testOntologyActionType.ts`
- `src/views/SpaceBehaviorWorkspace/utils/buildApplicationTestRequestParams.ts`
- `src/views/SpaceBehaviorWorkspace/components/BehaviorTestDialog.vue`
- `tests/ontology-space-behavior.test.mjs`
- 本 Plan

## 新增、修改和删除文件

- 修改上述文件；新增本 Plan；无删除

## 核心实现方式

1. 类型：`inputParams` 数组；`entityPrimaryKeys.from/to` 数组；`outputParams` 单对象
2. 组装器：同名入参聚合成数组；出参单条；关系两端数组
3. UI：入参多选 + 每实例数据行；出参单选；关系 From/To 多选

## 新增依赖及必要性

无。

## 验证方式

- `node --test --experimental-strip-types tests/ontology-space-behavior.test.mjs`
- `npm run format:check --` 改动文件
- `npm run type-check`、`npm run build:verify`
