# 子空间创建属性接口接入方案

## 需求理解

实例选择页点击下一步时，按已选对象分别查询对象属性列表，并将接口数据展示在下一步属性配置列表中。对象没有属性时仍进入属性配置页，不阻断流程。

## 修改范围

- 修改 `src/views/OntologySubspaceCreate/index.vue`，增加属性查询、异步状态、错误重试和步骤流转。
- 修改 `src/views/OntologySubspaceCreate/utils/mapSubspaceCreateObjectProperty.ts`，将接口属性记录映射为页面属性分组。
- 修改 `src/views/OntologySubspaceCreate/components/SubspaceCreateWorkspacePanel.vue`，展示属性查询 loading、error 和 empty 状态。
- 更新 `tests/ontology-subspace-create.test.mjs`，覆盖属性接口调用、字段映射和无属性继续流程。

## 核心实现方式

复用 `getOntologyPropertyByOntologyIdInterface`，使用选中对象 id 作为 `ontologyUniqueIdentifier`，按对象并发查询并用请求代次防止过期响应覆盖。全部请求成功后进入属性页，即使属性列表为空；任一请求失败则停留当前步骤并提供重试。

## 新增依赖

无。

## 验证方式

执行定向测试、格式检查、类型目录检查、类型检查、构建验证和 `git diff --check`。
