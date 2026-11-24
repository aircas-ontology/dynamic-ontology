# 规则配置弹框顶部线条与保存按钮颜色

## 需求理解

- 去掉规则配置全屏弹框顶部红框中的彩色横线。
- 将工具栏绿色「保存」按钮改为蓝色。

## 修改范围

- 仅 `src/views/SpaceBehaviorScheduleWorkspace/BehaviorScheduleRuleConfigDialog.vue`。
- 不改业务逻辑、画布交互、接口或依赖。

## 新增、修改和删除文件

- 修改：`BehaviorScheduleRuleConfigDialog.vue`
- 新增：本 Plan
- 删除：无

## 核心实现方式

1. 删除 `.behavior-schedule-rule-config-dialog .el-dialog__header::before` 渐变顶条样式。
2. 保存按钮 `type="success"` 改为 `type="primary"`，使用 Element Plus / Aircas 主色蓝色。

## 新增依赖及必要性

- 无

## 验证方式

- `npm run format:check --` 针对修改文件
- 相关现有测试若断言该源码则一并执行；纯展示变更不强制新增行为测试
- `npm run type-check`、`npm run build:verify`（应用代码变更）
- 人工确认弹框顶部无线条、保存为蓝色
