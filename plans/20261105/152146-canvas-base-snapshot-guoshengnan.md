# UML 画布初始快照及标识保留

- 需求：已有空间进入画布时回显全部对象、属性和关系，独立保存初始 JSON；保存时 base 为初始 ontologies/links，顶层为编辑后数据。
- 标识规则：已有对象、属性、关系保留 uniqueIdentifier；删除项仅从编辑结果移除；新增项不传标识，画布本地 id 不作为后端 id。保留对象 iconUrl。
- 修改：src/views/OntologyConceptualModelCreate/index.vue、utils/mapCanvasContentToConceptualModel.ts、src/types/apis/createOntologySpaceWithCanvasContentType.ts。
- 新增：tests/canvas-base-snapshot.test.mjs 和本方案；无删除文件，无新增依赖。
- 实现：加载成功后克隆独立初始快照；映射过程携带原始标识，保存时按存在与否提交；加载失败禁止保存，过期响应不能覆盖快照。新建空间沿用原有流程。
- 验证：TDD 验证快照隔离、编辑改名保留标识、删除和新增、错误及过期响应；运行 npm test、test:coverage、check:types-conventions、type-check、build:verify、明确文件 format:check、git diff --check。浏览器无可用工具则记录缺口，人工最终验收。
- 已获用户明确确认，保留工作区其他已有修改，不触碰受保护目录。
