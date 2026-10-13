# 关联数据源连线样式修正方案

## 需求理解

「对象属性 → 关联数据源」弹窗的映射连线样式修正：连线端点须精确落在圆点中心；圆点须显示在连线之上（当前连线覆盖圆点）。

## 修改范围

仅修改 `src/views/OntologyObjectAttributePanel/components/DataSourceAssociateDialog.vue`。

## 核心实现方式

1. `refreshLines`：去掉扇形偏移（`source.y + fan * 0.2`、`target.y + fan * 0.12`），直接以 `anchorCenter` 计算的圆点中心作为曲线端点；删除不再使用的 `fan`、`index` 变量。
2. `.mapping-anchor` 样式：新增 `position: relative; z-index: 3;`，使圆点层级高于连线 SVG 层（`z-index: 2`）。

## 新增依赖

无。

## 验证方式

连线坐标依赖 `getBoundingClientRect` 实际布局，Node 测试环境无法行为化验证（现有组件测试均为文本断言风格），免自动化测试；采用浏览器冒烟验证替代。执行 `format:check`、`type-check`（对比基线无新增错误）、`build:verify`，并核对现有 `data-source-associate-dialog.test.mjs` 不受影响（仅断言类名）。
