# 需求理解

对象空间管理的行为创建弹框需要根据当前空间查询基础函数算子，并将查询结果显示在“关联基础函数算子”下拉框中。

# 修改范围

- 复用现有 `getOntologyFunctionListInterface` 查询接口，按空间 ID、基础查询类型和已发布状态查询。
- 修改行为创建弹框的算子数据来源、加载状态、空状态和错误反馈。
- 从父页面向弹框传递当前空间 ID。
- 不修改 `public/`、`html/` 或用户已有无关改动。

# 新增、修改和删除文件

- 修改 `src/views/SpaceBehaviorWorkspace/components/BehaviorFormDialog.vue`。
- 修改 `src/views/SpaceBehaviorWorkspace/index.vue`。
- 新增本计划文件。

# 核心实现方式

弹框打开且处于创建模式时，以当前空间 ID调用已有函数算子列表接口，使用返回记录构造下拉选项；请求采用递增 token 防止过期响应覆盖新空间或新弹框状态。查询期间下拉禁用并显示加载状态，空数据和失败显示明确提示。保留现有选择算子后加载参数的本地行为。

# 新增依赖及必要性

无。

# 验证方式

执行相关文件格式检查、类型检查、项目规范检查、测试和 `build:verify`；复核 `git diff --check` 与工作区范围。
