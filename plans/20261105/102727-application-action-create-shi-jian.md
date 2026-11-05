# 对接应用行为创建（APPLICATION）

## 需求理解

按 `docs/20261103/createActionApi.md` §3.5 对接应用行为创建；本轮不做编辑。

## 已确认规则

1. 绑定关系单选一条（界面 + linkMapping）
2. 入参仅 PROPERTY / FIXED / EXTERNAL
3. WRITE_PROPERTY 的 functionParamExpression 自动生成：`$.data.<fullPath|paramName>`；RESULT_ONLY 不传 expression
4. 不做 OBJECT/LIST 整包绑定；仅非对象叶子行按三种来源传参；有 paramPath 时一并提交
5. EXTERNAL 默认值 UI 保留，请求暂不传
6. 每条出参都提交
7. 仅 POST 创建
8. mappingIns 传 category

## 修改范围

- createOntologyActionType、SpaceBehaviorDraft
- buildApplicationCreateActionParams
- BehaviorFormDialog、useSpaceBehaviorWorkspace
- tests

## 新增依赖

无

## 验证方式

相关单测 + format:check + type-check / build:verify
