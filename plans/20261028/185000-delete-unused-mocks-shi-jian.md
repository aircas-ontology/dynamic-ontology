# 删除非运行时 mocks

## 需求理解

`src/mocks` 只保留影响运行的 3 个目录 + `readme.md`；其余全部删除。测试仍需要的样例迁到 `tests/fixtures/`；仅校验旧 HTTP mock 文件文本的断言删除。

## 修改范围

- 新建 `tests/fixtures/` 并迁入 4 个测试样例
- 删除其余非运行时 mock 目录
- 更新测试 import / 去掉失效 readSource 断言
- 视需要微调 `src/mocks/readme.md`

## 新增、修改和删除文件

- 新增：`tests/fixtures/*.ts`（4 个）
- 删除：约 56 个非保留 `src/mocks/*Mock/` 目录
- 修改：相关 `tests/*.test.mjs`、`src/mocks/readme.md`

## 核心实现方式

保留 `ontologySubspaceCreateGuideMock`、`ontologySpaceRelationMock`、`ontologySpaceBehaviorMock`；测试专用样例迁 fixtures；API 测试去掉对已删 mocks 的文本断言。

## 新增依赖及必要性

无。

## 验证方式

- `npm test`
- `npm run format:check --` 本次改动文件
