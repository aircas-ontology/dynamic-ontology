# 开发 Prompt 目录规范

`docs/` 存放开发人员编写的待执行 Prompt。

## 日期目录

- 【必须】Prompt 按 `docs/YYYYMMDD/` 归档，日期使用 `Asia/Shanghai` 时区。

## 文件命名

- 【必须】普通 Prompt 命名为 `<git-user>.<topic>.md`。
- 【必须】API Prompt 命名为 `<git-user>.<topic>Api.md`，每个接口单独定义。
- 【必须】`git-user` 为当前编写代码的用户，当前系统登录的`git`的`username`，`topic` 使用 camelCase。
- 【禁止】当前`docs`中已有的文件，暂时不按照新的要求修改文件名
- 【禁止】把 `Prompt `当作全局项目规范或已确认 Plan。

API Prompt 示例参考 [`seventrap.ontologySearchApi.md`](20260914/seventrap.ontologySearchApi.md)。
