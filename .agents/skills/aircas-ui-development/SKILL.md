---
name: aircas-ui-development
description: Design, implement, review, or adjust this repository's Vue UI and SCSS using the existing Aircas themes, Element Plus overrides, interaction states, and accessibility conventions.
---

# Aircas UI Development

保持界面与现有 Aircas 设计语言和样式体系一致。

修改视觉或交互样式前，先读取 [references/visual-system.md](references/visual-system.md)、`src/styles/readme.md` 以及目标页面、布局或组件目录的 `readme.md`，并检查目标实现及其直接引用的现有样式。

## 工作流程

1. 判断改动属于页面、布局、全局组件还是全局主题，并以对应目录规范确定文件归属。
2. 搜索并复用现有 Design Token、CSS Variables、`.aircas-*` Class、组件和布局体系。
3. 现有颜色变量无法表达需求时，按 `src/styles/readme.md` 规划功能域限定变量并等待确认。
4. 使用 Element Plus 官方 API 和项目公共覆盖完成交互状态；只有公开能力无法满足时才使用稳定的深层选择器。
5. 按目标目录规范检查资源、可访问名称、键盘焦点、溢出和生命周期。

## 完成标准

- 按目录规范检查实际适用的交互、溢出和可访问状态。
- 修改结果应维持暗色科技风和紧凑信息密度，并与相邻页面或组件一致。
- 完成后使用 `project-verification-delivery` 选择并执行验证。
