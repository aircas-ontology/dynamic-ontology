# 编辑本体对象固定 groupIds 修复

## 需求理解
编辑本体对象保存时，请求体中的 `groupIds` 必须固定为 `[null]`，避免当前请求发送空数组导致服务端处理异常。

## 修改范围
- 修改本体对象编辑请求参数类型，允许 `null` 分组标识。
- 修改对象管理面板编辑保存请求，固定传递 `groupIds: [null]`。
- 同步修改接口说明示例和字段类型描述。
- 更新编辑接口相关测试断言。

## 文件变更
- 修改 `src/types/apis/updateOntologyObjectType.ts`
- 修改 `src/views/OntologySpaceManagementDetail/components/ObjectWorkspacePanel.vue`
- 修改 `docs/20260919/updateOntologyObjectApi-guoshengnan.md`
- 修改 `tests/update-ontology-object-api.test.mjs`

## 核心实现方式
使用 `Array<string | null>` 表示接口允许的分组 ID 列表，在编辑请求组装处直接设置 `groupIds: [null]`；创建接口保持现有行为不变。

## 新增依赖
无。

## 验证方式
执行编辑接口测试、全量测试与覆盖率检查、类型检查、构建验证、当前任务文件格式检查，并检查任务差异和空白错误。
