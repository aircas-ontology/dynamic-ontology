# 子空间多对象属性展示修复

## 需求理解

修复子空间创建页选择多个本体对象后，第三步属性表只显示对象分组标题、属性行被压缩隐藏的问题。

## 修改范围

- 修改 `SubspaceCreateWorkspacePanel.vue` 中对象属性分组的局部布局样式。
- 修改 `ontology-subspace-create.test.mjs` 增加防回归断言。
- 保留当前对象卡片样式改动和已有业务数据流，不修改接口、类型或依赖。

## 核心实现方式

属性内容区域继续负责纵向滚动；每个对象属性分组设置 `flex: 0 0 auto`，禁止在多个对象同时展示时被父级 Flex 容器压缩，从而让属性表按内容高度展开。

## 新增依赖

无。

## 验证方式

- 先运行定向测试确认新增断言失败，再实现修复并确认通过。
- `npm run format:check --` 任务文件列表。
- `npm run type-check`。
- `npm run build:verify`。
- `git diff --check`。
