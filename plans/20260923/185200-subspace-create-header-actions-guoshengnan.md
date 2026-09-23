# 顶栏上一步与创建

## 需求理解

走完第一步后，右上角显示上一步，并回退到上一个步骤。配置关系时右上角只保留上一步和创建，不再显示下一步。左侧返回始终回到空间列表。

## 修改范围

- 修改 `SubspaceCreateWorkspacePanel.vue` 顶栏按钮。
- 修改 `index.vue`：上一步只减步骤，创建承接最后一步提交。
- 更新 `tests/ontology-subspace-create.test.mjs`。

## 新增依赖

无。

## 验证

TDD 后跑子空间创建测试、任务文件 `format:check`、`type-check`、`build:verify`。
