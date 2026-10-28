# 属性树节点详情弹窗

## 需求理解

对象属性页面的分类树点击属性节点时，改为打开只读详情弹窗；表格中的编辑入口继续打开现有编辑弹窗。

## 修改范围

- 新增属性详情弹窗组件，展示已有属性字段且不提供编辑或保存操作。
- 调整属性页面树节点点击事件及页面状态，将树节点数据转换为详情数据。
- 调整分类树节点点击注释与事件命名，避免继续表达编辑行为。

## 文件

- 新增 `src/views/OntologyObjectAttributePanel/components/AttributePropertyDetailDialog.vue`。
- 修改 `src/views/OntologyObjectAttributePanel/index.vue`。
- 修改 `src/views/OntologyObjectAttributePanel/components/AttributeCategoryTree.vue`。

## 核心实现方式

复用 `OntologyAttributeItem` 和现有属性映射工具，将分类树属性节点转换为页面属性项，传入新的只读 `el-dialog`。详情弹窗仅展示字段，底部只保留关闭操作；表格编辑仍调用 `openEditAttribute`。

## 依赖

不新增依赖。

## 验证方式

执行相关文件 Prettier 检查、`npm run type-check`、`npm run build:verify`，并检查工作区 diff 与 `git diff --check`。
