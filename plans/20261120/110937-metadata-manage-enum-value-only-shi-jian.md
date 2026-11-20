# 元数据管理值列仅展示枚举

- 需求理解：元数据管理表格「值」列仅对枚举类型展示取值，输入值与范围显示「—」；不筛选表格行。
- 修改范围：`MetadataManageDialog.vue` 的表格行映射，以及相关测试；新增本 Plan。
- 新增 / 修改 / 删除文件：修改上述文件；新增本 Plan；不删除文件。
- 核心实现：`mapTreeToTableRows` 中仅 `valueType === "enum"` 时使用 `formatMetadataValueSummary`，否则固定为 `—`；共享格式化函数保持不变。
- 新增依赖：无。
- 验证方式：TDD 后执行相关测试与任务范围 format:check。
