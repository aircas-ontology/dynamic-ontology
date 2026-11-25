# 态势页目标实例查询对接

## 需求理解

态势页目标列表保持既有界面，基于任务主题绑定的本体空间加载对象分类树。根节点下的每个一级分类递归聚合其对象标识，分别调用对象实例批量查询接口，并在对应分类中展示真实实例。

## 修改范围

- 新增对象实例批量查询 API 契约与请求函数。
- 更新 API、类型统一出口。
- 增加页面私有的分类对象聚合与实例映射工具。
- 更新态势页目标列表的异步加载流程和实例展示。
- 更新已有态势页测试，覆盖递归去重和实例映射。

## 文件

- 新增 `src/apis/ontologyEntityQueryApi.ts`
- 新增 `src/types/apis/ontologyEntityQueryType.ts`
- 新增 `src/views/IntelligenceTaskDisplay/utils/targetCategoryInstances.ts`
- 修改 `src/apis/index.ts`
- 修改 `src/types/index.ts`
- 修改 `src/views/IntelligenceTaskDisplay/index.vue`
- 修改 `tests/intelligence-task-display.test.mjs`

## 核心实现

调用 `POST {ONTOLOGYMANAGE_URL}/ontology/entity/query`，请求体按对象唯一标识构造且主键数组为空。按一级分类独立请求，防止跨分类实例混入；分类节点及后代的对象标识去重。响应按对象标识展开为列表项，显示实例 `displayName`，缺失时回退对象名称或主键。

接口失败保留既有查询状态提示；路由空间切换或页面卸载后，过期响应不得覆盖当前状态。

## 新增依赖

无。

## 验证

- TDD：先运行目标测试，确认新增工具缺失导致失败；实现后运行测试。
- 对本次文件执行 Prettier 格式化及检查。
- 执行类型规范检查、类型检查、构建验证、全量测试与覆盖率；如存在既有失败，单独记录。
- 执行 `git diff --check` 和任务相关 diff 检查。
