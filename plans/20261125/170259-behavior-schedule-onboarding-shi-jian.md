# 完善行为与行为调度新手引导

## 需求理解

在已有对象/关系/函数算子引导风格上，补充「新建行为」「新建行为调度」两条大步骤；覆盖行为三类（基础/应用/行为树）与调度两种策略（规则/周期）。

默认决策：

- 插入位置：`function-docker-save` 之后、`object-menu-back` 之前。
- 行为树编排与规则流画布只引导到打开按钮。
- 主题引导复用 `space-manage` 步骤。

## 修改范围

- `src/views/onboardingGuideSteps.ts`
- 行为分类/列表/分类弹窗/行为表单
- 调度列表与新建调度表单
- `tests/onboarding-guide.test.mjs`

## 新增、修改和删除文件

- 修改：上述源码与测试
- 新增：本 Plan
- 删除：无

## 核心实现方式

1. 插入 `CHAIN_CREATE_BEHAVIOR` 与 `CHAIN_CREATE_BEHAVIOR_SCHEDULE` 步骤链。
2. 行为类别改用可点击的 radio（或 option 锚点）以便 `enterClickSelector` 切换三类。
3. 分类树悬停操作按钮在引导高亮时保持可见。
4. 调度策略 radio、周期区、确认/取消补齐 `data-onboarding`。

## 新增依赖及必要性

无。

## 验证方式

- `npm test`（`tests/onboarding-guide.test.mjs`）
- `npm run format:check -- <任务文件列表>`
- `npm run type-check`
- `npm run build:verify`
