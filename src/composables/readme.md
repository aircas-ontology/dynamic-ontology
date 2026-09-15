# Composables 目录规范

## 1. 目录职责与边界

`src/composables` 存放项目级、可供不同页面或公共组件显式引用的 Vue composables，用于封装可复用的响应式状态、生命周期和副作用管理逻辑。

- 【必须】进入本目录的 composable 具有明确的跨页面或公共组件复用需求，并能脱离单一页面或组件的内部实现独立使用。
- 【必须】页面专属 composables 保留在 [`src/views/<PageName>/composables`](../views/readme.md)，组件专属 composables 与组件就近维护。
- 【必须】无响应式状态和 Vue 生命周期依赖的通用函数放入 [`src/utils`](../utils/readme.md)。
- 【必须】需要在多个调用方之间持续共享的业务状态放入 [`src/stores`](../stores/readme.md)，composable 不得充当隐式全局 Store。
- 【禁止】为了可能发生的复用提前将局部逻辑提升到本目录。

## 2. 分类与目录结构

```text
src/composables/
├─ shared/
│  └─ use<Name>.ts
├─ <domain>/
│  └─ use<Name>.ts
└─ readme.md
```

- 【必须】composable 按使用范围或业务领域归类，不直接放在 `src/composables` 根目录。
- 【必须】`shared` 只存放跨业务领域使用的项目级 composables。
- 【必须】`<domain>` 存放属于明确业务领域、但可供该领域多个页面或公共组件使用的 composables。
- 【必须】分类目录使用 camelCase，并采用稳定、准确的领域名称。
- 【禁止】使用 `common`、`misc`、`temp` 等职责不明确的分类，或按单一页面名称建立分类。

## 3. 文件与导出命名

- 【必须】文件使用 `use<Name>.ts` 格式，其中 `Name` 使用 PascalCase 并准确表达封装能力，例如 `useTheme.ts`、`useMapSelection.ts`。
- 【必须】每个文件以同名 `use<Name>` 函数作为主要具名导出；文件名、导出名和 import 路径大小写保持一致。
- 【优先】一个文件只维护一个高内聚 composable；仅与其实现紧密耦合的辅助函数可保留在同一文件中且不导出。
- 【禁止】使用默认导出，或使用 `composable.ts`、`hooks.ts`、`useCommon.ts` 等无法表达职责的名称。
- 【必须】导出的 composable 使用 JSDoc 说明用途、参数、返回值、重要副作用和清理行为。

## 4. 引用与依赖边界

业务代码通过路径别名显式引用 composable：

```ts
import { useTheme } from "@/composables/shared/useTheme";
import { useMapSelection } from "@/composables/map/useMapSelection";
```

- 【必须】使用 `@/composables/<category>/use<Name>` 引用；“全局”表示项目级可用，不表示自动导入或挂载到全局对象。
- 【禁止】全局 composable 依赖 `src/views` 中的页面私有实现。
- 【必须】公共业务类型通过 `@/types` 使用，后端接口通过 `@/apis` 使用，纯工具通过 `@/utils/...` 使用，共享业务状态通过对应 Store 使用。
- 【必须】仅作为类型使用的符号通过 `import type` 导入。
- 【禁止】通过 composable 绕过 API、Store、类型或工具目录的现有公共边界。

## 5. 响应式状态与接口

- 【必须】参数和返回值保持完整类型推断或显式类型，不使用 `any` 或无依据的类型断言规避检查。
- 【必须】每次调用产生的局部状态彼此隔离；确需跨调用共享的业务状态交由 Store 管理。
- 【优先】不允许调用方直接修改的状态使用 `readonly()` 或只读类型暴露，状态更新通过语义明确的方法完成。
- 【优先】返回稳定、职责清晰的对象结构，避免随条件变化返回不一致的字段集合。
- 【禁止】在模块被 import 时隐式启动请求、监听器、定时器或其他长期副作用。

## 6. 副作用、异步行为与生命周期

- 【必须】composable 创建的事件监听器、定时器、动画帧、Observer、订阅和第三方实例具有明确所有者，并在作用域销毁时完整清理。
- 【优先】使用 `onScopeDispose` 或对应 Vue 生命周期注册清理；手动生命周期场景同时返回语义明确的停止或销毁方法。
- 【必须】异步逻辑按根规范处理 loading、success、empty、error 或 idle、submitting、success、error 等适用状态。
- 【必须】防止无控制重复请求和过期响应覆盖新状态；作用域销毁后取消不再需要的请求或后台任务。
- 【禁止】静默吞掉异常；composable 返回或抛出可供调用方提供用户反馈的明确错误结果。
- 【必须】浏览器 API、外部数据和运行时配置在边界处校验，服务端渲染或测试环境不可用的能力应具有明确处理。

## 7. 变更检查清单

1. 逻辑是否确有跨页面或公共组件复用需求，而非页面或组件私有实现。
2. 分类目录、文件名和具名导出是否符合 `<category>/use<Name>.ts` 约定。
3. 纯函数、共享状态、API 和公共类型是否仍由各自目录负责。
4. 参数、返回状态和错误是否类型安全，调用方是否只能修改允许修改的状态。
5. 请求并发、过期响应、异常反馈和所有副作用清理是否完整。
6. 是否覆盖正常、边界、错误、重复调用和销毁清理等适用测试场景。

