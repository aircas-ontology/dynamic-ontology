# Styles 目录规范

## 1. 目录职责与边界

`src/styles` 管理主题令牌、全局基础样式和 Element Plus 公共覆盖，不存放页面或组件私有样式。

- 【必须】`index.scss` 是应用全局样式的唯一聚合入口。
- 【必须】组件私有样式使用组件内 `<style scoped lang="scss">` 就近维护。
- 【禁止】在全局样式中用页面 DOM 层级覆盖局部组件。

## 2. 推荐结构与命名

```text
src/styles/
├─ element-plus/
│  └─ el-<component>.scss
├─ theme-dark.css
├─ theme-light.css
├─ index.scss
└─ readme.md
```

- 【必须】样式文件使用 kebab-case；Element Plus 覆盖按组件独立拆分。
- 【必须】业务 CSS Class 使用语义化 kebab-case；BEM 类名必须完整书写。
- 【禁止】使用 `&__xxx`、`&--xxx`、`&-xxx` 拼接 BEM 类名。

## 3. 主题与颜色

- 【必须】业务样式使用现有 `--aircas-*` 变量，禁止硬编码 HEX、RGB、HSL、`white` 或 `black`。
- 【必须】新增语义颜色以 `--aircas-color-*` 命名，并在暗色、亮色主题中同名成对定义。
- 【必须】Element Plus 变量映射在两套主题保持一致。
- 【必须】现有变量无法表达明确需求时，可在已确认 Plan 内新增 `--aircas-color-<feature>-*` 功能域限定变量，并在暗色、亮色主题中同名定义。
- 【禁止】仅因编码方便新增无业务语义、重复或一次性的主题变量。
- 【禁止】页面或组件业务样式出现 HEX、RGB、HSL 等原始颜色值；原始颜色值只在主题定义文件中维护。

## 4. Element Plus 与 scoped 样式

- 【必须】优先复用 `.aircas-*` 公共覆盖和官方 Props、CSS Variables、Theme API。
- 【必须】Select、Tooltip、Popover 等脱离组件 DOM 的浮层通过对应 `popper-class` 应用主题。
- 【优先】只有公开 API 和公共覆盖无法满足时才使用 `:deep()`，并定位稳定公开 Class。
- 【禁止】依赖 Element Plus 内部 DOM 层级、动态生成类名或脆弱选择器。

## 5. 布局、交互与可访问性

- 【必须】SCSS 嵌套原则上不超过四层，常规布局优先使用 Flex 或 Grid。
- 【必须】检查 normal、hover、active、disabled、focus、overflow 和文本截断。
- 【必须】键盘焦点可见，状态反馈不得只依赖颜色。
- 【优先】遵循项目既有字号、控件高度和 `8/12/16/20px` 间距体系。

## 6. 变更检查清单

1. 样式应放全局还是组件局部，职责是否正确。
2. 是否复用现有变量和 `.aircas-*` 覆盖。
3. 新变量是否在暗亮主题及 Element Plus 映射中成对维护。
4. 选择器、嵌套和 `:deep()` 是否稳定且最小化。
5. 交互状态、溢出、焦点和两套主题是否验证。
