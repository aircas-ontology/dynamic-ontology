# 子空间创建右侧三块高度

## 需求理解

按用户截图调整右侧工作区：顶部块 61.33px，选择栏 47.33px，第一步区域 flex 铺满剩余高度。不改文案、不改左侧树、不改公共样式。

## 修改范围

- 修改 `SubspaceCreateWorkspacePanel.vue` 布局与局部样式。
- 更新 `tests/ontology-subspace-create.test.mjs` 高度与铺满断言。

## 核心实现

- 去掉中间 `__content` 滚动包裹，四块改为工作区直接纵向 flex。
- `__header` 固定 61.33px；表单紧凑不占剩余；`__steps` 固定 47.33px 并用横向圆点步骤匹配截图。
- `__empty` `flex: 1; min-height: 0`，空状态充满第一步卡片。

## 新增依赖

无。

## 验证

- TDD：先失败再实现。
- `node --test tests/ontology-subspace-create.test.mjs`
- `npm run format:check --` 任务文件
- `npm run type-check`、`npm run build:verify`
