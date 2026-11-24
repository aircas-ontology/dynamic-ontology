# 应用行为测试允许未选数据行时添加

## 需求理解

应用行为「测试行为」弹框中，已选对象实例但未选非 main 存储分组数据行时，也允许点击「添加」。执行测试仍传该实例的 `inputParams` 绑定，仅省略此绑定的 `dataPrimaryKeys`，由后端默认查询前十行。

本次只放宽测试弹框，不改变调度参数保存的严格校验，也不改变已选数据行时的请求结构。保留工作区已有修改，在其基础上做最小增量变更。

## 修改范围

- 测试弹框参数控制器的空数据行添加行为。
- 测试执行请求中缺少数据行主键时的实例绑定组装。
- 对应真实弹框控制器与提交链路的行为测试。

## 新增、修改和删除文件

- 修改：`src/composables/behavior/useBehaviorParameters.ts`
- 修改：`src/components/BehaviorTestDialog/BehaviorTestDialog.vue`
- 修改：`src/utils/behaviorParameters/buildApplicationTestRequestParams.ts`
- 修改：`tests/behavior-execution-prefill.test.mjs`
- 新增：本 Plan
- 删除：无

## 核心实现方式

1. 为 `useBehaviorParameters` 增加默认关闭的 `allowEmptyDataRow` 上下文选项，仅 `BehaviorTestDialog` 创建控制器时开启，避免影响调度表单。
2. 开启后，已选实例且数据行槽位存在时，未选数据行也可生成绑定记录；实例未选、实例或数据行加载中、存储分组配置缺失等原有拦截保持不变。
3. `skipParamValidation` 模式保留缺少数据行的实例绑定，不再过滤整条绑定；默认快照模式继续严格校验。
4. `buildApplicationTestRequestParams` 增加默认关闭的 `allowMissingDataPrimaryKeys` 选项。测试执行开启时，缺少数据行主键的绑定仅输出 `entityPrimaryKey`，不输出 `dataPrimaryKeys`。
5. 先新增行为测试并确认失败，再完成最小实现；已选数据行和默认严格模式现有用例作为回归验证。

## 新增依赖及必要性

- 无。

## 验证方式

- `npm test`
- `npm run test:coverage`，按脚本报告确认统计范围内行、函数、分支覆盖率均不低于 80%。
- `npm run type-check`
- `npm run build:verify`
- `npm run format:check -- <本次实际修改且受 Prettier 支持的文件列表>`
- `git diff --check`，检查任务相关 diff 与 `git status --short`。
- 当前无 E2E script；如开发环境可用，仅对应用行为测试弹框做浏览器冒烟，验证空数据行添加、已选数据行回归和 Console Error。业务结果及后端默认前十行行为由人工最终验收。
