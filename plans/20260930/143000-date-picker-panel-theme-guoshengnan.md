# 日期选择面板主题覆盖修复

## 需求理解

属性筛选中的日期选择弹层仍使用 Element Plus 默认主题色，需要让日期面板在暗色和亮色主题下都遵循 Aircas 主题规范。

## 修改范围

- 修改全局 `src/styles/element-plus/el-date-picker.scss`，修复 `.aircas-picker` 内部 `.el-picker-panel`、`.el-date-range-picker` 重新声明默认变量导致主题变量失效的问题。
- 修改 `tests/ontology-subspace-create.test.mjs`，增加日期面板变量映射和交互状态回归断言。
- 新增本 Plan 文件；不修改组件逻辑、接口、类型或依赖。

## 核心实现方式

在实际日期面板节点上重新绑定 Aircas 变量，覆盖日历背景、文字、边框、区间背景、选中状态、快捷按钮、时间面板、禁用态和箭头；继续复用暗色与亮色主题已有变量，不新增颜色令牌。

## 验证方式

- 先运行定向测试确认新断言失败，再完成实现并确认通过。
- `node --test tests/ontology-subspace-create.test.mjs`
- `npm run format:check --` 任务文件列表
- `npm run type-check`
- `npm run build:verify`
- `git diff --check`
