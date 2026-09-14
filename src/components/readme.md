# Components 目录规范

## 1. 目录职责与边界

`src/components` 存放必须全局注册的公共 Vue 组件。页面私有组件保留在对应页面目录。

- 【必须】本目录中的每个 Vue 组件都通过 `register.ts` 全局注册。
- 【禁止】在公共组件中固化单一页面流程、直接发起页面 API 请求或维护页面级业务状态。
- 【优先】页面私有组件保留在对应页面目录，确认复用后再提升。

## 2. 结构与命名

```text
src/components/
├─ <ComponentName>.vue
├─ register.ts
└─ readme.md
```

- 【必须】组件文件和组件名使用 PascalCase；注册名与组件名一致。
- 【必须】组件专属资源放入 `src/assets/components/<componentName>`，资源目录使用小驼峰。
- 【优先】组件较复杂时使用同名 PascalCase 目录收拢子组件，但不得建立无实际需要的层级。

## 3. Vue、类型与接口

- 【必须】使用 Vue 3 Composition API 和 `<script setup lang="ts">`。
- 【必须】Props、Emits 和公开方法具有明确类型；只读输入不得在组件内直接修改。
- 【必须】事件名表达业务结果，避免 `click1`、`changeData` 等含义不明的名称。
- 【优先】通过 Props、Emits 和 Slots 建立组件边界，避免读取父组件 DOM 或全局变量。
- 【优先】内部模块使用 `@/`；同一组件目录内可使用清晰的相对路径。

## 4. 注册与依赖

- 【必须】`register.ts` 是本目录所有 Vue 组件的统一注册入口；导入和注册按组件名保持稳定字典序。
- 【必须】复用 Element Plus 和已有 `.aircas-*` 覆盖，不重复实现已有基础控件。
- 【禁止】公共组件依赖具体页面、路由页面实例或页面私有资源。

## 5. 样式、交互与可访问性

- 【必须】私有样式使用 `<style scoped lang="scss">`，颜色使用现有 `--aircas-*` 主题变量。
- 【禁止】在业务组件中硬编码 HEX、RGB、HSL、`white` 或 `black`。
- 【必须】CSS Class 使用语义化 kebab-case；SCSS 嵌套原则上不超过四层。
- 【必须】检查 normal、hover、active、disabled、focus 和 overflow 状态。
- 【必须】纯图标按钮提供 Tooltip、`title` 或准确的 `aria-label`，键盘焦点必须可见。

## 6. 生命周期与错误处理

- 【必须】移除组件创建的监听器、定时器、动画帧、Observer 和订阅。
- 【必须】第三方图形实例避免 `reactive()` 深度代理，按场景使用普通变量、`shallowRef()` 或 `markRaw()`。
- 【必须】异步组件按根规范区分查询、命令和初始化状态，并防止重复请求及过期响应覆盖。
- 【禁止】静默吞掉异常；可恢复错误向用户提供明确反馈。

## 7. 变更检查清单

1. 组件是否确需全局注册、职责单一且已加入 `register.ts`。
2. Props、Emits、Slots 和资源路径是否符合约定。
3. 是否复用主题、Element Plus 和现有公共能力。
4. 交互状态、无障碍和溢出是否验证。
5. 所有副作用和第三方实例是否完整清理。
