# TypeScript 类型与引用修复计划

## 需求理解

检查项目 TypeScript 类型定义是否规范、是否存在错误引用；将跨文件复用的类型放入 `src/types`，仅当前文件使用的类型保留在当前文件，并补全缺失类型。

## 修改范围

- 按业务域拆分 `src/types`，不建立单一集中类型文件。
- 补全卫星、登录、地图、共享工具及运行时配置类型。
- 修复当前类型检查暴露的类型和模块引用错误。
- 移除 `ontologyRoutes.ts` 中指向不存在页面的旧路由条目。
- 不修改 `public/`、`html/`，不新增依赖。

## 新增文件

- `src/types/entitySatellite.ts`
- `src/types/login.ts`
- `src/types/map.ts`
- `src/types/shared.ts`
- `src/types/runtime-config.d.ts`

## 修改文件

- `src/models/SatelliteClass.ts`
- `src/utils/constants.ts`
- `src/utils/initEarth.ts`
- `src/utils/storage.ts`
- `src/views/LoginPage/index.vue`
- `src/router/modules/ontologyRoutes.ts`

## 核心实现方式

- 卫星类型复用 `satellite.js` 的坐标类型，定义业务状态结构。
- 地图配置类型复用 Mars3D `Map` 构造函数参数类型。
- 运行时通过 HTML 脚本注入的 `MAP_CONFIG` 使用环境声明文件声明。
- `StorageGuard` 作为共享类型放入 `shared.ts`。
- `ApiResponse` 仅在请求模块内部使用，保留在 `request.ts`。
- `TimeEngineOptions`、`TickCallback`、组件 Props 等仅当前文件使用的类型保留原位置。

## 新增依赖

无。

## 验证方式

- `npm run type-check`
- `npm run build`
