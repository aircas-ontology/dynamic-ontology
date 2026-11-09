# 继承树新建对象锁定

## 需求理解

从继承层级树触发新建对象弹窗时，只允许手动创建，其它创建方式不可见；继承对象预填当前树节点且不可修改。对象列表的普通新建不受影响。用户已确认。

## 修改范围

- `OntologyObjectCreateDialog` 在存在 `initialParentId` 且非编辑时锁定为手动创建，并禁用继承对象选择器。
- 更新继承创建相关测试。

## 新增、修改和删除文件

修改：

- `src/views/ObjectWorkspacePanel/components/OntologyObjectCreateDialog.vue`
- `tests/inheritance-create-object.test.mjs`

新增本 Plan。不删除文件。

## 核心实现方式

用 `lockInheritedParent = Boolean(initialParentId) && !editingItem` 控制：锁定时隐藏创建方式卡片并强制 `manual`；继承对象选择器 `disabled` 且去掉 `clearable`。复用已有 `initialParentId`，不新增依赖。

## 新增依赖及必要性

不新增依赖。

## 验证方式

先更新测试并确认失败，再实现并通过。执行 `npm test`、`npm run test:coverage`、`npm run type-check`、`npm run build:verify` 和任务文件格式检查。浏览器核对继承树入口与列表新建入口差异。
