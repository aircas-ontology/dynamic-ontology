# `src` 一级目录开发规范文档建设计划

## 需求理解

为 `src` 下 12 个一级目录建立或校准 `readme.md`，让后续开发能够直接从目录内获得职责、命名、依赖、实现、验证及整改要求。规范使用 `【必须】`、`【禁止】`、`【优先】`，以目标状态为准，不把遗留实现当作范例。

## 修改范围

- 新建：`assets`、`components`、`layout`、`models`、`router`、`stores`、`styles`、`utils`、`views` 下的 `readme.md`。
- 修改：填充 `mocks/readme.md`，保留式校准 `apis/readme.md` 和 `types/readme.md`。
- 不修改源码、资源、配置、依赖、`public/` 或 `html/`。

## 核心实现

- 每份文档统一说明目录职责、推荐结构、命名、类型与依赖、核心规范、错误或生命周期、检查清单、现状整改项。
- `assets` 先按 `pages`、`layouts`、`components`、`common` 归属分层，再按资源类型细分；其自定义目录与文件统一使用 camelCase。该用户指定规则优先于仓库通用的 kebab-case 资源规则。
- 页面、布局和公共组件文档分别引用 `assets/pages/<pageName>`、`assets/layouts/<layoutName>`、`assets/components/<componentName>`。
- 整改项仅记录，不在本任务内实施。

## 依赖

不新增或修改依赖。

## 验证方式

- 确认 12 个一级目录均有小写 `readme.md`，且章节、规则标签和跨目录约定一致。
- 执行 `npm run check:types-conventions`、`git diff --check`，并核对变更范围。

