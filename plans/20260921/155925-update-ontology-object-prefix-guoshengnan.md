# 编辑本体对象接口补充 `/ontology` 前缀

## 需求理解

编辑本体对象接口当前请求路径缺少 `/ontology` 前缀，需要与创建、删除本体对象接口保持一致，调用 `/ontology/meta`。

## 修改范围

- 修改编辑本体对象 API 请求路径和对应 JSDoc。
- 同步修改编辑接口说明文档中的 URI 与示例。
- 更新编辑接口测试断言，覆盖 `/ontology/meta` 路径。

## 新增、修改和删除文件

- 修改 `src/apis/ontologyObjectManageApi.ts`。
- 修改 `docs/20260919/updateOntologyObjectApi-guoshengnan.md`。
- 修改 `tests/update-ontology-object-api.test.mjs`。
- 新增本 Plan 文件。

## 核心实现方式

将编辑接口的请求 URL 从 `DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/meta"` 调整为 `DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/meta"`，请求方法、请求体和响应类型保持不变。

## 新增依赖及必要性

无。

## 验证方式

- 对本次修改文件执行 Prettier 格式检查。
- 执行编辑本体对象相关测试。
- 执行 `npm run type-check` 和 `npm run build:verify`。
- 执行 `git diff --check`。
