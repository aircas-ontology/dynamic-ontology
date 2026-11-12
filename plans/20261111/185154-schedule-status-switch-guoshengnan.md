# 行为调度状态Switch滑块

用户确认将状态列按钮替换为Switch，START开启/STOP关闭，显示启用/停止，沿用接口、加载禁用及失败恢复。

- 仅修改src/views/SpaceBehaviorScheduleWorkspace/index.vue状态列模板，使用Element Plus Switch受控绑定，更新事件调用现有toggleScheduleStatus，不使用v-model提前覆盖原状态。
- 更新tests/schedule-save-api.test.mjs验证控件绑定契约，并沿用已有启停行为测试覆盖成功、失败回退、重复及过期响应；组件库视觉及浏览器操作需人工验收，无现有E2E或可用浏览器工具。
- 新增本计划，无删除、无新增依赖；保留已有修改，不触碰public/html。
- 验证针对测试、npm test/test:coverage、type-check/build:verify、限定格式及diff，记录既有失败。
