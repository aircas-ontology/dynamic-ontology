# 操作按钮四色样式扩展

## 需求理解

对象卡片上的详情、编辑、导出、删除已经确认。其它页面里同一类操作按钮按这四套颜色显示：详情和进入为青色渐变，编辑为蓝色浅底，导出和更多为深色底，删除为半透明红色。不改文案，不改对象卡片上已经确认的按钮样式，不改取消、确认、新建、返回、重试和视图切换。

## 修改范围

- 在公共按钮覆盖中增加四个可复用修饰类，保证能盖过现有实心按钮颜色。
- 本体对象列表的表格操作、属性表格操作、关系表格操作、本体空间表格操作使用这些修饰类。
- 关系图右键菜单的编辑和删除使用同一套颜色变量。
- 本体空间卡片上的进入、编辑、更多继续使用卡片内已有覆盖。

## 新增、修改和删除文件

- 新增：`plans/20260922/201344-action-button-tones-guoshengnan.md`
- 新增：`tests/action-button-tones.test.mjs`
- 修改：`src/styles/element-plus/el-button.scss`
- 修改：`src/views/OntologySpaceManagementDetail/components/OntologyObjectList.vue`
- 修改：`src/views/OntologyObjectDetail/components/AttributePropertyTable.vue`
- 修改：`src/views/OntologySpaceManagementDetail/relationComponents/SpaceRelationWorkspace.vue`
- 修改：`src/views/OntologySpaceManagement/components/SpaceActions.vue`
- 修改：`src/views/OntologySpaceManagementDetail/relationComponents/RelationGraphView.vue`
- 修改：`tests/ontology-object-list.test.mjs`

## 核心实现方式

公共样式使用现有 `--aircas-*` 变量，选择器带上与默认按钮相同的类型排除，并单独覆盖 `type="danger"` 和 `type="primary" plain`。对象卡片原有选择器优先级更高，外观保持不变。

## 新增依赖及必要性

无。

## 验证方式

先运行失败的 `tests/action-button-tones.test.mjs`，实现后复跑该测试和 `tests/ontology-object-list.test.mjs`，再对本次文件执行格式检查。
