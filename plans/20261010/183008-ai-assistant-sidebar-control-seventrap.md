# AI 助手侧栏控制按钮

## 需求理解

将 AI 抽屉控制按钮移到左侧导航栏，始终水平居中，垂直方向保持靠下方，沿用原按钮距离底部 24px 的间距。按钮为 30 × 30px，图标为 25 × 25px，使用 Element Plus 默认按钮外观。按钮始终显示，点击切换抽屉开关。

用户已于 2026-10-10 确认实施方案。

实施期间用户明确修正定位要求为“只是左右居中，仍然在靠下方的位置”，定位按该最新指令调整。

## 修改范围与文件

- 修改 `src/layout/components/AiAssistantDrawer.vue`：改为 `el-button`，切换抽屉显隐和可访问名称，调整定位和尺寸，移除自定义按钮外观。
- 修改 `src/layout/components/NavigationMenu.vue`：挂载 AI 助手组件，侧栏提供定位容器。
- 修改 `src/layout/index.vue`：移除原有挂载位置。
- 修改 `tests/layout-navigation.test.mjs`：更新布局约束，增加按钮反复开关及抽屉关闭同步的行为测试。
- 新增本 Plan 文件；不删除文件，不改动已有无关样式修改及受保护目录。

## 核心实现方式

控制按钮在侧栏内部绝对定位，使用 `left: 50%`、`bottom: 24px` 和水平居中平移，随侧栏 60px / 200px 宽度变化保持左右居中。默认按钮边框、背景和交互状态由 Element Plus 提供，局部仅控制尺寸、内边距和布局。保留现有 SVG 图标和抽屉内容。

抽屉使用官方 `modal-penetrable` 属性，避免非模态抽屉的透明容器拦截按钮点击，实现按钮始终可操作的已确认要求。

## 依赖

无新增依赖。复用 Element Plus、Vue、已有编译器和测试入口。

## 验证方式

- TDD：先更新测试并确认目标行为未实现导致失败，再实施并验证通过。
- 执行 `npm test`、`npm run test:coverage`，覆盖率以实际加载文件为统计范围，行、函数和分支不低于 80%。
- 执行 `npm run type-check`、`npm run build:verify`，构建产物仅写入系统临时目录。
- 执行 `npm run check:project-conventions`、仅涉及本次文件的格式化和格式检查。
- 浏览器冒烟检查暗亮主题、侧栏展开和收起、1920 × 1080、更高桌面分辨率及窄容器的居中与尺寸，检查按钮点击、键盘焦点、抽屉关闭和 Console Error。
- 当前无 Lint / E2E script，记录入口缺口；浏览器冒烟不等同于人工验收。
- 交付前检查任务 diff、`git diff --check` 和 `git status --short`。
