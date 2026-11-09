# 空间浏览真实统计

## 需求理解

空间浏览顶部对象、关系、实体数量和对象、关系、函数算子标签使用当前空间真实数据；行为标签继续使用现有演示数量。韧性标准应用数和属性填充率保持现有内容和显示方式。

## 范围与文件

- 修改 `src/views/EntityBrowsing/index.vue`、`components/EntityBrowseOverview.vue`、`composables/useEntityBrowseOverview.ts` 和 `utils/mapEntityBrowseOverview.ts`。
- 新增页面私有统计状态工具和 `tests/entity-browsing-statistics.test.mjs`，以及本计划文件；如需调整标签显示，修改 `components/WorkspaceTypeTabs.vue` 和 `utils/overviewStats.ts`。
- 复用已有空间统计和对象分类树接口及契约；不更改接口、类型目录、公共组件、其他页面或依赖。保留已有工作区修改，不删除文件。

## 实现方式

以空间 id 查询空间统计和对象分类树。对象、关系、函数算子使用空间统计字段；实体数量对分类树中对象按唯一标识去重后累加 entityCount。成功响应字段缺失或空数据时显示 0；请求失败显示错误及重试，不将失败伪装成 0。行为保留原样，质量卡片保持原样。切换空间时重置加载状态、防止重复请求和过期结果覆盖；页面销毁时停止写入。

## 验证

先增加正常、缺失、重复对象、请求错误、重复请求、切换空间及销毁测试并确认失败，再实现并验证。运行相关测试、npm test、npm run test:coverage、npm run type-check、npm run build:verify、任务文件格式检查及 git diff --check；尝试浏览器冒烟，记录基线失败及缺口。

## 依赖

不新增依赖。

## 验证结果

- 新增统计测试先因目标模块不存在而失败，实现后 7 项通过，覆盖真实数值、无数据、去重、失败重试、切换空间、并发和卸载。
- 本地 Mock 的空间 1 返回对象 2、关系 0、函数算子 2；分类树中实体数量为 0。HTTP 请求返回成功，实际浏览器交互未验证。
- `npm test`：858 项中 829 通过、29 项失败；失败项与修改前相同。`npm run test:coverage` 因相同失败及已加载文件分支覆盖率 77.22% 低于 80% 未通过，行覆盖率 92.42%，函数覆盖率 88.87%，不代表全项目源码覆盖率。
- `npm run type-check` 仍有修改前的 11 条错误；`npm run build:verify`、任务文件格式检查和 `git diff --check` 通过。
- 本次没有 E2E 脚本；会话中无浏览器控制工具，未进行浏览器交互、布局及人工验收。
