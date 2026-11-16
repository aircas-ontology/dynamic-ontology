# 需求理解

用户已确认：规则画布的配置执行行为弹窗选择行为后，复用周期调度方式显示、校验、保存并回显行为参数。

# 修改范围

- 新增页面私有 composable useRuleActionParameters.ts，复用 useBehaviorParameters 与四个现有查询接口。处理行为切换、加载、错误重试、取消、销毁及过期响应。
- 修改 ScheduleRuleFlowDesigner.vue：接入 BehaviorParameterConfig 替代旧的逐项值编辑，加载完成并校验通过后才允许确认，取消不回写图节点。
- 修改 ontologySpaceBehaviorScheduleType.ts 的行为节点模型，增加可选参数快照；原有图节点克隆与序列化沿用完整对象，保持快照随草稿保存。
- 更新节点编辑测试，新增参数加载、校验、回显与会话测试。
- 新增本 Plan，不删除文件，不修改周期调度、公共组件和公共 composable；不新增依赖。

# 核心实现

通过当前路由 spaceId 和行为选项 actionApi/ontologyUniqIdentifier 创建与周期调度一致的 application 参数上下文。选中行为请求详情；相同行为恢复快照，切换清理旧配置；确认复制快照到节点并同步普通参数展示值。关闭或卸载使请求失效。

# 验证

先补充行为测试并运行失败，再最小实现。按类型目录要求依次执行 check:types-conventions、type-check、build:verify；执行相关测试、npm test、test:coverage、本次格式检查、git diff --check 和状态检查。当前没有浏览器工具，真实页面及人工验收保留缺口；记录既有失败。

# 实施及验证结果

- 新增规则节点私有参数 composable，复用 `useBehaviorParameters` 和周期调度使用的四个接口；实现加载、切换清理、过期会话、失败重试、快照回显及确认校验。
- 执行行为弹窗已改为 `BehaviorParameterConfig`，选择行为后显示实际参数组件；关联对象与实例标识继续保留，确认时将校验后的快照写回节点，取消不写回。
- 行为节点增加可选参数快照字段，图节点克隆和序列化会保留该字段。
- 参数测试先因 composable 不存在失败，完成实现后相关 3 项通过；本次受影响联合测试 51/51 通过。
- `check:types-conventions`、`build:verify`、本次文件格式检查和 `git diff --check` 通过。
- `npm test`：1000 项，967 通过、33 项既有失败；`npm run test:coverage`：行 92.48%、函数 88.47%、分支 77.77%，分支未达 80%。
- `npm run type-check` 仍因既有 API、其他页面和调度创建参数问题未通过；本次新增 composable 与规则组件未出现类型错误。
- `check:project-conventions` 仍有历史 Plan 链接、public 格式排除及其他页面变量问题。
- 没有浏览器执行工具，未做实际弹窗视觉、主题和人工页面验收。

# 后续视觉调整

- 按截图移除执行行为弹窗中的关联对象、实例标识两行；行为参数组件保留并包裹在独立面板中，增加边框、圆角、内边距和标题层级。
- 相关 20 项规则及行为测试通过，`build:verify`、格式检查和 `git diff --check` 通过；全局类型检查仍只有既有错误。
