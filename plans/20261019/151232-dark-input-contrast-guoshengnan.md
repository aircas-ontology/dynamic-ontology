# Plan：暗色主题输入控件背景对比度修复

- 时间：2026-10-19 15:12:32（Asia/Shanghai）
- Git 用户：guoshengnan
- 状态：已确认（用户选择"深色内凹"方向）
- 变更记录：2026-10-19 用户反馈深色内凹（#061420）对比依然不明显，明确要求改用"比整个背景稍浅的颜色"，核心技术路线由内凹调整为浅色高亮，经用户直接指定后实施（#12384a）。
- 变更记录 2：2026-10-19 用户反馈关联数据源弹窗顶部两个容器块（source-group / mapping-group，原用 panel-background-deep #071925）与周围对比不明显，经用户指定改为公共令牌 section-header（#154457）。

## 需求理解

用户反馈：暗色系背景下输入类控件与容器背景对比不明显（截图为"关联数据源"弹窗中红框标注的 Select/输入控件）；浅色系对比没问题，保持原样。

根因：暗色主题下 `--aircas-color-input-background: #0d2938` 与弹窗面板 `panel-background: #0b2230` 过于接近；亮色下两者同为白色但存在深色边框兜底，对比正常。

## 修改范围

- 仅调整暗色调色板中 `input-background` 一个令牌值；亮色调色板不动。
- 全站 Input / Select / Textarea 及引用该令牌的业务私有样式（约 9 个组件）随令牌统一生效，不修改任何业务组件文件。
- 不触碰工作区已有未提交修改（public/configs/domainConfig.js、DataSourceAssociateDialog.vue、BehaviorFormDialog.vue、SpaceBehaviorWorkspace/index.vue）。

## 新增、修改和删除文件

| 操作 | 文件 |
| ---- | ---- |
| 修改 | `src/styles/common/_color.scss`（`$dark` map 中 `"input-background"` 一行） |

无新增、无删除。

## 核心实现方式

```scss
"input-background": #0d2938  →  "input-background": #061420
```

- 深色内凹方向（Element Plus 暗色惯例）：控件背景比面板更深，配合既有青色边框（border #2187a8）形成清晰轮廓。
- 令牌引用链保持不变：input.scss（`--el-input-bg-color`）、select.scss（`.el-select__wrapper` 背景）继续消费该令牌。
- hover / active / disabled 等状态令牌不变。

## 新增依赖及必要性

无新增依赖。

## 验证方式

- `npm run format:check -- src/styles/common/_color.scss`
- `npm run check:project-conventions`（主题变量变更必需）
- `npm run build:verify`
- 浏览器冒烟（暗色）：关联数据源弹窗、登录页、对象空间/对象创建弹窗中输入控件与容器对比明显；切换亮色确认外观与修改前一致；检查 hover / focus / disabled 状态与 Console Error。
- 纯样式令牌调整，不改变业务行为，免除单元测试与覆盖率（依据 AGENTS.md 7.2 表格与 7.1 豁免条款）。
