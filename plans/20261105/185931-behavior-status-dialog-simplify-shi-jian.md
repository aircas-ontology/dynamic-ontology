# 精简对象行为状态管理弹窗

## 需求理解

按截图红框，从空间行为 `BehaviorStatusDialog` 去掉标题区、操作原因、引用检查面板与「重新检查」，保留目标操作与两步确认。

## 修改范围

- `src/views/SpaceBehaviorWorkspace/components/BehaviorStatusDialog.vue`
- `tests/ontology-space-behavior.test.mjs`

## 新增 / 修改 / 删除文件

| 操作 | 路径     |
| ---- | -------- |
| 修改 | 上述文件 |
| 新增 | 本 Plan  |

## 核心实现方式

删除红框 UI 与 reason/check 逻辑；下一步直接进确认步；确认提交 `reason: ""` 保持草稿契约。

## 新增依赖及必要性

无。

## 验证方式

- `node --test tests/ontology-space-behavior.test.mjs`
- `npm run format:check -- <本次文件>`
- 按需 type-check / build:verify
