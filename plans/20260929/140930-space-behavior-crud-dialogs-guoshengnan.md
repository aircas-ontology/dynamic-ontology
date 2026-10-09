# 空间内行为创建查看编辑删除弹窗

## 需求理解

按原型改造空间内行为页的创建、查看、编辑、删除界面。本轮仍走本地 Mock，不接后端。不改对象详情行为 Tab，不改状态管理弹窗。

## 修改范围

替换现有简单表单与删除确认；查看改为右侧抽屉。扩展行为类型和 Mock。

## 新增、修改和删除文件

- 改造 `BehaviorFormDialog.vue` 为创建/编辑大表单
- 新增 `BehaviorDetailDrawer.vue`
- 改造 `BehaviorDeleteDialog.vue`：名称校验后才能删除
- 修改 `SpaceBehaviorWorkspace.vue`
- 扩展 `ontologySpaceBehaviorType.ts`、Mock 与测试

## 核心实现方式

查看用 `aircas-drawer`。创建保存为草稿。编辑已发布行为只另存新草稿。删除需输入行为名称确认。基础操作与函数算子、参数绑定使用本地 Mock。

## 新增依赖及必要性

无。

## 验证方式

先补失败测试，再实现；跑行为页测试和 `format:check`。
