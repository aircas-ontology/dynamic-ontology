# 对象浏览上下布局

用户已确认。

## 需求理解

取消Tab，上方属性列表（保留标准应用原数据与列），下方实体列表，各自滚动。属性区域始终显示。实体详情占满页面内容区，返回恢复列表状态；继续URL优先、空或失败回退站内详情。

## 文件范围

修改EntityBrowsingObjectProfile/index.vue、components/ObjectProfileStandardUsage.vue、components/ObjectProfileEntityList.vue，以及entity-browsing-object-profile-entity-list.test.mjs、object-profile-entity-detail-view.test.mjs。新增本Plan，无删除、无新依赖。

## 实现

父页上下布局，实体列表发出详情可见状态，隐藏属性区并扩展实体区。组件保持挂载以保留筛选分页。不新增路由，以现有页面整页详情视图切换。

## 验证

先更新行为测试确认失败，再实施。验证上下区域、详情与返回、对象切换、URL分流；运行test、coverage、type-check、build:verify、明确文件格式检查和diff检查。记录历史失败，浏览器工具不可用时说明缺口。
