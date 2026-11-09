# 浏览页去掉导出并调整对象与实体列表交互

## 需求理解

对象/主题空间浏览不显示导出；空间内对象列表浏览态不显示详情按钮，点击卡片或表格行进入详情；实体列表不展示 ontologyName、primaryKey、displayName；筛选字段下拉支持输入过滤。

## 修改范围

- SpaceActions、WelcomePanel、SectionToolbar、ThemeSpaceManagement
- OntologyObjectList
- mapObjectProfileEntityRows、ObjectProfileEntityList
- tests/space-browse.test.mjs、tests/entity-browsing-object-profile-entity-list.test.mjs

## 新增、修改和删除文件

修改上述文件；新增本 Plan；无删除；无新依赖。

## 核心实现方式

1. 浏览态去掉导出按钮，文案不再提导出；管理态导出保留。
2. browseOnly 时隐藏对象详情按钮与操作列，卡片/行点击触发 view。
3. 实体列收集排除 ontologyName、primaryKey、displayName。
4. 筛选字段 el-select 增加 filterable。

## 新增依赖及必要性

无。

## 验证方式

相关单测与 format:check。
