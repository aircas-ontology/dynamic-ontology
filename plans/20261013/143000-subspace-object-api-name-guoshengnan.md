# 子空间对象卡片显示 API 名称

## 需求理解

创建子空间选择对象后，右侧对象卡片副标题显示对象的 `apiName`，不显示唯一 ID。

## 修改范围

- 子空间创建分类树对象节点映射时补充真实对象 API 名称。
- 保持选中对象数据和卡片展示使用该 API 名称。
- 增加对象 API 名称映射测试。

## 文件

- 修改 `src/views/OntologySubspaceCreate/components/SubspaceCreateTreePanel.vue`。
- 修改 `tests/ontology-subspace-create.test.mjs`。

## 核心实现方式

从对象工作区的 `sections.items` 建立对象 ID 到 `apiName` 的查找结果，在递归映射树节点时将匹配到的 API 名称写入对象节点；无匹配时保留现有 ID 回退，保证数据不为空。

## 依赖

不新增依赖。

## 验证方式

运行子空间创建定向测试、相关文件格式检查、类型检查、构建验证和 `git diff --check`。
