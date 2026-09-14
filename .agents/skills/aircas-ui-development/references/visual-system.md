# Aircas 视觉系统

## 真实来源

修改样式前以仓库当前文件为准，不依赖本说明猜测可用变量或组件类：

- 全局聚合入口：`src/styles/index.scss`
- 暗色主题变量：`src/styles/theme-dark.css`
- 亮色主题变量：`src/styles/theme-light.css`
- Element Plus 覆盖：`src/styles/element-plus/`
- 公共组件注册：`src/components/register.ts`
- 图标与图片资源：`src/assets/` 及目标页面自身的 `assets/`

先搜索已有 `--aircas-*` 变量和 `.aircas-*` Class，再决定是否需要新增。Element Plus 下拉、弹层等脱离组件 DOM 的内容，优先使用对应 `popper-class`。

## 视觉基准

- 以 `1920 × 1080` 为主要设计基准，并兼容更高桌面分辨率。
- 整体采用暗色科技风和紧凑信息密度。
- 页面标题：`20px`。
- 区域标题：`16px`。
- 正文：`14px`。
- 辅助信息：`12px`。
- 常规表单控件和按钮高度：`32px`。
- 常用间距：`8px`、`12px`、`16px`、`20px`。
- 无明确原因时，不增加零散字号、间距、控件尺寸或孤立视觉规则。

## Element Plus 使用方式

- 优先检查 `src/styles/element-plus/` 中与目标组件同名的覆盖文件。
- 普通组件通过对应 `.aircas-*` Class 启用项目样式。
- Select、Date Picker、Tooltip、Dropdown、Popover 等浮层组件按现有实现使用 `popper-class`。
- Vue scoped 样式只有在官方配置和已有公共覆盖无法满足需求时，才通过 `:deep()` 定位稳定公开 Class。
- 避免依赖 Element Plus 内部 DOM 层级或生成类名。

## 检查清单

- 默认态与页面背景、边框、文字层级协调。
- hover、active、focus 有清晰但不过度的反馈。
- disabled 状态不可被误认为可操作。
- 长文本、窄容器、滚动区域和弹层不存在意外溢出。
- 图标按钮具备可访问名称，键盘焦点可见。
- 新增主题变量时检查暗色、亮色主题以及 Element Plus 变量映射。
