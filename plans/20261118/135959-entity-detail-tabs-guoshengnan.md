# 实例详情 Tab 浏览布局

- 需求：属性、关系、行为三个 Tab，默认属性；每页左分类、右内容。关系支持列表、2D、3D；行为展示卡片分页，保留执行和当前实例预填，隐藏管理按钮及编辑右键菜单。
- 修改范围：EntityBrowsingObjectProfile 的实例详情、查询控制器及相关测试。按管理页面视觉在当前页面适配，不跨页面引用私有实现。
- 新增：页面私有只读分类、关系视图及必要工具、composables 与 tests/*.test.mjs；新增本 Plan。删除文件：无。依赖：无。
- 实现：属性沿用现有分类和存储分组；关系分类来自当前实例关系，切换视图仅使用过滤后的实例关系；行为使用现有分类树接口和对象范围列表接口，分页筛选保持对象范围。分类搜索、视图独立保存，实例切换重置。
- 图：公共 2D 图按可见视图挂载；页面私有只读 3D 图使用现有 Three.js 和主题能力，切换销毁 WebGL、几何、材质、控制器、动画及观察器。
- 状态：保留 loading、empty、error、retry，分类查询独立处理并阻止重复和过期响应覆盖；卸载失效。
- 验证：TDD 先验证分类和切换行为失败，再最小实现；执行 npm test、test:coverage、type-check、build:verify、check:project-conventions、限定文件 format:check 和 git diff --check。浏览器控制工具不可用时记录缺口，人工验收待进行。
- 边界：不修改规则画布已有工作、数据源已有测试；不读取 html，不修改 public，不使用 Subagent。

## 实施与验证记录

- 修改：`components/ObjectProfileEntityDetail.vue`、`composables/useObjectProfileEntityDetail.ts`；新增页面私有 `ObjectProfileDetailCategories.vue`、`ObjectProfileEntityGraph3d.vue`、`useEntityBehaviorCategories.ts`、`entityDetailCategories.ts`、`createEntityRelationScene.ts`。均位于 `src/views/EntityBrowsingObjectProfile/`。
- 测试：新增 `tests/entity-detail-tabs.test.mjs`；更新 `tests/object-profile-entity-detail.test.mjs`、`tests/object-profile-entity-detail-view.test.mjs` 和相关执行回归测试 `tests/behavior-execution-prefill.test.mjs` 的依赖边界。
- TDD：分类测试先因目标模块不存在失败，再实现并通过；相关回归覆盖分类、分页、对象范围、重复请求、过期响应、卸载失效、Tab 状态保留与重置、3D 主题刷新及资源释放。相关 51 项测试全部通过。
- 全量测试：1179 项，1133 通过，46 失败；与本次任务前 `codex-rule-display-test.log` 的 46 项失败名称比较，无新增失败。
- 覆盖率：已加载文件行 93.39%、分支 78.85%、函数 90.35%；分支未达到 80%，且全量测试存在上述历史失败，因此覆盖率检查未通过。这不是全项目源码覆盖率。
- 类型检查：未通过，14 项错误均在本任务未修改的其他文件，本任务文件无剩余类型错误。
- 构建验证：`npm run build:verify` 通过，产物位于系统临时目录。
- 项目规范检查：未通过，历史 Plan 链接、`public/` 未被 Prettier 排除、其他组件旧主题变量等既有问题；未扩展修改范围。
- 浏览器验证未执行：当前未暴露浏览器控制工具，且无 E2E script。暗亮主题、窄屏溢出、真实 WebGL 交互与最终 UI/UX 待人工验收。
