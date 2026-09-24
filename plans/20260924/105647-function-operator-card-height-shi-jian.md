# Plan：函数算子卡片高度改为内容自适应

## 需求理解

卡片网格同行拉伸导致矮内容卡片底部留白过大。改为内容自适应高度，描述最多显示 2 行。

## 修改范围

- `FunctionOperatorPanel.vue`：网格 `align-items: start`；描述 `line-clamp: 2`。
- 相关单测断言上述样式。

## 新增依赖

无。

## 验证方式

- `node --test tests/function-operator-workspace.test.mjs`
- `npm run format:check --` 涉及文件
