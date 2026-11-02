# 容器算子上传接口文档对接

## 需求理解

对接 `docs/20261021/funContainerUploadDocApi.md`：multipart `file` 上传到 `POST /ontology/function/container/upload_doc`；成功 toast「上传成功」；本阶段不解析 data。

## 修改范围

- 类型、`functionApi.ts`、barrel、Mock、mockData、FormDialog、测试

## 核心实现方式

对齐镜像上传：`postUploadOntologyFunctionContainerDocInterface` + 表单异步上传与 loading。

## 新增依赖及必要性

无。

## 验证方式

契约测试、format:check、check:types-conventions、type-check、build:verify。
