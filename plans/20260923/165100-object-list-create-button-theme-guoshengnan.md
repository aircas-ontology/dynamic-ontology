# 本体对象列表新建按钮改用公共主题

## 需求理解

本体对象列表页「新建本体」按钮颜色不符合主题。改为使用已有公共 Button 覆盖。

## 修改范围

- 只改 `OntologyObjectList.vue` 工具栏上的「新建本体」按钮。
- 不改卡片/表格操作按钮、`el-button.scss` 和其他页面。

## 新增、修改和删除文件

- 修改：`src/views/OntologySpaceManagementDetail/components/OntologyObjectList.vue`
- 修改：`tests/ontology-object-list.test.mjs`
- 新增依赖：无

## 核心实现方式

按钮从 `class="aircas-button aircas-button--tone-primary"` 改为 `class="aircas-button" type="primary"`，与公共 `el-button` 覆盖用法一致。

## 验证方式

先改测试断言为公共主按钮 class 与 `type="primary"`，再改页面并通过对象列表测试。格式检查仅覆盖上述文件。
