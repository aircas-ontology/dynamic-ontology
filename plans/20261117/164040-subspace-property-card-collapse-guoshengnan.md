# 创建主题第三步对象属性卡片展开/折叠

## 需求理解

创建主题第 3 步「配置属性」中，每个对象属性卡片支持展开/折叠；折叠仅保留标题栏，不丢失勾选与筛选。

## 修改范围

仅 `OntologySubspaceCreate` 第三步属性卡片 UI。

## 新增、修改和删除文件

| 操作 | 路径                                                                           |
| ---- | ------------------------------------------------------------------------------ |
| 修改 | `src/views/OntologySubspaceCreate/components/SubspaceCreateWorkspacePanel.vue` |
| 修改 | `tests/ontology-subspace-create.test.mjs`                                      |

## 核心实现方式

1. 用 `Set` 记录已折叠 `objectId`，默认全部展开。
2. 标题栏增加折叠按钮与 `aria-label`。
3. 折叠时隐藏属性表；「全选」仍可用。
4. `propertyGroups` 变化时清理无效折叠 id。

## 新增依赖及必要性

无。

## 验证方式

更新测试后执行相关 `npm test`、`format:check`、`build:verify`。
