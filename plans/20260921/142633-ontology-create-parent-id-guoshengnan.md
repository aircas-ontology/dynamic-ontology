# 修复新建本体继承本体标识校验

## 需求理解

新建本体时，继承本体下拉框传入的是本体对象唯一标识字符串，但当前创建逻辑将其转为数字，导致合法的字符串标识被判定为无效。需要让继承本体标识按字符串传递，同时保留空间 id 和分类 id 的数字校验。

## 修改范围

- `src/types/apis/createOntologyObjectType.ts`：将 `parentOntologyUniqueIdentifier` 类型改为 `string`。
- `src/views/OntologySpaceManagementDetail/components/ObjectWorkspacePanel.vue`：移除继承本体的数字转换和数字校验，直接透传非空字符串。
- `tests/ontology-object-create-dialog.test.mjs`：增加字符串继承标识请求与不再数字校验的断言。

## 验证

运行本体创建相关测试、格式检查、类型检查和临时构建，并执行 `git diff --check`。
