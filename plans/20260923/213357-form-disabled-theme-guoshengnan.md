# 表单不可用状态统一为主题 disabled

## 需求理解

编辑关系弹窗里，禁用的输入框和禁用的下拉框外观不一致。输入框走 Element Plus 默认禁用，下拉框选中文字仍是主文本色，看起来还能操作。输入框、多行文本、下拉框和树选择的禁用态统一使用主题禁用背景、禁用文字和普通边框。

## 修改范围

- 只改公共表单控件的禁用样式。
- 不改字段是否禁用，也不新增主题变量。

## 新增、修改和删除文件

- 修改 `src/styles/element-plus/el-input.scss`
- 修改 `src/styles/element-plus/el-select.scss`
- 修改 `src/styles/element-plus/el-tree-select.scss`
- 新增 `tests/form-control-disabled.test.mjs`
- 新增本 Plan

## 核心实现方式

禁用背景使用 `--aircas-color-panel-background`，文字使用 `--aircas-color-text-disabled`，边框使用 `--aircas-color-border`。禁用时不再使用高亮边框。下拉框选中值和箭头在禁用时同样使用禁用文字色。

## 新增依赖及必要性

无。

## 验证方式

- 先运行样式断言并确认失败，再实现后确认通过。
- 对本次修改文件执行格式检查。
- 执行 `npm run type-check` 和 `npm run build:verify`。
