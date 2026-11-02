# 新建容器函数算子表单

## 需求理解

在新建函数弹框中开放「容器算子函数」表单：通用配置含名称/API名称/协议/说明（无版本）；容器区含待部署态、镜像与接口文档本地上传、启动命令与已发现接口空态；本阶段不对接上传/探测/创建接口，保存提示暂未开放。

## 修改范围

- `src/types/pages/ontologyFunctionOperatorType.ts`
- `src/views/FunctionOperatorPanel/components/FunctionOperatorFormDialog.vue`
- `tests/function-operator-workspace.test.mjs`

## 核心实现方式

1. 更新 docker 类型 description。
2. FormDialog 增加 docker section：通用配置无版本/无源模板；容器配置本地上传与空态。
3. 保存校验后提示暂未开放；切换类型/关闭时重置容器本地状态。

## 新增依赖及必要性

无。

## 验证方式

契约测试、format:check、相关 npm test、type-check、build:verify。
