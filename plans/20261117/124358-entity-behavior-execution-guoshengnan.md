# 实例行为卡片执行与实例预选续作

- 需求理解：继续用户已确认的卡片执行与当前实例预选任务。每张行为卡片右下角增加执行按钮，打开对应测试弹窗并预选当前实例；用户在弹窗确认后才调用执行接口。描述及其原样式保留。
- 授权依据：前序 Plan 已确认，用户明确恢复任务；行为树公共弹窗已于 834302c 提取。
- 修改范围：实体详情及行为卡片、公共普通测试弹窗与内部详情组件、参数控制器和行为树弹窗预选、行为映射工具和相关调用测试。
- 新增文件：本 Plan、src/utils/behaviorParameters/createBehaviorTestInitialEntity.ts、tests/behavior-execution-prefill.test.mjs；普通弹窗移动至 src/components/BehaviorTestDialog/ 下。
- 移动文件：BehaviorTestDialog.vue、BehaviorEntityRowDetailDialog.vue、BehaviorEntityLinkDataDialog.vue 从 SpaceBehaviorWorkspace/components 移至 src/components/BehaviorTestDialog/；mapListOntologyActionRecord.ts 移至 src/utils/behaviorParameters/。
- 修改文件：src/components/register.ts、src/components/BehaviorTreeTestDialog.vue、src/composables/behavior/useBehaviorParameters.ts、src/composables/behaviorTree/useBehaviorTreeExecution.ts、src/views/EntityBrowsingObjectProfile/components/ObjectProfileEntityBehaviors.vue、ObjectProfileEntityDetail.vue、src/views/SpaceBehaviorWorkspace/index.vue、components/BehaviorListPanel.vue、composables/useSpaceBehaviorWorkspace.ts，以及 tests/object-profile-entity-detail-view.test.mjs、tests/shared-behavior-parameters.test.mjs、tests/behavior-tree-test-dialog.test.mjs、tests/ontology-space-behavior.test.mjs 中相关测试。
- 核心实现：页面注入 API 方法，公共组件不依赖页面私有实现；实例行携带原始主键快照，保留数字 0、false、字符串及复合键。基础行为预选实例并保留跨页选择；应用行为预选匹配对象的入参和写回位置，main 入参自动形成绑定；非 main 分组保留实例选择并要求用户选择数据行；关系仅填充匹配挂载侧；行为树填充匹配对象的黑板及节点实例位置，不自动执行。
- 生命周期：重复打开/点击受控；关闭、切换行为/实例和卸载阻止旧请求回填，重新打开不复用旧选择。
- 新增依赖：无。
- 验证：TDD RED/GREEN，使用真实 Vue 状态和编译后组件隔离 HTTP 边界，覆盖按钮事件、弹窗联动、各类预选和提交参数、主键边界、分页、重复调用、错误及过期响应。运行 npm test、test:coverage、type-check、build:verify、check:project-conventions、指定文件格式与 diff 检查。当前无 E2E script；尽量对受影响页面浏览器冒烟，不能执行则说明缺口；人工验收待完成。
- 范围控制：保留 public/configs/domainConfig.js 用户已有修改，不访问 html，不修改 public；不顺带修复已有全量验证失败。本次不自动提交或推送。

## 验证记录

- TDD：预选控制器、卡片事件和行为树预选先出现目标未实现的失败，再实现通过。
- 直接相关四组测试共 46 项全部通过；新增执行测试 13 项覆盖普通、属性、应用、关系、树预选、原始主键、跨页、实际提交、重复调用、错误、关闭及销毁过期响应。
- npm test：1127 项，1093 通过、34 失败；失败数及失败项目与实施前基线一致。
- npm run test:coverage：失败。当前测试加载文件的行覆盖率 93.40%、分支 78.90%、函数 90.17%；分支未达到 80%。基线分支为 78.96%，本次未降低阈值或排除待测源码。该统计不是全项目源码覆盖率。
- npm run type-check：失败，仍为原有 14 项错误，分布在 agentChatApi、ontologyObjectManageApi、ApplicationManagement、ObjectWorkspacePanel、SpaceBehaviorScheduleWorkspace、BehaviorCategoryFormDialog、BehaviorFormDialog、ThemeSpaceManagement；本次文件无新增类型诊断。前置 vue-tsc 失败，因此后续 node 配置 tsc 未执行。
- npm run build:verify：通过，产物写入系统临时目录。
- npm run check:project-conventions：失败，历史 Markdown 链接、public 未在 Prettierignore 排除，以及移动前已存在的 BehaviorEntityRowDetailDialog 未定义主题变量；未扩大范围修复。
- 当前任务明确文件列表的 format:check 及 git diff --check 通过。
- 浏览器验证：未执行，当前工具不可用且项目无 E2E 脚本。主题、焦点、溢出和实际后端业务执行仍需人工验收，未声称通过。
- 无新增依赖，无自动提交推送。用户原有 public/configs/domainConfig.js 修改保留。
- 交付状态：功能实现及相关测试通过，全量验证仍受上述失败限制，人工验收待完成。
