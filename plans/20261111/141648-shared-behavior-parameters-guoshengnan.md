# 行为测试参数配置复用于行为调度

## 状态

已保存方案，等待代码同步；暂不实施。用户明确通知同步完成并要求执行后，再检查最新代码与本方案差异，存在范围或核心路线变化时重新确认。

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
