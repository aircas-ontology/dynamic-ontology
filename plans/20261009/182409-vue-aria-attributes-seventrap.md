# Vue ARIA 属性类型修复

## 需求理解

用户已确认使用全局类型扩展解决组件直接使用 `aria-label="按接口地址搜索"` 的类型错误，不使用局部 `v-bind`。按项目类型规范放置文件，不创建 `vue-shim.d.ts`。

## 修改范围与文件

- 新增 `src/types/global/vueAriaAttributesType.ts`：Vue 第三方类型扩展。
- 新增 `tests/vue-aria-attributes.test.mjs`：类型回归测试。
- 新增本 Plan。保留组件现有直接属性写法，不修改其他已有工作区变更。
- 不删除文件，不修改配置或依赖。

## 核心实现方式

Vue 的 `HTMLAttributes` 已声明 `aria-label`，当前错误来自组件公共属性 `AllowedComponentProps`。通过模块增强让 `AllowedComponentProps` 继承 `Pick<HTMLAttributes, "aria-label">`，复用官方属性类型。使用 `import type`，经现有 tsconfig 包含机制生效，不通过类型公共出口导出。

## 新增依赖

无。复用现有 TypeScript 编译器和 Node 测试入口。

## 验证方式

- 先运行新增类型测试并确认正确字符串在修复前失败，再实施类型扩展并验证通过。
- 验证 Vue 公共属性与实际 Element Plus 输入框、选择框接受字符串；数字、错误拼写和无关属性仍被拒绝。
- 类型目录按顺序运行 `check:types-conventions`、`type-check`、`build:verify`。
- 运行 `npm test`、`test:coverage`、`check:project-conventions`，仅格式化本次新增文件，检查 diff 和工作区状态。
- 保留现有 ARIA 模板与 SSR 回归验证；本次无运行时行为变化，不新增浏览器流程。覆盖率已有分支不足 80% 的问题单独记录，不扩大本次修复范围。
