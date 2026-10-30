# 已确认：运行配置模板创建对接

范围：新增functionRateLimitTemplateApi.ts与统一出口、createFunctionRateLimitTemplateType.ts及类型出口、创建Mock与HTTP路由fixture；修改runtimeTemplateState.ts与弹窗新增保存、对应测试、接口说明函数命名。无依赖和删除文件。

映射：POST /ontology/function/rate_limit_template，domain为ONTOLOGYMANAGE_URL，JSON body：name、timeoutMs、retryCount、retryIntervalMs、tpsLimit、maxConcurrency、enabled（0/1）；返回data模型同文档。字段必填性不额外扩大，UI成功响应完整性单独检查。Mock使用文档成功样例。

新增保存异步提交，禁止重复请求与关闭时重复保存；失败保留草稿，成功使用服务端ID和数据，不本地分配创建ID。编辑、删除、启停继续本地。

验证：TDD先失败后通过，字段转换、响应回填、错误和重复调用；执行类型规范、类型检查、临时构建、全量测试和覆盖率、格式、diff。
