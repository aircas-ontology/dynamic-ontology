# 运行配置展开区展示新字段

## 需求理解

运行配置列表改为可展开行；二级内容按「容器生命周期 + 部署信息」展示契约字段（含 `nodeIp`、`nodePort`），不虚构无契约字段。启停放生命周期区；不做重启。

## 修改范围

- `src/types/apis/getOntologyFunctionContainerRuntimeListType.ts`
- list / start / stop Mock
- `FunctionOperatorContainerRuntimePanel.vue`
- `tests/get-ontology-function-container-runtime-list-api.test.mjs`

## 核心实现方式

`el-table` expand：生命周期（最近操作、说明、启停）+ 单行部署信息表（容器名 / nodeIp / nodePort / containerPort / hostPort）。

## 新增依赖及必要性

无。

## 验证方式

TDD 后相关测试、`format:check`、`type-check`、`build:verify`。
