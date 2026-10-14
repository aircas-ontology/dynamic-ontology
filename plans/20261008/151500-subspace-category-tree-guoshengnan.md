# 子空间分类体系树数据接入实施方案

## 需求理解
子空间创建页面需要使用本体空间分类体系树的真实数据和层级结构，同时保留当前页面已有的树样式、复选框、搜索和已选对象流程。

## 修改范围
- 修改子空间创建分类树组件的数据来源和节点映射。
- 复用现有本体对象工作区查询 composable 与业务类型。
- 保留当前页面视觉样式，不引入本体空间分类树操作按钮。
- 不修改 public、html，不新增依赖。

## 文件
- 修改：src/views/OntologySubspaceCreate/components/SubspaceCreateTreePanel.vue
- 必要时新增：子空间页面私有树映射工具或测试文件。

## 核心实现方式
从当前路由读取 spaceId，调用 useOntologyObjectWorkspace 获取分类树；将 OntologyConceptNode 递归转换为子空间勾选树节点，分类节点作为分组、对象节点作为可选叶子；搜索通过 el-tree filter 保持现有交互，选中叶子对象继续复用 mapSubspaceCreateSelectedObjects。

## 新增依赖
无。

## 验证方式
执行相关文件格式检查、npm test、npm run test:coverage、npm run type-check、npm run build:verify、git diff --check，并核对工作区状态。
