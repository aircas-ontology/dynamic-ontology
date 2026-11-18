# 实例详情关系接口对接

- 需求理解：基于用户提供文档生成接口说明，并将实例详情关系区域从示例切换到真实接口，保留现有关系图。
- 授权：用户已明确确认实施方案。
- 新增：docs/20261117/1.getEntityLinksByPrimaryKeyApi.md、src/types/apis/postOntologyEntityLinksType.ts、tests/object-profile-entity-links.test.mjs。
- 修改：src/apis/ontologyEntityApi.ts 及 index.ts、src/types/index.ts、src/views/EntityBrowsingObjectProfile/composables/useObjectProfileEntityDetail.ts、utils/entityDetailData.ts、components/ObjectProfileEntityDetail.vue，相关已有详情测试。
- 实现：POST /ontology/entity/link，JSON 传对象标识及当前实例原始主键；响应映射保留方向、端点标识及同名不同实例。复用关系图，关系名称/类型用于边标签，不展示后端未提供的基数。保留可选 relations 注入用于现有调用兼容；默认改为真实数据，取消示例数据兜底。
- 状态：独立 loading/ready/empty/error、错误重试、并发去重、实例切换及销毁后拒绝旧响应。
- 文档：完整请求及响应字段、枚举、标准响应、演示样例与契约未约束之处；不将演示样例伪称真实返回。
- 不新增依赖、不修改公共图组件和第三方生命周期、不生成额外 Mock、不触碰 public 和 html，保留前任务未提交修改。
- 验证：先失败测试再最小实现；真实 Vue 控制器、HTTP 边界和图数据映射协作验证。覆盖原始主键、方向、同名、空、错误重试、重复请求、过期及销毁响应。按顺序执行类型规范、类型检查、build:verify，并运行 npm test、test:coverage、项目规范、明确文件格式及 diff 检查。已有全量失败不扩大范围修复。
- 浏览器无现成工具，自动化不能代替最终人工 UI 与后端联调验收。

## 验证记录

- TDD RED：详情测试导入待实现 buildEntityRelationRows 失败；实现并补齐页面边界替身后 GREEN。
- 直接相关测试：object-profile-entity-detail、object-profile-entity-detail-view、object-profile-entity-links 共 21 项通过。覆盖真实请求函数、原始主键、有向端点、同名实例、自环/平行边、缺失字段、请求去重、切换/卸载过期响应、网络及业务失败、重试和页面状态。
- 类型目录验证顺序：check:types-conventions 通过 → type-check 执行但仍有基线 14 项错误（本次文件无新增诊断，后续 node 配置 tsc 因前置失败未执行）→ build:verify 通过，写入系统临时目录。
- npm test：1132 项，1098 通过、34 失败，失败项与此前基线一致。
- test:coverage：已加载文件行 93.41%、分支 78.96%、函数 90.20%；分支低于 80%，检查失败；未降低门槛，未将加载文件覆盖率当作全项目覆盖率。
- check:project-conventions：仍有历史文档失效链接、public 未排除格式化和已有 BehaviorEntityRowDetailDialog 主题变量问题；未扩大范围修复。
- 本任务明确文件列表 format:check 通过；git diff --check 通过。
- 浏览器验证和实际业务联调未执行：当前无浏览器控制工具、无 E2E script；文档读取成功不代表业务接口联调通过，UI/UX 与真实业务数据待人工验收。
- 无依赖变更，无提交/推送；保留前任务及并行工作区修改，包括 public 配置和非本任务行为参数相关修改。
- 交付限制：实现及相关测试已通过，但全量检查受上述已有失败限制，不能声称全仓验证完成。
