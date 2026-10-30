# ARIA 回归测试方案

用户已于 2026-10-09 确认。

## 需求理解

将类似 aria-label 的验证纳入 npm test，阻止标准 ARIA 属性改为驼峰，并验证实际组件渲染的原生元素属性和相关状态。

## 修改范围与文件

- 新增 tests/application-aria.test.mjs，现有 tests/*.test.mjs 入口自动发现。
- 修改 src/views/ApplicationManagement/components/ApiDocsEndpointList.vue，恢复标准 ARIA 属性。若组件声明造成类型误报，使用局部兼容方式，不关闭检查、不使用 any。
- 新增本 Plan 文件。无删除文件。
- 保留前序任务和用户现有改动，不修复无关问题。

## 核心实现

使用已安装的 Vue SFC 编译器、Vue SSR、真实 Element Plus 和现有 TypeScript 转译能力，执行真实组件模板与业务逻辑。模板层检查标准 aria-label、aria-hidden、aria-expanded、aria-controls、aria-current 写法，不误判脚本中的 ariaLabel Prop。渲染层验证标签落在原生输入框，装饰图标隐藏，展开按钮与控制区域关联；通过真实处理函数验证收起、展开及选中状态。

## 依赖

无新增依赖，不改 package.json 和锁文件。

## 验证

先运行测试确认当前驼峰写法失败，再完成最小组件修改。运行 npm test、npm run test:coverage、npm run type-check、npm run build:verify、npm run check:project-conventions、明确文件列表的 format:check 和 git diff --check。已存在的覆盖率不足单独报告，保持阈值。SSR 验证不等同于浏览器、键盘或屏幕阅读器验收。

## 实施与验证记录

- 新增 7 项回归测试，覆盖模板属性命名、错误写法检出、真实原生输入框标签、控制区域关联、装饰图标隐藏、实际模板点击后的展开状态，以及选中属性与事件。允许后续增加其他标准命名的 ARIA 属性，不误判脚本标识符。
- RED：初始 6 项测试中，5 项渲染/状态/检查器测试通过，模板属性命名检查因当前 ariaLabel 失败。
- GREEN：恢复标准键名后所有测试通过。直接 aria-label 写法触发当前组件声明的 TS2353，使用局部 v-bind 对象传递标准键名；没有修改依赖、添加类型断言或关闭检查。
- npm test：397 / 397 通过；type-check、build:verify、项目规范、明确文件列表格式检查、git diff --check 通过。
- test:coverage：行 87.67%、函数 80.24%、分支 75.47%。分支门槛仍失败，与本次前基线一致；未降低阈值。动态编译的 Vue 模板行为测试不代表报告已统计原 Vue 源码覆盖率。
- 验证使用 SSR HTML 和真实模板 VNode 事件处理函数，未执行浏览器、键盘或屏幕阅读器验证，人工验收待执行。
- 本次仅修改接口列表组件、新增测试及本 Plan；保留此前和用户已有的其他修改。

## 用户明确调整：直接属性写法

用户要求使用 aria-label="按接口地址搜索"，禁止通过局部 v-bind 传递。按该明确要求恢复搜索框与菜单筛选的直接 aria-label 属性，并新增直接属性回归检查。原实施记录中的 v-bind 方式不再是最终实现。不扩大到全局类型配置、不关闭检查；如现有组件类型声明报错则如实记录。直接属性检查先因 v-bind 实现失败（8 项中 1 项失败），再修改组件。

直接属性版本验证：npm test 398 / 398 通过；build:verify、项目规范、任务文件格式和 diff 检查通过。type-check 在接口列表组件第 10、21 行出现 TS2353，当前组件声明未接受直接 aria-label 属性，此问题未通过替代模板语法或关闭检查处理。覆盖率保持行 87.67%、函数 80.24%、分支 75.47%，分支门槛仍失败。
