# Views 目录规范

## 1. 目录职责与边界

`src/views` 存放路由页面。其直接子目录均为独立页面（Page），页面负责组合布局、组件、Store 和 API，编排完整用户流程。

- 【必须】页面只保留页面编排和页面私有逻辑，可复用能力下沉到对应公共目录。
- 【禁止】在页面中重复实现公共组件、请求基础设施、通用工具或跨页面状态。
- 【禁止】页面之间直接引用对方的私有组件、工具函数、composables 或其他内部实现。
- 【必须】页面私有子组件与页面同目录维护；是否提取为全局组件仅由用户决定，未经用户明确要求不得自行提升到 `src/components`。

## 2. 结构与命名

```text
src/views/
└─ <PageName>/
   ├─ index.vue
   ├─ components/
   ├─ <business>Components/
   ├─ composables/
   └─ utils/
```

- 【必须】每个页面目录包含一个 `index.vue`，作为页面主入口并统一引入、组合页面内部组件。
- 【必须】页面目录和页面组件文件使用 PascalCase，入口使用生态约定的 `index.vue`。
- 【优先】页面私有组件按业务职责放入 `components`、`<business>Components` 等目录，只在确有拆分需要时创建。
- 【优先】不同业务组件目录之间避免互相引用，由 `index.vue` 负责组合；确需共同使用的页面私有组件应调整到双方都可依赖的页面级 `components` 中。
- 【必须】页面专属工具函数放入页面的 `utils`，页面专属 composables 放入页面的 `composables`。
- 【必须】页面专属资源统一放入 `src/assets/pages/<pageName>`，其中资源目录使用小驼峰。
- 【禁止】新建 `src/views/<PageName>/assets`。

## 3. 公共目录与依赖边界

- 【必须】页面业务类型放入 [`src/types`](../types/readme.md) 的对应目录并通过 `@/types` 使用；仅与单一实现紧密耦合的内部类型可按类型目录规范就近定义。
- 【必须】页面所需 Store 定义在 [`src/stores`](../stores/readme.md)，并遵守其状态职责、命名和生命周期规范。
- 【必须】页面所需后端接口定义在 [`src/apis`](../apis/readme.md)，页面通过 `@/apis` 统一出口使用。
- 【必须】页面专属静态资源定义在 [`src/assets/pages/<pageName>`](../assets/readme.md)，不得放回页面目录。
- 【必须】页面所需 Mock 定义在 [`src/mocks`](../mocks/readme.md)，按页面或业务域分类并复用正式类型。
- 【必须】页面路由定义在 [`src/router`](../router/readme.md)，业务路由放入其 `modules` 并由入口显式装配。
- 【必须】页面或组件私有样式使用 `<style scoped lang="scss">` 就近维护；只有主题令牌、全局基础样式和公共覆盖放入 [`src/styles`](../styles/readme.md)。
- 【必须】跨页面复用的全局工具函数放入 [`src/utils`](../utils/readme.md)，并通过 `@/utils/...` 引用；页面专属工具不得提升或供其他页面直接引用。
- 【必须】已由 [`src/components/register.ts`](../components/readme.md) 注册的全局组件可在页面模板中直接使用；未经用户明确决定，不得自行将页面组件提取为全局组件。

## 4. Vue 与导入

- 【必须】使用 Vue 3 Composition API 和 `<script setup lang="ts">`。
- 【必须】纯类型使用 `import type`，公共状态通过对应 Pinia Store 使用。
- 【优先】按 Vue、第三方包、项目模块、相对模块分组导入并保持稳定顺序。

## 5. 页面状态与数据流

- 【必须】异步页面按根规范区分查询、命令和初始化状态；只有查询或具有无内容语义的流程要求 empty。
- 【必须】避免相同请求在进行中重复触发，并防止过期响应覆盖新状态。
- 【优先】页面卸载时取消不再需要的请求、订阅和后台任务。
- 【禁止】静默吞掉异常或仅在控制台输出用户需要知道的失败。

## 6. UI、交互与可访问性

- 【必须】使用现有 Aircas 主题变量、公共组件和 Element Plus 覆盖。
- 【禁止】业务样式硬编码颜色；私有样式使用 `<style scoped lang="scss">`。
- 【必须】表单具有校验、提交中状态、失败提示和重复提交控制。
- 【必须】可操作元素使用正确语义，图片、图标按钮、键盘焦点和长文本具有可访问处理。
- 【必须】检查 normal、hover、active、disabled、focus 和 overflow 状态。

## 7. 第三方实例与生命周期

- 【必须】地图、图表和 Canvas 实例避免 Vue 深度响应式，只初始化一次并在卸载时销毁。
- 【必须】移除所有事件监听器、定时器、动画帧、Observer、Overlay 和订阅。
- 【必须】重建实例前执行与卸载相同的清理流程。

## 8. 变更检查清单

1. 页面目录、`index.vue` 入口、私有组件、composables 和工具函数位置是否正确。
2. 页面之间是否不存在私有组件、函数或其他内部实现的直接引用。
3. 类型、Store、API、资源、Mock、路由、样式和全局工具是否遵守对应目录规范。
4. 页面是否只做流程编排；全局组件是否仅在用户明确决定后提取并统一注册。
5. 异步状态语义、请求并发、错误反馈和卸载取消是否处理。
6. 路由名称和跳转目标是否存在且一致。
7. 主题、交互状态、无障碍和第三方实例清理是否验证。
