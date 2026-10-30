# 已关联数据源属性支持修改分类

- 需求理解：已关联数据源的对象属性允许修改属性分类，其他编辑权限和行为保持原样。
- 修改范围：对象属性编辑表单、编辑参数组装及对应回归测试。
- 修改文件：`src/views/OntologyObjectAttributePanel/components/AttributePropertyFormDialog.vue`、`src/views/OntologyObjectAttributePanel/composables/useAttributePropertyList.ts`、`tests/ontology-object-attribute-panel.test.mjs`。
- 新增文件：本 Plan；不删除文件。
- 核心实现：移除分类选择器的数据源锁定限制；绑定属性更新参数使用新分类，并保留其他锁定字段原值；同步提示和注释。
- 新增依赖：无。
- 验证方式：先添加并运行失败的行为回归测试，覆盖分类更新、分类 0、其他锁定字段保留、保存失败及重复提交；实现后运行 npm test、npm run test:coverage、npm run type-check、npm run build:verify 和任务文件格式检查。检查任务 diff 与 git status。浏览器检查仅限属性编辑流程；无现成 E2E 入口，最终业务和视觉效果由人工验收。
- 用户确认：2026-10-28 已确认实施。
