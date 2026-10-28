# Plan：修复页面旧 Aircas 样式变量

## 需求理解

检查所有页面样式，消除旧样式引用未定义 Aircas CSS 变量导致的空值，使暗色与亮色主题下的页面控件、面板和图编辑器保持可见且有正确状态反馈。

## 修改范围

- 主题令牌层：为仍被现有页面使用、且具备明确语义的旧变量建立暗亮主题兼容映射。
- 页面源码：仅在规范检查继续发现无语义或无法映射的引用时做最小替换。
- 不修改 `html/`、`public/`，不引入依赖，不进行无关组件重构。

## 文件变更

| 操作           | 路径                                                                 |
| -------------- | -------------------------------------------------------------------- |
| 新增           | `plans/20261012/173305-aircas-undefined-variable-fix-guoshengnan.md` |
| 修改           | `src/styles/common/_color-special.scss`                              |
| 视检查结果修改 | 仍含无法映射变量的页面或组件样式文件                                 |

## 核心实现方式

在 `color-special` 的暗亮主题 mixin 中统一输出兼容令牌：分类色映射到新版 category 令牌，状态色映射到 primary/success/warning/danger，边框、背景、文字、遮罩和透明色映射到现有语义令牌。所有兼容变量在两个主题中成对输出，避免页面侧重复定义颜色。

## 新增依赖

无。

## 验证方式

- `npm run check:project-conventions`，确认不存在未定义 Aircas 变量且暗亮主题令牌成对输出。
- 对实际修改的 SCSS 与页面文件执行格式检查。
- `npm run type-check`、`npm run build:verify`。
- 运行样式相关测试及必要的 `npm test` / `npm run test:coverage`，区分工作区既有失败。
- 检查 `git diff --check`、任务范围 diff 和 `git status --short`。
