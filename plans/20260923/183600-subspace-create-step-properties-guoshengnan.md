# 第三步按对象展示属性

## 需求理解

第二步选择实例后点击下一步，进入第三步配置对象属性。按选中对象分组展示属性表（属性名称、数据类型、验证条件），默认不勾选。每个对象分组右上角有全选；步骤区右上角保留全选属性和取消全选。不进入第四步。

## 修改范围

- 新增 `src/views/OntologySubspaceCreate/utils/mapSubspaceCreateObjectProperty.ts`：按对象生成样例属性分组。
- 修改 `index.vue`：进入第三步，维护属性勾选，并提供分组全选、全部全选和取消全选。
- 修改 `SubspaceCreateWorkspacePanel.vue`：第三步按对象渲染属性表。
- 更新 `tests/ontology-subspace-create.test.mjs`。

## 新增依赖

无。属性与现有实例一样使用页面内样例，字段对齐截图中的舷号、舰名、数据类型和未选择验证条件。

## 验证

TDD 后跑子空间创建测试、任务文件 `format:check`、`type-check`、`build:verify`。
