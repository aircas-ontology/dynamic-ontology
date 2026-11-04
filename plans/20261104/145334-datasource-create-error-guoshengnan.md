# 数据源创建失败提示

- 需求理解：数据源创建对象接口失败时，页面应弹出明确失败提示；优先使用后端原因，无原因时提供重试文案。
- 修改范围：仅数据源创建对象操作的失败处理与对应行为测试，保留工作区已有修改。
- 新增文件：本计划、`tests/datasource-create-error.test.mjs`；修改 `src/views/ObjectWorkspacePanel/composables/useObjectWorkspaceObjectActions.ts`；无删除文件。
- 核心实现：在已有错误状态记录后调用 Element Plus 错误提示，覆盖业务错误响应和网络异常，保留成功流程及重复提交控制。
- 新增依赖：无。
- 验证方式：先编写失败场景测试并确认失败，再实施最小修复；测试业务失败、异常、空原因、成功和重复提交，执行全量测试、覆盖率、类型检查、build:verify、限定文件格式及 diff 检查。无可用浏览器工具时记录未验证视觉效果。
- 用户已确认方案。
