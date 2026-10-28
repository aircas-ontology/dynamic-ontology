# 修复示例 API 域名配置类型并纳入开发文档

## 需求理解

- 修复 `src/apis/exampleApi.ts` 第 22 行使用 `DOMAIN_CONFIG` 时的 TypeScript 类型错误。
- 确保 `docs/`、`plans/` 目录中的未跟踪文件纳入 Git 管理。

## 修改范围

- 为运行时注入的 `DOMAIN_CONFIG` 补充全局类型声明。
- 增加覆盖该全局声明的回归测试。
- 将 `docs/`、`plans/` 下的未跟踪文件加入 Git 暂存区。
- 保留用户已有的 `exampleApi.ts` 和 `.agents/` 修改，不处理无关内容。

## 文件变更

- 新增：`plans/20260915/100942-fix-example-api-domain-config-type.md`
- 修改：`src/types/global/runtimeConfigType.ts`
- 修改：`tests/project-conventions.test.mjs`
- 删除：无

## 核心实现方式

- 根据 `public/configs/domainConfig.js` 的现有结构定义 `DomainConfig`。
- 在现有运行时配置声明文件中声明全局常量 `DOMAIN_CONFIG`，不改动运行时配置文件。
- 先运行新增测试并确认失败，再添加最小类型实现使其通过。

## 新增依赖

无。

## 验证方式

- `node --test --experimental-strip-types tests/project-conventions.test.mjs`
- `npm test`
- `npm run test:coverage`
- `npm run check:types-conventions`
- `npm run type-check`
- `npm run build:verify`
- `git diff --check`
- 检查任务相关 diff 与 Git 状态。
