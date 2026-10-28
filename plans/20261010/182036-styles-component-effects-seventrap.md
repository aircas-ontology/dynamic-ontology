# Styles 组件样式整理

用户于 2026-10-10 确认方案，时间使用 Asia/Shanghai。

## 需求理解

重命名特殊颜色令牌文件，保持文件内容完全不变；将集中维护的特殊效果按组件归入现有 SCSS 文件，同步更新规范和引用，保持现有外观和交互状态。

## 修改范围与文件

- 重命名 `src/styles/common/_special-colors.scss` 为 `src/styles/common/_color-special.scss`。
- 修改 `src/styles/themes/light.scss`、`src/styles/themes/dark.scss` 的 Sass 引用和命名空间。
- 修改 `src/styles/components/button.scss`、`src/styles/components/table.scss`，接收对应特殊效果。
- 删除 `src/styles/components/special-effects.scss`。
- 修改 `src/styles/index.scss`，移除集中效果文件引用。
- 修改 `src/styles/readme.md`，更新颜色文件路径及按组件维护默认适配和特殊效果的规范。
- 修改 `.agents/skills/aircas-ui-development/references/visual-system.md` 中直接引用的旧颜色文件路径，保持相关说明一致。
- 修改 `tests/action-button-tones.test.mjs`，读取迁移后的组件样式。
- 新增本 Plan 文件；不修改页面、其他组件、受保护目录或历史 Plan。

## 核心实现方式

- 颜色文件原样重命名，主题统一使用 `color-special` 命名空间。
- 渐变按钮规则追加到 `button.scss`，强调表头规则追加到 `table.scss`；保持选择器、变量、声明及 hover、focus-visible、active、disabled 状态不变。
- 组件默认适配和显式特殊效果均归入对应组件文件，入口只聚合组件文件。
- 先调整现有按钮测试的读取位置并运行，确认迁移前失败；再迁移实现并验证通过。

## 依赖

无新增依赖，使用现有 Sass、Prettier 和项目检查脚本。

## 验证方式

- 保存修改前编译 CSS 和颜色文件至系统临时目录，验证重命名后的颜色文件字节一致，并比较编译前后的规则、选择器和声明等价性；检查顺序变化不影响按钮、输入框、选择器和表格的层叠关系。
- 执行 `npm test`、`npm run test:coverage`、`npm run type-check`、`npm run build:verify`、`npm run check:project-conventions`。
- 仅格式化和检查本任务修改的受支持文本文件。
- 不改变外观或交互，通过编译等价性核对暗亮令牌与按钮、表格全部已有状态；浏览器验证及人工验收如未执行须明确报告，不将静态检查描述为浏览器通过。
- 交付前执行 `git diff --check`，检查任务 diff 和工作区状态；不运行写入 `html/` 的正式构建。

## 实施与验证记录

- 已按方案完成颜色文件重命名、主题引用更新、按钮和表格效果迁移、集中效果文件删除、规范及直接引用说明同步。
- RED：先将现有按钮测试改为读取 `button.scss`，运行后因渐变规则尚未迁移而失败；GREEN：迁移后按钮、主题编译及禁用控件相关测试共 4 项全部通过。
- 颜色文件与迁移前快照逐字节一致。入口编译生成的 31 条 CSS 规则、选择器和声明均不变；仅按钮渐变规则移至其他组件之前，按钮内部及其余规则的相对顺序保持一致。
- `npm run format:check -- <本任务 10 个明确文件>`、`npm run build:verify`、`git diff --check` 通过。构建产物位于系统临时目录。
- `npm test`：389 项中 382 项通过，7 项失败；失败涉及两个导出弹窗文案、登录超时常量、对象分类接口路径、空间操作按钮文本格式、Prettier 缺少 public 排除及旧布局入口仍存在。
- `npm run test:coverage`：同样 7 项测试失败，已加载文件的行覆盖率 87.58%、函数覆盖率 80.20%、分支覆盖率 75.38%；分支未达到 80% 门槛。此报告不代表全项目源码覆盖率。
- `npm run type-check`：ApplicationManagement 的 ApiDocsEndpointDetail.vue、ApiDocsEndpointList.vue 存在 3 个错误，涉及 TabPaneName 与 string 不兼容、aria-label 和 aria-hidden 属性类型不匹配。
- `npm run check:project-conventions`：失败涉及 `.agents/README.md` 缺少 code-formatting、`docs/readme.md` 和历史 `plans/PLAN.md` 的失效链接、`.prettierignore` 未排除 public。
- 已核对上述失败涉及的测试、业务源码、配置及文档与 HEAD 一致，均未被本任务修改；本次没有新增样式编译或相关测试失败。未扩大范围修复这些已有问题，因此必需全量检查尚未全部通过。
- 此次仅整理样式文件，通过编译规则等价性检查暗亮主题及已有状态；未执行浏览器视觉验证和人工验收，编译等价性不视为浏览器或人工验收通过。项目没有 Lint、E2E script。
