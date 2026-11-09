# 行为列表增加 operation 展示

## 需求理解

行为列表表格增加接口 `operation` 字段展示（新增/修改/删除/查询）。列表映射已把 `operation` 写入 `SpaceBehaviorItem.basicAction`，无需改接口或行模型。

## 修改范围

- `src/views/SpaceBehaviorWorkspace/components/BehaviorListPanel.vue`：增加列
- `tests/ontology-space-behavior.test.mjs`：补充列断言

## 新增、修改和删除文件

- 仅修改上述两文件；无新增/删除

## 核心实现方式

在 `apiName` 与「状态」之间插入「基础操作」列，使用 `SPACE_BEHAVIOR_BASIC_ACTION_LABELS` 展示中文标签。

## 新增依赖

无

## 验证方式

- 相关 `ontology-space-behavior` 测试
- `format:check` 针对改动文件
- `type-check`、`build:verify`（记录既有失败）
