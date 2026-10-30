# Plan：对象分类树点击对象高亮定位，不进详情

- 日期时间：2026-10-21 11:11:18（Asia/Shanghai）
- git-user：guoshengnan
- 状态：已确认（用户回复「好的，执行吧」）

## 需求理解

概念层级树中点击对象节点，当前行为是跳转对象详情页（`ObjectWorkspacePanel/index.vue` 的 `openObjectDetailFromTree`）。改为：右侧对象列表滚动定位到该对象并高亮（约 1.6s 后自动消退），不进详情；进详情仍走列表项的「详情」按钮。

## 修改范围

- `src/types/pages/ontologySpaceManagementDetailType.ts`：`OntologyObjectLocationTarget` 增加可选 `objectId?: string`。
- `src/views/ObjectWorkspacePanel/utils/objectWorkspace.ts`：新增 `makeObjectLocationTarget(categoryId, objectId, requestId)`。
- `src/views/ObjectWorkspacePanel/index.vue`：`openObjectDetailFromTree` → `locateObjectFromTree`，按 `uniqueIdentifier` 匹配列表项 `item.id`，设置对象级定位目标；查不到 ElMessage 提示；不再路由跳转；`@select-object` 绑定同步改名。
- `src/views/ObjectWorkspacePanel/components/OntologyObjectList.vue`：定位逻辑泛化，滚动分区后定位对象元素——卡片视图加 `data-object-id` 锚点与高亮类；表格视图 `row-class-name` 高亮行并滚动到行；高亮计时器同步清理 objectId。

## 复用机制

- 现有 `locationTarget { categoryId, requestId }` 定位通道与 1600ms 高亮计时器。
- 列表项 `item.id` 即对象 `uniqueIdentifier`，`item.categoryId` 可直接定位所属分区。

## 测试（TDD 先红）

- `tests/ontology-object-create-dialog.test.mjs`：「点击树对象节点跳详情」断言改为「定位不跳转」。
- `tests/ontology-object-workspace.test.mjs`：新增 `makeObjectLocationTarget` 与列表对象高亮断言。
- `tests/ontology-object-query-api.test.mjs`：分类定位断言保留不动。

## 新增依赖

无。

## 验证方式

- `npm test`：21 个已知基线失败，零新增。
- `npm run type-check`：9 个已知基线错误，零新增。
- `npm run build:verify`：通过。
- 任务文件 `format` / `format:check`。
- 浏览器目视验收：后端登录对 guoshengnan/a123456 返回「用户名或密码错误」，受阻则记录缺口。
- 不执行 git commit / push。
