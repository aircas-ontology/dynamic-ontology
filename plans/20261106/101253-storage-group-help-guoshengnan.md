# 需求理解

在属性编辑新增弹窗和概念构建模块的属性编辑区域，为“存储分组”标签增加帮助按钮，并悬浮提示“支持输入分组名称回车后创建新的存储分组”。保持现有输入、选择和回车创建行为不变。

# 修改范围

- 修改 `src/views/OntologyObjectAttributePanel/components/AttributePropertyFormDialog.vue`。
- 修改 `src/views/OntologyConceptualModelCreate/index.vue`。
- 更新对应页面源码测试，覆盖帮助提示和图标接入。
- 新增实施记录；不修改接口、类型、依赖或受保护目录。

# 核心实现方式

引入 Element Plus `QuestionFilled` 图标，在两个“存储分组”表单标签中使用 `el-tooltip` 包裹帮助按钮，复用同一提示文案，并提供可见焦点和无障碍标签。

# 新增依赖

无，复用现有 Element Plus 图标和 Tooltip 组件。

# 验证方式

执行相关测试、`npm run type-check`、`npm run build:verify`、本次修改文件的格式检查、项目规范检查和 `git diff --check`。
