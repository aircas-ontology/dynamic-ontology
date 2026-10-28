# 后端 API 契约实现 Skill

## 需求理解

创建项目级 `backend-api-implementation` Skill。后续用户明确指定一个符合 `docs/YYYYMMDD/<sequence>.<topic>Api.md` 命名的接口文档时，Skill 根据文档契约生成或更新 API 请求函数、Mock 样例数据和 API 类型，并维护公共出口及相关全局运行时配置类型。

`types 示例`、`apis 示例`、`mocks 示例` 仅作为可选参考，不作为规范输入。接口核心输入缺失、含糊、冲突或存在多种合理实现时，必须暂停并取得用户补充或确认。

## 修改范围

- 新增后端 API 契约实现 Skill 及其 Codex 界面元数据。
- 更新项目 Skill 索引和建议调用顺序。
- 不执行 `docs/20260914/1.ontologySearchApi.md`，不生成具体业务接口文件。
- 不修改用户已变更的 `src/apis/exampleApi.ts`。

## 文件变更

新增：

- `.agents/skills/backend-api-implementation/SKILL.md`
- `.agents/skills/backend-api-implementation/agents/openai.yaml`
- `plans/20260915/100456-backend-api-implementation-skill.md`

修改：

- `.agents/README.md`

删除：无。

## 核心实现方式

- 每次只接受一个用户明确指定的 Api.md 路径；未指定、路径不合规或一次指定多个时暂停确认。
- 将接口名称、三个目标编译位置、描述、domain、URI、HTTP 方法、输入参数契约、输出响应契约及至少一个响应样例定义为核心输入。
- 先读取项目导航、Prompt 规范、目标 Api.md、三个目标源码目录规范和现有相关实现，再进行契约完整性检查。
- API URL 使用文档定义的 domain 与 URI 组合；同步检查 domain 对应的 TypeScript 全局声明，缺失时把相关全局类型配置纳入实施范围。
- Mock 只生成文档实际给出的一个或多个响应样例，不自行扩展其他场景；多个样例缺少可辨识语义或命名时暂停确认。
- 实施遵循项目 Plan、TDD、类型安全、排序和验证要求；任何扩大范围或契约推断均需重新确认。

## 新增依赖

无。

## 验证方式

- 使用 `skill-creator` 的 `quick_validate.py` 校验新 Skill。
- 检查 Skill frontmatter、`agents/openai.yaml`、索引链接和路径引用。
- 执行 `git diff --check` 并审查任务相关 diff 与工作区状态。
- 本次仅修改 Plan、Skill 和 Skill 索引，不执行应用测试、覆盖率、类型检查或构建。
