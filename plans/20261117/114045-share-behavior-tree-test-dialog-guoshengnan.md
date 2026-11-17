# 提取行为树测试公共弹窗并提交远程

- 需求理解：用户明确授权先提取行为树测试弹窗，然后暂停卡片执行和实例预选任务，提交并推送当前聊天已实施修改。
- 修改范围：行为树弹窗公共化、全局注册、原页面调用和相关测试；不新增卡片执行按钮，不提取普通行为测试弹窗，不实施实例预选。
- 新增文件：src/components/BehaviorTreeTestDialog.vue、tests/behavior-tree-test-dialog.test.mjs、本 Plan。
- 修改文件：src/components/register.ts、src/views/SpaceBehaviorWorkspace/index.vue、tests/ontology-space-behavior.test.mjs。
- 删除文件：src/views/SpaceBehaviorWorkspace/components/BehaviorTreeTestDialog.vue（移动到公共组件）。
- 核心实现：弹窗通过 Props 接收页面的对象目录查询函数，不直接依赖页面 API；复用现有 useBehaviorTreeExecution；维持布局样式；关闭、切换和卸载使未完成的目录请求失效。
- 新增依赖：无。
- 验证方式：先新增公共弹窗运行时测试，确认未实现失败；验证打开时目录查询、执行要求加载、失败反馈、重复打开和过期响应/卸载清理；执行 npm test、test:coverage、type-check、build:verify、check:project-conventions、明确文件格式检查及 git diff --check。已有范围外失败单独报告，不扩大修复。
- 提交范围：包含本聊天此前 status: 1 请求筛选、移除卡片行为状态及各自测试和 Plan；排除 public/ 的用户已有修改及所有受保护目录。明确暂存文件并审查 staged diff 后提交当前分支，再普通推送到 origin/dev_sthq_1111；不强推。
- 暂停记录：卡片右下角执行按钮、普通测试弹窗公共化、当前实例自动预选尚未实施，等待用户后续恢复。

## 验证与暂停记录

- TDD：新增公共组件测试先因公共文件未提取而失败；实现后 3 项通过。
- 本聊天直接相关测试：19 项全部通过。
- npm test：1112 项，1078 通过，34 失败；失败项与此前全量检查一致，位于本次范围外。
- npm run test:coverage：同样 34 项失败；已加载文件统计行 93.25%、分支 78.96%、函数 90.07%，分支未达到 80%，不代表全项目源码覆盖率。
- npm run type-check：仍有此前范围外类型错误（agentChatApi、ontologyObjectManageApi、其他页面）；提取初次出现的原页面组件类型识别错误已通过公共路径导入修复，复查未再出现本次文件错误。
- npm run build:verify：通过，产物写入系统临时目录。
- npm run check:project-conventions：未通过，涉及历史文档失效链接、public 未被 Prettier 排除及其他弹窗已有未定义主题变量；未扩大修复。
- 明确文件 format:check：通过；git diff --check 通过。
- 浏览器验证未执行；人工验收未完成。组件模板与样式保持原样，运行时验证使用真实 Vue 响应式和编译后的脚本，隔离 HTTP 与执行边界。
- 用户要求的卡片执行按钮与实例预选任务已暂停；本次只提取行为树弹窗，未实施上述功能。
