# 无入参时跳过入参绑定校验

## 需求理解

创建应用行为时，若关联函数算子没有可绑定的输入参数（界面「输入参数 0项」），不应再拦截「请至少配置一条入参绑定」。

## 修改范围

- `src/views/SpaceBehaviorWorkspace/utils/buildApplicationCreateActionParams.ts`：仅在存在叶子入参行时要求至少一条 `INPUT` mapping
- `tests/ontology-space-behavior.test.mjs`：原「仅 object 入参行则报错」改为允许通过；并补充「无入参、仅出参」成功用例
- Plan 保存 `plans/20261110/`

## 新增、修改和删除文件

- 修改：上述组装器与单测
- 新增：本 Plan 文件
- 删除：无

## 核心实现方式

仅当 `inputRows.length > 0` 且仍无 `INPUT` mapping 时报错；无叶子入参时跳过该校验。

## 新增依赖及必要性

无。

## 验证方式

- `node --test --experimental-strip-types tests/ontology-space-behavior.test.mjs`
- `npm run format:check --` 改动文件
- `npm run type-check`、`npm run build:verify`（既有无关失败单独注明）
