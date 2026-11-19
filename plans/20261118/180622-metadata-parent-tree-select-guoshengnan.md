# 元数据父级改为可折叠 TreeSelect

## 需求理解

「添加分类」「添加元数据」的父级/所属分类由扁平 `el-select` 改为可折叠 `el-tree-select`，与属性分类编辑交互一致。

## 修改范围

仅元数据相关弹窗与父级树数据装配；无新依赖。

## 新增、修改和删除文件

| 动作 | 路径                                                          |
| ---- | ------------------------------------------------------------- |
| 修改 | `utils/metadataOperations.ts`（树选择数据克隆、首个可选分类） |
| 修改 | `components/MetadataCategoryFormDialog.vue`                   |
| 修改 | `components/MetadataRuleFormDialog.vue`                       |
| 修改 | `components/MetadataManageDialog.vue`                         |
| 修改 | `tests/ontology-attribute-metadata.test.mjs`                  |
| 新增 | 本 Plan                                                       |

## 核心实现方式

- 使用 `el-tree-select`：`check-strictly`、`node-key="id"`、可折叠展开。
- 添加分类：整棵分类树可选（含根）。
- 添加元数据：同一棵树，根节点 `disabled`，不可选为所属分类。

## 新增依赖及必要性

无。

## 验证方式

- 更新元数据单测并运行
- `format:check`、`type-check`（关注本次文件）、必要时 `build:verify`
