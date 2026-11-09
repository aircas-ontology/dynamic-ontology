# 浏览态点击空间卡片或行进入

## 需求理解

对象空间浏览、主题空间浏览的空间列表不再显示「进入」。浏览态点击卡片或表格行进入空间内页面。管理态仍保留「进入」。主题浏览保留「应用展示」，点击该按钮不进入空间。

## 修改范围

- SpaceActions、SpaceCardGrid、SpaceTableView
- ThemeSpaceManagement
- tests/space-browse.test.mjs

## 新增、修改和删除文件

修改上述文件；新增本 Plan。无删除，无新依赖。

## 核心实现方式

浏览态不渲染「进入」。对象空间卡片和行发出既有 `enter`；主题卡片和行调用 `enterThemeSpace`。点击内部按钮时不进入。浏览态对象空间表格去掉空操作列。

## 新增依赖及必要性

无。

## 验证方式

`tests/space-browse.test.mjs` 与任务文件 `format:check`。
