# 出参绑定移到编排出参上方

## 需求理解

结束节点抽屉内，将「出参绑定」移到「编排出参」上方；开始节点不变。

## 修改范围

- `FunctionOperatorCompositeEndpointNodeDialog.vue` 模板顺序

## 新增、修改和删除文件

**修改**

- `src/views/FunctionOperatorPanel/components/FunctionOperatorCompositeEndpointNodeDialog.vue`

## 核心实现方式

结束节点时先渲染出参绑定块，再渲染编排出参标题与参数列表。

## 新增依赖

无。

## 验证方式

`format:check`、相关测试。
