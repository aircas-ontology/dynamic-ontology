# 完善函数算子新手引导

## 需求理解

现有引导覆盖空间/对象/关系/属性/数据源关联，无函数算子创建链路。按相同交互风格增加「新建函数算子」，覆盖当前对用户开放的脚本函数、外部 API、容器算子三类创建步骤。

默认决策：

- 大步骤插在「新建关系」之后、「新建属性」之前。
- 类型范围仅 `FUNCTION_OPERATOR_PUBLIC_TYPE_OPTIONS` 当前开放三项：`code` / `api` / `docker`。
- 主题引导通过现有 `THEME_ONBOARDING_GUIDE_STEPS` 对 `space-manage` 步骤的复用自动带上。

## 修改范围

- `src/views/onboardingGuideSteps.ts`
- `src/views/FunctionOperatorPanel/index.vue`
- `src/views/FunctionOperatorPanel/components/FunctionOperatorFormDialog.vue`
- `src/views/FunctionOperatorPanel/components/FunctionOperatorScriptIdeDialog.vue`
- `tests/onboarding-guide.test.mjs`

## 新增、修改和删除文件

- 修改：上述源码与测试文件
- 新增：本 Plan 文件
- 删除：无

## 核心实现方式

1. 在 `relation-create-confirm` 与 `object-menu-back` 之间插入单链「新建函数算子」步骤。
2. 为函数列表「新建函数」、类型卡片、通用配置区、页脚按钮、脚本 IDE 增加 `data-onboarding` 锚点。
3. 更新 `onboarding-guide` 测试中的链名、步骤与锚点断言。

## 新增依赖及必要性

无。

## 验证方式

- `npm test`（`tests/onboarding-guide.test.mjs`）
- `npm run format:check -- <任务文件列表>`
- `npm run type-check`
- `npm run build:verify`
