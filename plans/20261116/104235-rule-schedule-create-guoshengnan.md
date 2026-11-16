# 规则行为调度创建

- 需求理解：按照用户提供的 if/else、switch/case 创建请求组装 RULE 调度；操作符以用户指定在线接口文档为准。
- 修改范围：创建参数类型及出口、规则转换工具、表单创建参数组装、创建保存入口、相关测试；保留当前未提交修改。
- 新增：本方案、buildRuleScheduleCreateParams.ts、规则转换测试；修改：createBehaviorScheduleType.ts、types/index.ts、相关周期创建类型引用、BehaviorScheduleFormDialog.vue、SpaceBehaviorScheduleWorkspace/index.vue、schedule-save-api.test.mjs。无删除文件、无新增依赖。
- 核心实现：if 原条件 false，else 同条件 true；case 使用 EQ，default 使用各 case 的 OR 并整体取反。每个行为拆成条件相同的规则，后端执行全部命中项，不保证顺序。行为快照原样序列化为 entity_json；按当前行为选项填写对象及 API。校验空间、条件、单个实例、参数快照；拒绝未约定的嵌套、函数、表达式及操作符，不做静默降级。保持周期调度和规则编辑原有边界。
- 验证：测试先失败再实现；转换测试覆盖两类分支、多行为、非法与不支持输入；接口集成测试覆盖成功、失败、重复和过期响应。执行类型规范、类型检查、临时构建、全量测试、覆盖率、任务文件格式及 diff 检查。无 E2E 入口；浏览器未验证时明确说明，最终由用户验收。
- 授权：用户已确认规则创建方案，随后明确要求以在线文档枚举转换操作符。

## 实施记录

- 在线文档：LT/LE/EQ/NE/GT/GE；CH 虽在枚举中但明确不支持。页面 contains/notContains/prefixContains 保留，提交时提示暂不支持，后续补齐。
- dynamic 使用 propertyId 精确定位；页面 propertyName 为显示名，不作为 apiName 发送。
- 为兼容创建请求联合类型，周期类型独立命名，编辑接口仍仅接受 TASK；周期空间默认取完整行为请求中的空间，不再构造缺少必填 spaceId 的请求。
- 维护 shared-behavior-parameters.test.mjs 的组件依赖注入，使新增规则转换模块可被既有周期集成测试识别；该调整属于相关测试维护。
