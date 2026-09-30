# 顶栏退出登录计划

## 需求理解

在顶栏「访客」处增加退出登录。没有后端退出接口，点击后清除当前会话令牌并跳转到登录页。不修改「欢迎回来，访客」文案。

## 修改范围

- 将顶栏访客区域改为下拉菜单，菜单项为「退出登录」。
- 选择该项时调用已有 `clearLoginToken()`，再按登录路由名离开当前页。
- 复用 `aircas-dropdown`，不新增主题变量或接口。

## 文件变更

新增：

- `tests/header-logout.test.mjs`

修改：

- `src/layout/components/HeaderBar.vue`

## 核心实现方式

- 下拉触发器保留现有访客图标和「访客」文字。
- `logoutCurrentSession` 仅处理 `logout` 命令：清除 `sessionStorage` 中的登录令牌，并使用 `router.replace` 进入 `LOGIN_ROUTE_NAME`，避免返回键回到已退出的页面。
- 未登录时现有路由守卫继续拦截业务页。

## 依赖

不新增依赖。

## 验证方式

先运行失败测试，再完成最小实现。执行 `node --test --experimental-strip-types tests/header-logout.test.mjs`、`npm run type-check` 和任务文件的格式检查。在浏览器中从本体空间页打开访客菜单并退出，确认回到登录页且令牌已清除。
