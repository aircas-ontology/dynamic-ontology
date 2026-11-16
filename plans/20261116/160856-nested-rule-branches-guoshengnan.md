# 多层规则分支转换

- 需求理解：取消执行参数转换的单层限制，支持 if、else-if、else、switch 混合多层嵌套。
- 修改范围：规则创建参数转换工具及对应行为测试；继续保留 flowDocument 快照及详情恢复逻辑。
- 修改文件：src/views/SpaceBehaviorScheduleWorkspace/utils/buildRuleScheduleCreateParams.ts、tests/rule-schedule-create.test.mjs；新增本 Plan，不删除文件。
- 核心实现：递归收集根到行为的路径谓词；路径之间 AND，局部否定使用德摩根规则和比较操作符反转；括号用 isLeft/isRight 计数表示。单层保持既有 condition 整体否定协议。switch case 全部独立匹配，default 为全部 case 的否定。flowDocument 保留原始业务拓扑。
- 语义边界：judgeRules 是独立规则，无法保证执行先后或前一个行为成功后才运行后续行为。保留对需要行为结果才能继续判断的流程的明确提示，不承诺顺序执行。比较否定依赖后端提供的互补枚举语义，真实接口空值行为待联调。
- 新增依赖：无。
- 验证方式：先增加失败测试，再实现；覆盖三层以上、混合 switch/if、else-if、default、多行为、局部取反、真值组合、不修改草稿及快照。运行 npm test、npm run test:coverage、npm run type-check、npm run build:verify，限定文件格式检查和 git diff --check；区分已有失败与新增失败。浏览器和真实后端验收如无法执行明确记录。
