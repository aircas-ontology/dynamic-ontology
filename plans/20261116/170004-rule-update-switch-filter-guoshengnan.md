# 规则编辑保存与 Switch 对象行为过滤

- 需求：对接规则调度编辑保存；Switch 分支引用对象时，行为选择按相关对象的并集过滤。
- 修改范围：规则编辑请求类型、已有更新接口注释、表单参数构建及更新提交；上游对象采集工具与对应测试。
- 修改文件：src/types/apis/updateBehaviorSchedulingType.ts、src/apis/ontologyActionApi.ts、src/views/SpaceBehaviorScheduleWorkspace/BehaviorScheduleFormDialog.vue、index.vue、utils/filterRuleBehaviorsByObject.ts、utils/buildRuleScheduleCreateParams.ts；tests/schedule-save-api.test.mjs、rule-schedule-create.test.mjs、rule-behavior-object-filter.test.mjs。新增本 Plan，不删除文件。
- 核心实现：编辑复用完整 RULE 创建参数，增加 id，通过既有 PUT /ontology/action/scheduling 提交，包含 spaceId、judgeRules、flowDocument；保留命令状态、重试和过期响应控制。未重新打开的行为复用原始请求，节点新快照优先，原始请求同时写回 flowDocument，确保再次编辑可恢复。按入边端口采集 Switch 判断值和当前 case 对象，default 采集全部 case；与外层条件对象取并集，合流遍历分支端口不丢失，循环安全去重，复用不匹配行为清理。
- 接口依据：用户提供 updateScheduling 在线文档链接；v2 文档数据返回 401，但 v3/api-docs 已成功读取，确认 PUT 支持 RULE、judgeRules 以及必填 id/spaceId；文档尚未更新 flowDocument 与计数括号，沿用用户此前明确的新协议。真实后端持久化验收须明确记录。
- 依赖：无新增。
- 验证：TDD 先失败后实现；覆盖编辑 RULE 请求、表单修改、重试、防重复、过期响应及参数不匹配；Switch case/default、多对象、嵌套、合流、循环和清理。运行 npm test、test:coverage、check:types-conventions、type-check、build:verify；限定格式及 diff 检查，区分已有失败。真实接口及浏览器无法验收时记录缺口。
