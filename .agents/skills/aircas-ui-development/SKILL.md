---
name: aircas-ui-development
description: Design, implement, review, or adjust this repository's Vue UI and SCSS using the existing Aircas themes, Element Plus overrides, interaction states, and accessibility conventions.
---

# Aircas UI Development

保持界面与现有 Aircas 设计语言和样式体系一致。

修改视觉或交互样式前，先读取 [references/visual-system.md](references/visual-system.md)，并检查目标组件及其直接引用的现有样式。

## 实现约束

- 项目样式使用 SCSS；组件私有样式使用 `<style scoped lang="scss">` 就近维护。
- 复用现有 Design Token、CSS Variables、Class、布局体系和组件，不创建独立样式体系。
- 业务组件和页面样式使用已有主题变量，禁止直接硬编码 HEX、RGB、HSL、`white` 或 `black`。确需新增颜色语义时，使用 `--aircas-color-*`，并确保主题定义完整；这类范围扩大须先按规划流程确认。
- CSS Class 使用具有业务语义的 kebab-case。BEM 类名写完整，禁止使用 `&__xxx`、`&--xxx` 或 `&-xxx` 拼接类名。
- SCSS 嵌套原则上不超过四层，优先使用稳定 Class 定位。
- 常规布局优先使用 Flex 或 Grid，不因视觉微调引入无关结构变化。
- 优先使用 Element Plus 已有组件及项目的 `.aircas-*` 覆盖，通过官方 API、Props、CSS Variables、Theme 或稳定公开 Class 调整第三方组件。
- 正式功能图标复用项目现有图标体系，禁止使用 Emoji 或 Unicode 字符代替。
- 纯图标按钮提供 Tooltip、`title` 或准确的 `aria-label`。

## 完成标准

- 检查实际适用的 normal、hover、active、disabled、focus 和 overflow 状态。
- 检查文本截断、容器溢出、键盘焦点和纯图标控件的可理解性。
- 修改结果应维持暗色科技风和紧凑信息密度，并与相邻页面或组件一致。
- 完成后使用 `project-verification-delivery` 选择并执行验证。
