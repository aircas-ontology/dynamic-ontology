# Plan：实例 URL 接口路径前缀同步

## 需求理解

文档 `接口 uri` 已改为 `/ontology/instance/url/list`（原 `/instance/url/list`）。将 API、Mock、单测中的路径同步为新值；同文档示例与伪代码中的旧路径一并修正。

## 修改范围

- `src/apis/ontologyInstanceUrlApi.ts`
- `src/mockData/routes.json`
- `tests/get-ontology-instance-url-list-api.test.mjs`
- `docs/20261112/instanceUrlApi.md`

## 新增、修改和删除文件

- 修改上述 4 个文件；无新增/删除。

## 核心实现方式

将所有 `/instance/url/list` 字符串替换为 `/ontology/instance/url/list`；fixture 文件路径保持不变。

## 新增依赖及必要性

无。

## 验证方式

- 任务相关单测
- `npm run format:check -- <改动文件>`
