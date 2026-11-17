# 实体属性分组键值对展示（已确认）

- 需求理解：实体属性取消表格，按存储分组组织键值对，同组多条记录独立展示。
- 修改范围：实体详情组件、属性映射工具、属性页面类型及现有详情测试；保留分类筛选、错误回退和重试。
- 文件变更：新增本计划；修改 ObjectProfileEntityDetail.vue、entityDetailData.ts、entityBrowsingObjectProfileType.ts、object-profile-entity-detail.test.mjs、object-profile-entity-detail-view.test.mjs；不删除文件。
- 核心实现：保留原始记录身份，先按存储组、再按记录组合属性，使用分组标题、记录卡片和语义化键值对；重复属性及缺失主键的不同记录不混合；长文本换行，局部滚动，复用暗亮主题变量。
- 依赖：无新增依赖。
- 验证：先补充分组及真实模板渲染测试并验证失败，再实现；检查分类过滤、多记录、重复属性、空值、0、false、错误回退。执行 npm test、test:coverage、check:types-conventions、type-check、build:verify、明确文件格式检查和 git diff --check。浏览器工具不可用时记录暗亮主题及视觉验收缺口；已有无关检查失败单独报告。
