# 切换后台服务地址

- 需求：将登录、对象管理统一后台地址切换为 http://172.16.18.62:37002。
- 授权：用户明确授权本次例外修改 public/，仅涉及以下两项地址；不改变长期目录规则。
- 修改文件：public/configs/domainConfig.js 的 LOGIN_URL、ONTOLOGYMANAGE_URL；新增本 Plan，不删除文件。
- 实现：保留接口路径拼接方式，配置值不带尾斜杠，避免请求路径出现双斜杠。
- 依赖：无新增。
- 验证：执行前先断言两项地址以复现不匹配，修改后重复断言并检查 JavaScript 语法；限定格式检查、type-check、build:verify 和 diff 检查，记录已有验证失败。不进行有业务写入的真实接口调用。
