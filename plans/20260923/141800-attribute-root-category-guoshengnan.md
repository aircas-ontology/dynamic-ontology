# 属性分类默认根节点并统一存储分组

## 需求理解

添加和编辑对象属性时，属性分类默认选中根分类；已有分类的属性保持原分类。根分类可以编辑，不能删除。编辑属性的存储分组与添加一样，允许输入新分组。

## 修改范围

- 属性表单分类默认值和根分类 id 解析。
- 属性分类树根节点隐藏删除。
- 存储分组在编辑时也允许创建。

## 新增、修改和删除文件

- 修改 `src/views/OntologyObjectDetail/utils/attributePanelHelpers.ts`
- 修改 `src/views/OntologyObjectDetail/composables/useAttributePropertyList.ts`
- 修改 `src/views/OntologyObjectDetail/composables/useAttributeCategoryTree.ts`
- 修改 `src/views/OntologyObjectDetail/components/AttributeCategoryTree.vue`
- 修改 `src/views/OntologyObjectDetail/components/AttributePropertyFormDialog.vue`
- 修改 `tests/ontology-object-attribute-panel.test.mjs`

## 核心实现方式

新增分类为空时选中根分类，根分类 id `0` 会提交给接口。根节点不渲染删除按钮，删除方法遇到根节点直接返回。存储分组下拉固定 `allow-create`。

## 新增依赖

- 无

## 验证方式

- 先运行属性面板测试确认失败，再完成修改并复跑。
- 对本次修改文件执行格式检查。
