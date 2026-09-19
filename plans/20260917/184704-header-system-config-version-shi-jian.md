# Plan：顶栏版本改读 SYSTEM_CONFIG

确认范围（用户 2026-09-17「确认」）。

## 需求理解

`HeaderBar` 版本号改用运行时 `SYSTEM_CONFIG.version`，不再从 `package.json` 导入。

## 修改范围

- `src/types/global/runtimeConfigType.ts`：声明 `SystemConfig` / `SYSTEM_CONFIG`
- `HeaderBar.vue`：使用 `SYSTEM_CONFIG.version` 展示，去掉 `v` 前缀与 `package.json` import

不修改 `public/`。

## 新增依赖

无。

## 验证方式

`npm run type-check`；浏览器核对本栏版本。
