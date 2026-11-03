# Attribute value object section for create/update/delete

## 需求理解

`基础行为 + 属性值` 下，新增/修改/删除均展示「对象信息」与「属性选择」，并落实 `docs/20261103/shijian.md`：

- 任意操作：属性只能来自同一存储分组
- 新增：不可选 `main`；选中某分组任一属性则全选该组
- 修改：同组可选单个或多个（不全选）
- 删除：不可选 `main`；非 main 分组选一则全选该组

## 修改范围

- `src/views/SpaceBehaviorWorkspace/utils/resolveAttributeValueSelection.ts`（新增）
- `src/views/SpaceBehaviorWorkspace/components/BehaviorFormDialog.vue`
- `tests/ontology-space-behavior.test.mjs`

## 核心实现方式

抽出选择决议函数；表单按 `basicAction` 控制可选行、全选/清空与提示文案；create/update/delete 间切换不清空对象，仅按规则重算勾选。

## 新增依赖及必要性

无。

## 验证方式

`ontology-space-behavior` 测试、`format:check`、`build:verify`。
