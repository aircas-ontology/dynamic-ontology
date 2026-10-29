---
name: third-party-instance-management
description: Integrate, manage, or review ECharts, Three.js, Cesium, Mars3D, and OpenLayers instances in this repository, with safe Vue reactivity boundaries and complete lifecycle cleanup.
---

# Third-Party Instance Management

在 Vue 组件中集成或维护第三方可视化、地图及图形实例时，先读取目标目录 `readme.md`；实例存储方式和生命周期约束以相关页面、组件、Store、模型或工具目录规范为准。

## Cesium 工具选择

- 涉及 Cesium 时，如果当前环境提供 `cesium-mcp-dev`，优先用于查证 Cesium API。
- 如果已安装公共 Skill `using-cesiumjs-skills`，先用它选择对应 CesiumJS 专项 Skill；不可用时直接依据仓库现有封装、类型和官方 API 完成同等只读检查，不中断项目流程。

## 工作流程

1. 确认实例所有者、初始化入口和允许的重建条件。
2. 按目标目录规范选择普通变量、`shallowRef()` 或 `markRaw()`，避免深度代理。
3. 将实例资源、事件、定时器、动画、Observer 和附加 DOM 纳入同一幂等清理边界。
4. 重建前执行与卸载一致的清理，并验证重复进入和离开。

## 完成标准

- 验证重复进入、离开或重新渲染组件不会产生重复实例和监听器。
- 验证组件卸载后不再执行回调、动画或后台任务。
- 完成后使用 `project-verification-delivery` 选择并执行与修改范围相称的验证。
