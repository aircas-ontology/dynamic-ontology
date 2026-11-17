# 对象画像实体详情页（已确认）

## 需求理解

将对象画像实体列表的详情入口改为站内详情；上方为属性分类树、实体属性值、实体关系二维图三列，下方展示所属对象的行为卡片。返回保留列表分页筛选。用户已确认提取对象关系二维图作为共享组件。

## 修改范围与文件

- 修改 EntityBrowsingObjectProfile/components/ObjectProfileEntityList.vue，新增同页面实体详情、分类/属性和行为卡片组件、composable、映射工具及页面类型。
- 新增 components/OntologyRelationGraph2d.vue 及内部图形工具；将 SpaceRelationWorkspace 的二维图实现提取到共享组件，原入口保留转发，避免跨页面私有引用；更新 components/register.ts。
- 修改 types/pages/entityBrowsingObjectProfileType.ts 与 types/index.ts，新增测试并更新旧详情入口和二维图迁移测试。
- 不修改 public、html，不新增依赖，不新增路由，不删除现有业务能力。

## 核心实现

- 使用已有属性分类树、实体 row_detail 与按 ontologyId 过滤的行为分页接口；分类筛选包含子类，保留 false/0、多行分组和空值语义。
- 实体查询主键使用选中行主键；对象/实体/空间切换使旧请求失效；每个区域独立处理加载、成功、空、错误和重试，重复请求受控。
- 实体全部关系接口未提供，继续向用户收集；不将对象类关系伪装成实体关系。先完成共享二维图和独立关系展示边界，接口未补齐前显示无关联数据。
- 布局复用 Aircas 主题与空间浏览行为卡片视觉，窄屏允许调整列布局和滚动，图实例主题刷新、resize 与卸载清理。

## 验证方式

先增加数据映射、分类筛选、请求协作、过期响应、错误重试、分页及详情返回的行为测试，运行确认失败后实现；测试入口 tests/*.test.mjs。执行 npm test、test:coverage、类型规范、type-check、build:verify、项目规范、明确文件列表格式检查和 git diff --check。记录已有失败。浏览器工具不可用时明确视觉验收缺口。
