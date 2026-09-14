---
name: project-verification-delivery
description: Verify completed repository changes and produce an evidence-based handoff. Use after modifying project files and before claiming completion, including tests, type checks, production builds, scope review, and unresolved failures.
---

# Project Verification and Delivery

根据真实修改和仓库脚本完成验证，只报告实际执行结果。

## 确定验证范围

1. 读取 `package.json` 的当前 scripts，不臆造命令。
2. 查看工作区状态和当前任务 diff，区分本次修改与用户已有变更。
3. 对照已确认 Plan；没有完整 Plan 的低风险小改，则对照用户明确要求。
4. 根据修改类型选择验证：
   - 应用代码、类型、配置、依赖或构建相关修改执行 `npm run type-check` 和 `npm run build:verify`；
   - 新功能、缺陷修复和行为变更核对 TDD 的 RED/GREEN 证据，并执行 `npm test` 和 `npm run test:coverage`；
   - 仅文档或 Skill 变更优先执行格式、链接、frontmatter 或专用校验器，除非用户或已确认 Plan 要求应用级检查。

## 安全执行

- Codex 不得运行会写入 `html/` 的 `npm run build`；统一使用将产物写入系统临时目录的 `npm run build:verify`。
- 不恢复、覆盖或格式化用户已有的无关修改。
- 命令失败时先记录失败命令和原因。只修复当前任务范围内的问题；修复需要扩大范围时停止并重新走规划确认。
- 不得将未运行的检查描述为通过，也不得用静态阅读代替已要求的真实执行。

## 完成检查

- 确认新增文件可被检索，内部相对链接和引用有效。
- 确认没有计划外文件、调试代码、硬编码秘密或意外生成物。
- 明确记录与最终 Plan 的任何差异。
- 验证失败但不适合在当前范围修复时，如实交付失败项、原因和未解决影响。

## 交付格式

保持简洁，只记录真实结果：

```text
修改文件：
实现内容：
新增依赖：有 / 无
验证结果：
未完成事项：
```

不要重复粘贴未修改代码或大段 Plan。
