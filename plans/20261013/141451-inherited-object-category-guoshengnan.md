# 继承对象分类联动

## 需求理解

创建对象时选择继承对象后，分类自动回显继承对象所属分类，并禁止修改分类。

## 修改范围

- 调整对象创建弹窗的继承对象选项类型和联动逻辑。
- 选择继承对象时回显其 `categoryId`，并禁用分类选择；清除继承对象后恢复分类选择。
- 增加对象创建弹窗源码测试。

## 文件

- 修改 `src/views/ObjectWorkspacePanel/components/OntologyObjectCreateDialog.vue`。
- 修改 `tests/ontology-object-create-dialog.test.mjs`。

## 核心实现方式

继承对象选项携带对象分类标识，监听草稿中的 `parentId`，从选项中查找继承对象并同步 `draft.categoryId`；分类控件根据继承对象是否已选择设置禁用状态。

## 依赖

不新增依赖。

## 验证方式

运行对象创建弹窗定向测试、相关文件格式检查、类型检查、构建验证和 `git diff --check`。
