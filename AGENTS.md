# AGENTS.md

## 1. 规则等级

本项目使用三类规则：

- **【必须】**：硬性要求，必须执行。
- **【禁止】**：硬性要求，禁止执行。
- **【优先】**：默认执行；确需偏离时在 Plan 中说明原因并获得用户确认。

普通说明文字仅用于解释，不具有独立规则等级。

规则按职责分层：

1. 用户当前明确要求具有最高优先级。
2. 本文件维护全项目硬边界和跨目录规则。
3. `src/<directory>/readme.md` 维护对应目录的技术规范。
4. `.agents/skills/` 维护项目工作流程，不重复定义目录技术规范。
5. `docs/` 中的文件是待执行开发 Prompt；只有用户明确指定后才进入当前任务范围。
6. `plans/` 中的文件是已确认实施方案和历史记录，不作为长期规范。
7. 通用最佳实践优先级最低。

- 【必须】发现规则冲突时说明冲突及影响，等待用户确认后再执行。开发 Prompt 与现行规范冲突时同样适用。

---

## 2. 基本原则

- 【必须】只修改当前任务明确涉及的内容。
- 【禁止】顺带重构、批量格式化或调整与当前任务无关的内容。
- 【必须】保持类型安全，不通过 `any`、无依据的类型断言或关闭检查规避类型问题。
- 【禁止】Codex 读取、修改、删除或提交 `html/` 生产构建目录。
- 【必须】`public/` 默认只读；确需修改时，必须由用户明确授权并纳入已确认 Plan。
- 【必须】使用 Subagent 前获得用户确认。
- 【必须】增量输出：只展示或描述发生变化的部分，不重复粘贴未修改代码或完整文件；Plan、验证证据、冲突和风险说明不受此限制。
- 【必须】修改 `src/<directory>/` 前完整阅读并遵守该目录的 `readme.md`。

> **核心原则：范围受控、类型安全、不触碰受保护产物。**

---

## 3. Codex 导航规范

- 【必须】Codex 读取本文件后，继续完整阅读 [`.agents/CODEX-NAVIGATION-GUIDE.md`](.agents/CODEX-NAVIGATION-GUIDE.md)，再开始仓库导航、范围判断或文件修改。
- 【必须】导航指南只提供仓库入口和职责索引，不能替代任务涉及目录内的 `readme.md` 规范。
- 【必须】项目约束以仓库内本文件及其引用规范为准，不依赖会话临时注入的公共 Skill 或 ECC Codex Supplement。

---

## 4. 项目结构与规范

**目录职责**: 本项目存放源代码，包含以下目录：

```text
src/
├─ apis/             HTTP 接口定义，按页面 / 业务域分类
├─ assets/          构建期静态资源，按页面 / 业务域分类
├─ components/      公共组件，由 register 统一注册
├─ example/         参考资料目录，不作为正式业务依赖
├─ layout/          公共布局
├─ mocks/           样例数据，按页面 / 业务域分类，符合正式业务类型定义
├─ models/          业务模型或 Class
├─ router/          Vue Router
├─ stores/          Pinia Store，Store 仅维护需要共享的业务状态，禁止直接操作 DOM
├─ styles/          全局主题及公共样式
├─ types/           TypeScript 类型，按页面 / 业务域分类，定义可复用业务类型
├─ utils/           无业务状态的公共工具函数
├─ views/           业务页面
├─ App.vue          根组件
└─ main.ts          入口文件

public/             部署后静态资源与运行时配置，默认只读
├─ configs/         部署后可调整的运行时配置
└─ data/            部署后可调整的运行时数据

docs/                开发人员编写的待执行 Prompt
plans/               已确认的实施 Plan 和历史记录
html/                生产构建产物，Codex 禁止读取、修改、删除或提交
.agents/            项目级 Agent 导航与 Skills
```

- 【必须】`src/` 业务源码使用 TypeScript。
- 【必须】Vue 使用 Vue 3、Composition API、`<script setup lang="ts">`。
- 【优先】项目内部模块引用使用 `@/` 路径别名。

### 环境与依赖管理

- 【必须】Node.js 使用 `24.12.0` 及以上版本。
- 【必须】Chrome 使用 `130` 及以上版本，实际构建目标与该要求保持一致。
- 【必须】统一使用 npm；npm 版本不得低于 `11.0.0`，固定版本见 `package.json#packageManager`。
- 【必须】`package-lock.json` 是唯一依赖锁文件，依赖变化时与 `package.json` 同步更新。
- 【禁止】提交 pnpm、Yarn、Bun 等其他包管理器的锁文件。
- 【禁止】项目硬性规范仅存在于需要联网安装的公共 Skill 中。

---

## 5. 文件与命名

- 【必须】Vue 页面目录和组件文件使用 PascalCase，`index.vue`、`App.vue` 等生态约定除外。
- 【必须】普通 TypeScript 文件使用 camelCase；以 Class 为主要导出的模型文件使用 PascalCase。
- 【必须】Store 文件使用 `use<Domain>Store.ts`。
- 【必须】`src/assets/**` 的自定义目录和资源文件使用 camelCase；样式文件和 CSS Class 使用 kebab-case。
- 【必须】文件名与 import 路径大小写保持一致。

---

## 6. 异步数据

- 【必须】查询列表或详情时处理 loading、success、empty、error。
- 【必须】登录、保存、删除等命令操作处理 idle、submitting、success、error，不强制 empty。
- 【必须】应用或第三方实例初始化处理 initializing、ready、error；仅在业务存在无内容语义时增加 empty。
- 【必须】所有异步行为防止无控制重复请求和过期响应覆盖新状态，并提供明确错误反馈。
- 【优先】页面卸载后取消不再需要的请求、订阅和后台任务。

状态名称可按实现调整，但业务语义必须完整。

---

## 7. 测试与构建

- 【必须】新功能、缺陷修复和行为变更采用 TDD：先运行失败测试，再完成最小实现并确认通过。
- 【必须】有可执行测试的代码变更运行 `npm test` 和 `npm run test:coverage`，覆盖率不得低于项目现有 80% 门槛。
- 【必须】应用代码、类型、配置或依赖变更执行 `npm run type-check` 和 `npm run build:verify`。
- 【禁止】Codex 使用会写入 `html/` 的 `npm run build` 进行验证；该命令只供开发或发布人员明确执行正式发布构建。
- 【优先】关键用户流程或交互行为变更增加或更新 E2E 测试。
- 【必须】纯文档、Skill、静态资源整理及不改变行为的样式修改可免除单元测试和覆盖率；无法合理自动化测试的行为变更必须在 Plan 中说明并获得确认。
