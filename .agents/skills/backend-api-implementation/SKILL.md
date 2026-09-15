---
name: backend-api-implementation
description: Implement this repository's API functions, typed contracts, and Mock samples from one explicitly specified docs/YYYYMMDD/*Api.md contract. Use only when the user identifies the exact Api.md file to process.
---

# Backend API Implementation

根据用户明确指定的一份 Api.md 契约，同步实现 API、Mock、类型和必要的运行时配置类型。不得仅凭接口主题搜索并自行选择文档，也不得在一次执行中默认处理多份 Api.md。

## 输入闸门

开始处理前，确认用户只指定了一个符合 `docs/YYYYMMDD/<sequence>.<topic>Api.md` 的文件。未指定文件、路径不符合约定或一次指定多个文件时，暂停并请用户明确目标。

目标文档必须明确提供：

- 接口名称；
- API、Mock、Types 的目标编译位置；
- 接口描述；
- 接口 domain；
- 接口 URI；
- HTTP 请求方式；
- 输入参数结构、必填性和字段含义；
- 输出响应结构和字段含义；
- 至少一个完整响应样例。

`types 示例`、`apis 示例`、`mocks 示例` 均为可选参考，不能替代上述核心输入，也不能覆盖项目规范或正文契约。任何核心输入缺失、含糊、相互冲突，或示例与正文不一致时，停止实施并请用户补充或确认。

## 实施前检查

1. 按项目导航要求读取根 `AGENTS.md`、`.agents/CODEX-NAVIGATION-GUIDE.md`、`docs/readme.md` 和目标 Api.md。
2. 完整读取 `src/apis/readme.md`、`src/mocks/readme.md`、`src/types/readme.md`。
3. 检查 `git status --short`，只读查看文档指定的目标、相关公共出口、`src/utils/request.ts`、现有同域实现和相关全局类型声明；保留用户已有修改。
4. 使用 `project-change-planning` 明确新增、修改和测试范围，等待用户确认并保存 Plan 后再实施。
5. 在 Plan 中逐项记录契约正文与最终文件、类型、函数和 Mock 导出的映射。若目标已有实现、命名存在多个合理选择、覆盖用户修改或需要扩大文档指定范围，先请用户确认。

## 契约映射

### Types

- 将请求参数、响应数据和嵌套结构定义在文档指定的 `src/types/apis/*Type.ts` 中，并遵守 `src/types/readme.md`。
- 类型必须来自正文结构和字段说明；不得从可选示例章节臆造缺失契约。
- 在 `src/types/index.ts` 显式转导出所有普通类型，并保持规定排序。
- 检查接口 domain 使用的全局运行时对象及属性是否已有准确的 TypeScript 声明。缺失时，按 `src/types/readme.md` 补充适当的 `src/types/global/*Type.ts`；不得通过 `any`、无依据断言或关闭检查绕过。
- 若无法从现有只读运行时配置和 Api.md 确定 domain 对象或属性类型，先请用户确认。

### APIs

- 在文档指定的 `src/apis/*Api.ts` 中实现轻量请求函数，并遵守 `src/apis/readme.md`。
- 使用文档中的 HTTP 方法、domain 和 URI；请求 URL 由 domain 表达式与 URI 组合，例如 `DOMAIN_CONFIG.OCEAN_SERVER_URL + "/ontology/search"`。
- GET 查询使用 `params`，提交类请求按目录规范使用 `data`；无法明确映射时先请用户确认。
- 通过 `@/types` 使用 `ApiResponse<T>` 和业务类型，通过 `@/utils/request` 使用 `request`，并提供完整 JSDoc 和显式返回类型。
- 在 `src/apis/index.ts` 按规范导入并导出接口函数。

### Mocks

- 在文档指定的 `src/mocks/<domain>Mock/` 中实现类型安全的具名 Mock 导出，并遵守 `src/mocks/readme.md`。
- 只生成 Api.md 实际提供的响应样例，不自行补充成功、空数据、失败、权限或边界场景。
- 文档提供多个响应样例时全部生成；每个导出名称应反映文档给出的场景语义。
- 多个样例没有可辨识的场景含义或名称、样例与响应类型不一致，或无法确定稳定命名时，先请用户确认。
- 保持样例字段和值的契约语义，不引入随机数、当前时间、真实凭据、个人信息或生产数据。

## TDD 与验证

接口实现属于功能变更，遵循根规则的 TDD 流程：先添加或调整能验证请求配置、公共出口、类型契约、Mock 样例和必要全局声明的测试并确认失败，再完成最小实现并确认通过。不得为了通过测试而弱化契约。

完成后使用 `project-verification-delivery`，至少执行当前仓库要求的：

```sh
npm test
npm run test:coverage
npm run check:types-conventions
npm run type-check
npm run build:verify
```

同时检查任务相关 diff、`git diff --check` 和工作区状态。不得运行会写入 `html/` 的 `npm run build`。

## 必须暂停确认的情况

除上述输入闸门外，遇到以下任一情况也不得自行推断：

- 正文缺少生成目标所需的字段、类型、必填性、容器层级或样例值；
- domain、URI、请求承载位置或响应包裹结构无法唯一确定；
- 可选示例章节、现有实现、公共类型或运行时配置与正文契约冲突；
- 目标文件存在未说明的实现或用户修改，继续操作可能覆盖或改变其语义；
- 需要新增依赖、修改受保护目录、处理另一份 Api.md 或扩大已确认 Plan。

向用户说明具体缺口、受影响文件和可选处理方式；取得明确输入或确认后再继续。
