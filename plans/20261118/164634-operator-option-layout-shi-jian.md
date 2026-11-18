# 关联函数算子下拉多行排版修复

## 需求理解

修复应用行为「关联函数算子」下拉中名称/描述/类型因固定行高重叠的问题。

## 修改范围

- `src/views/SpaceBehaviorWorkspace/components/BehaviorFormDialog.vue`
- `tests/ontology-space-behavior.test.mjs`（补充 popper 断言）

## 新增、修改和删除文件

- 修改上述文件；新增本 Plan
- 无新增依赖

## 核心实现方式

`el-select` 增加局部 `popper-class`；下拉项 `height: auto`、`line-height: normal`，并加大内边距，使多行信息纵向可读。

## 新增依赖及必要性

无。

## 验证方式

- 相关源码断言测试
- `npm run format:check -- <任务文件>`
