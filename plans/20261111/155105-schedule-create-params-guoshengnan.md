# 行为调度创建参数

用户已确认。按给定结构组织周期调度创建参数，entityJson 为完整校验后的行为执行请求 JSON 字符串，不包含界面快照。

- 新增 src/types/apis/createBehaviorScheduleType.ts，修改类型统一出口。
- 新增页面 utils/buildBehaviorScheduleCreateParams.ts：每天、每周、每月转 Quartz；手填支持标准五段转化及 Quartz 六、七段。
- 修改 BehaviorScheduleFormDialog.vue：仅新建周期调度组装并输出完整参数，确认事件附带创建参数；保留编辑、规则调度及现有面板。
- 新增 tests/schedule-create-params.test.mjs，更新 tests/shared-behavior-parameters.test.mjs。
- ontologyIdentifier 优先行为详情，其次行为选项；actionApi 使用已选行为。无新增依赖，无删除文件，不接入未提供的创建接口。
- 先运行新增测试确认失败，再实施并运行针对测试、npm test、test:coverage、类型规范、type-check、build:verify、限定文件格式检查、diff 检查。记录仓库已有失败，不修改无关问题。
- 当前无 E2E 入口，运行时浏览器验收未覆盖，需人工验收。
