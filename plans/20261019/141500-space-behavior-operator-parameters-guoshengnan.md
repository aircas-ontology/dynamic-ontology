# 需求理解

行为新建弹窗选择函数算子后，需要同步显示该算子的入参和出参数据。

# 修改范围

- 复用现有函数详情接口，根据选中的 `functionApi` 和 `version` 查询参数详情。
- 修改行为表单参数展示，将详情中的 `INPUT` 和 `OUTPUT` 参数映射到现有入参、出参表格。
- 增加参数查询加载、错误和过期响应处理。

# 新增、修改和删除文件

- 修改 `src/views/SpaceBehaviorWorkspace/components/BehaviorFormDialog.vue`。
- 新增本计划文件。

# 核心实现方式

选择算子后调用 `getOntologyFunctionDetailInterface`，按参数 `category` 分为输入和输出，映射参数名称、类型、必填状态和描述；查询期间显示加载提示，失败时清空参数并提示错误，切换算子或清空选择时取消旧请求结果的影响。

# 新增依赖及必要性

无。

# 验证方式

执行格式检查、类型检查、生产构建验证和 `git diff --check`；记录仓库已有类型错误及测试失败。
