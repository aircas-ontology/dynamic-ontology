# 开发 Prompt 目录规范

`docs/` 存放开发人员编写的已执行 Prompt。Prompt 只有在用户明确指定后才进入当前任务范围；其中的代码示例必须服从 `AGENTS.md` 和对应的 `src/*/readme.md`。目录根级仅保留本规范文件，开发 Prompt 必须进入日期目录。

## 日期目录

- 【必须】Prompt 按 `docs/YYYYMMDD/` 归档，日期使用 `Asia/Shanghai` 时区。

## 文件命名

- 【必须】Prompt 按用户归档，文件名为 `<user>.md`，`<user>` 使用当前仓库 `git config user.name` 转换后的小写 kebab-case，与 `plans/` 命名一致；未配置时停止归档并提示用户先配置。
- 【必须】同日同用户文件已存在时，将 Prompt 按执行顺序追加到文件末尾，不覆盖已有内容；每次归档以「序号 + 主题标题」区分。
- 【禁止】把 Prompt 当作全局项目规范或已确认 Plan。
- 【禁止】已有归档文件不因命名规则变化而批量重命名。

Prompt 归档示例参考 [`shijian.md`](20260915/shijian.md)。
