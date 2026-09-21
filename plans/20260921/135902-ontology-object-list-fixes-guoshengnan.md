# 修复对象列表删除接口与展示布局

## 需求理解

对象空间页面的本体对象删除请求需要使用带 `/ontology` 前缀的删除路径；对象列表表格操作列需要增宽并保持详情、编辑、导出、删除按钮单行排列；卡片没有父本体时保留父本体区域并显示占位内容，避免卡片内容错位。

## 修改范围

- `src/apis/ontologyObjectManageApi.ts`：删除接口路径及 JSDoc 改为 `/ontology/meta/{ontologyIdentifier}`。
- `src/views/OntologySpaceManagementDetail/components/OntologyObjectList.vue`：对象卡片父本体无值时显示占位；表格操作列增宽并约束按钮不换行。
- `tests/delete-ontology-object-api.test.mjs`：同步删除接口前缀契约断言。
- 新增对象列表展示断言，覆盖父本体占位和操作列布局。

## 核心实现

删除请求继续使用对象唯一标识，仅调整 URL 前缀；不改变删除确认、成功刷新和错误处理流程。卡片根据 `parentDisplayName` 判断真实父本体，空值或“无”显示主题占位符。表格操作列宽度调整到可容纳四个按钮，并让按钮内容保持不换行。

## 依赖

不新增依赖。

## 验证

运行对象删除和对象列表相关测试、格式检查、类型检查、临时构建，并执行 `git diff --check`。
