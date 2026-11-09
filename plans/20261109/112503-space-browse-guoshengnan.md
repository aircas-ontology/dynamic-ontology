# 空间浏览入口

## 需求理解

新增对象空间浏览与主题空间浏览菜单，复用现有首页，仅保留已有进入按钮，暂时进入现有空间内管理页。用户已确认。

## 修改范围和文件

修改 src/router/modules/workspaceRoutes.ts、src/layout/components/NavigationMenu.vue、两个空间管理首页及对象空间管理的 SpaceCollection、SpaceCardGrid、SpaceTableView、SpaceActions、WelcomePanel、SectionToolbar 组件。新增 tests/space-browse.test.mjs 和本 Plan；不删除文件。

## 核心实现

独立浏览路由通过 props 传递 browseOnly，复用首页，隐藏新建、编辑、更多、弹窗和引导；保留统计、搜索、排序、分页和卡片／表格。管理模式默认不变，进入目标不变。不提取公共组件，不调整已有跨页面引用。

## 依赖

不新增依赖。

## 验证

先测试路由解析、共享组件渲染的浏览与管理操作差异并确认失败，再实现。运行 npm test、npm run test:coverage、npm run type-check、npm run build:verify、任务文件格式检查、git diff --check。尝试浏览器检查新增入口、两种视图、主题和进入跳转；不可用时如实记录。

## 实施和验证记录

- 实际新增 6 项路由解析与真实 Vue 模板渲染测试；初始 3 项测试因未实现而失败，实施后 6 项全部通过。同步更新 tests/onboarding-guide.test.mjs、tests/ontology-space-management.test.mjs 中受浏览模式影响的两个既有断言。
- npm test：847 项，818 通过、29 失败。对 HEAD 原始源码执行只读对照测试为 841 项，812 通过、同名 29 项失败；本次未增加失败。既有失败涉及 AI 助手、导出、页面结构旧断言、图标上传等。
- npm run test:coverage：29 项既有失败，统计范围为本次测试进程加载的文件；行 92.58%、分支 77.21%、函数 89.71%，分支低于 80%，未通过，不代表全项目源码覆盖率。未调整门槛或排除文件。
- npm run type-check：未通过，11 条错误；HEAD 原始源码对照复现同样错误，涉及 agentChatApi.ts 的 AGENT_URL 可空、ApplicationManagement 的类型和 aria 属性、ConceptHierarchyTree 的 aria 属性、两个行为表单的事件类型，以及 ThemeSpaceManagement 原有 Box 未导入和导出类型。未修改这些既有问题。
- npm run build:verify、任务文件 format:check 和 git diff --check 通过，构建输出仅位于系统临时目录。
- 浏览器验证未执行：当前会话未提供 Browser Skill 所需的浏览器控制工具；卡片／表格仅完成模板渲染测试，暗亮主题、焦点、溢出、真实点击和 Console 尚未验证。项目无 E2E 入口。人工验收未完成。
- 无新增依赖，无受保护目录变更。原始源码对照使用临时只读映射，未还原或覆盖工作区文件。
