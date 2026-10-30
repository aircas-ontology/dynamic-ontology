# 上传文档后自动探查接口

## 需求理解

- 探查 URI：`POST /ontology/function/container/probe_interfaces`
- Domain：`DOMAIN_CONFIG.ONTOLOGYMANAGE_URL`
- 入参：`{ docPath: string }`（上传文档返回的 `data.path`）
- 上传文档同步解析并保存 `data.path`
- 上传成功 toast「上传成功」后自动探查；本阶段不展示探查结果
- 探查失败 toast 错误；成功静默

## 修改范围

- 上传类型/Mock/fixture；探查类型/API/Mock/mockData；表单；相关测试

## 核心实现方式

1. 上传 `UploadOntologyFunctionContainerDocData` 含 `fileName` / `path` / `format`
2. `postProbeOntologyFunctionContainerInterfacesInterface`，body `{ docPath }`，data 为 null
3. 表单保存 `dockerApiDocPath`，上传成功后自动探查；清空时一并清除 path

## 新增依赖及必要性

无。

## 验证方式

相关 `npm test`、`format:check`、`check:types-conventions`、`type-check`（过滤）、`build:verify`
