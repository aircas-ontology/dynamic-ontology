# 脚本 IDE 保存前解析与创建后留存

## 需求理解

去掉脚本 Web-IDE「解析」按钮。点保存时先调解析接口，成功后再创建或更新。创建成功后不关弹框，置灰上一步通用配置；同会话再改代码点保存则先解析再 PUT。

## 修改范围

- `FunctionOperatorScriptIdeDialog.vue`：去掉解析按钮；保存异步先解析再提交。
- `useFunctionOperatorWorkspace.saveScriptOperator`：创建成功保留表单与 IDE，写入 `editingOperator`/`formDraft`；列表编辑后的关闭行为不变。
- 表单在创建成功后因 `operator` 有值而置灰通用配置。
- 更新相关测试。

## 新增、修改和删除文件

- 修改上述 Vue/TS 与测试文件
- 新增本 Plan
- 不新增业务源码文件

## 核心实现方式

保存前复用现有解析接口与 `splitParsedScriptParameters`。创建成功后用请求参数组装草稿与 `editingOperator`，`formVisible` 保持 true。后续保存因 `editingOperator` 走 PUT。

## 新增依赖及必要性

无。

## 验证方式

先改测试确认失败，再实现。执行脚本 IDE / workspace / update 相关测试，以及任务文件的 format:check、type-check、build:verify。
