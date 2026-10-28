# 子空间创建页清空内容并保留路由

## 需求理解

删除子空间创建页的表单、分类树、步骤区和助手等业务内容，只保留可访问的空页面。`OntologySubspaceCreate` 路由和入口跳转保持不变。

## 修改范围

- 只改 `src/views/OntologySubspaceCreate/index.vue` 为空白壳。
- 路由 `subspace-create`、空间列表「子空间」跳转、空间详情 `isWorkflowPage` 判断不改。
- 不删除页面目录和路由文件。

## 新增、修改和删除文件

- 修改：`src/views/OntologySubspaceCreate/index.vue`
- 修改：`tests/ontology-space-management-detail.test.mjs`（断言空页且路由仍在）
- 新增依赖：无

## 核心实现方式

页面只保留带 `aria-label="创建子空间"` 的空 `section` 和占满内容区的 scoped 样式。去掉脚本状态、树数据、按钮和原有业务样式。

## 验证方式

先补失败测试：页面不再包含分类树/表单/助手，路由仍解析到原路径。再改页面并跑该测试。格式检查仅覆盖上述文件。
