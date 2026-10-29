# 问题 1、3、6、7 修复方案

用户已于 2026-10-09 确认。

## 需求理解

修复类型与构建阻断、关系图初始化失败、测试与实现漂移、规范与文档问题。问题 6 以当前实现为准更新注释和测试，保留 100 秒超时、现有接口路径及展示效果。

## 修改范围

- 安装 package-lock.json 已声明的 @antv/x6，修复 ApplicationManagement 接口文档组件类型报错。
- 关系图增加 initializing / ready / error、失败提示、重试和部分初始化资源清理，防止重复初始化、过期更新和卸载后回写。
- 同步 ontologyObjectManageApi.ts 接口注释及九项失败测试。
- 修复 .prettierignore、.agents/README.md、docs/readme.md、plans/PLAN.md 链接，以及 FunctionOperatorPanel.vue 未定义主题变量。

## 文件

修改：ApiDocsEndpointDetail.vue、ApiDocsEndpointList.vue、RelationGraphView.vue、useRelationGraph3d.ts、ontologyObjectManageApi.ts、FunctionOperatorPanel.vue、直接对应 tests/*.test.mjs、.prettierignore、.agents/README.md、docs/readme.md、plans/PLAN.md。
新增：本 Plan、页面私有关系图生命周期模块（需要时）、关系图生命周期行为测试。
删除：无。

## 核心实现

使用现有 Vue、Three.js、Element Plus 和主题变量。生命周期资源按所有者统一清理，初始化和更新错误向用户展示。测试以当前行为为准，避免文案或格式的脆弱匹配。新增或修改具名函数补齐 JSDoc。

## 依赖

无新增依赖；仅恢复锁文件中已存在依赖。如安装必须改变依赖版本或锁文件，停止并重新确认。

## 验证

关系图初始化失败、重试、重复调用、卸载及过期响应采用 TDD，先运行失败测试再实施。运行 npm test、npm run test:coverage、npm run type-check、npm run build:verify、npm run check:project-conventions、任务文件 format:check、git diff --check。覆盖率以当前测试已加载文件统计，不降低阈值；已有范围外缺口单独报告。浏览器仅验证接口文档与关系图，人工验收单独注明。

## 边界

不使用 Subagent，不读取或修改 html/，不修改 public/，保留用户已有 domainConfig.js 修改。不处理问题 2 和 4。

## 实施与验证记录

- 恢复 @antv/x6@3.1.7，package.json 和 package-lock.json 未改动。安装进程等待时间过长，在目标依赖已安装且类型、构建验证通过后停止，未遗留后台安装任务。
- 关系图生命周期的四项目标行为测试先失败，再通过；追加资源初始化失败和幂等清理测试。
- npm test：390 / 390 通过。
- type-check、build:verify、项目规范、类型目录规范、任务文件格式检查通过。
- test:coverage：已加载文件行覆盖率 87.67%、函数 80.24%、分支 75.47%，分支阈值仍失败（原始 74.85%）。既有范围外覆盖率缺口未通过降低门槛或排除文件规避。
- 浏览器验证未完成：当前 CUA 无可用浏览器，Playwright 未安装；未据此宣称视觉和真实 WebGL 运行通过。人工验收待执行。
- 未修改用户已有 public/configs/domainConfig.js，未读取或写入 html/。
