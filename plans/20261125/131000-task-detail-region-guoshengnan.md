# 任务详情区域回显

## 需求理解

点击任务主题的进入任务后，态势页使用路由 `taskId` 查询任务主题详情。详情字段 `regionPoint` 为地图区域数据，格式为 `lon,lat;lon,lat`。地图只绘制接口返回且可组成区域的点位；返回为空、格式错误或有效顶点少于三个时清空已有区域框。

## 修改范围

- 扩展任务主题详情接口、响应类型和统一出口。
- 新增态势页私有区域点位解析工具。
- 在态势页按任务编号加载详情并传递解析后的点位给地图。
- 在 Cesium 地图组件替换并定位区域实体，空区域清理实体。
- 更新态势页测试，覆盖区域字符串解析和空值清空语义。

## 文件

- 修改 `src/apis/taskTopicApi.ts`
- 修改 `src/apis/index.ts`
- 修改 `src/types/apis/taskTopicType.ts`
- 修改 `src/types/index.ts`
- 新增 `src/views/IntelligenceTaskDisplay/utils/taskRegion.ts`
- 修改 `src/views/IntelligenceTaskDisplay/index.vue`
- 修改 `src/views/IntelligenceTaskDisplay/components/TaskDisplayMap.vue`
- 修改 `tests/intelligence-task-display.test.mjs`

## 核心实现

通过 `GET ${DOMAIN_CONFIG.THEME_URL}/task-topic/{id}` 查询详情。请求开始与失败时都将区域点位置空，避免保留上一个任务区域。接口成功后解析 `regionPoint`，仅保留经纬度均为有限数值的点，少于三个点视为无区域。

地图组件以单独实体维护区域折线。区域输入变化时先移除旧实体；存在有效点位时重新绘制闭合边界并飞行定位到区域范围。组件卸载仍由已有地图清理流程统一销毁。

## 新增依赖

无。

## 验证方式

- TDD：先执行新增区域解析测试，确认工具缺失而失败；实现后执行定向测试。
- 对任务文件执行格式化与格式检查。
- 执行类型规范检查、类型检查、构建验证、全量测试与覆盖率；仓库既有失败单独记录。
- 检查 `git diff --check` 与任务相关差异。
