# 调度创建统一在线服务

用户确认：创建接口服务地址复用 DOMAIN_CONFIG.ONTOLOGYMANAGE_URL，路径保持 /ontology/action/scheduling。

- 修改 src/apis/ontologyActionApi.ts 中地址及用途注释。
- 修改 tests/schedule-save-api.test.mjs，注入运行时配置并验证请求跟随配置变化，先失败后实施。
- 无依赖、类型、删除及 public 配置变更；保持请求体和页面保存逻辑，保留已有修改。
- 验证针对测试、npm test、test:coverage、type-check、build:verify、限定格式检查和 git diff --check。记录既有失败。
- 不执行真实创建请求，后端实际保存效果需人工验收。

## 验证结果

- RED：接口仍请求本地地址导致新期望失败；GREEN：保存相关 5 项测试全部通过，覆盖两种运行时服务地址。
- npm test：931 项，899 通过、32 失败，与上次失败名称一致；type-check 13 项既有错误，输出与上次一致。
- test:coverage 已加载文件行 92.24%、函数 88.09%、分支 77.00%，分支低于 80%，检查未通过，非全项目源码覆盖率。
- build:verify、限定文件 format:check 和 git diff --check 通过；未执行浏览器或真实后端保存验证，人工验收待完成。
