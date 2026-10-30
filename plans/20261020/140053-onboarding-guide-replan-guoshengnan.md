# 六步流程式新手引导重新规划

- 日期时间：2026-10-20 14:00:53（Asia/Shanghai）
- 用户：guoshengnan
- 状态：已确认（用户确认：1 方案 OK；2 步骤按建议归组；3 弹窗元素补 data-onboarding 属性）

## 一、需求理解

将现有四步新手引导重新规划为六步流程式引导：

- 六步链：新建对象空间 → 新建对象 → 新建关系 → 新建属性 → 属性关联数据源 → 自动关联数据源
- 每步按真实操作链路拆分为多个小步，逐元素高亮（含弹窗内必填项、确定按钮、tab 等）
- 跨页面步骤真实跳转续接（流程式引导），引导状态经 sessionStorage 传递
- 引导只指示位置不代替点击，用户真实操作弹窗并真实提交数据
- 找不到目标元素时（如弹窗未打开）Mock 兜底展示，提示先完成上一步操作

用户确认的关键决策：

1. 跨页衔接：流程式引导（推荐方案）
2. 弹窗引导深度：逐元素高亮（推荐方案）
3. 元素定位：为弹窗内关键元素补 `data-onboarding` 属性

## 二、修改范围

### 新增

- `src/views/onboardingGuideSteps.ts`：六步链统一步骤配置（title/description/hints/targetSelector/mockLabel/route/页面归属）
- `src/composables/useOnboardingGuide.ts`：引导步骤管理 composable（当前步骤、sessionStorage 跨页续接、嵌入模式过滤步骤1）

### 修改

- `src/components/OnboardingGuide/OnboardingGuideOverlay.vue`：
  - 步骤支持 `route` 字段，跨页"下一步"触发真实路由跳转
  - Mock 兜底提示文案调整（"请先完成上一步操作"）
- 三个页面 `index.vue` 接线（替换内联 steps 为统一配置 + composable）：
  - `src/views/OntologySpaceManagement/index.vue`（帮助入口从步骤1开始）
  - `src/views/OntologySpaceManagementDetail/index.vue`（从步骤2开始）
  - `src/views/OntologyObjectDetail/index.vue`（从步骤4开始）
- 各弹窗组件补 `data-onboarding` 属性（约 8 个文件）：
  - 新建对象空间弹窗 SpaceFormDialog（手动创建区、导入创建区、下载模板、选择文件、确定）
  - 对象工作区弹窗（概念层级树新建、新建子分类、新建对象弹窗）
  - 关系工作区（新建关系分类树、添加关系分类、添加关系）
  - 属性面板（新建属性分类树、创建分类、添加属性）
  - 数据源关联弹窗 DataSourceAssociateDialog（选择数据源、关联数据源、字段两列区、关联按钮、拖拽区、提交、自动关联）

### 步骤清单（39 小步，按已确认归组）

1. 步骤1 新建对象空间（空间列表页，6 小步）：新建按钮 → 弹窗手动创建必填 → 确定 → 导入创建 tab → 下载模板+选择文件 → 导入确定
2. 步骤2 新建对象（跨页，10 小步）：列表进入按钮 → 对象菜单 → 新建概念层级树节点 → 子分类弹窗确认 → 新建对象按钮 → 对象弹窗必填标识 → 确认创建 → 导入创建 → 下载模板+上传文件 → 导入确认创建
3. 步骤3 新建关系（空间管理页，6 小步）：关系菜单 → 新建关系分类树 → 分类弹窗确认 → 添加关系按钮 → 关系弹窗必填 → 确认
4. 步骤4 新建属性（跨页，8 小步）：对象菜单 → 对象详情按钮 → 属性菜单 → 新建属性分类树 → 分类弹窗确认 → 属性添加按钮 → 属性弹窗必填 → 保存
5. 步骤5 属性关联数据源（对象详情页，7 小步）：关联数据源按钮 → 选择数据源 → 关联数据源 → 字段两列区 → 关联按钮 → 拖拽连线区 → 提交
6. 步骤6 自动关联数据源（对象详情页，2 小步）：关联数据源按钮 → 自动关联数据源按钮

页面帮助入口起点：空间列表页=步骤1、空间管理页=步骤2、对象详情页=步骤4。

### 嵌入模式

沿用现有行为：无创建空间权限时过滤步骤1（步骤2 起步）。

## 三、核心实现方式

1. `OnboardingGuideStep` 增加可选 `route`（目标元素所在路由）与 `chain`（所属大步骤标识）；组件"下一步"时若下一小步 route 与当前路由不同则 `router.push`，引导状态写 sessionStorage，新页面挂载时 composable 检测续接
2. 元素定位优先级：`[data-onboarding="<id>"]` 专属标识 → 现有语义 class → Mock 兜底
3. 引导操作（跳过/完成/ESC）清空 sessionStorage；步骤切换更新 sessionStorage
4. 测试 TDD：重写 `tests/onboarding-guide.test.mjs`（统一配置、composable 续接、组件 route 跳转、三页面接线、data-onboarding 属性）

## 四、新增依赖

无。

## 五、验证方式

- `npm test`（全部通过或仅既有基线失败）
- `npm run format:check -- <改动文件>`
- `npm run type-check`（无引导相关新增错误）
- `npm run build:verify`
- 浏览器冒烟：跨页续接、弹窗逐元素高亮、Mock 兜底、嵌入模式过滤；最终人工验收

## 六、原则说明

- 引导不代替点击、不自动提交；用户真实打开弹窗与提交数据（与原"不会提交数据"原则不同，为逐元素高亮方案的既定取舍）
- 原"无可访问空间显示权限提示"暂不实现，沿用 Mock 兜底
