# 已确认：运行配置模板状态

需求：增加状态开关列，默认启用。非编辑行可直接切换；编辑行状态使用草稿，保存提交，取消恢复。其他行编辑期间禁止直接切换，避免草稿冲突。

范围：RuntimeConfigTemplateDialog.vue、runtimeTemplateState.ts、runtime-config-template.test.mjs。无新增依赖、无删除文件，不触碰受保护目录。

验证：先增加失败行为测试再实现，验证默认值、直接切换、重复调用、缺失记录、保存和取消，执行全量测试与覆盖率、类型检查、build:verify和任务格式检查。
