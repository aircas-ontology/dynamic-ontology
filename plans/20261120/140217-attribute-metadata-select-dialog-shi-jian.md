# 属性表单选择元数据弹窗

- 需求理解：属性表单元数据由 tree-select 改为「选择元数据」按钮；弹窗展示目录树、类型与可编辑值（输入/枚举多选/范围）；取消点击节点加入选中；确认后写回 selectedRecords；表单保留标签移除。
- 修改范围：`AttributePropertyFormDialog.vue`、新增 `AttributeMetadataSelectDialog.vue`、相关工具与测试；新增本 Plan。
- 新增 / 修改 / 删除文件：新增弹窗组件与可选工具函数；修改属性表单与测试；不删除文件。
- 核心实现：勾选选中；自定义树节点编辑值；无 node-click 写入；确认组装记录经 update-metadata 回写。
- 新增依赖：无。
- 验证方式：TDD 后相关测试、format、按需 type-check / build:verify。
