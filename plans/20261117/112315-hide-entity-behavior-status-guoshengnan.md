# 隐藏实例详情行为状态

- 需求理解：仅删除行为卡片的行为状态行；描述字段及原样式保留。
- 修改范围：ObjectProfileEntityBehaviors.vue 模板和对应渲染测试。
- 新增文件：本 Plan。
- 修改文件：src/views/EntityBrowsingObjectProfile/components/ObjectProfileEntityBehaviors.vue、tests/object-profile-entity-detail-view.test.mjs。
- 删除文件：无。
- 核心实现：先增加真实组件 SSR 渲染测试，验证状态不展示且名称、描述、API、挂载函数和更新时间仍展示；确认失败后仅删除状态行模板。
- 新增依赖：无。
- 验证方式：目标测试 RED/GREEN、npm test、test:coverage、type-check、build:verify、指定文件格式检查和 git diff --check。全量验证上次存在范围外失败，本次如实报告。浏览器未验证时明确记录，人工验收待完成。
