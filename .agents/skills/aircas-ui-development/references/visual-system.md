# Aircas 视觉系统

## 真实来源

技术约束以 `src/styles/readme.md` 和目标页面、布局或组件目录的 `readme.md` 为准。修改样式前以仓库当前文件为准，不依赖本说明猜测可用变量或组件类：

- 全局聚合入口：`src/styles/index.scss`
- 暗色主题变量：`src/styles/themes/dark.scss`
- 亮色主题变量：`src/styles/themes/light.scss`
- Element Plus 覆盖：`src/styles/components/`
- 公共组件注册：`src/components/register.ts`
- 图标与图片资源：`src/assets/pages/`、`src/assets/layouts/`、`src/assets/components/` 和 `src/assets/common/`

先搜索新版 `--aircas-*` 变量。现有变量无法表达明确需求时，按规划流程确认功能域限定变量，在 common/_color-special.scss 集中定义并由暗亮主题同名输出。根节点 .dark 启用暗色，移除恢复亮色；浮层自动继承根节点主题。

## 视觉基准

- 以 `1920 × 1080` 为主要设计基准，并兼容更高桌面分辨率。
- 整体采用暗色科技风和紧凑信息密度。
- 页面标题：`20px`。
- 区域标题：`16px`。
- 正文：`14px`。
- 辅助信息：`12px`。
- 普通控件高度使用 `--aircas-size-control`（30px），按钮使用 `--aircas-size-button`（32px），small/large 使用官方 Props。
- 常用间距：`8px`、`12px`、`16px`、`20px`。
- 无明确原因时，不增加零散字号、间距、控件尺寸或孤立视觉规则。

## Element Plus 使用方式

- 优先检查 `src/styles/components/` 中与目标组件同名的覆盖文件。
- 普通组件自动继承新版主题，无需添加 aircas 组件类。
- 普通浮层无需主题 popper-class；项目特有渐变或非对称边框才使用明确特殊类。
- Vue scoped 样式只有在官方配置和已有公共覆盖无法满足需求时，才通过 `:deep()` 定位稳定公开 Class。
- 避免依赖 Element Plus 内部 DOM 层级或生成类名。

## 检查清单

- 默认态与页面背景、边框、文字层级协调。
- hover、active、focus 有清晰但不过度的反馈。
- disabled 状态不可被误认为可操作。
- 长文本、窄容器、滚动区域和弹层不存在意外溢出。
- 图标按钮具备可访问名称，键盘焦点可见。
- 新增主题变量时检查暗色、亮色主题以及 Element Plus 变量映射。
