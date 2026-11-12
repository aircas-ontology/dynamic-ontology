# 周期行为调度编辑保存

用户确认生成接口说明并对接周期调度编辑保存。

- 新增 docs/20261111/updateSchedulingApi.md，说明 PUT /ontology/action/scheduling、id和其他必填字段、可选ontologyIdentifier、task.entityJson及RULE契约与当前限制。
- 新增 src/types/apis/updateBehaviorSchedulingType.ts，复用创建周期配置并增加id；修改src/types/index.ts、src/apis/ontologyActionApi.ts、src/apis/index.ts统一导出接口与类型。
- 修改 BehaviorScheduleFormDialog.vue，编辑也组装经过校验的周期参数；修改index.vue编辑请求提交、成功关闭刷新当前筛选分页、message反馈、失败保留重试、防重复及空间切换/卸载过期保护。
- RULE规则画布与扁平接口无转换约定，编辑保存明确提示暂不支持，不再本地更新后提示成功。
- 修改tests/schedule-save-api.test.mjs、tests/shared-behavior-parameters.test.mjs，先失败再实现，验证路径方法、完整参数、编辑后值、成功/错误/重试/重复/过期响应及规则限制。
- 无新增依赖、无删除；保留已有修改，不触碰public/html。
- 验证相关测试、npm test/test:coverage、类型规范→type-check→build:verify、限定格式和diff；记录既有失败。无E2E入口及可用浏览器工具，浏览器人工验收待执行。
