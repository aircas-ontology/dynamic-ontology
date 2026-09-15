# 首页纯色双主题调整（已确认）

## 需求
参考用户两张截图调整本体空间管理首页。顶部标题名称保持“空天 · 灵枢”。全部当前页面渐变改为纯色，优先使用Aircas公共组件样式，兼容暗亮主题。

## 范围
修改src/layout/index.vue及HeaderBar、NavigationMenu样式；修改OntologySpaceManagement页面及WelcomePanel、StatCard、SectionToolbar、SpaceTable、SpaceActions；公共el-table.scss增加可选aircas-table--flat修饰类；默认分页10条及相关测试。保持现有菜单、Mock真实统计、业务行为和未接入功能提示，不新增依赖或业务页面。

## 实现
调整顶栏56px、侧栏224px、卡片比例、工具栏同排、表格行距/头像/按钮层级、分页左右布局；颜色复用双主题变量，不修改已有主题色定义。公共表格纯色修饰只影响使用者，不改变其他表格。

## 验证
分页测试先失败后通过；npm test、test:coverage、type-check、build:verify、check:project-conventions；浏览器检查双主题、无渐变、桌面/窄屏、视图切换与分页；检查diff及工作区。
