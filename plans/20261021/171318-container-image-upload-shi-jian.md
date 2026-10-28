# 容器算子上传镜像对接

## 需求理解

对接 `docs/20261021/funContainerUploadImageApi.md`：multipart `file` 上传到 `POST /ontology/function/container/upload_image`；成功 toast「上传成功」；本阶段不解析 data。

## 修改范围

- 类型、`functionApi.ts`、apis/types barrel、Mock、mockData 路由、FormDialog、测试

## 核心实现方式

1. Params `{ file: File }`，Data `null`
2. `postUploadOntologyFunctionContainerImageInterface` FormData 字段 `file`
3. 表单选文件校验后调用接口，成功保留文件名并 toast

## 新增依赖及必要性

无。

## 验证方式

契约测试、format:check、check:types-conventions、type-check、build:verify。
