## 1 本体空间编辑服务对接

## 需求背景

实现本体空间编辑接口功能对接

## 功能要求

根据E:\资料\h数字5模块\project\dev-project\docs\20260918\updateOntologySpaceApi-guoshengnan.md文档，对接空间列表页的编辑按钮功能。空间列表页路由：/workspace/ontology-space-management，空间列表组件路径：E:\资料\h数字5模块\project\dev-project\src\views\OntologySpaceManagement\components\SpaceTableView.vue，空间列表卡片组件：E:\资料\h数字5模块\project\dev-project\src\views\OntologySpaceManagement\components\SpaceCollection.vue，点击编辑按钮，打开编辑弹窗，修改信息后，点击确定调用编辑接口，接口调用成功则关闭弹窗、提示成功、刷新列表，调用失败则展示失败信息

## 2 本体空间删除服务对接

## 需求背景

实现本体空间删除接口功能对接

## 功能要求

根据deleteOntologySpaceApi-guoshengnan.md这个方案，对接本体空间删除功能。空间列表页路由：/workspace/ontology-space-management，空间列表组件路径：E:\资料\h数字5模块\project\dev-project\src\views\OntologySpaceManagement\components\SpaceTableView.vue，空间列表卡片组件：E:\资料\h数字5模块\project\dev-project\src\views\OntologySpaceManagement\components\SpaceCollection.vue，点击更多按钮中的删除按钮，弹出确认删除<xxx>本体空间数据提示窗，再次点击确认按钮后，调用删除接口，删除成功提示成功并刷新列表，删除失败提示失败信息。读取项目规范和skill等生成计划
