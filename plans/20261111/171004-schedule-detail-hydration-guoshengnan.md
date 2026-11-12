# 修复调度行为及参数回显

用户确认：查看/编辑按 actionApi 匹配选项，列表失败仍回显详情名称；解析 entityJson 后恢复外部值、对象实例绑定及关系两端，查看只读，编辑可调整。

- 修改页面 index.vue、BehaviorScheduleFormDialog.vue 及页面类型：传递详情对象标识；选项采用 actionApi 匹配并提供详情兜底；异步列表重试不清空参数，重开清理旧数据。
- 新增页面 utils/restoreScheduleBehaviorParameters.ts：校验 JSON、行为/空间上下文，基于已加载参数定义构造可恢复快照，恢复跨页选中实例、非 main 数据行和多选关系。无详情名称时以主键标注保存的选择，不虚构实体名称。
- 对共享参数状态增加最小原始主键支持，修改 src/types/behavior/behaviorParameterType.ts、src/composables/behavior/useBehaviorParameters.ts，避免复杂主键回显后被转成字符串；不改变其他调用者正常行为。
- 修改 tests/shared-behavior-parameters.test.mjs、tests/schedule-save-api.test.mjs，先失败后实现；覆盖零/false、绑定、跨页、关系、多次打开、列表失败与重试、JSON 异常、错配和过期响应。
- 新增依赖无，删除文件无；保留已有修改，不触碰 public/html。
- 验证针对测试、npm test、test:coverage、类型规范→type-check→build:verify、限定格式及 diff 检查；记录既有失败。无 E2E 入口，浏览器回显和人工验收未执行时明确记录。

## 回显失败追查补充

用户提供真实返回并确认周期配置位于 data.taskVO；在线文档仍声明 ruleVO，导致前端读取不到参数。沿用已确认的详情回显修复范围：修改 index.vue 优先读取 taskVO 并兼容 ruleVO，类型增加 taskVO，接口说明记录真实返回差异；更新本文件及 tests/schedule-save-api.test.mjs，使用用户提供的 max_mach 和关系两端参数先失败后修复。无新增依赖、删除文件或其他行为变更，验证方式不变。
