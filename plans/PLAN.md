# 当前分支代码审查结果

## 验证结论

- 工作区干净，当前分支：`dev_sthq`。
- `npm run type-check`：通过。
- `npm run build:verify`：通过。
- `npm run check:types-conventions`：通过。
- `npm test`：133 个测试中 128 通过、5 失败。
- `npm run check:project-conventions`：失败。
- 格式检查发现 51 个源码/测试文件存在 Prettier 差异。

## 高优先级代码问题

1. 登录令牌请求头不一致

涉及：

- [src/apis/loginApi.ts:15](/Users/xhp/projects/02-WebStorm/26-ontology/dynamic-ontology/src/apis/loginApi.ts:15)
- [src/utils/request.ts:67](/Users/xhp/projects/02-WebStorm/26-ontology/dynamic-ontology/src/utils/request.ts:67)

问题：

- 登录响应读取 `access-token` / `AccessToken`，测试和注释要求读取 `Authorization`。
- 普通请求注入的是 `access-token`，测试和注释要求 `Authorization`。
- 当前导致登录 API 相关测试和请求拦截器测试失败。

建议：

- 统一后端契约使用的请求头名称。
- 同时兼容 Axios 小写化后的 `authorization`。
- 登录 API 改用 `@/utils/authToken`、`@/utils/request`，避免违反 API 目录规范。

2. 类型安全被 `any` 绕过

涉及：

- [src/views/OntologyObjectDetail/index.vue:7](/Users/xhp/projects/02-WebStorm/26-ontology/dynamic-ontology/src/views/OntologyObjectDetail/index.vue:7)
- [src/views/OntologySpaceManagementDetail/relationComponents/SpaceRelationWorkspace.vue:241](/Users/xhp/projects/02-WebStorm/26-ontology/dynamic-ontology/src/views/OntologySpaceManagementDetail/relationComponents/SpaceRelationWorkspace.vue:241)

问题：

- 使用 `Component as any`。
- 将 `unknown` 直接断言为 `OntologyRelationClass`，没有运行时校验。

建议：

- 为路由组件 slot 建立明确类型，移除 `as any`。
- 为表格行增加类型守卫，非法数据返回安全结果或显示错误。

3. 未定义主题变量

涉及：

- [src/views/OntologyObjectDetail/components/ObjectDetailTabs.vue:143](/Users/xhp/projects/02-WebStorm/26-ontology/dynamic-ontology/src/views/OntologyObjectDetail/components/ObjectDetailTabs.vue:143)
- [src/views/OntologyObjectDetail/components/OntologyObjectOverviewPanel.vue:64](/Users/xhp/projects/02-WebStorm/26-ontology/dynamic-ontology/src/views/OntologyObjectDetail/components/OntologyObjectOverviewPanel.vue:64)

缺少变量：

- `--aircas-color-cyan-soft`
- `--aircas-color-border-shadow`
- `--aircas-color-panel-overlay`
- `--aircas-color-panel-overlay-deep`

建议：

- 优先替换为已有主题变量。
- 若确实需要新增变量，必须在 `theme-dark.css` 和 `theme-light.css` 中成对定义。

4. 第三方图形实例缺少初始化失败状态

涉及：

- [src/views/OntologySpaceManagementDetail/composables/useRelationGraph3d.ts:218](/Users/xhp/projects/02-WebStorm/26-ontology/dynamic-ontology/src/views/OntologySpaceManagementDetail/composables/useRelationGraph3d.ts:218)
- [src/views/OntologySpaceManagementDetail/relationComponents/RelationGraphView.vue:113](/Users/xhp/projects/02-WebStorm/26-ontology/dynamic-ontology/src/views/OntologySpaceManagementDetail/relationComponents/RelationGraphView.vue:113)

问题：

- `WebGLRenderer` 创建失败时没有捕获异常。
- 页面没有 `initializing / ready / error` 状态，也没有向用户展示 WebGL 不可用的原因。
- 目前虽有销毁逻辑，但初始化失败路径不完整。

建议：

- 将图形实例初始化封装为可返回错误状态的流程。
- 初始化失败时显示明确的降级提示。
- 增加初始化失败、重复初始化、卸载后更新等测试。

## 测试、文档和规范问题

1. 登录测试与实现契约不一致

涉及：

- [tests/login-api.test.mjs:54](/Users/xhp/projects/02-WebStorm/26-ontology/dynamic-ontology/tests/login-api.test.mjs:54)
- [tests/request.test.mjs:69](/Users/xhp/projects/02-WebStorm/26-ontology/dynamic-ontology/tests/request.test.mjs:69)

当前测试要求 `Authorization`，实现使用 `access-token`。应先确认后端真实契约，再同步实现和测试。

2. 全文检索占位文案不一致

涉及：

- [src/views/FullTextSearch/index.vue:7](/Users/xhp/projects/02-WebStorm/26-ontology/dynamic-ontology/src/views/FullTextSearch/index.vue:7)
- [tests/full-text-search.test.mjs:17](/Users/xhp/projects/02-WebStorm/26-ontology/dynamic-ontology/tests/full-text-search.test.mjs:17)

实现使用中文顿号 `、`，测试要求逗号 `，`。需统一产品文案和测试。

3. 过时测试错误要求删除有效布局文件

涉及：

- [tests/remediation-conventions.test.mjs:26](/Users/xhp/projects/02-WebStorm/26-ontology/dynamic-ontology/tests/remediation-conventions.test.mjs:26)
- [src/layout/index.vue](/Users/xhp/projects/02-WebStorm/26-ontology/dynamic-ontology/src/layout/index.vue)

当前目录规范明确允许默认布局使用 `index.vue`，因此不应直接删除该文件。应修改测试，或先确认布局重命名方案。

4. 项目规范检查失败

涉及：

- [.vscode/settings.json:5](/Users/xhp/projects/02-WebStorm/26-ontology/dynamic-ontology/.vscode/settings.json:5)
- [.agents/README.md](/Users/xhp/projects/02-WebStorm/26-ontology/dynamic-ontology/.agents/README.md)
- [docs/readme.md](/Users/xhp/projects/02-WebStorm/26-ontology/dynamic-ontology/docs/readme.md)

问题：

- Vue 默认格式化器配置为 `Vue.volar`，项目规范要求 `esbenp.prettier-vscode`。
- `.agents/README.md` 缺少 `code-formatting` Skill 条目。
- `docs/readme.md` 链接指向不存在的 `docs/20260914/1.ontologySearchApi.md`，实际文件名为 `seventrap.ontologySearchApi.md`。

5. 格式不符合项目配置

需要格式化的源码/测试文件包括：

- `src/layout/index.vue`
- `src/layout/components/HeaderBar.vue`
- `src/layout/components/NavigationMenu.vue`
- `src/models/SatelliteClass.ts`
- `src/utils/storage.ts`
- `src/apis/readme.md`
- `src/components/AircasPanel.vue`
- `src/views/OntologySpaceManagement/**`
- `src/views/OntologySpaceManagementDetail/**`
- `src/types/pages/ontologySpaceManagementDetailType.ts`
- `src/mocks/**`
- `tests/**`
- `scripts/check-types-conventions.mjs`

应使用项目规定的显式文件列表执行格式化，不能全仓无范围格式化。

## 中优先级代码问题

- [src/views/OntologySpaceManagement/composables/useSpaceManagement.ts:19](/Users/xhp/projects/02-WebStorm/26-ontology/dynamic-ontology/src/views/OntologySpaceManagement/composables/useSpaceManagement.ts:19)：远程请求失败时直接回退 Mock，并将状态标记为成功，用户无法知道看到的是样例数据。
- 多个具名函数缺少根规范要求的 JSDoc，例如 `AircasPanel.vue`、`AircasTimeline.vue`、`HeaderBar.vue`、`SpaceFormDialog.vue`、`RelationGraphView.vue` 中的部分函数。
- 多处 Element Plus 组件使用 `ariaLabel`，建议统一核对为实际可输出的 `aria-label` 属性，避免辅助技术无法读取标签。
- `src/utils/request.ts` 中 `resolveResponseData` 声明返回 `AxiosResponse`，但实际可能返回 `response.data`，接口类型与运行时行为不一致，应重新定义拦截器返回类型。
- `src/apis/ontologyManageApi.ts:116` 存在被注释掉的重复 URL，属于无效代码，应清理。

## 建议整改顺序

1. 先确认并统一登录请求头契约，修复 3 个登录/请求测试失败。
2. 修复未定义主题变量和类型安全问题。
3. 修正测试与布局、全文检索文案的契约漂移。
4. 修正项目规范配置、Markdown 链接和 Skill 索引。
5. 分批对实际涉及文件执行格式化。
6. 补充 WebGL 初始化失败、Mock 回退提示和无障碍行为测试。
7. 重新执行 `npm test`、覆盖率、规范检查、类型检查和 `build:verify`。

本次仅执行了只读检查，没有编辑、删除或生成项目文件。
