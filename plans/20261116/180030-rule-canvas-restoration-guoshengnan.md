# 规则画布回显修复（已确认）

- 需求：详情和编辑准确展示已保存行为参数，画布在弹窗展开及尺寸变化后自适应且节点可读。
- 范围：本页面 factory、graphCells、graphSession、Designer、RuleConfigDialog 及对应 tests；保留现有修改，不触碰 public/html。
- 实现：节点摘要优先当前快照，否则使用匹配行为的 actionDetails；只改变展示，不改变执行参数。弹窗 opened 后布局，尺寸变化重新居中，自动缩放最低 0.8，清理 Observer、动画帧并隔离过期布局。
- 文件：修改上述现有文件和测试；新增本计划和画布会话测试；无删除，无新增依赖。
- 验证：先添加行为测试确认失败，再最小实现；执行定向测试、npm test、test:coverage、type-check、build:verify、明确文件格式检查和 diff 检查。记录已有失败；无浏览器工具时明确运行时视觉验收缺口。
