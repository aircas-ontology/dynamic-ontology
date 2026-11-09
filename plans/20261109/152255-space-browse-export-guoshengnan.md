# 空间浏览导出与应用展示

## 需求理解

对象空间浏览和主题空间浏览在每条空间的「进入」旁展示「导出」，点击后沿用现有导出弹窗和下载流程。主题空间浏览另增「应用展示」，当前无功能，点击提示暂未接入。两个管理页仍把导出放在「更多」中，不展示「应用展示」。用户已确认。

## 修改范围

- 主题浏览的卡片和表格增加「导出」「应用展示」；导出弹窗在浏览模式可打开，新建、编辑、删除和引导仍仅管理页可用。
- 对象浏览的卡片和表格增加「导出」；导出弹窗在浏览模式可打开，编辑、更多、删除仍隐藏。
- 浏览欢迎区和工具栏说明补充导出。
- 主题表格操作列在浏览模式加宽，卡片操作区允许换行，避免三个按钮溢出。

## 新增、修改和删除文件

修改：

- `src/views/ThemeSpaceManagement/index.vue`
- `src/views/OntologySpaceManagement/index.vue`
- `src/views/OntologySpaceManagement/components/SpaceActions.vue`
- `src/views/OntologySpaceManagement/components/WelcomePanel.vue`
- `src/views/OntologySpaceManagement/components/SectionToolbar.vue`
- `tests/space-browse.test.mjs`

新增本 Plan。不删除文件。

## 核心实现方式

复用已有导出接口、弹窗和 `notifyUnavailable`。主题浏览的导出按钮打开现有导出弹窗；「应用展示」调用 `notifyUnavailable('应用展示')`，提示「应用展示功能暂未接入」。对象浏览的导出按钮继续发出 `export` 动作。管理页操作保持原样。

## 新增依赖及必要性

不新增依赖。

## 验证方式

先更新 `tests/space-browse.test.mjs`，确认浏览页因缺少导出和应用展示而失败，再做最小实现并验证通过。随后执行 `npm test`、`npm run test:coverage`、`npm run type-check`、`npm run build:verify` 和任务文件格式检查。在 `http://127.0.0.1:36000/` 检查两个浏览页的卡片、表格和导出弹窗，以及两个管理页仍只在「更多」中提供导出。
