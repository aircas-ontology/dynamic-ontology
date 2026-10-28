# 全站页面样式对照回退主题令牌

## 需求理解

主题文件已回退到 `56cda95`。检查全站页面、布局和页面私有样式，把 9 月 22 日后新增、现已不存在的颜色变量引用改回当前主题中的同义令牌。不改布局、文案、交互和主题文件本身。

## 修改范围

- 只改失效 `--aircas-color-*` 引用，以及断言这些字符串的现有测试。
- 不改 `theme-dark.css` / `theme-light.css`。
- 不改 `el-button.scss`（工作区已有无关回退）。
- 不改硬编码颜色、字号、间距、BEM 结构和 popper 类名。
- 不新增主题变量。

## 新增、修改和删除文件

修改页面与布局样式：概念模型、大模型构建、对象属性、空间列表、空间详情、关系工作区、子空间创建、顶栏。

修改 `src/styles/element-plus/el-dialog.scss` 中已带 fallback 的 `scrim-strong` 引用。

修改对应源码断言测试：`ontology-space-management-detail`、`ontology-space-relation`、`ontology-object-list`、`ontology-object-attribute-panel`、`space-overview`、`ontology-space-management-structure`。

新增依赖：无。

## 核心实现方式

按最长名称优先替换：

- `panel-overlay` / `panel-overlay-deep` → `overlay` / `overlay-deep`
- `cyan-*` / `blue-*` / `green-soft` / `purple-soft` / `orange-soft` → 对应 `accent-*`
- `border-shadow` → `page-glow`
- `accent-shadow` → `accent-cyan-shadow`
- `danger-border` / `danger-soft` → `danger`
- `header-start` / `header-end` → `page-background` / `menu-background`
- `scrim-strong` fallback → `page-glow`

## 验证方式

先改测试断言并确认失败，再改页面引用并确认这些测试通过。格式检查只覆盖本次文件。`check:project-conventions` 核对本次涉及文件不再引用未定义令牌。`type-check` 与 `build:verify`。
