---
name: code-formatting
description: Format or verify this repository's task-scoped Vue, TypeScript, JavaScript, CSS, SCSS, JSON, and Markdown files with the checked-in VS Code and Prettier configuration. Use after editing supported text files; do not use for generated, protected, or unrelated files.
---

# Code Formatting

使用仓库内配置统一当前任务文件的格式，不扩大修改范围。

## 工作流程

1. 格式化前读取 `.vscode/settings.json`、`.prettierrc.json` 和 `.prettierignore`；配置不一致时停止并说明冲突。
2. 根据任务 diff 建立明确文件列表，只包含当前任务实际修改且受 Prettier 支持的文件。
3. 使用 `npm run format -- <文件列表>` 格式化这些文件，再使用 `npm run format:check -- <同一文件列表>` 验证。
4. 检查格式化 diff，确认没有语义变化、无关重排或计划外文件。

## 边界

- 禁止使用 `npm run format -- .` 或其他无范围的写入式批量格式化。
- 禁止读取、格式化或修改 `html/`；禁止格式化或修改 `public/`。
- 不格式化用户已有的无关修改、生成文件、第三方文件或 `.prettierignore` 排除内容。
- 只报告真实执行过的格式化或检查结果；命令失败时保留输出并按任务范围处理。
