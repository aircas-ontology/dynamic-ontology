# 输入值 / 范围元数据不传 value

- 需求理解：添加与编辑元数据时，类型为输入值或范围不展示值/最小最大值输入框，且请求不传 `value`；枚举类型 UI 与 `value` 提交不变。
- 修改范围：`MetadataRuleFormDialog.vue`、`MetadataManageDialog.vue`、`metadataSchemaType.ts`、相关测试；新增本 Plan。
- 新增 / 修改 / 删除文件：修改上述文件；新增本 Plan；不删除文件。
- 核心实现：表单隐藏 input/range 值控件；提交时 input/range 仅传 `valueType`，enum 仍序列化 `value`；API 类型将 `value` 改为可选。
- 新增依赖：无。
- 验证方式：TDD 后执行相关测试与覆盖率、`type-check`、`build:verify`、任务范围 `format:check`。
