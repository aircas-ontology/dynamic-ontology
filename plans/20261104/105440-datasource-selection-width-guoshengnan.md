# 缩小表选择列宽

## 需求理解与修改范围

用户确认将数据源构建流程“选择数据库表”中的“选用”和“主表”列从 120px 调整为 64px，保留居中显示。

## 文件与实现

- 修改 src/views/ObjectWorkspacePanel/components/DatasourceBuildDialog.vue 的两个 width 属性。
- 新增本计划文件，无删除文件、无新增依赖，不修改交互或数据逻辑。

## 验证

限定文件格式检查、列宽静态检查和 git diff --check。纯展示布局调整免除单元测试及覆盖率；浏览器视觉效果仍需人工验收。
