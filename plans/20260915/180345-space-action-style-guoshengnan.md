# 本体空间操作样式调整（已确认）

修改本体空间管理页视图切换选中色，使其复用名称排序按钮主题色；将编辑按钮纳入 Aircas 公共编辑按钮样式并统一与进入、更多按钮风格；删除页面演示数据说明，保留导出范围提示。

修改 src/styles/element-plus/el-radio.scss、src/styles/element-plus/el-button.scss、src/views/OntologySpaceManagement/components/SectionToolbar.vue、SpaceActions.vue、index.vue 及相关测试。不新增依赖、不修改 html 和 public。

验证 npm test、npm run test:coverage、npm run type-check、npm run build:verify、npm run check:project-conventions 和 git diff --check。
