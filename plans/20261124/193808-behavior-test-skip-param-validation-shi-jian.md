# 行为执行测试取消前端参数校验

## 需求理解

应用行为「测试行为」对话框点「执行」时，不再因未添加实例绑定、未选数据行、EXTERNAL 未填、关系 From/To 未选、实例/数据行 loading/error 等前端校验而拦截请求。调度保存用的 `createParameterSnapshot()` 继续严格校验。仍要求行为详情具备 `actionApi` 与 `spaceId`。

## 修改范围

- 仅放宽 `submitApplicationBehaviorTest` 组装请求时的参数完整性校验。
- 不改调度快照、不改 UI 顶部 `configurationError` 提示逻辑（未绑定时仍可显示提示，但不阻止执行）。

## 新增、修改和删除文件

- 修改：`src/composables/behavior/useBehaviorParameters.ts`
- 修改：`src/components/BehaviorTestDialog/BehaviorTestDialog.vue`
- 修改：`tests/shared-behavior-parameters.test.mjs`
- 修改：`tests/ontology-space-behavior.test.mjs`（如需断言 `skipParamValidation`）
- 新增：本 Plan
- 删除：无

## 核心实现方式

1. 为 `buildParameterRequest` 增加可选参数 `{ skipParamValidation?: boolean }`。
2. `skipParamValidation === true` 时：
   - `collectApplicationParamBindingSelections`：跳过未完成绑定，只收录完整项，不返回 error；
   - EXTERNAL / 关系 From-To / 实例与数据行 loading、error：不拦截。
3. `submitApplicationBehaviorTest` 调用 `buildParameterRequest({ skipParamValidation: true })`。
4. `createParameterSnapshot` 仍用默认严格模式。

## 新增依赖及必要性

- 无

## 验证方式

- 先补/改失败用例（未绑定时测试执行可继续），再实现并通过。
- `npm test`（相关用例）
- `npm run format:check --` 任务文件
- `npm run type-check`、`npm run build:verify`
