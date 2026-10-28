# 属性数据类型选项调整

## 需求理解

属性新增和编辑弹窗的数据类型下拉框改用用户给出的括号内枚举值，显示值和提交值保持一致。

## 修改范围

- 调整属性列表 composable 提供的数据类型选项。
- 增加测试，校验完整选项、顺序及后端枚举值。

## 文件变更

- 修改 `src/views/OntologyObjectDetail/composables/useAttributePropertyList.ts`。
- 修改 `tests/ontology-object-attribute-panel.test.mjs`。
- 不修改接口、类型、依赖、`public/` 或 `html/`。

## 核心实现方式

下拉框继续复用现有字符串数组绑定，数组替换为 `Boolean`、`Integer`、`Long`、`Float`、`Short`、`Byte`、`Double`、`Decimal`、`String`、`Date`、`Array`、`Map`、`Vector`、`Timestamp`、`MediaReference`、`TimeSeries`、`Attachment`、`Geohash`、`Geoshape`、`Cipher`、`Ontology`。选中值直接写入 `draft.dataType` 并由现有新增、编辑请求提交。

## 依赖

不新增依赖。

## 验证方式

- 先增加选项契约测试并确认旧实现失败，再修改实现使其通过。
- 执行属性面板定向测试、格式检查、类型检查、验证构建及 `git diff --check`。
