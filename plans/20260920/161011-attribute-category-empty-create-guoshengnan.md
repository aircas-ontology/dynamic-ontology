# 属性分类树空数据与创建分类

## 需求理解

当属性分类树查询响应缺少 data 时，页面将其视为空分类树，左侧模块显示无数据提示和“创建分类”按钮。点击按钮打开创建分类弹窗，父分类显示为“无”；从分类树节点点击添加时回显该节点名称且只读。保存时无分类树数据提交 parentId: 0，从节点创建时提交对应节点 id，并携带当前本体对象标识与分类名称。创建成功关闭弹窗、提示成功并重新查询分类树，失败提示接口错误。

## 修改范围

- 更新属性分类创建接口契约、类型、API 函数、Mock 与统一出口。
- 更新属性对象属性页的空状态、弹窗和创建提交流程。
- 增加接口与页面行为专项测试。
- 更新创建接口文档中的标识字段名称为 ontologyIdentifier；查询接口仍使用 ontologyUniqueIdentifier。

## 文件范围

- 新增：src/types/apis/createOntologyObjectArrTypeTreeType.ts
- 新增：src/mocks/createOntologyObjectArrTypeTreeMock/createOntologyObjectArrTypeTreeMock.ts
- 修改：src/apis/ontologyObjectArrManageApi.ts
- 修改：src/apis/index.ts
- 修改：src/types/index.ts
- 修改：src/views/OntologyObjectDetail/components/OntologyObjectAttributePanel.vue
- 修改：docs/20260920/createOntologyObjectArrTypeTreeApi-guoshengnan.md
- 新增或修改：属性分类接口与页面专项测试文件

## 核心实现

- 创建接口使用 POST /ontology/property/category，请求体字段为 ontologyIdentifier、parentId、
  ame。
- 查询成功但
  esponse.data 缺失时进入 empty 状态，不构造默认分类节点。
- empty 状态保留搜索区域，显示“暂无分类树数据”和“创建分类”按钮。
- 创建弹窗显示只读父分类；从分类树节点创建时使用该节点 id，无分类树数据时使用 parentId: 0。
- 创建成功后调用查询函数刷新树状态，失败显示服务端消息并保留弹窗。

## 后续编辑扩展

- 属性分类树节点增加编辑按钮，样式沿用概念层级树的 hover 操作组。
- 编辑弹窗显示只读父分类和可编辑节点名称。
- 保存调用 `PUT /ontology/property/category`，成功后关闭弹窗、提示成功并刷新分类树。

## 依赖

不新增依赖。

## 验证

- 先运行新增专项测试确认失败，再实现并重新运行专项测试。
- 执行任务文件格式检查、
  pm run type-check、
  pm run build:verify、git diff --check，并检查工作区状态。
