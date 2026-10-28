# 对象空间管理「规则」改为「属性」

## 需求理解

对象空间管理页表格列头及卡片指标中的展示文案「规则」改为「属性」。仅改文案，不改 `metrics.rule` 字段名或数据映射。

## 修改范围

- `src/views/OntologySpaceManagement/components/SpaceTableView.vue`：`label="规则"` → `label="属性"`
- `src/views/OntologySpaceManagement/components/SpaceCardGrid.vue`：指标文案「规则」→「属性」
- `tests/ontology-space-management-structure.test.mjs`：断言同步为「属性」

## 新增、修改和删除文件

- 修改上述 3 个文件；无新增、无删除；无新依赖

## 核心实现方式

两处 UI 文案替换 + 同步结构测试断言。绑定仍为 `metrics.rule`。

## 新增依赖及必要性

无。

## 验证方式

- `node --test tests/ontology-space-management-structure.test.mjs` 或 `npm test`
- `npm run format:check --` 上述修改文件
- 人工：表格列头与卡片显示「属性」
