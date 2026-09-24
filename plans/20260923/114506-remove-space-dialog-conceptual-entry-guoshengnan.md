# 删除新建本体空间弹窗的概念模型入口

## 需求理解

删除“新建本体空间”弹窗中的“基于概念模型创建”入口及其进入概念建模画布的操作。空间列表“更多”菜单中的“概念构建”入口属于独立功能，继续保留。

## 修改范围

- 精简空间创建弹窗，仅保留手动创建和导入创建模式。
- 移除弹窗向页面发出的 `open-conceptual` 事件及页面对应处理链。
- 保留空间列表操作中的概念模型构建跳转及其当前空间参数。
- 更新概念模型页面相关测试，验证弹窗入口已移除且列表概念构建入口仍存在。

## 文件变更

- 修改 `src/views/OntologySpaceManagement/components/SpaceFormDialog.vue`。
- 修改 `src/views/OntologySpaceManagement/index.vue`。
- 修改 `src/views/OntologySpaceManagement/composables/useSpaceManagementActions.ts`。
- 修改 `tests/ontology-conceptual-model-create.test.mjs`。

不新增依赖，不修改接口、路由和受保护目录。

## 核心实现方式

将弹窗模式类型收敛为 `manual | import`，删除概念模式模板、底部按钮、事件声明及相关私有样式；删除页面事件绑定和 composable 中仅服务于弹窗入口的跳转函数，但保留列表操作 `conceptual-model` 分支。

## 验证方式

- 运行空间管理和概念模型定向测试。
- 对本次修改文件执行 Prettier 格式检查。
- 执行类型约定检查、类型检查、验证构建、`git diff --check`，并区分既有失败与本次变更结果。
