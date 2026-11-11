# 接入调度保存接口

用户确认：新建周期调度 POST http://172.16.28.228:37002/ontology/action/scheduling，提交已组装参数。仅此接口使用本地地址，不改 public 配置。

- 修改 src/apis/ontologyActionApi.ts 及 index.ts，复用 request，响应 data 使用 unknown，不臆测返回字段。
- 修改 src/views/SpaceBehaviorScheduleWorkspace/index.vue：接收创建参数、等待接口成功后加入现有本地列表并关闭弹窗；失败保留输入、展示 message；阻止重复提交，忽略卸载或空间切换后的响应。
- 规则调度、编辑、删除保留原有流程，列表接口不在本次范围。
- 新增 tests/schedule-save-api.test.mjs，先失败后实现，覆盖真实请求配置及页面成功、业务失败、网络异常、重试、重复提交和过期响应。
- 无依赖、类型或受保护文件变更，无删除文件。
- 验证：针对测试、npm test、test:coverage、type-check、build:verify、限定文件格式检查、git diff --check。对比既有失败。无 E2E 入口，浏览器及人工验收待执行。不自动向服务写入样例调度。

## 验证记录

- RED：新增 4 项测试均因接口或保存行为未实现失败；GREEN：保存相关 5 项、连同参数组件及参数组装共 27 项全部通过。
- npm test：931 项，899 通过、32 失败；失败名称与此前记录一致。
- type-check：13 项既有错误，与此前输出一致，无新增错误。
- test:coverage：已加载文件行 92.24%、函数 88.09%、分支 77.00%；分支未达 80%，命令失败，非全项目源码覆盖率。
- build:verify 通过，产物仅在系统临时目录；限定文件 format:check、git diff --check 通过。
- 未执行浏览器及真实后端写入验证，真实保存与最终业务效果待人工验收。无新增依赖，保留先前工作区变更。
