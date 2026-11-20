# 行为树成功条件改为表达式

- 需求理解：ACTION 执行成功条件由 outputKey/op/value 改为 `{ expression }`；UI 单输入框；空表达式表示不配。
- 修改范围：类型、绑定/序列化/校验、节点检查器、readme、相关测试；新增本 Plan。
- 新增 / 修改 / 删除文件：修改上述文件；新增本 Plan；不删除文件。
- 核心实现：草稿与序列化仅保留 expression；旧格式读取视为未配置；校验不再检查出参与运算符。
- 新增依赖：无。
- 验证方式：TDD 后 behavior-tree-orchestration 相关测试与 format:check。
