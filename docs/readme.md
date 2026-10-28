# 开发 Prompt 目录规范

`docs/` 存放开发人员编写的待执行 Prompt。Prompt 只有在用户明确指定后才进入当前任务范围；其中的代码示例必须服从 `AGENTS.md` 和对应的 `src/*/readme.md`。目录根级仅保留本规范文件，开发 Prompt 必须进入日期目录。

## 日期目录

- 【必须】Prompt 按 `docs/YYYYMMDD/` 归档，日期使用 `Asia/Shanghai` 时区。

## 文件命名

- 【必须】普通 Prompt 命名为 `<sequence>.<topic>.md`。
- 【必须】API Prompt 命名为 `<sequence>.<topic>Api.md`，每个接口单独定义。
- 【必须】`sequence` 从 `1` 开始按目录内执行顺序递增，`topic` 使用 camelCase。
- 【禁止】把 Prompt 当作全局项目规范或已确认 Plan。

API Prompt 示例参考 [`1.ontologySearchApi.md`](20260914/1.ontologySearchApi.md)。
