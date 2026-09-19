# 本体对象详情页面 —— 实施 Plan

## 1. 需求理解

参考原型项目本体详情管理页面，在当前项目中新增"本体对象详情"页面。该页面在本体空间内管理之下，以对象为粒度，展示一个本体对象的四个菜单：

| Tab | 路由 path | 路由 name | 说明 |
|-----|-----------|-----------|------|
| 本体名称（xxx舰船） | object | OntologyObjectDetailObject | 对象资源统计页（占位） |
| 属性 | attribute | OntologyObjectDetailAttribute | 对象属性（占位） |
| 关系 | relation | OntologyObjectDetailRelation | 对象关系（占位） |
| 行为 | behavior | OntologyObjectDetailBehavior | 对象行为（占位） |

菜单实现方式与现有 `OntologySpaceManagementDetail` 的 `WorkspaceTypeTabs` 一致（胶囊样式 tabs + `<router-view />`）。四个子页面内容暂不构建，复用 `EmptyWorkspacePanel.vue` 占位。

## 2. 修改范围

### 新增文件

| 文件 | 说明 |
|------|------|
| `src/types/pages/ontologyObjectDetailType.ts` | 本体对象详情页相关类型（Tab 标识、路由名联合类型） |
| `src/views/OntologyObjectDetail/index.vue` | 容器页（tabs + router-view + 加载/空态） |
| `src/views/OntologyObjectDetail/components/ObjectDetailTabs.vue` | 四个菜单 tabs 组件（仿 WorkspaceTypeTabs） |
| `src/views/OntologyObjectDetail/composables/useObjectDetailWorkspace.ts` | 解析路由参数、推导 active tab |
| `src/views/OntologyObjectDetail/utils/objectDetailTabs.ts` | Tab ↔ 路由名映射 |

### 修改文件

| 文件 | 说明 |
|------|------|
| `src/router/modules/workspaceRoutes.ts` | 注册 OntologyObjectDetail 父路由 + 四个 children |
| `src/types/index.ts` | 导出新增类型 |
| `src/layout/components/BreadcrumbBar.vue` | 扩展面包屑：对象详情路径显示「本体空间管理 → 空间内管理 → 本体详情」 |

## 3. 路由设计

```
/workspace
├─ ontology-space-management/:spaceId        （已有）
├─ ontology-object/:objectId                 ← 新增父路由（与空间管理同级）
│  ├─ object       → OntologyObjectDetailObject
│  ├─ attribute    → OntologyObjectDetailAttribute
│  ├─ relation     → OntologyObjectDetailRelation
│  └─ behavior     → OntologyObjectDetailBehavior
└─ full-text-search                         （已有）
```

- 父路由 `redirect` 到 `OntologyObjectDetailObject`，确保访问 `/ontology-object/:objectId` 时自动落到默认 tab。
- 子页面组件复用 `EmptyWorkspacePanel.vue`（已被 workspaceRoutes 导入），不新建占位组件。

## 4. 核心实现方式

### 4.1 类型定义

```ts
// ontologyObjectDetailType.ts
export type OntologyObjectDetailTab = "object" | "attribute" | "relation" | "behavior";

export type OntologyObjectDetailRouteName =
  | "OntologyObjectDetailObject"
  | "OntologyObjectDetailAttribute"
  | "OntologyObjectDetailRelation"
  | "OntologyObjectDetailBehavior";
```

### 4.2 Tab ↔ 路由名映射

仿 `workspaceTabs.ts` 结构：

```ts
// objectDetailTabs.ts
const TAB_ROUTE_NAMES: Record<OntologyObjectDetailTab, OntologyObjectDetailRouteName> = {
  object: "OntologyObjectDetailObject",
  attribute: "OntologyObjectDetailAttribute",
  relation: "OntologyObjectDetailRelation",
  behavior: "OntologyObjectDetailBehavior",
};
```

### 4.3 容器页 index.vue

参考 `OntologySpaceManagementDetail/index.vue`：
- `useObjectDetailWorkspace` composable 提供 `objectId`、`activeTab`、`objectName` 等
- `ObjectDetailTabs` 接收 props（activeTab、objectName），emit `update:activeTab`
- `<router-view />` 渲染子路由
- 暂不实现加载/空态（因为所有子页都是 EmptyWorkspacePanel，不需要异步数据），但预留 status 字段保持与现有模式一致

### 4.4 ObjectDetailTabs.vue

仿 `WorkspaceTypeTabs.vue` 胶囊样式，四个 tab：
- `object` 标签显示对象名称（如 "福特级航空母舰(CVN)"）
- `attribute` / `relation` / `behavior` 标签为固定文本
- 样式复用 Aircas 主题变量

### 4.5 BreadcrumbBar 扩展

在现有 `isSpaceDetail` 分支之后新增 `isObjectDetail` 判断：
- `route.matched.some(record => record.name === "OntologyObjectDetail")`
- 面包屑：首页 → 本体对象详情（使用 `route.meta.title` 或固定文本）

## 5. 新增依赖

无。复用现有 Vue Router、Element Plus、Aircas 主题变量、EmptyWorkspacePanel。

## 6. 验证方式

1. `npm run type-check` — 类型检查
2. `npm run build:verify` — 构建验证（verify-build 脚本不触 html 写入）
3. `npm run format:check -- src/router/modules/workspaceRoutes.ts src/types/index.ts src/layout/components/BreadcrumbBar.vue src/views/OntologyObjectDetail src/types/pages/ontologyObjectDetailType.ts` — Prettier 校验
4. 浏览器访问 `#/workspace/ontology-space-management/xxx/object/yyy`，确认：
   - 容器页渲染，四个 tab 可见可切换
   - 路由随 tab 切换正确更新
   - 面包屑显示正确
   - 子页面显示「内容尚未接入」空态
