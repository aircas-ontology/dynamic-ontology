# 调度列表接口文档及对接

用户已确认。来源为在线 OpenAPI 中 OntologyActionController_listScheduling：GET /ontology/action/scheduling/list，仅有 pageNum、pageSize。

- 新增 docs/20261111/listSchedulingApi.md，记录来源、字段、示例和契约缺口；示例标注为说明用，非真实业务数据。
- 新增 src/types/apis/listBehaviorSchedulingType.ts，修改类型出口及页面类型的可选元数据（接口状态、详情是否可用）。
- 修改 src/apis/ontologyActionApi.ts、index.ts，新增列表查询，复用 DOMAIN_CONFIG.ONTOLOGYMANAGE_URL。
- 新增页面 utils/fetchBehaviorSchedules.ts：每页1000条读取所有分页以保留现有全量本地筛选，映射真实字段；无创建时间时显示 -，不臆造 Cron、参数和规则详情。
- 修改页面 index.vue：移除初始样例列表、处理加载/成功/空/错误重试、重复及过期请求、空间切换和卸载；创建成功后刷新。真实列表缺少详情的记录禁用查看/编辑，日志不生成样例。未提供编辑、删除及日志接口，不对接或臆造。
- 修改 tests/schedule-save-api.test.mjs，新增 tests/schedule-list.test.mjs，先失败后实现，覆盖查询配置、分页、映射、筛选、请求状态、错误、重试、重复、过期、创建刷新及销毁。
- 无新依赖，不修改 public，不读取 html，不删除文件，保留当前既有修改。
- 验证：针对测试、npm test、test:coverage、check:types-conventions → type-check → build:verify、限定文件格式及 diff 检查。现无 E2E 入口，浏览器与人工验收记录为未执行。接口文档已可读取，实际列表查询可进行只读连通检查，不创建测试数据。

## 验证记录

- RED：新增纯查询测试因缺少实现失败；页面集成测试确认原有样例列表、不刷新和缺少列表状态导致失败。实施后列表与保存相关 15 项全部通过，先前参数组件等相关测试亦通过。
- npm test：941 项，909 通过、32 失败，失败名称与此前一致。type-check：最终保留 13 项既有错误，排除行号偏移后与此前一致，新增 title 属性的两项类型错误已修复。
- test:coverage：新 fetchBehaviorSchedules.ts 行、函数、分支均为 100%；全部已加载文件行 92.26%、函数 88.12%、分支 77.16%。整体分支未达 80%，该命令失败；不代表全项目源码覆盖率。
- 类型规范、最终 build:verify、明确文件 format:check、git diff --check 通过。构建仅写系统临时目录。
- 在线 OpenAPI 读取成功；无登录态的 GET 列表只读检查返回 HTTP 401，未验证真实业务数据。未执行浏览器和人工最终验收，也未写入真实服务。
- 文档明确无空间筛选参数；页面当前不能保证仅返回当前空间的调度。详情缺失时禁用查看/编辑，日志显示空数据；既有本地规则创建及删除流程未扩展为远程接口。
