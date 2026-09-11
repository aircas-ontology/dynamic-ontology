/*
 * 注册全局组件，类似 element-ui
 * 全局组件使用
 */
import type { App } from "vue";
import AircasPanel from "./AircasPanel.vue";

export default (app: App) => {
  app.component("AircasPanel", AircasPanel);
};
