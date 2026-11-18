# 实例详情 URL 查询与站内回退

## 需求理解

用户已确认：点击详情先查询实例 URL；有非空 URL 时 iframe 展示；请求成功无 URL、非成功状态或请求异常时均打开现有站内详情。

## 修改范围与文件

修改 src/views/EntityBrowsingObjectProfile/components/ObjectProfileEntityList.vue、tests/object-profile-entity-detail-view.test.mjs、tests/entity-browsing-object-profile-entity-list.test.mjs；新增本 Plan，无删除文件。

## 核心实现

复用 getOntologyInstanceUrlListInterface，携带空间、对象、实例 ID。保留列表分页筛选及原始主键；加入查询加载状态、同一实例重复点击保护、返回/对象切换/卸载时失效令牌，防止旧请求覆盖。自动打开同样查询 URL，无 Mock 固定地址分支。无 URL 或请求失败打开站内详情。

## 依赖

无新增依赖。

## 验证

TDD：先更新和增加真实组件行为测试，确认目标行为失败，再最小实现。覆盖有效 URL、空列表/空白 URL、接口失败/异常、重复点击、过期响应、返回、对象切换与卸载及自动打开。执行限定文件格式检查、npm test、test:coverage、type-check、build:verify、git diff --check。记录已有失败；浏览器可用则仅验证本流程，否则说明缺口。暂停的数据源任务及本地 public 配置保持原样。
