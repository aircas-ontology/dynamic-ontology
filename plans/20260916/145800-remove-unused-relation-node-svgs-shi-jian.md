# Plan：删除关系三维图未生效的实体 SVG 及相关代码

确认范围：去掉 `layout-mode="network"` 下不会渲染的实体图标资源，以及只为这些图标服务的解析与节点贴图代码。空间管理页的 `iconUrl` 不在范围内。

## 需求理解

当前关系工作台三维图固定 `network` 布局，节点使用文字贴图，`relationObjectIcon.ts` 与 `entities/*.svg` 不可见。删除这批资源和对应代码；`star` 布局节点改为与 `network` 相同的文字贴图。

## 修改范围

- 删除 `src/assets/pages/ontologySpaceManagementDetail/entities/` 下剩余 SVG 及空目录
- 删除 `src/views/OntologySpaceManagementDetail/utils/relationObjectIcon.ts`
- 修改 `useRelationGraph3d.ts`：去掉图标解析；节点统一 `createLabelTexture`
- 修改 `relationGraph3dTexture.ts`：删除 `createRelationNodeTexture` / `loadImage` / `drawTintedIcon`；保留边标签和分类色

## 新增依赖

无。

## 核心实现方式

`useRelationGraph3d` 建节点时始终调用 `createLabelTexture`。`relationGraph3dTexture.ts` 仅保留边标签纹理与分类软色。

## 验证方式

- TDD：关系测试断言三维图源码不再引用图标解析与节点图标贴图
- `npm test`、`npm run test:coverage`、`npm run type-check`、`npm run build:verify`
