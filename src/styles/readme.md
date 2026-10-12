# Styles 目录规范

## 1. 职责与入口

`src/styles` 管理主题令牌、全局基础样式和 Element Plus 变量适配。

- 【必须】`index.scss` 是应用全局样式唯一聚合入口，按 Element Plus 官方 CSS → 官方暗色变量 → Aircas 的顺序引入。
- 【必须】遵守本文第 6 节 Aircas 接入规范。组件、页面私有样式使用 `<style scoped lang="scss">` 就近维护。
- 【禁止】通过全局页面 DOM 层级覆盖局部组件。

## 2. 目录与命名

```text
src/styles/
├─ common/
├─ themes/
├─ components/
├─ variables.scss
├─ index.scss
└─ readme.md
```

- 【必须】样式文件与业务 CSS Class 使用语义化 kebab-case；BEM 类名完整书写。
- 【禁止】使用 `&__xxx`、`&--xxx`、`&-xxx` 拼接 BEM 类名。

## 3. 主题与颜色

- 【必须】根节点 `.dark` 启用暗色，移除该类启用亮色；响应式消费者使用 `useDocumentTheme`，不读取 theme 属性。
- 【必须】优先使用新版 `--aircas-*` 语义令牌；普通业务样式禁止硬编码 HEX、RGB、HSL、white、black。
- 【必须】原始颜色集中在 common 中维护。新增功能域颜色须纳入已确认 Plan，并在暗亮主题中同名成对输出。
- 【必须】必要分类色与效果色集中在 `common/_color-special.scss`；效果色优先从新版颜色派生。
- 【禁止】新增重复、一次性或无业务语义的颜色令牌。
- 【必须】区分面板背景与遮罩 overlay 的用途；Element Plus 映射由 variables.scss 统一维护。

## 4. 组件外观

- 【必须】普通 Element Plus 组件使用官方 Props 和新版默认外观，无需 aircas 组件 class 或主题 popper-class。
- 【必须】仅项目特有渐变、非对称边框使用明确的特殊 class。复用例外在 components 中独立封装，局部例外留在所属组件。
- 【必须】`components/` 中的默认适配与可复用特殊效果按组件名归入同名 SCSS 文件，如按钮归入 `button.scss`、表格归入 `table.scss`；禁止跨组件集中维护特殊效果。
- 【优先】只有公开 API 和变量无法满足时才使用最小 :deep()，定位稳定公开 class。
- 【禁止】依赖内部 DOM 层级、动态生成类名或脆弱的 first-child/nth-child 外观选择器。

## 5. 布局与验收

- 【必须】SCSS 嵌套原则上不超过四层，常规布局优先 Flex 或 Grid。
- 【必须】验证暗亮主题、normal、hover、active、disabled、focus、overflow 和长文本；键盘焦点可见，状态反馈不只依赖颜色。
- 【必须】Canvas、WebGL 等缓存颜色的实例在主题变化时刷新，清理监听和替换资源，保留业务及视图状态。
- 【必须】按根规则执行 task-scoped 格式、规范、测试、类型与 build:verify；不得写入 html 或修改 public。

## 6. Aircas 样式接入与开发规范

### 项目接入

本项目使用 npm、Vue 3 和 Element Plus，Aircas 源码随应用编译。唯一入口为 [index.scss](index.scss)，main.ts 按以下顺序引入：

```ts
import "element-plus/dist/index.css";
import "element-plus/theme-chalk/dark/css-vars.css";
import "@/styles/index.scss";
```

运行 `npm install`、`npm run dev`。Sass 已存在于项目依赖，不需要独立主题包或额外构建命令。

### 主题切换

- 【必须】默认根节点为 `<html class="dark">`。`:root.dark` 输出暗色主题，`:root:not(.dark)` 输出亮色主题。
- 【必须】使用 `@/composables/shared/useDocumentTheme` 的只读 `isDark` 和 `toggleTheme()`；主题状态以根 class 为来源，不使用 theme 属性，不增加主题持久化。
- 【必须】保留根节点其他 class，作用域销毁时清理主题观察器。
- 【必须】浮层自动继承根变量，普通 Select、DatePicker、Tooltip、Popover、Dropdown 等不添加主题 popper-class。
- 【必须】缓存颜色的 Canvas、Three.js 和图模型在主题变化时刷新；暂停的时间轴也要重绘。刷新不重建整个实例，不重置镜头、布局或编辑状态，替换纹理释放旧资源。

### 样式层级与颜色

| 层级         | 位置                                  | 职责                                            |
| ------------ | ------------------------------------- | ----------------------------------------------- |
| 设计令牌     | common/_*.scss                        | 颜色、字号、尺寸、间距、圆角和阴影              |
| 暗亮主题     | themes/dark.scss、themes/light.scss   | 按根 class 输出同名令牌                         |
| 官方变量映射 | variables.scss                        | 将 Aircas 语义映射到当前 Element Plus 的 --el-* |
| 组件外观     | components/button.scss、table.scss 等 | 按组件维护最小默认适配及显式启用的特殊效果      |
| 聚合入口     | index.scss                            | 加载顺序、基础样式和滚动条                      |

- 【必须】普通颜色优先选用 primary、success、warning、danger、info、text-*、border、border-light、hover、active 及背景令牌。
- 【必须】面板使用 panel-background、panel-background-deep、card-background；overlay 系列专用于遮罩，不按旧变量同名机械替换。
- 【必须】业务样式禁止原始 HEX、RGB、HSL、white、black；transparent 可直接使用。
- 【必须】新版没有且需要保留视觉区分的蓝紫分类色使用 category-blue、category-purple，集中定义在 common/_color-special.scss。
- 【必须】复用光晕、透明填充等效果使用 effect-* 令牌，优先通过新版颜色派生。新增特殊颜色必须有明确用途、经 Plan 确认、暗亮同名输出。
- 【必须】Three.js、Canvas 和缓存 SVG 网格读取实际颜色值，不能将未解析的 var() 直接传给颜色解析器。

### Element Plus 使用

- 【必须】普通组件直接使用官方 Props、尺寸和默认主题，不添加旧 aircas-button、aircas-input、aircas-table、aircas-dialog、tone 等覆盖类。
- 【必须】渐变按钮显式添加 `aircas-button--gradient`；保留默认、hover、focus、disabled 状态。
- 【必须】需要项目特有表头强调底边的表格添加 `aircas-table--accent-header`，仅覆盖底边，其他外观由默认主题维护。
- 【必须】业务布局、卡片渐变、控件尺寸等私有样式就近维护；只有实际复用例外才进入全局 components。
- 【禁止】复制官方组件完整 SCSS、修改组件业务逻辑来实现主题，或为普通组件恢复整套旧覆盖。
- 【优先】先检查令牌和 --el-* 映射，公开 API 无法满足时才使用最小稳定 :deep()。

### 验证

按实际修改运行：

```bash
npm test
npm run test:coverage
npm run type-check
npm run build:verify
npm run check:project-conventions
npm run format:check -- <本次修改文件列表>
```

规范检查编译入口，识别 Sass 生成的真实令牌，并验证暗亮一致性与缺失引用。不得使用会写入 html 的 build 命令。

浏览器检查受影响的 Button、Input、Select、Table、Dialog、Drawer、DatePicker、树和浮层，覆盖暗亮、悬停、焦点、禁用、加载、错误、空状态、长文本与溢出；检查连续换肤、图谱和时间轴刷新、重复进入离开与 Console Error。自动化、浏览器及人工验收结果分别报告，已有无关失败单独记录。
