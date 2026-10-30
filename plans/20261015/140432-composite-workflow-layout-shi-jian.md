# 函数编排流程画布（仅布局）

## 需求理解

编排表单下一步打开全屏流程画布；本阶段仅静态布局。

## 修改范围

新增 CompositeWorkflowDialog；FormDialog 接线；契约测试。

## 新增、修改和删除文件

- 新增：FunctionOperatorCompositeWorkflowDialog.vue
- 修改：FunctionOperatorFormDialog.vue、测试

## 核心实现方式

全屏 el-dialog 三栏静态布局；返回上一步关闭画布。

## 新增依赖及必要性

无。

## 验证方式

契约测试 + format:check。
