# Plan：对接函数算子列表 API

## 需求理解

按 `docs/20260923/7.getFunListApi-shijian.md` 对接列表；缺省字段 UI 展示空值。暂不传 `ontologySpaceId`（后端后续再加）。

## 修改范围

- Types / `getOntologyFunctionListInterface` / Mock
- `loadOperators` 改调列表接口；record → FunctionOperator 映射
- CUSTOMIZE 类型标签为空；缺字段空展示
- 创建成功后去掉 Mock 双写，改为重新拉列表
- 筛选 UI 暂仅客户端过滤当前页（请求只带分页）

## 文件

新增：`getOntologyFunctionListType.ts`、`getOntologyFunctionListMock/`、测试  
修改：`functionApi.ts`、`index` 出口、workspace、Panel、页面类型（可选 `apiModelType`）

## 验证

TDD → 相关测试 → format → types conventions → type-check / build:verify
