# 已关联数据源的属性仅允许修改名称和描述

- 时间：2026-10-19 18:05（Asia/Shanghai）
- 作者：guoshengnan
- 状态：用户已确认（选择“确认实施”，含提示条）

## 需求理解

对象属性编辑功能调整：已关联数据源的属性不再整体禁止编辑，改为可以打开编辑弹窗，但仅“属性名称”“属性描述”可修改，其余字段（API、属性分类、数据类型、存储分组、默认值、主键、名称键）不可修改。

## 修改范围

仅对象属性面板 `src/views/OntologyObjectAttributePanel/`；不涉及其它属性编辑入口。

## 新增、修改、删除文件

- 修改 `tests/ontology-object-attribute-panel.test.mjs`：重写 2 个既有失败测试（194 行、204 行）为新行为断言
- 修改 `src/views/OntologyObjectAttributePanel/composables/useAttributePropertyList.ts`：移除警告拦截，新增 `datasourceLocked` 状态
- 修改 `src/views/OntologyObjectAttributePanel/index.vue`：`handleEditAttribute` 移除两处拦截，查详情后传锁定状态
- 修改 `src/views/OntologyObjectAttributePanel/components/AttributePropertyFormDialog.vue`：新增 `datasourceLocked` prop，锁定 6 个控件并加提示条

无新增依赖、无删除文件。

## 核心实现方式

1. `openEditAttribute(value, datasourceLocked)`：新增第二参数（默认按 `value.datasourceId` 与 `value.datasourceColumnName` 判断），移除 `ElMessage.warning("该属性已绑定数据源，不可编辑")` 拦截；新增导出 `datasourceLocked` ref 供表单禁用。
2. `handleEditAttribute`：保留数据源详情查询；已绑定时不再 return，改为将 `Boolean(detail?.datasourceId?.trim() && detail.datasourceColumnName?.trim())` 传入 `openEditAttribute`。
3. 表单弹窗：`datasourceLocked` 为 true 时禁用属性分类、数据类型（与原 `draft.isPrimary` 条件合并）、存储分组、默认值、主键开关、名称键开关；顶部 `el-alert` 提示“该属性已绑定数据源，仅支持修改属性名称和描述”。
4. 保存链路不变：锁定字段控件禁用且草稿回显原值，`buildUpdatePropertyParams` 提交原值等效于仅修改名称和描述。

## 新增依赖

无。

## 验证方式

1. TDD：先重写测试确认失败，再实施并确认 `node --test tests/ontology-object-attribute-panel.test.mjs` 通过。
2. 全量 `npm test`：既有基线失败应减少 2 个，不新增失败。
3. `npm run type-check`、`npm run build:verify`。
4. `npm run format:check -- <本次改动文件>`。
5. 浏览器冒烟：已绑定数据源属性点击编辑 → 弹窗打开、仅名称/描述可改、保存成功。
