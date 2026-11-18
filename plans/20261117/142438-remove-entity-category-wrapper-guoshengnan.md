# 移除实例分类固定根节点

- 需求：移除前端人为添加的最外层全部属性，分类树直接展示接口返回的数据，保留分类点击筛选。
- 授权：用户已确认方案。
- 修改：src/views/EntityBrowsingObjectProfile/components/ObjectProfileEntityDetail.vue；tests/object-profile-entity-detail-view.test.mjs。
- 新增：本 Plan；无删除文件、无依赖变化。
- 实现：categoryTree 直接引用响应式 categories，不生成包装节点。初始未筛选状态保留，点击接口节点仍设置 selectedCategoryId 并筛选该分类及子类。
- 验证：TDD 先验证不生成固定根节点的失败测试，再实现。检查空树、异步数据更新和点击选择；运行相关测试、npm test、test:coverage、type-check、build:verify、明确文件格式和 diff 检查。无 E2E 入口及浏览器控制工具，视觉人工验收待完成。保留其他任务和用户修改，不触碰 public/html。

## 验证结果

- TDD：先新增真实组件脚本回归测试，因空接口分类仍出现固定 all 节点而失败；移除包装后通过。
- 详情页面和控制器相关测试共 21 项通过，新增测试覆盖仅接口节点、异步分类更新、子类和根类点击选择、空数组。
- npm run format:check 指定三文件通过；git diff --check 通过。
- npm run build:verify 通过，写入系统临时目录。
- npm run type-check 失败：仍为此前 14 项非本次文件类型诊断；前置 vue-tsc 失败后 node 配置 tsc 未执行。
- npm test：1133 项，1096 通过、37 失败。34 项为此前已记录基线；另 3 项位于当前工作区并行修改的调度流程：real create form emits converted RULE payload and blocks unsupported operands or repeated submits、schedule parameter panel stays visible while its content follows the selected behavior、schedule malformed saved parameters block confirmation and recover on retry。本次修改仅详情分类包装和对应测试，未改这些流程，未扩大范围修复；不将这 3 项表述为此前已验证基线。
- test:coverage 失败：已加载文件行 93.41%、分支 78.94%、函数 90.21%，分支低于 80%。该报告不是全项目覆盖率，未降低门槛。
- 浏览器验证未执行（无可用工具，无 E2E 入口）；分类视觉、键盘和真实页面人工验收待完成。
- 保留全部用户及其他任务改动，无提交推送。全量验证未通过，不能声称整体完成验收。
