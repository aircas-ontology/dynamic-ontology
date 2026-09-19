# 本体对象手动创建接口对接

## 需求理解

根据 `docs/20260919/createOntologyObjectApi-guoshengnan.md` 对接本体对象手动创建接口。已确认采用正文类型和项目请求规范：POST 请求使用 `data` 请求体；`spaceId`、`parentOntologyUniqueIdentifier`、`categoryId` 使用数字；可选字段仅在有值时发送。真实接口成功后关闭创建弹框、提示成功并刷新当前对象列表；失败显示接口 message。

## 契约映射

- 类型：`CreateOntologyObjectParams`、`CreateOntologyObjectData` → `src/types/apis/createOntologyObjectType.ts`。
- API：`createOntologyObjectInterface` → `src/apis/ontologyObjectManageApi.ts`，调用 `DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + /ontology/meta`，方法 `post`，请求体 `data`。
- Mock：`createOntologyObjectMock` → `src/mocks/createOntologyObjectMock/createOntologyObjectMock.ts`，仅实现文档提供的成功样例。
- 公共出口：同步 `src/types/index.ts` 和 `src/apis/index.ts`。

## 修改范围

- 新增接口类型、API 函数、成功 Mock 与契约测试。
- 修改创建弹框提交数据类型，将 UI 草稿转换为接口参数。
- 修改对象工作区提交流程：按当前空间 id 调用真实接口，成功后提示并调用工作区列表加载；失败显示接口错误信息，不关闭弹框。
- 保留当前列表接口未接入真实服务的现状，刷新沿用现有分类树加载流程。

## 依赖

无新增依赖，不修改受保护目录。

## 验证方式

- 先运行新增契约测试确认失败，再实现最小代码并确认通过。
- 执行当前任务文件的 Prettier 检查、`npm test`、`npm run test:coverage`、`npm run check:types-conventions`、`npm run type-check`、`npm run build:verify`、`git diff --check`。
