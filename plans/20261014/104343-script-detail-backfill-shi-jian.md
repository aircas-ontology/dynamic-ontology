# 脚本函数详情回显（编辑 / 基于已有创建）

## 需求理解

编辑与基于已有函数创建时回填脚本详情；IDE 使用 data.code 与 language。

## 修改范围

详情类型、页面 code definition、mapOntologyFunctionDetail、FormDialog、语言映射、测试与 Mock。

## 新增、修改和删除文件

- 修改：getOntologyFunctionDetailType.ts、ontologyFunctionOperatorType.ts、mapOntologyFunctionDetail.ts、FunctionOperatorFormDialog.vue、buildCreateOntologyScriptFunctionParams 或新建语言映射、测试、Mock
- 新增：必要时 mapScriptLanguageFromApi 工具

## 核心实现方式

CUSTOMIZE 映射为 definition.kind=code；FormDialog 从 definition 写入 scriptDraft*；源模板同步。

## 新增依赖及必要性

无。

## 验证方式

详情/工作区契约测试 + format:check。
