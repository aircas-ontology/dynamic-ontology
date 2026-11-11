# 调度创建本体标识改为可选

用户确认：移除本体标识必填拦截；有值传递，无值省略；保留页面输入及行为参数有效性校验。

- 修改 src/views/SpaceBehaviorScheduleWorkspace/utils/buildBehaviorScheduleCreateParams.ts，删除本体标识空值拦截并按非空值组装可选字段。
- 修改 src/types/apis/createBehaviorScheduleType.ts，将 ontologyIdentifier 标为可选，与最新接口契约一致（应用行为由 linkMapping 推导）。
- 修改 tests/schedule-create-params.test.mjs、tests/shared-behavior-parameters.test.mjs，先失败再实现；验证空白标识省略、有效标识保留及界面正常提交，原有输入和Cron校验不变。
- 新增本计划，无删除、无新增依赖、不触碰public/html。
- 验证针对测试、npm test、test:coverage、类型规范→type-check→build:verify、限定格式与diff检查。记录既有失败，未进行浏览器或人工验收时明确说明。
