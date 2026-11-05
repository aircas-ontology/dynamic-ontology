# 继承层级树新增对象

- 需求：继承层级树对象节点提供新增入口，空间根节点不提供；打开手动创建并预设当前对象为继承对象。
- 范围：ConceptHierarchyTree.vue、ObjectWorkspacePanel/index.vue、useObjectWorkspaceObjectActions.ts、OntologyObjectCreateDialog.vue 和相关行为测试。
- 实现：复用现有新增按钮样式，阻止点击冒泡；事件传递当前对象，弹窗初始化父对象及关联分类；普通新建和编辑清除预设。继承接口中的对象未出现在列表时补入父对象选项。
- 文件：修改上述四个源码文件，新增 tests/inheritance-create-object.test.mjs 及本方案；不删除文件。
- 依赖：无新增依赖。
- 验证：先运行新增测试确认失败，再最小实现并验证；运行 npm test、test:coverage、type-check、build:verify、明确文件的格式检查和 git diff --check。浏览器工具可用时执行相关流程冒烟，否则记录缺口。
- 用户已确认实施；保留工作区已有修改，不触碰 html/ 和 public/。
