# 编辑关系时禁用 API 名称

## 需求理解

「编辑关系」弹窗中 API 名称只读，禁止修改；新建仍可编辑。

## 修改范围

- `SpaceRelationFormDialog.vue`
- `tests/ontology-space-relation.test.mjs`

## 新增、修改和删除文件

- 修改：上述两个文件
- 新增：本 Plan
- 删除：无

## 核心实现方式

API 名称输入增加 `:disabled="mode === 'edit'"`，并补充测试断言。

## 新增依赖及必要性

无。

## 验证方式

- 相关关系表单测试
- 任务文件 `format:check`
