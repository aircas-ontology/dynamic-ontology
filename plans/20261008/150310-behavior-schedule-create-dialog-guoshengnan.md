# 行为调度新建弹窗

## 需求理解

按原型实现空间内行为调度「新建调度」弹窗。规则调度展示规则配置入口与描述；周期调度按每天 / 每周 / 每月 / Cron 切换配置，并填写关联对象、实例、行为与描述。样式复用 Aircas 公共类。确认写入本地 Mock 列表。规则配置按钮暂不进入二级页。

## 修改范围

新增弹窗组件与页面类型，工作区「新建调度」打开弹窗。不接真实调度接口，不改查看 / 编辑 / 删除，不改 `public/`、`html/`。

## 新增、修改和删除文件

- 新增 `src/views/OntologySpaceManagementDetail/behaviorScheduleComponents/BehaviorScheduleFormDialog.vue`
- 新增 `src/types/pages/ontologySpaceBehaviorScheduleType.ts`
- 新增 `tests/behavior-schedule-create-dialog.test.mjs`
- 修改 `src/types/index.ts`
- 修改 `src/views/OntologySpaceManagementDetail/behaviorScheduleComponents/SpaceBehaviorScheduleWorkspace.vue`
- 删除：无

## 核心实现方式

`el-dialog.aircas-dialog` + `el-form.aircas-form`。策略用 `aircas-radio`。周期面板：每天仅执行时间；每周为执行日复选框加执行时间；每月为 1–31 日下拉加执行时间；Cron 为表达式输入（无执行时间）。实例在未选对象时禁用。确认处理 idle / submitting / success / error。

## 新增依赖及必要性

无。

## 验证方式

先写失败测试再实现。跑定向测试、`npm test`、任务文件 `format:check`、`check:types-conventions`、`type-check`、`build:verify`，并在调度页走规则 / 周期两条新建路径。
