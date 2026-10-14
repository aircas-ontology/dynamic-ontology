# 补充函数上下线 Mock

## 需求理解

本地 USE_MOCK 下，发布/下线接口请求 POST /ontology/function/publish 与 POST /ontology/function/unpublish。当前 mockData 无对应路由，需补齐使命令可走通。

## 修改范围

- 仅改 src/mockData 与对应测试
- 不改 public/、API、业务代码
- 不新增依赖；复用 fixtures/common/success.json

## 新增、修改和删除文件

- 修改：src/mockData/routes.json
- 修改：tests/mock-http-server.test.mjs
- 无新增 fixture 文件

## 核心实现方式

在 function 路由段增加两条 POST 路由，均指向 fixtures/common/success.json；Mock 静态成功，不持久化列表 publishStatus。

## 新增依赖及必要性

无。

## 验证方式

- npm test -- tests/mock-http-server.test.mjs（TDD：先 RED 再 GREEN）
- npm run format:check -- 仅覆盖本次改动文件
