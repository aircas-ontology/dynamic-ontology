# 概念模型画布创建空间接口对接

## 需求理解

将概念模型画布的“保存并创建空间”接入 `/ontology/space/canvas`，补充空间显示名称，生成接口类型与请求函数，转换对象、属性、关系画布数据，映射属性数据类型，并根据接口结果提示、返回空间或展示失败信息。

## 修改范围

- 新增画布创建空间 API 参数/响应类型。
- 在本体空间管理 API 和统一出口中新增创建接口。
- 扩展概念模型页面的空间名称输入、请求状态和数据转换逻辑。
- 将 `objects` 转换为 `ontologies`，属性 `attributes` 转换为 `properties`，关系端点 id 转换为对象 API 名称并提交到 `links`。
- 新增针对接口契约和画布保存逻辑的失败测试。

## 文件

新增：

- `src/types/apis/createOntologySpaceWithCanvasContentType.ts`
- `plans/20260921/` 下本计划文件

修改：

- `src/types/index.ts`
- `src/apis/ontologyManageApi.ts`
- `src/apis/index.ts`
- `src/views/OntologyConceptualModelCreate/index.vue`
- `tests/ontology-conceptual-model-create.test.mjs`
- 新增接口相关测试文件（如有必要）

## 核心实现

- 请求使用 `DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/space/canvas"`、POST 和 `data`。
- 空间名称与 API 名称均为必填；图标和描述当前无页面字段时传空字符串。
- 数据类型映射：字符串→String、整数→Integer、小数→Double、布尔→Boolean、日期时间→DateTime，未知值回退 String。
- 请求中仅提交已连接关系；缺少源对象或目标对象的关系不提交，并在保存前提示用户。
- 保存期间禁用重复提交；成功要求 `code === 200` 且返回 `data.spaceId`，提示成功后进入对应空间概览；失败保留画布并显示错误。

## 验证

- 先运行新增测试确认失败，再完成实现并运行通过。
- 执行类型检查、相关测试、格式检查、构建验证和 `git diff --check`。
- 保留工作区已有修改，不修改 `html/`、`public/` 及无关文件。
