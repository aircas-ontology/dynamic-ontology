---
name: backend-api-implementation
description: Automatically generate this repository's API functions, typed contracts, and Mock samples from one explicitly specified docs/YYYYMMDD/*Api.md contract. Use only when the user identifies the exact Api.md file to process.
---

# Backend API Implementation

根据用户明确指定的单份 Api.md 自动生成并同步 API、Types、Mocks 和必要的运行时配置类型。本 Skill 负责编排契约到文件的映射；各目标目录的技术规则始终以对应 `readme.md` 为准。

## 输入闸门

开始处理前确认用户只指定了一个符合 `docs/YYYYMMDD/<sequence>.<topic>Api.md` 的文件。未指定准确路径、路径不符合约定或一次指定多份文档时，暂停并请用户明确目标。

目标文档必须明确提供：

- 接口名称及 API、Types、Mocks 的目标编译位置；
- 接口描述、domain、URI 和 HTTP 方法；
- 输入参数结构、必填性和字段含义；
- 输出响应结构和字段含义；
- 至少一个完整响应样例。

`types 示例`、`apis 示例`、`mocks 示例` 仅用于辅助理解，不能替代正文契约。核心输入缺失、含糊、互相冲突，或示例与正文不一致时，停止并请用户补充或确认。

## 实施流程

1. 读取根 `AGENTS.md`、`docs/readme.md`、目标 Api.md，以及 `src/apis/readme.md`、`src/types/readme.md`、`src/mocks/readme.md`。
2. 检查 `git status --short`，只读查看文档指定目标、公共出口、`src/utils/request.ts`、同域实现和相关全局类型声明，保留用户已有修改。
3. 使用 `project-change-planning` 明确新增、修改和测试范围；在 Plan 中记录契约正文与最终文件、类型、函数及 Mock 导出的逐项映射，等待确认并保存 Plan。
4. 遵循目标目录规范，先写契约映射的失败测试，再生成最小 API、Types、Mocks 和确有必要的运行时配置类型。
5. 将正文中的 HTTP 方法、domain、URI、输入承载位置、响应包裹结构和样例值原样映射到实现，不从可选示例或现有近似接口臆造契约。
6. 仅生成 Api.md 实际提供的 Mock 响应样例，不得自行补造成功、空数据、失败、权限或边界场景。若当前功能或目录规范要求某场景但文档没有对应样例，暂停并请用户补充契约或确认处理方式。
7. 使用 `project-verification-delivery` 执行项目当前要求的测试、约定检查、类型检查和临时目录构建，再核对任务 diff 与工作区状态。

## 必须暂停确认的情况

- 正文缺少生成目标所需的字段、类型、必填性、容器层级或样例值；
- domain、URI、请求承载位置或响应包裹结构无法唯一确定；
- 可选示例、现有实现、公共类型或运行时配置与正文契约冲突；
- 文档目标会覆盖未说明的现有实现或用户修改；
- Mock 所需场景未提供可映射的响应样例；
- 需要新增依赖、修改受保护目录、处理另一份 Api.md 或扩大已确认 Plan。

说明具体缺口、受影响文件和可选处理方式；取得明确输入或确认后再继续，不得通过 `any`、无依据断言、随机数据或静默默认值绕过契约。
