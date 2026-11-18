# 实体共用标题和返回

用户已确认。

## 需求

实体名称移动到顶部对象名称同一行；移除URL与站内详情内部标题和返回实体列表按钮。顶部返回在详情时关闭详情，在列表时返回对象浏览列表。保留分页筛选和URL回退。

## 范围

修改EntityBrowsingObjectProfile/index.vue、components/ObjectProfileEntityList.vue、components/ObjectProfileEntityDetail.vue及tests/entity-browsing-object-profile-entity-list.test.mjs、tests/object-profile-entity-detail-view.test.mjs。新增本Plan，不删除文件，不新增依赖。

## 实现

列表向父页同步实体名称；公开关闭详情动作供顶部返回调用。父页显示名称并按详情状态分流返回。

## 验证

TDD验证标题同步、清理及顶部返回两种状态；运行相关测试、全量测试和coverage、type-check、build:verify、限定格式与diff检查。保留无关修改并记录已有失败。浏览器不可用时报告人工验收缺口。
