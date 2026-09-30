# 需求理解

- 按在线画布接口契约支持可选 `spaceId`。
- 从本体空间列表进入概念画布时，将当前空间 id 传入保存请求，在已有空间下写入画布内容。
- 画布保存按钮文案改为“保存”。
- 保留从新建本体空间流程进入画布时的空间名称、API 名称和新建空间兼容逻辑。

# 修改范围

- 扩展画布保存请求类型，增加已有空间 id。
- 空间列表概念构建入口将空间 id 放入画布路由参数。
- 画布读取路由空间 id，按已有空间/新建空间分支组装请求体。
- 修改保存按钮文案及保存成功后的空间 id 处理。
- 补充接口契约、路由参数和按钮文案测试。

# 文件

## 修改

- `src/types/apis/createOntologySpaceWithCanvasContentType.ts`
- `src/views/OntologySpaceManagement/composables/useSpaceManagementActions.ts`
- `src/views/OntologyConceptualModelCreate/index.vue`
- `tests/create-ontology-space-canvas-api.test.mjs`
- `tests/ontology-space-management.test.mjs`

## 新增

- 本计划文件。

## 删除

- 无。

# 核心实现

- 在线接口传入 `spaceId` 时只提交 `spaceId`、`ontologies` 和 `links`，由后端在当前空间下保存画布内容。
- 新建流程未提供空间 id 时，继续提交空间名称、API 名称、描述及画布内容。
- 保存响应优先使用返回的 `data.spaceId`，已有空间场景在响应未返回 id 时回退到路由空间 id。

# 新增依赖

- 无。

# 验证方式

- 先执行画布接口和空间管理定向测试确认新增断言失败，再完成实现并确认通过。
- 执行任务文件格式检查、类型约定检查、类型检查、验证构建、全量测试和 `git diff --check`。
- 不修改 `html/`、`public/` 及工作区中与本任务无关的已有改动。
