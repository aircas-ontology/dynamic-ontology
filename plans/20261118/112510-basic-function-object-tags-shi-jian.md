# Plan：基础函数「选择对象」尽量展示已选名称

## 需求理解

多选后输入框尽量多显示对象名称；当前默认 `collapse-tags` 只露出第 1 个，其余收成 `+N`。

## 修改范围

仅 `BehaviorFormDialog.vue` 中基础函数旁的 `el-tree-select` 展示方式；不改同目录约束、树数据与业务逻辑。

## 新增、修改和删除文件

- 修改：`src/views/SpaceBehaviorWorkspace/components/BehaviorFormDialog.vue`
- 修改：`tests/ontology-space-behavior.test.mjs`（断言不再使用 collapse-tags）
- 新增依赖：无

## 核心实现方式

1. 去掉 `collapse-tags` / `collapse-tags-tooltip`，已选名称全部以 tag 展示。
2. 为该控件增加局部 class：限制最大高度并允许纵向滚动，避免多选过多撑破弹窗。

## 验证方式

- `npm test -- tests/ontology-space-behavior.test.mjs`
- `npm run format:check --` 任务改动文件
- 人工：多选 3+ 个对象时，输入框内应能看到多个名称
