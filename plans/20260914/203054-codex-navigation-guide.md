# Codex 仓库导航指南补全计划

## 需求理解

将会话中临时注入的 ECC Codex 导航要求落入仓库规范：在根 `AGENTS.md` 中建立必须遵守的读取规则，并将导航指南存放到已跟踪的 `.agents/` 目录。

已发送的会话内容无法由仓库修改删除；落库后以仓库内规范为准，不再依赖临时注入内容。

## 修改范围

- 新增 `.agents/` 下的 Codex 仓库导航指南。
- 更新根 `AGENTS.md`，建立导航指南的强制读取规则。
- 删除先前生成且被忽略的 `docs/CODEX-NAVIGATION-GUIDE.md`。
- 更新本次实施 Plan。
- 不修改业务源码、配置、依赖和构建产物。

## 文件清单

### 新增

- `.agents/CODEX-NAVIGATION-GUIDE.md`

### 修改

- `AGENTS.md`
- `plans/20260914/203054-codex-navigation-guide.md`

### 删除

- `docs/CODEX-NAVIGATION-GUIDE.md`

## 核心实现方式

1. 在 `AGENTS.md` 中规定 Codex 必须读取 `.agents/CODEX-NAVIGATION-GUIDE.md`，并明确仓库规范优先于会话临时注入内容。
2. 在导航指南中说明规则读取顺序与目录级 `readme.md` 的作用域。
3. 按当前仓库真实结构记录主要目录、入口文件和职责。
4. 标明 `html/`、`public/` 等受保护范围，以及范围控制、类型安全和验证要求。
5. 提供面向常见任务的定位表和只读检索建议，避免重复扫描受保护目录。

## 新增依赖

无。

## 验证方式

- 检查 `.agents/CODEX-NAVIGATION-GUIDE.md` 可被 Git 和文本检索发现，旧 `docs/` 路径不存在。
- 检查指南中的本地相对链接均指向已存在路径。
- 检查 `git diff --check`、任务 diff 和工作区状态，确认无计划外修改。
