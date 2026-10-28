# 删除对象时移除相连关系线

## 需求理解

概念模型画布删除对象时，源端或目标端连在该对象上的关系线一并删除。未连接该对象的关系保留。

## 修改范围

- 调整概念模型页删除选中对象的逻辑。
- 增加关系过滤函数和对应测试。

## 新增、修改和删除文件

- 新增 `src/views/OntologyConceptualModelCreate/utils/removeRelationsConnectedToObject.ts`
- 修改 `src/views/OntologyConceptualModelCreate/index.vue`
- 修改 `tests/ontology-conceptual-model-create.test.mjs`

## 核心实现方式

删除对象后，用 `removeRelationsConnectedToObject` 过滤掉 `sourceId` 或 `targetId` 等于该对象 id 的关系。画布同步会去掉对应连线。

## 新增依赖

- 无

## 验证方式

- 先运行删除关系测试确认失败，再完成修改并复跑概念模型测试。
- 对本次修改文件执行格式检查。
