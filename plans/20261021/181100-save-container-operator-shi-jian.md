# 对接保存容器算子接口

## 需求理解

对接 `POST /ontology/function/container`：新建表单保存时提交 image / interfaceDoc / runCommand / selectedInterfaces；成功关闭弹窗并刷新列表。镜像上传 data 对齐 funContainerUploadImageApi.md 样例。

## 修改范围

- 镜像类型/Mock/fixture；创建类型/API/Mock；buildParams；FormDialog；workspace/index；相关测试

## 核心实现方式

1. 镜像 data：`fileName/path/size/architecture/repoTags`
2. `postCreateOntologyFunctionContainerInterface`
3. 表单校验后 `emit("save-container")`；workspace 调用并刷新

## 新增依赖及必要性

无。

## 验证方式

相关 `npm test`、`format:check`、`check:types-conventions`、`type-check`（过滤）、`build:verify`
