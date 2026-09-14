# 空天 · 灵枢--动态本体（前端）

## 1、基本介绍

- 基于 vite vue3 开发 web 应用
- 当前版本为 v0.1.0

## 2、开发环境

- Node.js：v24.12.0 及以上
- npm：v11.0.0 及以上，项目固定版本见 `package.json#packageManager`
- Chrome：130 及以上
- 依赖统一使用 npm 管理，`package-lock.json` 是唯一锁文件

## 3、运行

```sh
npm install
npm run dev
npm run build
```

`npm run build` 用于人工发布并输出到 `html/`；自动化构建验证使用 `npm run build:verify`。

## 4、Skills

### 项目 Skills

项目创建并随仓库维护的 Skills 位于 [`.agents/skills`](.agents/skills)，索引见 [`.agents/README.md`](.agents/README.md)。

### 公共 Skills

以下公共 Skills 可从互联网下载安装，用于补充通用开发能力；其可用性取决于开发人员环境，不构成项目硬性依赖。公共 Skill 必须服从本项目的 `AGENTS.md`、目录规范和已确认 Plan。

| 来源                                 | URL                                                                                                        | 适用能力                                                  |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| affaan-m/ECC                         | [github.com/affaan-m/ECC](https://github.com/affaan-m/ECC)                                                 | 通用前端工程、质量、安全、构建和发布技能                  |
| obra/superpowers-skills              | [github.com/obra/superpowers-skills](https://github.com/obra/superpowers-skills)                           | 需求澄清、计划、调试、TDD、审查和完成前验证               |
| nextlevelbuilder/ui-ux-pro-max-skill | [github.com/nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) | UI/UX 规则、Vue 栈资料、检索脚本和按需参考资料            |
| mattpocock/skills                    | [github.com/mattpocock/skills](https://github.com/mattpocock/skills)                                       | 模块设计和领域建模；其余工程/生产力技能与本项目重复或无关 |
| anthropics/skills                    | [github.com/anthropics/skills](https://github.com/anthropics/skills)                                       | 前端视觉设计和本地 Web 应用测试                           |
| multica-ai/andrej-karpathy-skills    | [github.com/multica-ai/andrej-karpathy-skills](https://github.com/multica-ai/andrej-karpathy-skills)       | Karpathy 编码行为准则                                     |
| CesiumGS/cesiumjs-skills             | [github.com/CesiumGS/cesiumjs-skills](https://github.com/CesiumGS/cesiumjs-skills)                         | CesiumJS 领域技能；使用时结合项目 Mars3D 封装和生命周期   |
