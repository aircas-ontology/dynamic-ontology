# Switch 分支保存回显修复

- 需求理解：修复 switch-case 保存后分支行为跑到 Switch 外部的问题，保持 case、default、嵌套条件和行为参数的归属。
- 修改范围：画布序列化中的 Switch 汇合点判断与对应行为测试；检查创建参数、flowDocument 恢复、画布重建的往返结果。
- 修改文件：src/views/SpaceBehaviorScheduleWorkspace/utils/scheduleRuleFlowGraphSerialize.ts、tests/schedule-rule-switch-ports.test.mjs；新增本 Plan，不删除文件。
- 核心实现：少于两条已连接路径时不推测汇合点；有多条路径时寻找首个共同可达汇合节点，不让结束节点提前掩盖实际汇合点，避免行为移出分支或共用行为重复出现。不猜测修复已保存错误数据。
- 新增依赖：无。
- 验证方式：TDD 先复现后实现；覆盖单 case、仅 default、多个 case、空路径、共同后继节点、嵌套 switch/if；执行画布重建与序列化、创建请求与快照还原链路测试。运行 npm test、test:coverage、type-check、build:verify、限定格式检查与 git diff --check；区分已有失败和新增失败。无真实浏览器或后端验收时明确说明。
