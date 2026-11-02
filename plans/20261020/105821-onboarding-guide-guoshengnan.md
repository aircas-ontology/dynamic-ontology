# 新手引导遮罩层实施方案

## 需求理解

新增四步新手引导：创建空间、进入空间并创建对象、创建属性、创建关系。引导以内容区右上角帮助图标打开的遮罩层展示；说明卡片仅显示当前步骤名称，不显示步骤序号。真实数据和真实页面元素优先，页面空状态时使用只读 Mock 目标展示操作位置。引导中的示例操作不提交数据、不调用业务写接口、不修改业务状态。嵌入式访问直接视为没有创建对象空间权限，隐藏创建空间步骤；无可访问空间时显示权限提示。

## 修改范围

- 新增公共引导遮罩组件、步骤配置和引导 composable。
- 在对象空间管理页和空间内管理页内容区提供帮助入口。
- 在对象详情页提供帮助入口并支持属性步骤定位。
- 为真实目标和空状态 Mock 目标增加引导定位标识。
- 嵌入式模式过滤创建空间步骤并处理无空间状态。

## 文件

- 新增 `src/components/OnboardingGuide/OnboardingGuideOverlay.vue`
- 新增 `src/components/OnboardingGuide/onboardingGuideSteps.ts`
- 新增 `src/components/OnboardingGuide/useOnboardingGuide.ts`
- 修改 `src/components/register.ts`
- 修改 `src/views/OntologySpaceManagement/index.vue`
- 修改 `src/views/OntologySpaceManagementDetail/index.vue`
- 修改 `src/views/OntologyObjectDetail/index.vue`

## 核心实现方式

引导组件接收当前步骤、步骤列表和嵌入式状态。每步先查询真实目标元素；找不到时渲染只读 Mock 高亮区域或仅显示说明。遮罩层仅负责导航步骤和说明，不触发业务按钮事件。步骤状态不因点击 Mock 目标改变，只根据真实业务数据后续重新打开时重新计算。

## 依赖

不新增依赖，复用 Vue、Vue Router、Element Plus 和现有主题令牌。

## 验证方式

执行任务范围内的格式检查、项目规范检查、类型检查和 build:verify；检查普通/嵌入式、真实数据/空状态、键盘焦点和遮罩溢出。
