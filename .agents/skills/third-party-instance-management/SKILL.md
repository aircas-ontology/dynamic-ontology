---
name: third-party-instance-management
description: Integrate, manage, or review ECharts, Three.js, Cesium, Mars3D, and OpenLayers instances in this repository, with safe Vue reactivity boundaries and complete lifecycle cleanup.
---

# Third-Party Instance Management

在 Vue 组件中集成或维护第三方可视化、地图及图形实例时，确保实例只初始化一次，并在组件生命周期结束时完整释放资源。

## Cesium 工具选择

- 涉及 Cesium 时，优先使用当前环境可用的 `cesium-mcp-dev` 服务。
- 开始 CesiumJS 开发前使用 `using-cesiumjs-skills`，再根据任务选择对应的 CesiumJS 专项 Skill。

## 实例与响应式边界

- 禁止使用 `reactive()` 深度代理 Cesium Viewer、Map、Chart、Layer、Graphic 等第三方复杂实例。
- 实例需要响应式容器时使用 `shallowRef()`；仅供组件内部使用时优先保存为普通变量。实例必须放入其他响应式对象时使用 `markRaw()` 明确排除深度代理。
- 初始化前检查已有实例，避免重复创建实例、Canvas、Overlay 或 GPU 资源。

## 生命周期清理

- 组件销毁时释放第三方实例及其创建的资源。
- 同时移除事件监听器，停止定时器和 `requestAnimationFrame`，断开 Observer，并清理实例附加的 Canvas、Overlay 或其他 DOM 资源。
- 重建实例前先执行与组件销毁一致的清理，避免热更新、条件渲染或参数变化造成残留。

## 完成标准

- 验证重复进入、离开或重新渲染组件不会产生重复实例和监听器。
- 验证组件卸载后不再执行回调、动画或后台任务。
- 完成后使用 `project-verification-delivery` 选择并执行与修改范围相称的验证。
