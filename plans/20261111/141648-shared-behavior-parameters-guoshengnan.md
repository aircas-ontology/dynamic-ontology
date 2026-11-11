# 行为测试参数配置复用于行为调度

## 状态

代码已同步，用户已确认在 `dev_sthq_1111` 分支执行。按同步后再次确认的参数结构实施。

## 需求理解

提取行为测试弹窗中的参数配置能力，供行为测试和行为调度共同使用。调度配置不触发立即测试。

## 修改范围

- 行为测试弹窗及其参数相关私有依赖。
- 行为调度页面、表单、行为选项加载逻辑和调度草稿类型。
- 公共参数组件、必要共享逻辑与相关行为测试。
- 具体新增、修改文件在代码同步后复核，禁止页面之间直接引用私有实现。

## 预计文件

- 修改 src/views/SpaceBehaviorWorkspace/components/BehaviorTestDialog.vue。
- 修改 src/views/SpaceBehaviorScheduleWorkspace/index.vue、BehaviorScheduleFormDialog.vue 和 utils/fetchScheduleBehaviorOptions.ts。
- 修改 src/types/pages/ontologySpaceBehaviorScheduleType.ts 及必要类型出口。
- 新增 src/components/BehaviorParameterConfig/ 下公共参数配置组件；按需要提取公共逻辑，具体边界同步后确定。
- 新增或更新 tests/*.test.mjs 中对应测试。
- 不删除文件；不触碰 html/ 或修改 public/。

## 核心实现方式

- 复用行为详情加载、输入输出参数展示、外部值填写、固定值展示。
- 复用属性来源的对象实例、存储分组数据行选择、写回属性与关系两端绑定配置。
- 复用参数校验、类型转换和请求参数组装能力。
- 保留最新入参 PROPERTY 的多条绑定记录、出参 WRITE_PROPERTY 单选，以及关系 From/To 两端多选。
- 公共组件仅负责参数 UI；共享 composable 管理独立配置状态，并通过调用方提供的接口适配加载数据。
- 配置快照保存输入值、绑定记录、输出及关系选择，编辑和查看时恢复；切换行为清空旧配置。
- 测试执行按钮、测试接口调用及结果展示继续由行为测试弹窗负责。
- 调度行为选项保留 ID、actionApi 及必要信息，不只保留名称，避免同名行为混淆。
- 调度草稿新增输入值、实例绑定和输出绑定快照，支持编辑回显。
- 处理加载、空、失败、重试、重复请求、过期响应和卸载清理。
- 同步后检查调度保存契约；未确认的后端字段不自行编造。

## 新增依赖

无，优先复用现有 Vue、Element Plus 和接口。

## 验证方式

- TDD 覆盖参数来源、校验、类型转换、配置快照与回显、行为切换、同名行为、失败及过期响应。
- npm test、npm run test:coverage、npm run type-check、npm run build:verify。
- 公共组件及类型调整对应的项目规范与类型规范检查。
- 仅对任务文件运行格式检查；检查 git diff --check 和任务 diff。
- 浏览器验证行为测试流程及调度参数配置，确保配置时不执行测试接口。
- 已有测试、覆盖率和类型错误需与本次新增失败分开记录；人工验收待用户进行。

## 实施记录

- 新增公共组件 `src/components/BehaviorParameterConfig/BehaviorParameterConfig.vue`，并加入 `src/components/register.ts`。
- 新增共享状态 `src/composables/behavior/useBehaviorParameters.ts` 和领域类型 `src/types/behavior/behaviorParameterType.ts`。
- 将六个参数相关工具提取至 `src/utils/behaviorParameters/`，原页面工具保留兼容转导出；新增 `cloneBehaviorParameterSnapshot.ts`。
- 行为测试保留测试执行、结果展示和原有基础行为流程；应用参数与关系双端选择由共用组件展示。
- 周期调度按行为 ID 选择，保留 API；参数配置只查询数据、校验并保存草稿快照，支持编辑和只读查看，切换行为清除旧参数。
- 调度仍沿用现有本地列表，未增加后端调度保存接口或依赖。
- 新增 `tests/shared-behavior-parameters.test.mjs` 的 13 项行为测试；更新选项测试及原有源码检查的读取位置。

## 验证记录

- TDD：参数模块未实现时失败；同名行为选项、复合主键克隆、跨空间请求和取消后重试分别记录失败并修复为通过。
- 相关 47 项测试通过；全量 `npm test` 为 917 项，885 项通过、32 项失败，失败集合与修改前完全一致。
- `npm run test:coverage` 未通过：当前已加载文件的行覆盖率 92.22%、函数覆盖率 88.00%、分支覆盖率 76.58%，分支未达到 80%。此统计不是全项目源码覆盖率。
- `npm run check:types-conventions` 通过；`npm run type-check` 仍有修改前已有的 13 项类型错误，无新增类型错误。
- `npm run build:verify` 通过，产物写入系统临时目录。
- `npm run check:project-conventions` 未通过：现有历史 Markdown 失效链接、Prettier 未排除 public/、实例详情弹窗引用未定义主题变量等问题，未扩大当前任务范围修复。
- 当前任务文件格式检查通过，`git diff --check` 通过。
- 浏览器冒烟未执行：当前工具未提供浏览器所需的 JavaScript 控制入口，也没有项目 E2E script；页面实际交互、暗亮主题和最终人工验收仍待进行。
