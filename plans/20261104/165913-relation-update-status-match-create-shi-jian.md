# 关系实例「修改」状态选项与「新增」一致

## 需求理解

关系实例基础操作为「修改」时，状态仅可选 ENABLE / DISABLE，与「新增」相同。

## 修改范围

- `listSpaceBehaviorRelationTargetStatusOptions`
- `buildLinkCreateActionParams` UPDATE 状态校验
- 对应单测

## 新增、修改和删除文件

- 修改：`ontologySpaceBehaviorType.ts`、`buildLinkCreateActionParams.ts`、`tests/ontology-space-behavior.test.mjs`

## 核心实现方式

`create` / `update` 共用 ENABLE|DISABLE 过滤；UPDATE 提交拒绝 DELETE。

## 新增依赖

无

## 验证方式

相关单测 + format:check
