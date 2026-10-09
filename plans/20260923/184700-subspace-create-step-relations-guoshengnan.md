# 第四步选择关系

## 需求理解

配置属性后点击下一步，进入第四步选择关系。表格交互对齐实例选择列表，默认全部勾选。行内容按关系展示：关系名称、源对象、目标对象。

## 修改范围

- 新增 `mapSubspaceCreateSelectedRelation.ts`：按已选对象生成关系行。
- 修改 `index.vue`：进入第四步并维护关系勾选。
- 修改 `SubspaceCreateWorkspacePanel.vue`：第四步渲染关系选择表。
- 更新 `tests/ontology-subspace-create.test.mjs`。

## 新增依赖

无。关系与实例一样使用页面内样例，在已选对象之间生成护航、同编队。

## 验证

TDD 后跑子空间创建测试、任务文件 `format:check`、`type-check`、`build:verify`。
