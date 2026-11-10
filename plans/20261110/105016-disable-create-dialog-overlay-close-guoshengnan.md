# 禁止创建弹窗遮罩层关闭

## 需求理解

对象、空间、关系和属性创建弹窗不应因点击弹窗外部遮罩层而关闭。

## 修改范围

仅调整四个创建弹窗的 Element Plus `el-dialog` 配置，将 `close-on-click-modal` 固定为 `false`。

## 新增、修改和删除文件

- 修改 `src/views/ObjectWorkspacePanel/components/OntologyObjectCreateDialog.vue`
- 修改 `src/views/OntologySpaceManagement/components/SpaceFormDialog.vue`
- 修改 `src/views/SpaceRelationWorkspace/components/SpaceRelationFormDialog.vue`
- 修改 `src/views/OntologyObjectAttributePanel/components/AttributePropertyFormDialog.vue`
- 新增 `tests/create-dialog-overlay-close.test.mjs`
- 新增本 Plan 文件
- 不删除文件

## 核心实现方式

在四个 `el-dialog` 上显式设置 `:close-on-click-modal="false"`，保留现有关闭按钮、Esc 和业务提交逻辑。

## 新增依赖及必要性

不新增依赖。

## 验证方式

- 对修改的 Vue 文件执行 Prettier 格式检查。
- 先运行新增回归测试确认现状失败，再完成实现后运行 `npm test` 和 `npm run test:coverage`。
- 执行 `npm run type-check` 和 `npm run build:verify`。
- 执行 `git diff --check`，检查任务相关差异和工作区状态。

## 实施与验证记录

- 四个弹窗均已设置 `:close-on-click-modal="false"`。四个组件同时复用于编辑表单，因此编辑模式也禁止遮罩关闭。
- RED：修改前新增 8 个行为用例中 7 个按预期失败；空间弹窗提交中原已禁止遮罩关闭，该用例通过。
- GREEN：新增 8 个行为用例全部通过，覆盖空闲、提交中、重复遮罩点击及显式关闭。测试编译实际模板根节点属性，并挂载真实 Element Plus `useDialog` 状态逻辑；不涉及页面 DOM 点击和完整表单提交。
- `npm test`：885 个测试，856 通过、29 失败。使用临时只读文件读取替换，将四个 Vue 文件在测试中映射为 Git HEAD 版本，排除新增测试后复核：877 个测试，848 通过、29 失败，失败名称集合相同；未修改工作区源码进行基线验证。
- `npm run test:coverage`：同样 29 个测试失败，当前脚本报告的已加载文件行覆盖率 92.62%、分支覆盖率 77.37%、函数覆盖率 89.21%，分支覆盖率未达到 80%；不代表全项目源码覆盖率。
- `npm run type-check`：失败，11 项错误位于未修改的 Agent API、应用接口文档、概念层级树、行为表单及主题空间等文件；不扩大范围修复。
- `npm run build:verify`：通过，产物写入系统临时目录。
- 当前任务六个文件的格式检查与 `git diff --check`：通过。
- 浏览器冒烟未执行；无现有 E2E 脚本。页面实际点击与人工最终验收仍待执行。
- 未新增依赖，未触碰受保护目录。
